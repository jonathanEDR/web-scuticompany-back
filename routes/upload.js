import express from 'express';
import { uploadImage, deleteImage, listImages } from '../controllers/uploadController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Rutas de upload (todas protegidas con autenticación)
router.post('/image', requireAuth, uploadImage);
router.delete('/image/:filename', requireAuth, deleteImage);
router.get('/images', requireAuth, listImages);

export default router;
