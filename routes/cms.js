import express from 'express';
import {
  getAllPages,
  getPageBySlug,
  updatePage,
  createPage,
  initHomePage,
  initAllPages
} from '../controllers/cmsController.js';
import { requireAuth } from '../middleware/clerkAuth.js';
import { canManageContent, canManageSystem } from '../middleware/roleAuth.js';
import { initializeDatabase, checkDatabaseHealth } from '../utils/dbInitializer.js';
import validateCardStylesMiddleware from '../middleware/validateCardStyles.js';

const router = express.Router();

// Rutas públicas (sin autenticación)
router.get('/pages', getAllPages);
router.get('/pages/:slug', getPageBySlug);

// Health check de base de datos
router.get('/health', async (req, res) => {
  try {
    const health = await checkDatabaseHealth();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al verificar salud de la base de datos',
      error: error.message
    });
  }
});

// Rutas protegidas (requieren permisos de gestión de contenido)
router.put('/pages/:slug', canManageContent, validateCardStylesMiddleware, updatePage);
router.post('/pages', canManageContent, validateCardStylesMiddleware, createPage);
router.post('/pages/init-home', canManageContent, initHomePage);
router.post('/pages/init-all', canManageContent, initAllPages);

// Forzar re-inicialización de base de datos (solo para admins con permisos de sistema)
router.post('/init-database', canManageSystem, async (req, res) => {
  try {
    console.log('🔄 Forzando re-inicialización de base de datos...');
    await initializeDatabase();
    
    res.json({
      success: true,
      message: 'Base de datos inicializada correctamente'
    });
  } catch (error) {
    console.error('Error al inicializar base de datos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al inicializar base de datos',
      error: error.message
    });
  }
});

export default router;
