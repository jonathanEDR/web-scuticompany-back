import User from '../models/User.js';
import logger from '../utils/logger.js';
import { normalizeRole, getDefaultRole } from '../utils/roleNormalizer.js';
import { autoLinkUserToLeads } from '../utils/leadAutoLinker.js';
import { createWelcomeOnboarding } from '../utils/onboardingService.js';
import { sanitizeUserData, sanitizeName, sanitizeEmail, sanitizeUrl } from '../utils/sanitizer.js';

/**
 * 🔒 Helper: Formatear y sanitizar datos de usuario para respuesta
 * Elimina datos sensibles y sanitiza campos de texto
 */
const formatUserResponse = (user) => {
  if (!user) return null;
  
  // Convertir a objeto plano si es documento Mongoose
  const userData = user.toObject ? user.toObject() : { ...user };
  
  return {
    _id: userData._id,
    clerkId: userData.clerkId,
    email: sanitizeEmail(userData.email) || userData.email,
    firstName: sanitizeName(userData.firstName) || '',
    lastName: sanitizeName(userData.lastName) || '',
    username: sanitizeName(userData.username) || '',
    fullName: sanitizeName(userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim()),
    profileImage: sanitizeUrl(userData.profileImage) || '',
    emailVerified: userData.emailVerified || false,
    role: userData.role,
    customPermissions: userData.customPermissions || [],
    isActive: userData.isActive,
    roleAssignedBy: userData.roleAssignedBy,
    roleAssignedAt: userData.roleAssignedAt,
    lastLogin: userData.lastLogin,
    createdAt: userData.createdAt,
    updatedAt: userData.updatedAt,
    // Blog profile sanitizado
    blogProfile: userData.blogProfile ? {
      displayName: sanitizeName(userData.blogProfile.displayName) || '',
      bio: userData.blogProfile.bio ? userData.blogProfile.bio.substring(0, 500) : '',
      avatar: sanitizeUrl(userData.blogProfile.avatar) || '',
      website: sanitizeUrl(userData.blogProfile.website) || '',
      location: sanitizeName(userData.blogProfile.location) || '',
      expertise: userData.blogProfile.expertise || [],
      social: userData.blogProfile.social || {},
      isPublicProfile: userData.blogProfile.isPublicProfile,
      profileCompleteness: userData.blogProfile.profileCompleteness
    } : null
  };
};

/**
 * @desc    Sincronizar usuario de Clerk con MongoDB
 * @route   POST /api/users/sync
 * @access  Private (requiere datos de usuario de Clerk)
 */
