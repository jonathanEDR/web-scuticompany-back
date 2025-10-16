import express from 'express';
import { uploadImage, deleteImage, listImages } from '../controllers/uploadController.js';

const router = express.Router();

// Rutas de upload
router.post('/image', uploadImage);
router.delete('/image/:filename', deleteImage);
router.get('/images', listImages);

export default router;
