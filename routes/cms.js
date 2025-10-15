import express from 'express';
import {
  getAllPages,
  getPageBySlug,
  updatePage,
  createPage,
  initHomePage
} from '../controllers/cmsController.js';

const router = express.Router();

// Rutas públicas (sin autenticación)
router.get('/pages', getAllPages);
router.get('/pages/:slug', getPageBySlug);

// Rutas protegidas (requieren autenticación)
// TODO: Agregar middleware de autenticación cuando esté listo
router.put('/pages/:slug', updatePage);
router.post('/pages', createPage);
router.post('/pages/init-home', initHomePage);

export default router;
