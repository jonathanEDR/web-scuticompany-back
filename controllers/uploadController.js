import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// @desc    Subir imagen
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

    const image = req.files.image;
    
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(image.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de archivo no permitido. Solo se permiten: JPG, PNG, GIF, WEBP'
      });
    }

    // Validar tamaño (max 5MB)
    if (image.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Máximo 5MB'
      });
    }

    // Generar nombre único
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = path.extname(image.name);
    const filename = `${timestamp}-${randomString}${extension}`;
    
    // Ruta completa del archivo
    const uploadPath = path.join(uploadsDir, filename);

    // Mover el archivo
    await image.mv(uploadPath);

    // URL pública del archivo
    const imageUrl = `/uploads/${filename}`;

    res.json({
      success: true,
      message: 'Imagen subida correctamente',
      data: {
        filename,
        url: imageUrl,
        size: image.size,
        mimetype: image.mimetype
      }
    });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir la imagen',
      error: error.message
    });
  }
};

// @desc    Eliminar imagen
// @route   DELETE /api/upload/image/:filename
// @access  Private
export const deleteImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada'
      });
    }

    // Eliminar el archivo
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'Imagen eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la imagen',
      error: error.message
    });
  }
};

// @desc    Listar todas las imágenes
// @route   GET /api/upload/images
// @access  Private
export const listImages = async (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    
    const images = files.map(filename => {
      const stats = fs.statSync(path.join(uploadsDir, filename));
      return {
        filename,
        url: `/uploads/${filename}`,
        size: stats.size,
        uploadedAt: stats.birthtime
      };
    });

    res.json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    console.error('Error al listar imágenes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar imágenes',
      error: error.message
    });
  }
};
