/**
 * Middleware de AutenticaciÃ³n Mejorado
 * - Valida tokens JWT de Clerk
 * - Obtiene roles y permisos desde MongoDB
 * - La base de datos es la fuente de verdad para roles
 */

import { verifyToken } from '@clerk/clerk-sdk-node';
import User from '../models/User.js';
import { getRolePermissions } from '../config/roles.js';
import logger from '../utils/logger.js';

/**
 * Middleware principal de autenticaciÃ³n
 * Valida el token JWT de Clerk y obtiene el usuario desde MongoDB
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticaciÃ³n requerido',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1];

    // Validar token con Clerk
    let clerkUser;
    try {
      // Debug: verificar que tenemos la clave secreta
      if (!process.env.CLERK_SECRET_KEY) {
        logger.error('❌ CLERK_SECRET_KEY no está configurado en variables de entorno');
        return res.status(500).json({
          success: false,
          message: 'Error de configuración del servidor',
          code: 'MISSING_CLERK_CONFIG'
        });
      }

      clerkUser = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY
      });

    } catch (clerkError) {
      logger.warn('❌ Token inválido de Clerk', { 
        error: clerkError.message,
        tokenPreview: token.substring(0, 20) + '...'
      });
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado',
        code: 'INVALID_TOKEN',
        details: clerkError.message
      });
    }

    // Buscar usuario en nuestra base de datos por clerkId
    const user = await User.findOne({ 
      clerkId: clerkUser.sub 
    }).populate('roleAssignedBy', 'firstName lastName email');

    if (!user) {
      logger.warn('Usuario no encontrado en DB', { clerkId: clerkUser.sub });
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado. SincronizaciÃ³n requerida.',
        code: 'USER_NOT_SYNCED'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Cuenta desactivada. Contacta al administrador.',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Agregar información del usuario a la request
    req.user = {
      id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role,
      permissions: getRolePermissions(user.role),
      customPermissions: user.customPermissions || [],
      isActive: user.isActive,
      dbUser: user // Usuario completo de DB si se necesita
    };

    // Agregar req.userId para compatibilidad con controladores
    req.userId = user._id;

    // También agregar req.auth para compatibilidad con otros controladores
    req.auth = {
      userId: user.clerkId,
      sessionId: clerkUser.sid || null
    };

    // Actualizar último login (sin await para no bloquear)
    User.findByIdAndUpdate(user._id, { 
      lastLogin: new Date() 
    }).catch(err => 
      logger.warn('Error actualizando lastLogin', err)
    );

    next();

  } catch (error) {
    logger.error('Error en middleware de autenticaciÃ³n', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware opcional de autenticaciÃ³n
 * No bloquea la request si no hay token, pero aÃ±ade info si lo hay
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No hay token, continuar sin usuario
      req.user = null;
      req.userId = null;
      return next();
    }

    // Ejecutar autenticación normal
    await requireAuth(req, res, next);

  } catch (error) {
    // En caso de error, continuar sin usuario
    req.user = null;
    req.userId = null;
    next();
  }
};

/**
 * Middleware para verificar si el usuario tiene un permiso especÃ­fico
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'AutenticaciÃ³n requerida',
        code: 'AUTH_REQUIRED'
      });
    }

    const hasPermission = req.user.permissions.includes(permission) || 
                         req.user.customPermissions.includes(permission);

    if (!hasPermission) {
      logger.warn('Acceso denegado por permisos', {
        userId: req.user.id,
        role: req.user.role,
        requiredPermission: permission,
        userPermissions: req.user.permissions
      });

      return res.status(403).json({
        success: false,
        message: `Permisos insuficientes. Se requiere: ${permission}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * Middleware para verificar rol especÃ­fico
 */
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'AutenticaciÃ³n requerida',
        code: 'AUTH_REQUIRED'
      });
    }

    // Normalizar roles a mayúsculas para comparación
    const normalizedRole = role.toUpperCase();
    const userRole = req.user.role.toUpperCase();

    if (userRole !== normalizedRole) {
      logger.warn('Acceso denegado por rol', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRole: role,
        normalizedUserRole: userRole,
        normalizedRequiredRole: normalizedRole
      });

      return res.status(403).json({
        success: false,
        message: `Rol insuficiente. Se requiere: ${role}`,
        code: 'INSUFFICIENT_ROLE'
      });
    }

    next();
  };
};

/**
 * Middleware para verificar múltiples roles (OR)
 */
export const requireAnyRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida',
        code: 'AUTH_REQUIRED'
      });
    }

    // Normalizar roles a mayúsculas para comparación
    const normalizedRoles = roles.map(role => role.toUpperCase());
    const userRole = req.user.role.toUpperCase();

    if (!normalizedRoles.includes(userRole)) {
      logger.warn('Acceso denegado por roles', {
        userId: req.user.id,
        userRole: req.user.role,
        allowedRoles: roles,
        normalizedRoles,
        normalizedUserRole: userRole
      });

      return res.status(403).json({
        success: false,
        message: `Rol insuficiente. Se requiere uno de: ${roles.join(', ')}`,
        code: 'INSUFFICIENT_ROLE'
      });
    }

    next();
  };
};

/**
 * Middleware para verificar multiples permisos (OR)
 * Usuario debe tener AL MENOS UNO de los permisos especificados
 */
export const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticacion requerida',
        code: 'AUTH_REQUIRED'
      });
    }

    const userPermissions = [...req.user.permissions, ...req.user.customPermissions];
    const hasAnyPermission = permissions.some(permission => 
      userPermissions.includes(permission)
    );

    if (!hasAnyPermission) {
      logger.warn('Acceso denegado por permisos', {
        userId: req.user.id,
        role: req.user.role,
        requiredPermissions: permissions,
        userPermissions: req.user.permissions
      });

      return res.status(403).json({
        success: false,
        message: 'Permisos insuficientes',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};
