/**
 * Middleware de Autenticación Mejorado
 * - Valida tokens JWT de Clerk
 * - Obtiene roles y permisos desde MongoDB
 * - La base de datos es la fuente de verdad para roles
 */

import { verifyToken } from '@clerk/clerk-sdk-node';
import User from '../models/User.js';
import { getRolePermissions } from '../config/roles.js';
import logger from '../utils/logger.js';

/**
 * Middleware principal de autenticación
 * Valida el token JWT de Clerk y obtiene el usuario desde MongoDB
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1];

    // Validar token con Clerk
    let clerkUser;
    try {
      clerkUser = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY
      });
    } catch (clerkError) {
      logger.warn('Token inválido de Clerk', { error: clerkError.message });
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado',
        code: 'INVALID_TOKEN'
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
        message: 'Usuario no encontrado. Sincronización requerida.',
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

    // Actualizar último login (sin await para no bloquear)
    User.findByIdAndUpdate(user._id, { 
      lastLogin: new Date() 
    }).catch(err => 
      logger.warn('Error actualizando lastLogin', err)
    );

    logger.debug('Usuario autenticado exitosamente', {
      userId: user._id,
      role: user.role,
      email: user.email
    });

    next();

  } catch (error) {
    logger.error('Error en middleware de autenticación', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware opcional de autenticación
 * No bloquea la request si no hay token, pero añade info si lo hay
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No hay token, continuar sin usuario
      req.user = null;
      return next();
    }

    // Ejecutar autenticación normal
    await requireAuth(req, res, next);

  } catch (error) {
    // En caso de error, continuar sin usuario
    req.user = null;
    next();
  }
};

/**
 * Middleware para verificar si el usuario tiene un permiso específico
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida',
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
 * Middleware para verificar rol específico
 */
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida',
        code: 'AUTH_REQUIRED'
      });
    }

    if (req.user.role !== role) {
      logger.warn('Acceso denegado por rol', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRole: role
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

    if (!roles.includes(req.user.role)) {
      logger.warn('Acceso denegado por roles', {
        userId: req.user.id,
        userRole: req.user.role,
        allowedRoles: roles
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