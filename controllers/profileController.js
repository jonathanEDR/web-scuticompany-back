/**
 * 👤 Profile Controller
 * Gestión de perfiles públicos de usuarios
 */

import User from '../models/User.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { validateProfileData } from '../utils/profileValidator.js';

// ============================================
// OBTENER PERFIL PROPIO
// ============================================

/**
 * @desc    Obtener perfil completo del usuario autenticado
 * @route   GET /api/profile
 * @access  Private
 */
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Devolver perfil completo (incluye datos privados)
    res.json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role,
        blogProfile: user.blogProfile,
        fullName: user.fullName,
        publicUsername: user.publicUsername,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Error getting my profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// ACTUALIZAR PERFIL PÚBLICO
// ============================================

/**
 * @desc    Actualizar perfil público del usuario
 * @route   PUT /api/profile
 * @access  Private
 */
export const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Validar datos del perfil
    const { isValid, errors } = validateProfileData(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Datos de perfil inválidos',
        errors
      });
    }

    // Actualizar perfil usando el método del modelo
    const updatedUser = await user.updateBlogProfile(req.body);

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        _id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        username: updatedUser.username,
        role: updatedUser.role,
        blogProfile: updatedUser.blogProfile,
        fullName: updatedUser.fullName,
        publicUsername: updatedUser.publicUsername,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// OBTENER PERFIL PÚBLICO POR USERNAME
// ============================================

/**
 * @desc    Obtener perfil público de un usuario por username
 * @route   GET /api/profile/public/:username
 * @access  Public
 */
export const getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;
    
    // Buscar usuario por username público
    const user = await User.findByPublicUsername(username);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que el perfil sea público
    if (!user.blogProfile?.isPublicProfile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil no público'
      });
    }

    // Devolver solo datos públicos
    const publicProfile = user.getPublicProfile();

    res.json({
      success: true,
      data: publicProfile
    });

  } catch (error) {
    console.error('Error getting public profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil público',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// OBTENER ESTADÍSTICAS DEL PERFIL
// ============================================

/**
 * @desc    Obtener estadísticas del perfil (posts, comentarios, etc.)
 * @route   GET /api/profile/:username/stats
 * @access  Public
 */
export const getProfileStats = async (req, res) => {
  try {
    const { username } = req.params;
    
    // Buscar usuario
    const user = await User.findByPublicUsername(username);
    
    if (!user || !user.blogProfile?.isPublicProfile) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Importar modelos dinámicamente para evitar dependencias circulares
    const BlogPost = (await import('../models/BlogPost.js')).default;
    const BlogComment = (await import('../models/BlogComment.js')).default;

    // Calcular estadísticas
    const [
      totalPosts,
      publishedPosts,
      totalComments,
      approvedComments
    ] = await Promise.all([
      BlogPost.countDocuments({ author: user._id }),
      BlogPost.countDocuments({ author: user._id, isPublished: true }),
      BlogComment.countDocuments({ 'author.userId': user._id }),
      BlogComment.countDocuments({ 'author.userId': user._id, status: 'approved' })
    ]);

    const stats = {
      posts: publishedPosts, // Solo posts publicados para el perfil público
      comments: approvedComments, // Solo comentarios aprobados
      followers: 0, // Placeholder - se implementará cuando tengamos sistema de seguidores
      following: 0, // Placeholder - se implementará cuando tengamos sistema de seguidores
      // Información adicional para uso interno
      detailedStats: {
        posts: {
          total: totalPosts,
          published: publishedPosts,
          draft: totalPosts - publishedPosts
        },
        comments: {
          total: totalComments,
          approved: approvedComments
        },
        profile: {
          completeness: user.blogProfile.profileCompleteness,
          joinDate: user.createdAt,
          lastActive: user.blogProfile.lastProfileUpdate
        }
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting profile stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// LISTAR PERFILES PÚBLICOS
// ============================================

/**
 * @desc    Listar perfiles públicos con paginación
 * @route   GET /api/profile/public
 * @access  Public
 */
export const listPublicProfiles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      expertise,
      sortBy = 'profileCompleteness'
    } = req.query;

    // Construir query
    const query = {
      'blogProfile.isPublicProfile': true,
      'blogProfile.profileCompleteness': { $gt: 0 } // Solo perfiles con algo de información
    };

    // Filtro de búsqueda
    if (search) {
      query.$or = [
        { 'blogProfile.displayName': new RegExp(search, 'i') },
        { 'blogProfile.bio': new RegExp(search, 'i') },
        { 'blogProfile.expertise': new RegExp(search, 'i') }
      ];
    }

    // Filtro por expertise
    if (expertise) {
      query['blogProfile.expertise'] = expertise;
    }

    // Ordenamiento
    let sort = {};
    switch (sortBy) {
      case 'profileCompleteness':
        sort = { 'blogProfile.profileCompleteness': -1 };
        break;
      case 'joinDate':
        sort = { createdAt: -1 };
        break;
      case 'lastActive':
        sort = { 'blogProfile.lastProfileUpdate': -1 };
        break;
      default:
        sort = { 'blogProfile.profileCompleteness': -1 };
    }

    const users = await User.find(query)
      .select('blogProfile createdAt')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await User.countDocuments(query);

    const profiles = users.map(user => ({
      _id: user._id,
      displayName: user.blogProfile.displayName,
      bio: user.blogProfile.bio,
      avatar: user.blogProfile.avatar,
      location: user.blogProfile.location,
      expertise: user.blogProfile.expertise,
      profileCompleteness: user.blogProfile.profileCompleteness,
      joinDate: user.createdAt
    }));

    res.json({
      success: true,
      data: profiles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error listing public profiles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar perfiles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};