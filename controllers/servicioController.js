import Servicio from '../models/Servicio.js';

/**
 * @desc    Obtener todos los servicios
 * @route   GET /api/servicios
 * @access  Public
 */
export const getServicios = async (req, res) => {
  try {
    const { categoria, destacado, activo = true } = req.query;
    
    // Construir filtros dinámicos
    const filtros = { activo };
    if (categoria) filtros.categoria = categoria;
    if (destacado) filtros.destacado = destacado === 'true';

    const servicios = await Servicio.find(filtros).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: servicios.length,
      data: servicios
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicios',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener un servicio por ID o slug
 * @route   GET /api/servicios/:id
 * @access  Public
 */
export const getServicio = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar por ID o por slug
    const servicio = await Servicio.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { slug: id }
      ]
    });

    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: servicio
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el servicio',
      error: error.message
    });
  }
};

/**
 * @desc    Crear un nuevo servicio
 * @route   POST /api/servicios
 * @access  Private (por ahora public para testing)
 */
export const createServicio = async (req, res) => {
  try {
    const servicio = await Servicio.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Servicio creado exitosamente',
      data: servicio
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al crear el servicio',
      error: error.message
    });
  }
};

/**
 * @desc    Actualizar un servicio
 * @route   PUT /api/servicios/:id
 * @access  Private (por ahora public para testing)
 */
export const updateServicio = async (req, res) => {
  try {
    const servicio = await Servicio.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true, // Retornar el documento actualizado
        runValidators: true // Ejecutar validaciones del schema
      }
    );

    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Servicio actualizado exitosamente',
      data: servicio
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al actualizar el servicio',
      error: error.message
    });
  }
};

/**
 * @desc    Eliminar un servicio
 * @route   DELETE /api/servicios/:id
 * @access  Private (por ahora public para testing)
 */
export const deleteServicio = async (req, res) => {
  try {
    const servicio = await Servicio.findByIdAndDelete(req.params.id);

    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Servicio eliminado exitosamente',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el servicio',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener servicios destacados
 * @route   GET /api/servicios/destacados
 * @access  Public
 */
export const getServiciosDestacados = async (req, res) => {
  try {
    const servicios = await Servicio.findDestacados();
    
    res.status(200).json({
      success: true,
      count: servicios.length,
      data: servicios
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicios destacados',
      error: error.message
    });
  }
};
