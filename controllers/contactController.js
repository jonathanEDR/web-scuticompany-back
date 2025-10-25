import Contact from '../models/Contact.js';
import { body, validationResult } from 'express-validator';

/**
 * 📝 VALIDADORES
 */
export const validateContactCreation = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  
  body('celular')
    .trim()
    .notEmpty().withMessage('El celular es requerido')
    .matches(/^[\d\s\+\-\(\)]+$/).withMessage('Formato de celular inválido'),
  
  body('correo')
    .trim()
    .notEmpty().withMessage('El correo es requerido')
    .isEmail().withMessage('Formato de correo inválido')
    .normalizeEmail(),
  
  body('mensaje')
    .trim()
    .notEmpty().withMessage('El mensaje es requerido')
    .isLength({ min: 10, max: 2000 }).withMessage('El mensaje debe tener entre 10 y 2000 caracteres')
];

/**
 * 📩 CREAR CONTACTO (PÚBLICO - SIN AUTH)
 * Endpoint para el formulario público del sitio web
 */
export const createContact = async (req, res) => {
  try {
    // Validar datos de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => ({
          campo: err.path,
          mensaje: err.msg
        }))
      });
    }

    const { nombre, celular, correo, mensaje } = req.body;

    // Crear metadata desde la request
    const metadata = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      referrer: req.get('referer'),
      idioma: req.get('accept-language')?.split(',')[0] || 'es'
    };

    // Crear nuevo contacto
    const nuevoContacto = new Contact({
      nombre,
      celular,
      correo,
      mensaje,
      origen: 'web',
      tipoFormulario: 'contacto_general',
      estado: 'nuevo',
      prioridad: 'media',
      metadata
    });

    await nuevoContacto.save();

    // Respuesta exitosa (sin datos sensibles)
    res.status(201).json({
      success: true,
      message: '¡Gracias por contactarnos! Te responderemos pronto.',
      contactId: nuevoContacto._id
    });

    // TODO: Aquí se puede agregar notificación por email/webhook
    console.log('✉️ Nuevo contacto recibido:', {
      id: nuevoContacto._id,
      nombre: nuevoContacto.nombre,
      correo: nuevoContacto.correo
    });

  } catch (error) {
    console.error('❌ Error al crear contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar tu mensaje. Por favor, intenta nuevamente.'
    });
  }
};

/**
 * 📋 OBTENER TODOS LOS CONTACTOS (ADMIN)
 * Con paginación, filtros y búsqueda
 */
export const getContacts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      estado,
      origen,
      prioridad,
      asignadoA,
      buscar,
      fechaDesde,
      fechaHasta,
      sortBy = 'fechaCreacion',
      sortOrder = 'desc'
    } = req.query;

    // Construir filtros
    const filtros = {};

    if (estado) filtros.estado = estado;
    if (origen) filtros.origen = origen;
    if (prioridad) filtros.prioridad = prioridad;
    if (asignadoA) filtros['asignadoA.userId'] = asignadoA;

    // Filtro de búsqueda por texto
    if (buscar) {
      const regex = new RegExp(buscar, 'i');
      filtros.$or = [
        { nombre: regex },
        { correo: regex },
        { celular: regex },
        { mensaje: regex }
      ];
    }

    // Filtro de fechas
    if (fechaDesde || fechaHasta) {
      filtros.fechaCreacion = {};
      if (fechaDesde) filtros.fechaCreacion.$gte = new Date(fechaDesde);
      if (fechaHasta) filtros.fechaCreacion.$lte = new Date(fechaHasta);
    }

    // Ordenamiento
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Ejecutar query con paginación
    const skip = (page - 1) * limit;
    const [contactos, total] = await Promise.all([
      Contact.find(filtros)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-metadata.userAgent -metadata.ip'), // Excluir datos sensibles
      Contact.countDocuments(filtros)
    ]);

    res.json({
      success: true,
      data: contactos,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener contactos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener contactos'
    });
  }
};

/**
 * 🔍 OBTENER CONTACTO POR ID (ADMIN)
 */
export const getContactById = async (req, res) => {
  try {
    const { id } = req.params;

    const contacto = await Contact.findById(id);

    if (!contacto) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }

    // Si el contacto está en estado "nuevo", marcarlo como "leído"
    if (contacto.estado === 'nuevo') {
      contacto.estado = 'leido';
      contacto.fechaLectura = new Date();
      await contacto.save();
    }

    res.json({
      success: true,
      data: contacto
    });

  } catch (error) {
    console.error('❌ Error al obtener contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener contacto'
    });
  }
};

/**
 * ✏️ ACTUALIZAR CONTACTO (ADMIN)
 * Actualizar estado, prioridad, asignación, etiquetas, etc.
 */
