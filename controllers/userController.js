import User from '../models/User.js';
import logger from '../utils/logger.js';

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
      const updated = await User.findOneAndUpdate(
        { clerkId },
        {
          email: email || existingUser.email,
          firstName: firstName || existingUser.firstName,
          lastName: lastName || existingUser.lastName,
          username: username || existingUser.username || email.split('@')[0],
          profileImage: profileImage || existingUser.profileImage,
          lastLogin: new Date()
        },
        { new: true }
      );

      logger.database('UPDATE', 'users', { clerkId: updated.clerkId });
      logger.api('POST', '/api/users/sync', 200, Date.now() - startTime);

      return res.status(200).json({
        success: true,
        message: 'Usuario actualizado correctamente',
        user: {
          id: updated._id,
          clerkId: updated.clerkId,
          email: updated.email,
          firstName: updated.firstName,
          lastName: updated.lastName,
          username: updated.username,
          profileImage: updated.profileImage,
          isNewUser: false
        }
      });
    } else {
      logger.startup('Creando nuevo usuario en la base de datos', {
        clerkId: clerkId,
        email: email
      });
      
      // Usuario no existe, crear nuevo
      const newUser = new User({
        clerkId,
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        username: username || email.split('@')[0],
        profileImage: profileImage || '',
        lastLogin: new Date()
      });

      await newUser.save();
      
      logger.success('Nuevo usuario creado exitosamente', {
        userId: newUser._id,
        clerkId: newUser.clerkId,
        email: newUser.email
      });
      
      logger.database('CREATE', 'users', { clerkId: newUser.clerkId });
      logger.api('POST', '/api/users/sync', 201, Date.now() - startTime);

      return res.status(201).json({
        success: true,
        message: 'Usuario creado correctamente',
        user: {
          id: newUser._id,
          clerkId: newUser.clerkId,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          username: newUser.username,
          profileImage: newUser.profileImage,
          isNewUser: true
        }
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

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        profileImage: user.profileImage,
        emailVerified: user.emailVerified,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};