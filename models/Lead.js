import mongoose from 'mongoose';

/**
 * 📝 Schema de Actividad de Lead
 * Registra todas las interacciones con el lead
 */
const leadActivitySchema = new mongoose.Schema({
  fecha: {
    type: Date,
    default: Date.now
  },
  tipo: {
    type: String,
    enum: ['nota', 'llamada', 'email', 'reunion', 'propuesta', 'cambio_estado'],
    required: true
  },
  descripcion: {
    type: String,
    required: true
  },
  usuarioId: {
    type: String, // Clerk user ID
    required: true
  },
  usuarioNombre: {
    type: String,
    required: true
  }
});

/**
 * 🎯 Schema Principal de Lead
 * Modelo completo de CRM integrado con sistema de roles
 */
const leadSchema = new mongoose.Schema({
  // ========================================
  // 👤 INFORMACIÓN DEL CLIENTE
  // ========================================
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    index: true
  },
  celular: {
    type: String,
    required: [true, 'El celular es requerido'],
    trim: true
  },
  correo: {
    type: String,
    required: [true, 'El correo es requerido'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
    index: true
  },
  empresa: {
    type: String,
    trim: true
  },
  
  // ========================================
  // 💼 INFORMACIÓN DEL PROYECTO
  // ========================================
  tipoServicio: {
    type: String,
    enum: ['web', 'app', 'ecommerce', 'sistemas', 'consultoria', 'diseño', 'marketing', 'otro'],
    required: true
  },
  descripcionProyecto: {
    type: String,
    required: [true, 'La descripción del proyecto es requerida']
  },
  presupuestoEstimado: {
    type: Number,
    min: 0
  },
  fechaDeseada: {
    type: Date
  },
  
  // ========================================
  // 📊 ESTADO DEL LEAD
  // ========================================
  estado: {
    type: String,
    enum: ['nuevo', 'contactado', 'calificado', 'propuesta', 'negociacion', 'ganado', 'perdido', 'pausado'],
    default: 'nuevo',
    index: true
  },
  prioridad: {
    type: String,
    enum: ['baja', 'media', 'alta', 'urgente'],
    default: 'media'
  },
  
  // ========================================
  // 📅 INFORMACIÓN DE SEGUIMIENTO
  // ========================================
  fechaProximoSeguimiento: {
    type: Date
  },
  asignadoA: {
    userId: {
      type: String, // Clerk user ID
      index: true
    },
    nombre: String,
    email: String
  },
  
  // ========================================
  // 🌐 ORIGEN DEL LEAD
  // ========================================
  origen: {
    type: String,
    enum: ['web', 'referido', 'redes_sociales', 'email', 'telefono', 'evento', 'chat', 'otro'],
    default: 'web'
  },
  
  // ========================================
  // 📜 HISTORIAL DE ACTIVIDADES
  // ========================================
  actividades: [leadActivitySchema],
  
  // ========================================
  // 👨‍💼 METADATOS DEL SISTEMA
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
  // 🏷️ TAGS Y CATEGORIZACIÓN
  // ========================================
  tags: [{
    type: String,
    trim: true
  }],
  
  // ========================================
  // 🗑️ SOFT DELETE
  // ========================================
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// ========================================
// 📇 ÍNDICES PARA OPTIMIZACIÓN
// ========================================
leadSchema.index({ estado: 1, fechaProximoSeguimiento: 1 });
leadSchema.index({ 'asignadoA.userId': 1, estado: 1 });
leadSchema.index({ origen: 1, createdAt: -1 });
leadSchema.index({ tipoServicio: 1, estado: 1 });
leadSchema.index({ prioridad: 1, estado: 1 });

// ========================================
// 🔧 MÉTODOS DEL MODELO
// ========================================

/**
 * Agregar actividad al lead
 * @param {string} tipo - Tipo de actividad
 * @param {string} descripcion - Descripción de la actividad
 * @param {object} usuario - Información del usuario (de Clerk)
 */
leadSchema.methods.agregarActividad = function(tipo, descripcion, usuario) {
  this.actividades.push({
    tipo,
    descripcion,
    usuarioId: usuario.id,
    usuarioNombre: `${usuario.firstName || ''} ${usuario.lastName || ''}`.trim() || usuario.email
  });
  return this.save();
};

/**
 * Cambiar estado del lead con logging automático
 * @param {string} nuevoEstado - Nuevo estado del lead
 * @param {string} razon - Razón del cambio
 * @param {object} usuario - Información del usuario (de Clerk)
 */
leadSchema.methods.cambiarEstado = function(nuevoEstado, razon, usuario) {
  const estadoAnterior = this.estado;
  this.estado = nuevoEstado;
  
  return this.agregarActividad(
    'cambio_estado',
    `Estado cambiado de "${estadoAnterior}" a "${nuevoEstado}". ${razon ? `Razón: ${razon}` : ''}`,
    usuario
  );
};

/**
 * Asignar lead a un usuario
 * @param {object} usuario - Información del usuario a asignar
 * @param {object} asignadoPor - Usuario que hace la asignación
 */
leadSchema.methods.asignarA = function(usuario, asignadoPor) {
  this.asignadoA = {
    userId: usuario.id,
    nombre: `${usuario.firstName || ''} ${usuario.lastName || ''}`.trim(),
    email: usuario.emailAddresses?.[0]?.emailAddress || usuario.email
  };
  
  return this.agregarActividad(
    'nota',
    `Lead asignado a ${this.asignadoA.nombre}`,
    asignadoPor
  );
};

// ========================================
// 📊 MÉTODOS ESTÁTICOS
// ========================================

/**
 * Obtener estadísticas generales
 */
leadSchema.statics.getEstadisticasGenerales = async function() {
  const [porEstado, porPrioridad, porOrigen, total] = await Promise.all([
    this.aggregate([
      { $match: { activo: true } },
      { $group: { _id: '$estado', count: { $sum: 1 } } }
    ]),
    this.aggregate([
      { $match: { activo: true } },
      { $group: { _id: '$prioridad', count: { $sum: 1 } } }
    ]),
    this.aggregate([
      { $match: { activo: true } },
      { $group: { _id: '$origen', count: { $sum: 1 } } }
    ]),
    this.countDocuments({ activo: true })
  ]);
  
  return {
    total,
    porEstado,
    porPrioridad,
    porOrigen
  };
};

/**
 * Obtener leads pendientes de seguimiento
 */
leadSchema.statics.getLeadsPendientesSeguimiento = async function() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  return this.find({
    activo: true,
    fechaProximoSeguimiento: { $lte: hoy },
    estado: { $nin: ['ganado', 'perdido'] }
  }).sort({ fechaProximoSeguimiento: 1 });
};

// ========================================
// 🎨 VIRTUAL PROPERTIES
// ========================================

/**
 * Obtener última actividad
 */
leadSchema.virtual('ultimaActividad').get(function() {
  if (this.actividades && this.actividades.length > 0) {
    return this.actividades[this.actividades.length - 1];
  }
  return null;
});

/**
 * Días desde creación
 */
leadSchema.virtual('diasDesdeCreacion').get(function() {
  if (this.createdAt) {
    const diff = Date.now() - this.createdAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// ========================================
// ⚙️ CONFIGURACIÓN DE SERIALIZACIÓN
// ========================================
leadSchema.set('toJSON', { virtuals: true });
leadSchema.set('toObject', { virtuals: true });

export default mongoose.model('Lead', leadSchema);
