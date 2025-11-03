import mongoose from 'mongoose';

/**
 * 📄 Schema de Plantilla de Mensaje
 * Plantillas predefinidas para respuestas rápidas en el CRM
 */
const messageTemplateSchema = new mongoose.Schema({
  // ========================================
  // 📋 INFORMACIÓN BÁSICA
  // ========================================
  titulo: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    unique: true,
    maxlength: 100
  },
  
  descripcion: {
    type: String,
    trim: true,
    maxlength: 300
  },
  
  // ========================================
  // 📝 CONTENIDO DE LA PLANTILLA
  // ========================================
  asunto: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  contenido: {
    type: String,
    required: [true, 'El contenido es requerido'],
    maxlength: 5000
  },
  
  // ========================================
  // 🏷️ CATEGORIZACIÓN
  // ========================================
  tipo: {
    type: String,
    enum: [
      'bienvenida',
      'seguimiento',
      'cotizacion',
      'propuesta',
      'cierre',
      'agradecimiento',
      'recordatorio',
      'rechazo',
      'custom'
    ],
    required: true,
    index: true
  },
  
  categoria: {
    type: String,
    enum: ['ventas', 'soporte', 'marketing', 'general'],
    default: 'general',
    index: true
  },
  
  // ========================================
  // 🔧 VARIABLES DINÁMICAS
  // ========================================
  // Variables que pueden ser reemplazadas al usar la plantilla
  variables: [{
    nombre: {
      type: String,
      required: true
      // ej: 'nombre', 'empresa', 'servicio', 'precio'
    },
    descripcion: {
      type: String
      // ej: 'Nombre del cliente'
    },
    valorDefault: {
      type: String
      // Valor por defecto si no se proporciona
    },
    requerido: {
      type: Boolean,
      default: false
    }
  }],
  
  // ========================================
  // 🎯 CONFIGURACIÓN DE USO
  // ========================================
  esPrivada: {
    type: Boolean,
    default: false
    // true = Solo el creador puede usarla
    // false = Toda la organización puede usarla
  },
  
  esActiva: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Canal para el que está diseñada
  canal: {
    type: String,
    enum: ['sistema', 'email', 'sms', 'whatsapp', 'todos'],
    default: 'sistema'
  },
  
  // ========================================
  // 👤 INFORMACIÓN DEL CREADOR
  // ========================================
  creadoPor: {
    userId: {
      type: String,
      required: true
    },
    nombre: String,
    email: String
  },
  
  // ========================================
  // 📊 ESTADÍSTICAS DE USO
  // ========================================
  vecesUsada: {
    type: Number,
    default: 0
  },
  
  ultimoUso: {
    type: Date,
    default: null
  },
  
  // ========================================
  // 🏷️ TAGS Y BÚSQUEDA
  // ========================================
  etiquetas: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // ========================================
  // ⭐ FAVORITOS
  // ========================================
  favoritos: [{
    userId: String,
    agregadoEn: {
      type: Date,
      default: Date.now
    }
  }],
  
  // ========================================
  // 🎨 METADATA ADICIONAL
  // ========================================
  metadata: {
    colorTag: String,      // Color visual para identificación rápida
    icono: String,         // Emoji o icono asociado
    atajo: String          // Shortcut de teclado (ej: '/bienvenida')
  }
  
}, {
  timestamps: true, // createdAt, updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ========================================
// 📇 ÍNDICES
// ========================================
messageTemplateSchema.index({ tipo: 1, categoria: 1, esActiva: 1 });
messageTemplateSchema.index({ 'creadoPor.userId': 1, esActiva: 1 });
messageTemplateSchema.index({ etiquetas: 1 });
messageTemplateSchema.index({ vecesUsada: -1 }); // Para ordenar por popularidad

// ========================================
// 🔧 MÉTODOS DE INSTANCIA
// ========================================

/**
 * Procesar plantilla reemplazando variables
 * @param {object} valores - Objeto con valores para las variables
 * @returns {object} { asunto, contenido } procesados
 */
messageTemplateSchema.methods.procesar = function(valores = {}) {
  let contenidoProcesado = this.contenido;
  let asuntoProcesado = this.asunto || '';
  
  // Reemplazar variables en formato {variable}
  this.variables.forEach(variable => {
    const valor = valores[variable.nombre] || variable.valorDefault || '';
    const regex = new RegExp(`{${variable.nombre}}`, 'g');
    
    contenidoProcesado = contenidoProcesado.replace(regex, valor);
    asuntoProcesado = asuntoProcesado.replace(regex, valor);
  });
  
  return {
    asunto: asuntoProcesado,
    contenido: contenidoProcesado
  };
};

/**
 * Registrar uso de la plantilla
 */
messageTemplateSchema.methods.registrarUso = function() {
  this.vecesUsada += 1;
  this.ultimoUso = new Date();
  return this.save();
};

/**
 * Marcar/desmarcar como favorito para un usuario
 * @param {string} userId - ID del usuario
 */
messageTemplateSchema.methods.toggleFavorito = function(userId) {
  const index = this.favoritos.findIndex(f => f.userId === userId);
  
  if (index >= 0) {
    // Ya es favorito, remover
    this.favoritos.splice(index, 1);
  } else {
    // Agregar a favoritos
    this.favoritos.push({
      userId,
      agregadoEn: new Date()
    });
  }
  
  return this.save();
};

/**
 * Verificar si es favorito de un usuario
 * @param {string} userId - ID del usuario
 */
messageTemplateSchema.methods.esFavoritoDe = function(userId) {
  return this.favoritos.some(f => f.userId === userId);
};

/**
 * Clonar plantilla para crear una nueva
 * @param {object} usuario - Usuario que clona
 */
messageTemplateSchema.methods.clonar = function(usuario) {
  const Template = this.constructor;
  
  return new Template({
    titulo: `${this.titulo} (Copia)`,
    descripcion: this.descripcion,
    asunto: this.asunto,
    contenido: this.contenido,
    tipo: this.tipo,
    categoria: this.categoria,
    variables: this.variables,
    esPrivada: true, // Las copias son privadas por defecto
    canal: this.canal,
    creadoPor: {
      userId: usuario.id || usuario.clerkId,
      nombre: `${usuario.firstName || ''} ${usuario.lastName || ''}`.trim() || usuario.email,
      email: usuario.email
    },
    etiquetas: [...this.etiquetas]
  });
};

// ========================================
// 📊 MÉTODOS ESTÁTICOS
// ========================================

/**
 * Obtener plantillas disponibles para un usuario
 * @param {string} userId - ID del usuario
 * @param {object} filtros - Filtros adicionales
 */
messageTemplateSchema.statics.obtenerDisponibles = async function(userId, filtros = {}) {
  const query = {
    esActiva: true,
    $or: [
      { esPrivada: false },
      { 'creadoPor.userId': userId }
    ],
    ...filtros
  };
  
  return this.find(query).sort({ vecesUsada: -1, titulo: 1 });
};

/**
 * Obtener plantillas más usadas
 * @param {number} limit - Cantidad de resultados
 */
messageTemplateSchema.statics.obtenerMasUsadas = async function(limit = 10) {
  return this.find({ esActiva: true })
    .sort({ vecesUsada: -1 })
    .limit(limit);
};

/**
 * Obtener plantillas favoritas de un usuario
 * @param {string} userId - ID del usuario
 */
messageTemplateSchema.statics.obtenerFavoritas = async function(userId) {
  return this.find({
    esActiva: true,
    'favoritos.userId': userId
  }).sort({ titulo: 1 });
};

/**
 * Buscar plantillas por texto
 * @param {string} busqueda - Texto a buscar
 * @param {string} userId - ID del usuario (opcional)
 */
messageTemplateSchema.statics.buscar = async function(busqueda, userId = null) {
  const query = {
    esActiva: true,
    $or: [
      { titulo: { $regex: busqueda, $options: 'i' } },
      { descripcion: { $regex: busqueda, $options: 'i' } },
      { contenido: { $regex: busqueda, $options: 'i' } },
      { etiquetas: { $regex: busqueda, $options: 'i' } }
    ]
  };
  
  // Si se proporciona userId, incluir plantillas públicas y privadas del usuario
  if (userId) {
    query.$and = [
      {
        $or: [
          { esPrivada: false },
          { 'creadoPor.userId': userId }
        ]
      }
    ];
  } else {
    query.esPrivada = false;
  }
  
  return this.find(query).sort({ vecesUsada: -1, titulo: 1 });
};

/**
 * Crear plantillas por defecto del sistema
 */
messageTemplateSchema.statics.crearPlantillasDefault = async function() {
  const plantillasDefault = [
    {
      titulo: 'Bienvenida - Nuevo Lead',
      descripcion: 'Mensaje de bienvenida automático para nuevos leads',
      asunto: '¡Gracias por contactarnos, {nombre}!',
      contenido: `Hola {nombre},

¡Gracias por ponerte en contacto con nosotros!

Hemos recibido tu solicitud sobre {servicio} y estamos muy emocionados de poder ayudarte.

Nuestro equipo revisará tu mensaje y te responderemos en un plazo máximo de 24 horas.

Mientras tanto, si tienes alguna pregunta urgente, no dudes en responder a este mensaje.

¡Saludos cordiales!
El equipo de Scuti`,
      tipo: 'bienvenida',
      categoria: 'ventas',
      variables: [
        { nombre: 'nombre', descripcion: 'Nombre del cliente', requerido: true },
        { nombre: 'servicio', descripcion: 'Tipo de servicio solicitado', valorDefault: 'tu proyecto' }
      ],
      esPrivada: false,
      canal: 'sistema',
      creadoPor: {
        userId: 'system',
        nombre: 'Sistema',
        email: 'sistema@scuti.com'
      },
      etiquetas: ['bienvenida', 'automatico', 'inicial']
    },
    {
      titulo: 'Seguimiento - Primera Respuesta',
      descripcion: 'Primera respuesta personalizada al cliente',
      asunto: 'Re: Tu solicitud de {servicio}',
      contenido: `Hola {nombre},

Gracias por tu interés en {servicio}.

He revisado los detalles que nos compartiste y me gustaría coordinar una llamada para conocer mejor tus necesidades y poder ofrecerte la mejor solución.

¿Tendrías disponibilidad esta semana para una llamada rápida de 15-20 minutos?

Algunas opciones que tengo disponibles:
- {opcion1}
- {opcion2}
- {opcion3}

Por favor, déjame saber cuál te viene mejor.

¡Saludos!
{nombre_agente}`,
      tipo: 'seguimiento',
      categoria: 'ventas',
      variables: [
        { nombre: 'nombre', descripcion: 'Nombre del cliente', requerido: true },
        { nombre: 'servicio', descripcion: 'Servicio de interés', requerido: true },
        { nombre: 'opcion1', descripcion: 'Primera opción de horario', valorDefault: 'Martes 10:00 AM' },
        { nombre: 'opcion2', descripcion: 'Segunda opción de horario', valorDefault: 'Miércoles 3:00 PM' },
        { nombre: 'opcion3', descripcion: 'Tercera opción de horario', valorDefault: 'Jueves 11:00 AM' },
        { nombre: 'nombre_agente', descripcion: 'Nombre del agente', requerido: true }
      ],
      esPrivada: false,
      canal: 'sistema',
      creadoPor: {
        userId: 'system',
        nombre: 'Sistema',
        email: 'sistema@scuti.com'
      },
      etiquetas: ['seguimiento', 'reunion', 'agenda']
    },
    {
      titulo: 'Cotización Enviada',
      descripcion: 'Notificación de cotización lista',
      asunto: 'Tu cotización para {proyecto} está lista',
      contenido: `Hola {nombre},

Adjunto encontrarás la cotización detallada para {proyecto}.

Resumen:
- Inversión: {precio}
- Tiempo estimado: {tiempo}
- Incluye: {incluye}

Esta cotización es válida por {validez} días.

Si tienes alguna pregunta o necesitas ajustes, estoy a tu disposición para conversarlo.

¿Te gustaría agendar una llamada para revisar los detalles?

¡Quedamos atentos!
{nombre_agente}`,
      tipo: 'cotizacion',
      categoria: 'ventas',
      variables: [
        { nombre: 'nombre', descripcion: 'Nombre del cliente', requerido: true },
        { nombre: 'proyecto', descripcion: 'Nombre del proyecto', requerido: true },
        { nombre: 'precio', descripcion: 'Precio total', requerido: true },
        { nombre: 'tiempo', descripcion: 'Tiempo de desarrollo', valorDefault: '4-6 semanas' },
        { nombre: 'incluye', descripcion: 'Qué incluye', valorDefault: 'Desarrollo, diseño y soporte' },
        { nombre: 'validez', descripcion: 'Días de validez', valorDefault: '15' },
        { nombre: 'nombre_agente', descripcion: 'Nombre del agente', requerido: true }
      ],
      esPrivada: false,
      canal: 'sistema',
      creadoPor: {
        userId: 'system',
        nombre: 'Sistema',
        email: 'sistema@scuti.com'
      },
      etiquetas: ['cotizacion', 'propuesta', 'precio']
    }
  ];
  
  try {
    for (const plantilla of plantillasDefault) {
      await this.findOneAndUpdate(
        { titulo: plantilla.titulo },
        plantilla,
        { upsert: true, new: true }
      );
    }
    console.log('✅ Plantillas por defecto creadas/actualizadas');
  } catch (error) {
    console.error('❌ Error creando plantillas por defecto:', error);
  }
};

// ========================================
// 🎨 VIRTUAL PROPERTIES
// ========================================

/**
 * Virtual para cantidad de favoritos
 */
messageTemplateSchema.virtual('cantidadFavoritos').get(function() {
  return this.favoritos ? this.favoritos.length : 0;
});

/**
 * Virtual para indicar si es popular
 */
messageTemplateSchema.virtual('esPopular').get(function() {
  return this.vecesUsada >= 10;
});

export default mongoose.model('MessageTemplate', messageTemplateSchema);
