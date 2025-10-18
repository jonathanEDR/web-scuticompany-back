import express from 'express';
import { 
  uploadImage, 
  listImages, 
  getImageById, 
  updateImageMetadata, 
  deleteImage,
  searchImages,
  getOrphanImages,
  cleanupOrphanImages,
  getImageStatistics,
  addImageReference,
  removeImageReference
} from '../controllers/imageController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Rutas de upload y gestión de imágenes (todas protegidas con autenticación)

// Upload de imagen
router.post('/image', requireAuth, uploadImage);

// Listar todas las imágenes con filtros
router.get('/images', requireAuth, listImages);

// Buscar imágenes
router.get('/images/search', requireAuth, searchImages);

// Obtener estadísticas
router.get('/images/stats', requireAuth, getImageStatistics);

// Obtener imágenes huérfanas
router.get('/images/orphans', requireAuth, getOrphanImages);

// Limpiar imágenes huérfanas
router.post('/images/cleanup', requireAuth, cleanupOrphanImages);

// Obtener imagen por ID
router.get('/images/:id', requireAuth, getImageById);

// Actualizar metadatos de imagen
router.patch('/images/:id', requireAuth, updateImageMetadata);

// Eliminar imagen
router.delete('/images/:id', requireAuth, deleteImage);

// Agregar referencia de uso (internal)
router.post('/images/:id/reference', requireAuth, addImageReference);

// Eliminar referencia de uso (internal)
router.delete('/images/:id/reference', requireAuth, removeImageReference);

export default router;
