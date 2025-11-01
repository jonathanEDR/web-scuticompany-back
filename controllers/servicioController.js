import Servicio from '../models/Servicio.js';
import PaqueteServicio from '../models/PaqueteServicio.js';
import Categoria from '../models/Categoria.js';

/**
 * @desc    Obtener todos los servicios con filtros avanzados
 * @route   GET /api/servicios
 * @access  Public
 */
export const getServicios = async (req, res) => {
  try {
    const { 
      categoria, 
      destacado, 
      activo, 
      estado,
      visibleEnWeb,
      etiqueta,
      precioMin,
      precioMax,
      tipoPrecio,
      departamento,
      sort = '-createdAt',
      page = 1,
      limit = 10,
      includeDeleted = false,
      admin = false // Para identificar si es una consulta administrativa
    } = req.query;
    
    // Construir filtros dinámicos
    const filtros = {};
    
    // Si no es una consulta administrativa, filtrar solo servicios públicos
    if (admin !== 'true') {
      filtros.activo = true;
      filtros.visibleEnWeb = true;
    }
    
    if (categoria) filtros.categoria = categoria;
    if (destacado !== undefined) filtros.destacado = destacado === 'true';
    if (activo !== undefined && admin === 'true') filtros.activo = activo === 'true';
    if (estado) filtros.estado = estado;
    if (visibleEnWeb !== undefined && admin === 'true') filtros.visibleEnWeb = visibleEnWeb === 'true';
    if (etiqueta) filtros.etiquetas = etiqueta;
    if (tipoPrecio) filtros.tipoPrecio = tipoPrecio;
    if (departamento) filtros.departamento = departamento;
    
    // Filtros de precio
    if (precioMin || precioMax) {
      filtros.$or = [];
      if (precioMin) {
        filtros.$or.push(
          { precio: { $gte: Number(precioMin) } },
          { precioMin: { $gte: Number(precioMin) } }
        );
      }
      if (precioMax) {
        filtros.$or.push(
          { precio: { $lte: Number(precioMax) } },
          { precioMax: { $lte: Number(precioMax) } }
        );
      }
    }

    // Configurar opciones de paginación
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort
    };

    // Si se incluyen eliminados, agregar opción especial
    const queryOptions = includeDeleted === 'true' ? { includeDeleted: true } : {};

    const servicios = await Servicio.find(filtros, null, queryOptions)
      .sort(options.sort)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .populate('responsable', 'firstName lastName email')
      .populate('categoria', 'nombre descripcion slug icono color')
      .populate('paquetes');

    const total = await Servicio.countDocuments(filtros);
    
    res.status(200).json({
      success: true,
      count: servicios.length,
      total,
      page: options.page,
      pages: Math.ceil(total / options.limit),
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
 * @desc    Obtener un servicio por ID o slug con paquetes
 * @route   GET /api/servicios/:id
 * @access  Public
 */
export const getServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const { includePaquetes = true, admin = false } = req.query;
    
    // Construir filtros base
    const baseFilter = {
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { slug: id }
      ]
    };
    
    // Si no es una consulta administrativa, filtrar solo servicios públicos
    if (admin !== 'true') {
      baseFilter.activo = true;
      baseFilter.visibleEnWeb = true;
    }
    
    // Buscar por ID o por slug con filtros de visibilidad
    let query = Servicio.findOne(baseFilter)
      .populate('responsable', 'firstName lastName email')
      .populate('categoria', 'nombre descripcion slug icono color');

    if (includePaquetes === 'true') {
      query = query.populate('paquetes');
    }

    const servicio = await query;

    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado o no disponible públicamente'
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
 * @access  Private - Requiere CREATE_SERVICES permission
 */
export const createServicio = async (req, res) => {
  try {
    // Agregar automáticamente el usuario responsable si está autenticado
    const servicioData = {
      ...req.body
    };

    // Si el usuario está autenticado, asignarlo como responsable
    if (req.user && req.user.id) {
      servicioData.responsable = req.user.id;
    }

    // Si no se proporciona slug, se generará automáticamente en el middleware
    // Si se proporciona slug y ya existe, el middleware agregará timestamp

    const servicio = await Servicio.create(servicioData);
    
    res.status(201).json({
      success: true,
      message: 'Servicio creado exitosamente',
      data: servicio
    });
  } catch (error) {
    console.error('❌ Error al crear servicio:', error);
    
    // Manejo específico para error de slug duplicado
    if (error.code === 11000 && error.keyPattern?.slug) {
      return res.status(400).json({
        success: false,
        message: 'Error: El slug del servicio ya existe',
        error: 'Por favor, intenta con un título diferente o deja que el sistema genere el slug automáticamente'
      });
    }
    
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
    console.log('📥 Datos recibidos para actualizar:', {
      id: req.params.id,
      imagen: req.body.imagen,
      titulo: req.body.titulo
    });

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

/**
 * @desc    Buscar servicios
 * @route   GET /api/servicios/buscar
 * @access  Public
 */
export const buscarServicios = async (req, res) => {
  try {
    const { q, categoria, estado } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un término de búsqueda'
      });
    }

    const filtros = {};
    if (categoria) filtros.categoria = categoria;
    if (estado) filtros.estado = estado;

    const servicios = await Servicio.buscar(q, filtros);

    res.status(200).json({
      success: true,
      count: servicios.length,
      data: servicios
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en la búsqueda',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener servicios por categoría
 * @route   GET /api/servicios/categoria/:categoria
 * @access  Public
 */
export const getServiciosPorCategoria = async (req, res) => {
  try {
    const { categoria } = req.params;
    const servicios = await Servicio.findByCategoria(categoria);

    res.status(200).json({
      success: true,
      count: servicios.length,
      data: servicios
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicios por categoría',
      error: error.message
    });
  }
};

/**
 * @desc    Duplicar un servicio
 * @route   POST /api/servicios/:id/duplicar
 * @access  Private
 */
export const duplicarServicio = async (req, res) => {
  try {
    const servicioOriginal = await Servicio.findById(req.params.id);

    if (!servicioOriginal) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    // Crear copia del servicio
    const servicioCopia = servicioOriginal.toObject();
    delete servicioCopia._id;
    delete servicioCopia.createdAt;
    delete servicioCopia.updatedAt;
    servicioCopia.titulo = `${servicioCopia.titulo} (Copia)`;
    servicioCopia.slug = null; // Se generará automáticamente
    servicioCopia.vecesVendido = 0;
    servicioCopia.ingresoTotal = 0;
    servicioCopia.activo = false; // Comenzar inactivo
    servicioCopia.estado = 'desarrollo';

    const nuevoServicio = await Servicio.create(servicioCopia);

    // Duplicar paquetes si existen
    const paquetesOriginales = await PaqueteServicio.find({ servicioId: req.params.id });
    
    if (paquetesOriginales.length > 0) {
      const nuevosPaquetes = paquetesOriginales.map(paquete => {
        const paqueteCopia = paquete.toObject();
        delete paqueteCopia._id;
        delete paqueteCopia.createdAt;
        delete paqueteCopia.updatedAt;
        paqueteCopia.servicioId = nuevoServicio._id;
        paqueteCopia.vecesVendido = 0;
        paqueteCopia.ingresoTotal = 0;
        return paqueteCopia;
      });

      await PaqueteServicio.insertMany(nuevosPaquetes);
    }

    res.status(201).json({
      success: true,
      message: 'Servicio duplicado exitosamente',
      data: nuevoServicio
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al duplicar el servicio',
      error: error.message
    });
  }
};

/**
 * @desc    Cambiar estado de un servicio
 * @route   PATCH /api/servicios/:id/estado
 * @access  Private
 */
export const cambiarEstado = async (req, res) => {
  try {
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido'
      });
    }

    const servicio = await Servicio.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true, runValidators: true }
    );

    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: `Estado cambiado a ${estado}`,
      data: servicio
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al cambiar el estado',
      error: error.message
    });
  }
};