export const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const usuario = req.user; // Del middleware de autenticación

    const contacto = await Contact.findById(id);

    if (!contacto) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }

    // Campos permitidos para actualización directa
    const camposPermitidos = ['prioridad', 'etiquetas', 'calificacion'];
    camposPermitidos.forEach(campo => {
      if (updates[campo] !== undefined) {
        contacto[campo] = updates[campo];
      }
    });

    // Cambio de estado con método dedicado
    if (updates.estado && updates.estado !== contacto.estado) {
      contacto.cambiarEstado(updates.estado, {
        userId: usuario.clerkId,
        userName: usuario.nombre || usuario.firstName,
        userEmail: usuario.email
      });
    }

    // Asignación
    if (updates.asignadoA) {
      contacto.asignarA(updates.asignadoA);
    }

    await contacto.save();

    res.json({
      success: true,
      message: 'Contacto actualizado exitosamente',
      data: contacto
    });

  } catch (error) {
    console.error('❌ Error al actualizar contacto:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar contacto'
    });
  }
};

/**
 * 🗑️ ELIMINAR CONTACTO (ADMIN)
 */
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const contacto = await Contact.findByIdAndDelete(id);

    if (!contacto) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Contacto eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error al eliminar contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar contacto'
    });
  }
};

/**
 * 🔄 CAMBIAR ESTADO DEL CONTACTO (ADMIN)
 */
export const cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const usuario = req.user;

    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido'
      });
    }

    const contacto = await Contact.findById(id);

    if (!contacto) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }

    contacto.cambiarEstado(estado, {
      userId: usuario.clerkId,
      userName: usuario.nombre || usuario.firstName,
      userEmail: usuario.email
    });

    await contacto.save();

    res.json({
      success: true,
      message: `Estado cambiado a "${estado}" exitosamente`,
      data: contacto
    });

  } catch (error) {
    console.error('❌ Error al cambiar estado:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al cambiar estado'
    });
  }
};

/**
 * 📝 AGREGAR NOTA AL CONTACTO (ADMIN)
 */
export const agregarNota = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, contenido } = req.body;
    const usuario = req.user;

    if (!contenido) {
      return res.status(400).json({
        success: false,
        message: 'El contenido de la nota es requerido'
      });
    }

    const contacto = await Contact.findById(id);

    if (!contacto) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }

    contacto.agregarNota(tipo || 'nota', contenido, {
      userId: usuario.clerkId,
      userName: usuario.nombre || usuario.firstName,
      userEmail: usuario.email
    });

    await contacto.save();

    res.json({
      success: true,
      message: 'Nota agregada exitosamente',
      data: contacto
    });

  } catch (error) {
    console.error('❌ Error al agregar nota:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar nota'
    });
  }
};

/**
 * 📊 OBTENER ESTADÍSTICAS (ADMIN)
 */
export const getEstadisticas = async (req, res) => {
  try {
    const stats = await Contact.getEstadisticasGenerales();

    // Estadísticas adicionales
    const [
      promedioRespuesta,
      contactosUltimaSemana,
      topOrigenes
    ] = await Promise.all([
      // Promedio de tiempo de respuesta (en horas)
      Contact.aggregate([
        { 
          $match: { 
            fechaRespuesta: { $exists: true },
            fechaCreacion: { $exists: true }
          } 
        },
        {
          $project: {
            tiempoRespuesta: {
              $divide: [
                { $subtract: ['$fechaRespuesta', '$fechaCreacion'] },
                1000 * 60 * 60 // Convertir a horas
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            promedio: { $avg: '$tiempoRespuesta' }
          }
        }
      ]),
      
      // Contactos de la última semana
      Contact.countDocuments({
        fechaCreacion: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }),
      
      // Top 5 orígenes
      Contact.aggregate([
        { $group: { _id: '$origen', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        ...stats,
        promedioRespuestaHoras: promedioRespuesta[0]?.promedio?.toFixed(2) || 0,
        contactosUltimaSemana,
        topOrigenes
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

/**
 * 📌 OBTENER CONTACTOS PENDIENTES (ADMIN)
 * Contactos nuevos o en proceso
 */
export const getContactosPendientes = async (req, res) => {
  try {
    const contactos = await Contact.getContactosPendientes();

    res.json({
      success: true,
      data: contactos,
      count: contactos.length
    });

  } catch (error) {
    console.error('❌ Error al obtener contactos pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener contactos pendientes'
    });
  }
};

/**
 * 🔍 BUSCAR CONTACTOS (ADMIN)
 */
export const buscarContactos = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'El término de búsqueda debe tener al menos 2 caracteres'
      });
    }

    const contactos = await Contact.buscarPorTexto(q);

    res.json({
      success: true,
      data: contactos,
      count: contactos.length
    });

  } catch (error) {
    console.error('❌ Error al buscar contactos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar contactos'
    });
  }
};
