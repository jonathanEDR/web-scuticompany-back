import Image from '../models/Image.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import logger from '../utils/logger.js';
import { getImageDimensions } from '../utils/imageProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio de uploads
const uploadsDir = path.join(__dirname, '../uploads');

// @desc    Subir imagen y guardar en DB
// @route   POST /api/upload/image
// @access  Private
export const uploadImage = async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ninguna imagen'
      });
    }

    const imageFile = req.files.image;
    const userId = req.user.userId; // Del middleware auth
    
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de archivo no permitido. Solo se permiten: JPG, PNG, GIF, WEBP'
      });
    }

    // Validar tamaño (max 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Máximo 5MB'
      });
    }

    // Generar nombre único
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = path.extname(imageFile.name);
    const filename = `${timestamp}-${randomString}${extension}`;
    
    // Ruta completa del archivo
    const uploadPath = path.join(uploadsDir, filename);

    // Mover el archivo
    await imageFile.mv(uploadPath);

    // Extraer dimensiones de la imagen
    const dimensions = await getImageDimensions(uploadPath);

    // URL pública del archivo
    const imageUrl = `/uploads/${filename}`;

    // Obtener metadatos adicionales del body (si existen)
    const {
      category = 'other',
      title = imageFile.name,
      description = '',
      alt = '',
      tags = []
    } = req.body;

    // Crear registro en la base de datos
    const imageRecord = await Image.create({
      filename,
      originalName: imageFile.name,
      url: imageUrl,
      mimetype: imageFile.mimetype,
      size: imageFile.size,
      width: dimensions.width,
      height: dimensions.height,
      category,
      title,
      description,
      alt,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      uploadedBy: userId,
      isOrphan: true // Inicialmente es huérfana hasta que se use
    });

    logger.success(`Imagen subida: ${filename} por usuario ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Imagen subida correctamente',
      data: imageRecord
    });
  } catch (error) {
    logger.error('Error al subir imagen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir la imagen',
      error: error.message
    });
  }
};

// @desc    Listar imágenes con filtros y paginación
// @route   GET /api/upload/images
// @access  Private
export const listImages = async (req, res) => {
  try {
    const {
      category,
      isOrphan,
      uploadedBy,
      tags,
      search,
      page = 1,
      limit = 20,
      sortBy = '-uploadedAt'
    } = req.query;

    const options = {
      category,
      isOrphan: isOrphan === 'true' ? true : isOrphan === 'false' ? false : undefined,
      uploadedBy,
      tags: tags ? tags.split(',') : undefined,
      search,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy
    };

    const result = await Image.findWithFilters({}, options);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error al listar imágenes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar imágenes',
      error: error.message
    });
  }
};

// @desc    Obtener imagen por ID
// @route   GET /api/upload/images/:id
// @access  Private
export const getImageById = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada'
      });
    }

    res.json({
      success: true,
      data: image
    });
  } catch (error) {
    logger.error('Error al obtener imagen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la imagen',
      error: error.message
    });
  }
};

// @desc    Actualizar metadatos de imagen
// @route   PATCH /api/upload/images/:id
// @access  Private
export const updateImageMetadata = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      alt,
      category,
      tags
    } = req.body;

    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada'
      });
    }

    // Actualizar solo los campos proporcionados
    if (title !== undefined) image.title = title;
    if (description !== undefined) image.description = description;
    if (alt !== undefined) image.alt = alt;
    if (category !== undefined) image.category = category;
    if (tags !== undefined) {
      image.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    }

    await image.save();

    logger.success(`Metadatos actualizados para imagen ${id}`);

    res.json({
      success: true,
      message: 'Metadatos actualizados correctamente',
      data: image
    });
  } catch (error) {
    logger.error('Error al actualizar metadatos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar metadatos',
      error: error.message
    });
  }
};

// @desc    Eliminar imagen
// @route   DELETE /api/upload/images/:id
// @access  Private
export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query; // ?force=true para forzar eliminación

    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada'
      });
    }

    // Verificar si se puede eliminar
    if (!image.canDelete(force === 'true')) {
      return res.status(400).json({
        success: false,
        message: 'La imagen está en uso y no puede ser eliminada. Usa ?force=true para forzar la eliminación.',
        usedIn: image.usedIn
      });
    }

    // Eliminar archivo físico
    const filePath = path.join(uploadsDir, image.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Eliminar registro de la base de datos
    await Image.findByIdAndDelete(id);

    logger.success(`Imagen eliminada: ${image.filename}`);

    res.json({
      success: true,
      message: 'Imagen eliminada correctamente'
    });
  } catch (error) {
    logger.error('Error al eliminar imagen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la imagen',
      error: error.message
    });
  }
};

// @desc    Buscar imágenes
// @route   GET /api/upload/images/search
// @access  Private
export const searchImages = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un término de búsqueda'
      });
    }

    const images = await Image.find({
      $or: [
        { filename: { $regex: q, $options: 'i' } },
        { originalName: { $regex: q, $options: 'i' } },
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ]
    })
    .limit(parseInt(limit))
    .sort('-uploadedAt');

    res.json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    logger.error('Error al buscar imágenes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar imágenes',
      error: error.message
    });
  }
};

// @desc    Obtener imágenes huérfanas
// @route   GET /api/upload/images/orphans
// @access  Private
export const getOrphanImages = async (req, res) => {
  try {
    const orphans = await Image.find({ isOrphan: true })
      .sort('-uploadedAt');

    const totalSize = orphans.reduce((sum, img) => sum + img.size, 0);

    res.json({
      success: true,
      count: orphans.length,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      data: orphans
    });
  } catch (error) {
    logger.error('Error al obtener imágenes huérfanas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener imágenes huérfanas',
      error: error.message
    });
  }
};

// @desc    Limpiar imágenes huérfanas
// @route   POST /api/upload/images/cleanup
// @access  Private (Admin only - agregar middleware)
export const cleanupOrphanImages = async (req, res) => {
  try {
    const { dryRun = false } = req.body;

    const orphans = await Image.find({ isOrphan: true });

    if (dryRun) {
      const totalSize = orphans.reduce((sum, img) => sum + img.size, 0);
      return res.json({
        success: true,
        message: 'Simulación de limpieza',
        count: orphans.length,
        totalSize,
        totalSizeFormatted: formatBytes(totalSize),
        images: orphans.map(img => ({
          filename: img.filename,
          size: img.sizeFormatted,
          uploadedAt: img.uploadedAt
        }))
      });
    }

    // Eliminar archivos físicos y registros
    const deleted = [];
    const errors = [];

    for (const image of orphans) {
      try {
        const filePath = path.join(uploadsDir, image.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        await Image.findByIdAndDelete(image._id);
        deleted.push(image.filename);
      } catch (err) {
        errors.push({ filename: image.filename, error: err.message });
      }
    }

    logger.success(`Limpieza completada: ${deleted.length} imágenes eliminadas`);

    res.json({
      success: true,
      message: 'Limpieza completada',
      deleted: deleted.length,
      errors: errors.length,
      details: { deleted, errors }
    });
  } catch (error) {
    logger.error('Error al limpiar imágenes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al limpiar imágenes',
      error: error.message
    });
  }
};

// @desc    Obtener estadísticas de imágenes
// @route   GET /api/upload/images/stats
// @access  Private
export const getImageStatistics = async (req, res) => {
  try {
    const stats = await Image.getStatistics();

    res.json({
      success: true,
      data: {
        ...stats,
        totalSizeFormatted: formatBytes(stats.totalSize)
      }
    });
  } catch (error) {
    logger.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

// @desc    Agregar referencia de uso a una imagen
// @route   POST /api/upload/images/:id/reference
// @access  Private (Internal use)
export const addImageReference = async (req, res) => {
  try {
    const { id } = req.params;
    const { model, documentId, field } = req.body;

    if (!model || !documentId || !field) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren model, documentId y field'
      });
    }

    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada'
      });
    }

    await image.addReference(model, documentId, field);

    res.json({
      success: true,
      message: 'Referencia agregada correctamente',
      data: image
    });
  } catch (error) {
    logger.error('Error al agregar referencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar referencia',
      error: error.message
    });
  }
};

// @desc    Eliminar referencia de uso de una imagen
// @route   DELETE /api/upload/images/:id/reference
// @access  Private (Internal use)
export const removeImageReference = async (req, res) => {
  try {
    const { id } = req.params;
    const { model, documentId, field } = req.body;

    if (!model || !documentId || !field) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren model, documentId y field'
      });
    }

    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada'
      });
    }

    await image.removeReference(model, documentId, field);

    res.json({
      success: true,
      message: 'Referencia eliminada correctamente',
      data: image
    });
  } catch (error) {
    logger.error('Error al eliminar referencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar referencia',
      error: error.message
    });
  }
};

// Helper function
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
