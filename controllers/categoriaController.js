import Categoria from '../models/Categoria.js';
import Servicio from '../models/Servicio.js';

// Obtener todas las categorías
export const obtenerCategorias = async (req, res) => {
  try {
    const { activas, conServicios } = req.query;
    
    let query = {};
    if (activas === 'true') {
      query.activo = true;
    }
    
    let categorias = await Categoria.find(query)
      .sort({ orden: 1, nombre: 1 });
    
    // Si se solicita incluir conteo de servicios
    if (conServicios === 'true') {
      for (let categoria of categorias) {
        await categoria.actualizarContadorServicios();
      }
    }
    
    res.status(200).json({
      success: true,
      data: categorias,
      total: categorias.length
    });
    
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener una categoría por ID
export const obtenerCategoriaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const categoria = await Categoria.findById(id);
    
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    // Actualizar contador de servicios
    await categoria.actualizarContadorServicios();
    
    res.status(200).json({
      success: true,
      data: categoria
    });
    
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear nueva categoría
export const crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion, icono, color, orden } = req.body;
    
    // Validar que el nombre no esté vacío
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es obligatorio'
      });
    }
    
    // Verificar si ya existe una categoría con el mismo nombre
    const categoriaExistente = await Categoria.findOne({ 
      nombre: { $regex: new RegExp(`^${nombre.trim()}$`, 'i') }
    });
    
    if (categoriaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      });
    }
    
    const nuevaCategoria = new Categoria({
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || '',
      icono: icono || '📁',
      color: color || '#6B7280',
      orden: orden || 0
    });
    
    const categoriaGuardada = await nuevaCategoria.save();
    
    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: categoriaGuardada
    });
    
  } catch (error) {
    console.error('Error al crear categoría:', error);
    
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Datos de validación incorrectos',
        errors: errores
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar categoría
export const actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, icono, color, orden, activo } = req.body;
    
    const categoria = await Categoria.findById(id);
    
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    // Si se está cambiando el nombre, verificar que no exista otra con el mismo nombre
    if (nombre && nombre.trim() !== categoria.nombre) {
      const categoriaExistente = await Categoria.findOne({ 
        nombre: { $regex: new RegExp(`^${nombre.trim()}$`, 'i') },
        _id: { $ne: id }
      });
      
      if (categoriaExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una categoría con ese nombre'
        });
      }
    }
    
    // Actualizar campos
    if (nombre) categoria.nombre = nombre.trim();
    if (descripcion !== undefined) categoria.descripcion = descripcion.trim();
    if (icono) categoria.icono = icono;
    if (color) categoria.color = color;
    if (orden !== undefined) categoria.orden = orden;
    if (activo !== undefined) categoria.activo = activo;
    
    const categoriaActualizada = await categoria.save();
    
    res.status(200).json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: categoriaActualizada
    });
    
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Datos de validación incorrectos',
        errors: errores
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar categoría
export const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    
    const categoria = await Categoria.findById(id);
    
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    // Verificar si hay servicios asociados
    const serviciosAsociados = await Servicio.countDocuments({ categoria: id });
    
    if (serviciosAsociados > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la categoría porque tiene ${serviciosAsociados} servicio(s) asociado(s)`
      });
    }
    
    await Categoria.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });
    
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener estadísticas de categorías
export const obtenerEstadisticasCategorias = async (req, res) => {
  try {
    const estadisticas = await Categoria.getEstadisticas();
    
    res.status(200).json({
      success: true,
      data: estadisticas
    });
    
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};