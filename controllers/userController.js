import User from '../models/User.js';

/**
 * @desc    Sincronizar usuario de Clerk con MongoDB
 * @route   POST /api/users/sync
 * @access  Private (requiere datos de usuario de Clerk)
 */
export const syncUser = async (req, res) => {
  try {
    const {
      clerkId,
      email,
      firstName,
      lastName,
      username,
      profileImage
    } = req.body;

    // Validar datos requeridos
    if (!clerkId || !email) {
      return res.status(400).json({
        success: false,
        message: 'clerkId y email son requeridos'
      });
    }

    // Buscar si el usuario ya existe
    let existingUser = await User.findOne({ clerkId });

    if (existingUser) {
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
    console.error('❌ Error sincronizando usuario:', error);
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