/**
 * @desc    Cambiar estado masivo de servicios
 * @route   PATCH /api/servicios/bulk/estado
 * @access  Private
 */
export const cambiarEstadoMasivo = async (req, res) => {
  try {
    const { ids, estado } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs'
      });
    }

    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido'
      });
    }

    const result = await Servicio.updateMany(
      { _id: { $in: ids } },
      { estado }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} servicios actualizados`,
      data: { modificados: result.modifiedCount }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al cambiar estados',
      error: error.message
    });
  }
};

/**
 * @desc    Soft delete de un servicio
 * @route   DELETE /api/servicios/:id/soft
 * @access  Private
 */
export const softDeleteServicio = async (req, res) => {
  try {
    const servicio = await Servicio.findById(req.params.id);

    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    await servicio.softDelete();

    res.status(200).json({
      success: true,
      message: 'Servicio eliminado exitosamente (soft delete)',
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
 * @desc    Restaurar un servicio eliminado
 * @route   PATCH /api/servicios/:id/restaurar
 * @access  Private
 */
export const restaurarServicio = async (req, res) => {
  try {
    const servicio = await Servicio.findById(req.params.id).setOptions({ includeDeleted: true });

    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    await servicio.restore();

    res.status(200).json({
      success: true,
      message: 'Servicio restaurado exitosamente',
      data: servicio
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al restaurar el servicio',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener top servicios más vendidos
 * @route   GET /api/servicios/top/vendidos
 * @access  Public
 */
export const getTopServicios = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const servicios = await Servicio.getTopServicios(parseInt(limit));

    res.status(200).json({
      success: true,
      count: servicios.length,
      data: servicios
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener top servicios',
      error: error.message
    });
  }
};
