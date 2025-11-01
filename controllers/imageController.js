import Image from '../models/Image.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import logger from '../utils/logger.js';
import { getImageDimensions } from '../utils/imageProcessor.js';
import cloudinary, { deleteFromCloudinary } from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio de uploads (mantener para compatibilidad local)
const uploadsDir = path.join(__dirname, '../uploads');

// @desc    Subir imagen y guardar en DB (usando Cloudinary)
// @route   POST /api/upload/image
// @access  Private
export const uploadImage = async (req, res) => {
  try {
    // ============================================
    // LOGGING INICIAL PARA DEBUGGING
    // ============================================
    logger.info('📤 Upload request iniciado', {
      hasFile: !!req.files?.image,
      userId: req.user?.clerkId || req.user?.id,
      fileInfo: req.files?.image ? {
        name: req.files.image.name,
        size: req.files.image.size,
        mimetype: req.files.image.mimetype
      } : null,
      cloudinaryConfigured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)
    });

    // Verificar archivos y autenticación
    if (!req.files || !req.files.image) {
      logger.warn('❌ No se proporcionó imagen en la request');
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ninguna imagen'
      });
    }

    const imageFile = req.files.image;
    const userId = req.user?.clerkId || req.user?.id; // Fallback
    
    if (!userId) {
      logger.error('❌ Usuario no autenticado correctamente', { user: req.user });
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado correctamente'
      });
    }
    
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

    // ============================================
    // SUBIR A CLOUDINARY CON LOGS
    // ============================================
    logger.info('☁️ Iniciando upload a Cloudinary...');
    
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'web-scuti',
          resource_type: 'image',
          transformation: [
            { width: 2000, height: 2000, crop: 'limit' },
            { quality: 'auto:best' }
          ]
        },
        (error, result) => {
          if (error) {
            logger.error('❌ Error en Cloudinary upload:', {
              error: error.message,
              code: error.http_code,
              details: error
            });
            reject(error);
          } else {
            logger.success('✅ Upload a Cloudinary exitoso:', {
              publicId: result.public_id,
              url: result.secure_url,
              size: result.bytes,
              format: result.format,
              dimensions: `${result.width}x${result.height}`
            });
            resolve(result);
          }
        }
      );

      uploadStream.end(imageFile.data);
    });

    // Obtener metadatos adicionales del body (si existen)
    const {
      category = 'other',
      title = imageFile.name,
      description = '',
      alt = '',
      tags = []
    } = req.body;

    // ============================================
    // CREAR REGISTRO EN BASE DE DATOS
    // ============================================
    logger.info('💾 Guardando registro en base de datos...');
    
    const imageRecord = await Image.create({
      filename: uploadResult.public_id, // Usar public_id de Cloudinary
      originalName: imageFile.name,
      url: uploadResult.secure_url, // URL pública de Cloudinary
      cloudinaryId: uploadResult.public_id, // Guardar ID para eliminar después
      mimetype: imageFile.mimetype,
      size: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height,
      category,
      title,
      description,
      alt,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      uploadedBy: userId,
      isOrphan: true // Inicialmente es huérfana hasta que se use
    });

    logger.success('🎉 Upload completado exitosamente:', {
      imageId: imageRecord._id,
      cloudinaryId: uploadResult.public_id,
      url: uploadResult.secure_url,
      userId: userId,
      category: category,
      size: `${(uploadResult.bytes / 1024 / 1024).toFixed(2)}MB`
    });

    res.status(201).json({
      success: true,
      message: 'Imagen subida correctamente',
      data: imageRecord
    });
  } catch (error) {
    // ============================================
    // MANEJO DE ERRORES CON LOGS DETALLADOS
    // ============================================
    logger.error('💥 Error crítico en upload de imagen:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.clerkId || req.user?.id,
      fileName: req.files?.image?.name,
      cloudinaryConfig: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME ? '✅ CONFIGURADO' : '❌ NO CONFIGURADO',
        apiKey: process.env.CLOUDINARY_API_KEY ? '✅ CONFIGURADO' : '❌ NO CONFIGURADO',
        apiSecret: process.env.CLOUDINARY_API_SECRET ? '✅ CONFIGURADO' : '❌ NO CONFIGURADO'
      }
    });

    // Determinar tipo de error para respuesta más específica
    let statusCode = 500;
    let message = 'Error interno del servidor al subir la imagen';

    if (error.message.includes('Invalid image file')) {
      statusCode = 400;
      message = 'Formato de imagen no válido';
    } else if (error.message.includes('File too large')) {
      statusCode = 413;
      message = 'El archivo es demasiado grande';
    } else if (error.message.includes('Cloudinary')) {
      statusCode = 503;
      message = 'Error en el servicio de almacenamiento de imágenes';
    }

    res.status(statusCode).json({
      success: false,
      message: message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    // Eliminar de Cloudinary si tiene cloudinaryId
    if (image.cloudinaryId) {
      try {
        await deleteFromCloudinary(image.cloudinaryId);
        logger.success(`Imagen eliminada de Cloudinary: ${image.cloudinaryId}`);
      } catch (cloudinaryError) {
        logger.error('Error al eliminar de Cloudinary:', cloudinaryError);
        // Continuar con la eliminación de BD aunque falle Cloudinary
      }
    } else {
      // Fallback: eliminar archivo físico local (para imágenes antiguas)
      const filePath = path.join(uploadsDir, image.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Eliminar registro de la base de datos
    await Image.findByIdAndDelete(id);

    logger.success(`Imagen eliminada de BD: ${image.filename}`);

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