export const syncUser = async (req, res) => {
  const startTime = Date.now();
  
  try {
    logger.api('POST', '/api/users/sync', 'PROCESSING');
    
    const {
      clerkId,
      email,
      firstName,
      lastName,
      username,
      profileImage
    } = req.body;

    logger.debug('Datos recibidos para sync', {
      clerkId: clerkId ? 'presente' : 'faltante',
      email: email ? 'presente' : 'faltante',
      firstName: firstName || 'vacío'
    });

    // Validar datos requeridos
    if (!clerkId || !email) {
      logger.warn('Datos requeridos faltantes en sync de usuario', { clerkId: !!clerkId, email: !!email });
      return res.status(400).json({
        success: false,
        message: 'clerkId y email son requeridos'
      });
    }

    // Buscar si el usuario ya existe
    let existingUser = await User.findOne({ clerkId });
    logger.database('QUERY', 'users', { operation: 'findOne', clerkId });

    if (existingUser) {
      logger.success('Usuario existente encontrado, actualizando datos', {
        userId: existingUser._id,
        clerkId: existingUser.clerkId
      });
      
      // Usuario existe, actualizar datos si es necesario
      const updateData = {
        email: email || existingUser.email,
        firstName: firstName || existingUser.firstName,
        lastName: lastName || existingUser.lastName,
        username: username || existingUser.username || email.split('@')[0],
        profileImage: profileImage || existingUser.profileImage,
        lastLogin: new Date()
      };

      // 🆕 Inicializar blogProfile si no existe
      if (!existingUser.blogProfile || Object.keys(existingUser.blogProfile).length === 0) {
        updateData.blogProfile = {
          displayName: `${firstName || existingUser.firstName || ''} ${lastName || existingUser.lastName || ''}`.trim() || username || existingUser.username || email.split('@')[0],
          bio: '',
          avatar: profileImage || existingUser.profileImage || '',
          website: '',
          location: '',
          expertise: [],
          social: {
            twitter: '',
            linkedin: '',
            github: '',
            orcid: ''
          },
          isPublicProfile: true,
          allowComments: true,
          showEmail: false,
          profileCompleteness: 15,
          lastProfileUpdate: new Date()
        };
      }

      const updated = await User.findOneAndUpdate(
        { clerkId },
        updateData,
        { new: true }
      );

      logger.database('UPDATE', 'users', { clerkId: updated.clerkId });
      logger.api('POST', '/api/users/sync', 200, Date.now() - startTime);

      // 🔒 Sanitizar respuesta de usuario
      return res.status(200).json({
        success: true,
        message: 'Usuario actualizado correctamente',
        synced: true,
        user: formatUserResponse(updated)
      });
    } else {
      logger.startup('Creando nuevo usuario en la base de datos', {
        clerkId: clerkId,
        email: email
      });
      
      // Usuario no existe, crear nuevo
      const defaultRole = getDefaultRole(email); // Determinar rol automáticamente
      
      const newUser = new User({
        clerkId,
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        username: username || email.split('@')[0],
        profileImage: profileImage || '',
        role: defaultRole, // Rol determinado automáticamente
        lastLogin: new Date(),
        // 🆕 Inicializar blogProfile por defecto
        blogProfile: {
          displayName: `${firstName || ''} ${lastName || ''}`.trim() || username || email.split('@')[0],
          bio: '',
          avatar: profileImage || '',
          website: '',
          location: '',
          expertise: [],
          social: {
            twitter: '',
            linkedin: '',
            github: '',
            orcid: ''
          },
          isPublicProfile: true, // Por defecto público
          allowComments: true,
          showEmail: false,
          profileCompleteness: 15, // Completitud inicial básica
          lastProfileUpdate: new Date()
        }
      });

      logger.debug('Creando nuevo usuario con rol determinado', {
        email,
        assignedRole: defaultRole,
        isDefaultSuperAdmin: defaultRole === 'SUPER_ADMIN'
      });

      await newUser.save();
      
      logger.success('Nuevo usuario creado exitosamente', {
        userId: newUser._id,
        clerkId: newUser.clerkId,
        email: newUser.email
      });
      
      // 🔗 VINCULACIÓN AUTOMÁTICA DE LEADS
      let leadLinkResult = null;
      try {
        leadLinkResult = await autoLinkUserToLeads({
          clerkId: newUser.clerkId,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role
        });
        
        if (leadLinkResult.success && leadLinkResult.leadsLinked > 0) {
          logger.success('Leads vinculados automáticamente al nuevo usuario', {
            userEmail: newUser.email,
            leadsLinked: leadLinkResult.leadsLinked,
            linkedLeads: leadLinkResult.linkedLeads
          });
        }
      } catch (linkError) {
        // No fallar la creación del usuario si hay error en la vinculación
        logger.error('Error en vinculación automática (no crítico)', {
          error: linkError.message,
          userEmail: newUser.email
        });
      }

      // 🎉 ONBOARDING AUTOMÁTICO PARA USUARIOS REGISTRADOS (USER)
      // Nota: Los usuarios se registran como USER. El equipo interno les asigna CLIENT después.
      let onboardingResult = null;
      if (newUser.role === 'USER') {
        try {
          // Si no se vinculó con leads existentes, crear onboarding completo
          const needsWelcomeOnboarding = !leadLinkResult?.success || leadLinkResult?.leadsLinked === 0;
          
          if (needsWelcomeOnboarding) {
            onboardingResult = await createWelcomeOnboarding({
              clerkId: newUser.clerkId,
              email: newUser.email,
              firstName: newUser.firstName,
              lastName: newUser.lastName
            });
            
            if (onboardingResult.success) {
              logger.success('🎉 Onboarding automático completado para nuevo usuario registrado', {
                userEmail: newUser.email,
                leadCreated: onboardingResult.onboarding.leadCreated,
                messagesSent: onboardingResult.onboarding.messagesSent
              });
            }
          } else {
            logger.info('Usuario vinculado con leads existentes, omitiendo onboarding automático', {
              userEmail: newUser.email,
              existingLeads: leadLinkResult.leadsLinked
            });
          }
        } catch (onboardingError) {
          // No fallar la creación del usuario si hay error en el onboarding
          logger.error('Error en onboarding automático (no crítico)', {
            error: onboardingError.message,
            userEmail: newUser.email
          });
        }
      }
      
      logger.database('CREATE', 'users', { clerkId: newUser.clerkId });
      logger.api('POST', '/api/users/sync', 201, Date.now() - startTime);

      // 🔒 Sanitizar respuesta de usuario nuevo
      return res.status(201).json({
        success: true,
        message: 'Usuario creado correctamente',
        synced: true,
        leadLinking: leadLinkResult, // Información de vinculación de leads
        onboarding: onboardingResult, // Información de onboarding automático
        user: formatUserResponse(newUser)
      });
    }

  } catch (error) {
    logger.error('Error sincronizando usuario', error);
    logger.api('POST', '/api/users/sync', 500, Date.now() - startTime);
    
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener perfil de usuario desde MongoDB
 * @route   GET /api/users/profile/:clerkId
 * @access  Private
 */
export const getUserProfile = async (req, res) => {
  try {
    const { clerkId } = req.params;

    const user = await User.findOne({ clerkId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // 🔒 Sanitizar respuesta de perfil
    return res.status(200).json({
      success: true,
      user: formatUserResponse(user)
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};