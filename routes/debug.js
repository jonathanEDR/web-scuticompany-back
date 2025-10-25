import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * 🔍 ENDPOINT DE DEBUG TEMPORAL
 * Para investigar el problema de roles en producción
 */
router.get('/debug/user/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    
    // Buscar usuario por clerkId
    const user = await User.findOne({ clerkId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        clerkId
      });
    }

    // Información completa del usuario
    const debugInfo = {
      success: true,
      user: {
        _id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        customPermissions: user.customPermissions,
        roleAssignedBy: user.roleAssignedBy,
        roleAssignedAt: user.roleAssignedAt,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      rawDocument: user.toObject(),
      schema: {
        roleField: user.schema.paths.role,
        defaultRole: user.schema.paths.role.defaultValue,
        enumValues: user.schema.paths.role.enumValues
      }
    };

    logger.debug(`[DEBUG] Usuario encontrado: ${user.email}, role: ${user.role}`);
    
    res.json(debugInfo);

  } catch (error) {
    logger.error('Error en debug de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno',
      error: error.message
    });
  }
});

/**
 * 🔍 DEBUG: Listar todos los usuarios con sus roles
 */
router.get('/debug/users/all', async (req, res) => {
  try {
    const users = await User.find({}).select('clerkId email role isActive createdAt').limit(10);
    
    const debugInfo = {
      success: true,
      totalUsers: await User.countDocuments(),
      users: users.map(user => ({
        clerkId: user.clerkId,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      })),
      dbConnection: {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      }
    };
    
    res.json(debugInfo);
    
  } catch (error) {
    logger.error('Error listando usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno',
      error: error.message
    });
  }
});

/**
 * 🔍 DEBUG: Información del entorno
 */
router.get('/debug/env', async (req, res) => {
  try {
    const envInfo = {
      success: true,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        MONGODB_URI: process.env.MONGODB_URI ? 'CONFIGURADO' : 'NO CONFIGURADO',
        CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? 'CONFIGURADO' : 'NO CONFIGURADO',
        BASE_URL: process.env.BASE_URL,
        FRONTEND_URL: process.env.FRONTEND_URL,
        DEFAULT_SUPER_ADMIN_EMAIL: process.env.DEFAULT_SUPER_ADMIN_EMAIL
      },
      mongoose: {
        connection: mongoose.connection.readyState,
        models: Object.keys(mongoose.models)
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(envInfo);
    
  } catch (error) {
    logger.error('Error obteniendo info del entorno:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno',
      error: error.message
    });
  }
});

export default router;