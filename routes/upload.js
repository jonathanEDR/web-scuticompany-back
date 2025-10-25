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
import { canUploadFiles, canManageUploads, requireUser } from '../middleware/roleAuth.js';

const router = express.Router();

// Rutas de upload y gestión de imágenes (todas protegidas con autenticación)

// Upload de imagen (requiere permiso de upload)
router.post('/image', canUploadFiles, uploadImage);

// Listar todas las imágenes con filtros (requiere permiso de gestión)
router.get('/images', canManageUploads, listImages);

// Buscar imágenes (requiere permiso de gestión)
router.get('/images/search', canManageUploads, searchImages);

// Obtener estadísticas (requiere gestión de uploads)
router.get('/images/stats', canManageUploads, getImageStatistics);

// Obtener imágenes huérfanas (requiere gestión de uploads)
router.get('/images/orphans', canManageUploads, getOrphanImages);

// Limpiar imágenes huérfanas (requiere gestión de uploads)
router.post('/images/cleanup', canManageUploads, cleanupOrphanImages);

// Obtener imagen por ID (requiere usuario autenticado)
router.get('/images/:id', requireUser, getImageById);

// Actualizar metadatos de imagen (requiere gestión de uploads)
router.patch('/images/:id', canManageUploads, updateImageMetadata);

// Eliminar imagen (requiere gestión de uploads)
router.delete('/images/:id', canManageUploads, deleteImage);

// Agregar referencia de uso - internal (requiere gestión de uploads)
router.post('/images/:id/reference', canManageUploads, addImageReference);

// Eliminar referencia de uso - internal (requiere gestión de uploads)
router.delete('/images/:id/reference', canManageUploads, removeImageReference);

export default router;
