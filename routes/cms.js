import express from 'express';
import {
  getAllPages,
  getPageBySlug,
  updatePage,
  createPage,
  initHomePage
} from '../controllers/cmsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas (sin autenticación)
router.get('/pages', getAllPages);
router.get('/pages/:slug', getPageBySlug);

// Rutas protegidas (requieren autenticación)
router.put('/pages/:slug', requireAuth, updatePage);
router.post('/pages', requireAuth, createPage);
router.post('/pages/init-home', requireAuth, initHomePage);

export default router;
