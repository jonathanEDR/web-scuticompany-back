import mongoose from 'mongoose';

// 🔧 Schema explícito para subdocumento FAQ (soluciona problemas de serialización)
const faqSchema = new mongoose.Schema({
  pregunta: {
    type: String,
    required: true
  },
  respuesta: {
    type: String,
    required: true
  }
}, { _id: false });

// 🔧 Schema explícito para subdocumento SEO (soluciona problemas de serialización)
const seoSchema = new mongoose.Schema({
  titulo: {
    type: String,
    maxlength: 60,
    default: ''
  },
  descripcion: {
    type: String,
    maxlength: 160,
    default: ''
  },
  palabrasClave: {
    type: String,
    maxlength: 500,
    default: ''
  }
}, { _id: false }); // _id: false para que no genere ID automático en subdocumento

const servicioSchema = new mongoose.Schema(
  {
    // Información básica
    titulo: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      maxlength: [100, 'El título no puede tener más de 100 caracteres']
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      maxlength: [1000, 'La descripción no puede tener más de 1000 caracteres']
    },
    descripcionCorta: {
      type: String,
      maxlength: [200, 'La descripción corta no puede tener más de 200 caracteres']
    },
    
    // ============================================
    // 🆕 CONTENIDO AVANZADO - Sistema de Personalización
    // ============================================
    descripcionRica: {
      type: String,
      maxlength: [5000, 'La descripción rica no puede tener más de 5000 caracteres'],
      default: ''
    },
    videoUrl: {
      type: String,
      default: '',
      validate: {
        validator: function(v) {
          if (!v) return true; // Vacío es válido
          // Validar URLs de YouTube y Vimeo
          return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com)/.test(v);
        },
        message: 'URL de video inválida (solo YouTube/Vimeo)'
      }
    },
    galeriaImagenes: {
      type: [String],
      default: [],
      validate: {
        validator: function(v) {
          return v.length <= 10;
        },
        message: 'No puedes agregar más de 10 imágenes en la galería'
      }
    },
    contenidoAdicional: {
      type: String,
      maxlength: [2000, 'El contenido adicional no puede tener más de 2000 caracteres'],
      default: ''
    },
    
    // Visualización
    icono: {
      type: String,
      default: '🚀'
    },
    iconoType: {
      type: String,
      enum: ['emoji', 'url', 'icon-name'],
      default: 'emoji'
    },
    colorIcono: {
      type: String,
      default: '#4F46E5'
    },
    colorFondo: {
      type: String,
      default: '#EEF2FF'
    },
    orden: {
      type: Number,
      default: 0
    },
    
    // Imagen principal
    imagen: {
      type: String,
      default: ''
    },
    
    // Pricing avanzado
    precio: {
      type: Number,
      min: [0, 'El precio no puede ser negativo']
    },
    precioMin: {
      type: Number,
      min: [0, 'El precio mínimo no puede ser negativo']
    },
    precioMax: {
      type: Number,
      min: [0, 'El precio máximo no puede ser negativo']
    },
    tipoPrecio: {
      type: String,
      enum: ['fijo', 'rango', 'paquetes', 'personalizado', 'suscripcion'],
      default: 'fijo'
    },
    moneda: {
      type: String,
      default: 'PEN',
      enum: ['USD', 'MXN', 'EUR', 'PEN']
    },
    
    // Duración y timing
    duracion: {
      valor: {
        type: Number,
        min: 0
      },
      unidad: {
        type: String,
        enum: ['horas', 'días', 'semanas', 'meses', 'años'],
        default: 'semanas'
      }
    },
    
    // Gestión y estado
    estado: {
      type: String,
      enum: ['activo', 'desarrollo', 'pausado', 'descontinuado', 'agotado'],
      default: 'activo'
    },
    categoria: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Categoria',
      required: [true, 'La categoría es obligatoria']
    },
    destacado: {
      type: Boolean,
      default: false
    },
    activo: {
      type: Boolean,
      default: true
    },
    visibleEnWeb: {
      type: Boolean,
      default: true
    },
    requiereContacto: {
      type: Boolean,
      default: false
    },
    
    // Contenido y características
    imagenes: [{
      type: String
    }],
    caracteristicas: [{
      type: String
    }],
    beneficios: [{
      type: String
    }],
    incluye: [{
      type: String
    }],
    noIncluye: [{
      type: String
    }],
    faq: {
      type: [faqSchema],
      default: []
    },
    tecnologias: [{
      type: String
    }],
    etiquetas: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    
    // Información adicional del servicio
    tiempoEntrega: {
      type: String,
      maxlength: [100, 'El tiempo de entrega no puede tener más de 100 caracteres']
    },
    garantia: {
      type: String,
      maxlength: [200, 'La garantía no puede tener más de 200 caracteres']
    },
    soporte: {
      type: String,
      enum: ['basico', 'premium', 'dedicado', '24x7'],
      default: 'basico'
    },
    
    // Organización interna
    departamento: {
      type: String,
      enum: ['ventas', 'desarrollo', 'marketing', 'diseño', 'soporte'],
      default: 'ventas'
    },
    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // Sistema de plantillas
    esPlantilla: {
      type: Boolean,
      default: false
    },
    plantillaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Servicio'
    },
    
    // Métricas y analytics
    vecesVendido: {
      type: Number,
      default: 0,
      min: 0
    },
    ingresoTotal: {
      type: Number,
      default: 0,
      min: 0
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    numeroReviews: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // Campos personalizados flexibles
    camposPersonalizados: [{
      nombre: {
        type: String,
        required: true
      },
      valor: mongoose.Schema.Types.Mixed,
      tipo: {
        type: String,
        enum: ['texto', 'numero', 'boolean', 'fecha', 'lista'],
        default: 'texto'
      }
    }],
    
    // SEO mejorado
    metaTitle: {
      type: String,
      maxlength: 60
    },
    metaDescription: {
      type: String,
      maxlength: 160
    },
    // Campo SEO unificado - ✅ Usa schema explícito para correcta serialización
    seo: {
      type: seoSchema,
      default: () => ({ titulo: '', descripcion: '', palabrasClave: '' })
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    },
    
    // Soft delete
    eliminado: {
      type: Boolean,
      default: false
    },
    eliminadoAt: {
      type: Date
    }
  },
  {
    timestamps: true, // Crea automáticamente createdAt y updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ========================================
// ÍNDICES PARA MEJORAR RENDIMIENTO
// ========================================

// Índice de texto completo para búsqueda
servicioSchema.index({ titulo: 'text', descripcion: 'text', etiquetas: 'text' });

// ========================================
// ÍNDICES COMPUESTOS OPTIMIZADOS
// ========================================

// 🔥 CRÍTICO: Servicios públicos activos (listado web público)
// Query: { activo: true, visibleEnWeb: true, eliminado: false }
servicioSchema.index({ 
  activo: 1, 
  visibleEnWeb: 1, 
  eliminado: 1,
  orden: 1,
  destacado: -1
}, {
  name: 'public_services_optimized'
});

// 🔥 CRÍTICO: Servicios por categoría (páginas de categoría)
// Query: { categoria: X, activo: true, visibleEnWeb: true }
servicioSchema.index({ 
  categoria: 1, 
  activo: 1,
  visibleEnWeb: 1,
  destacado: -1, 
  orden: 1
}, {
  name: 'category_services_optimized'
});

// 🔥 CRÍTICO: Servicios destacados (homepage)
// Query: { destacado: true, activo: true, visibleEnWeb: true }
servicioSchema.index({ 
  destacado: 1,
  activo: 1, 
  visibleEnWeb: 1,
  orden: 1
}, {
  name: 'featured_services_optimized'
});

// ⚡ IMPORTANTE: Panel admin - filtros comunes
// Query: { estado: X, eliminado: false }
servicioSchema.index({ 
  estado: 1, 
  eliminado: 1,
  activo: 1,
  createdAt: -1 
}, {
  name: 'admin_services_list'
});

// ⚡ IMPORTANTE: Servicios por responsable (asignaciones)
// Query: { responsable: X, estado: X }
servicioSchema.index({ 
  responsable: 1, 
  estado: 1,
  eliminado: 1,
  createdAt: -1
}, {
  name: 'responsible_services'
});

// 📌 AUXILIAR: Servicios no eliminados ordenados
servicioSchema.index({ eliminado: 1, orden: 1, createdAt: -1 });

// Virtual: Paquetes asociados
servicioSchema.virtual('paquetes', {
  ref: 'PaqueteServicio',
  localField: '_id',
  foreignField: 'servicioId'
});

// Virtual: Rango de precio formateado
servicioSchema.virtual('precioFormateado').get(function() {
  if (this.tipoPrecio === 'rango' && this.precioMin && this.precioMax) {
    return `${this.moneda} $${this.precioMin} - $${this.precioMax}`;
  } else if (this.precio) {
    return `${this.moneda} $${this.precio}`;
  }
  return 'Precio a consultar';
});

// Virtual: Duración formateada
servicioSchema.virtual('duracionFormateada').get(function() {
  if (this.duracion && this.duracion.valor) {
    return `${this.duracion.valor} ${this.duracion.unidad}`;
  }
  return 'Continuo';
});

// Middleware: Generar slug automáticamente antes de guardar
servicioSchema.pre('save', async function(next) {
  // Generar slug si no existe o si el título fue modificado
  if (this.isModified('titulo') || !this.slug) {
    let slugBase = this.titulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^a-z0-9]+/g, '-') // Reemplazar espacios y caracteres especiales
      .replace(/^-+|-+$/g, ''); // Quitar guiones del inicio y final
    
    // Si el slug ya existe, agregar timestamp para hacerlo único
    let slug = slugBase;
    let counter = 1;
    
    // Verificar si el slug ya existe
    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${slugBase}-${Date.now()}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  
  // Validar rangos de precio
  if (this.tipoPrecio === 'rango' && this.precioMin && this.precioMax) {
    if (this.precioMin > this.precioMax) {
      const error = new Error('El precio mínimo no puede ser mayor que el máximo');
      return next(error);
    }
  }
  
  // Generar descripción corta si no existe
  if (!this.descripcionCorta && this.descripcion) {
    this.descripcionCorta = this.descripcion.substring(0, 150);
    if (this.descripcion.length > 150) {
      this.descripcionCorta += '...';
    }
  }
  
  // ✅ Sincronizar campos SEO nuevos con los antiguos (retrocompatibilidad)
  if (this.isModified('seo')) {
    if (this.seo?.titulo) {
      this.metaTitle = this.seo.titulo;
    }
    if (this.seo?.descripcion) {
      this.metaDescription = this.seo.descripcion;
    }
  }
  // También sincronizar en sentido inverso si se usan los campos antiguos
  if (this.isModified('metaTitle') || this.isModified('metaDescription')) {
    if (!this.seo) {
      this.seo = {};
    }
    if (this.metaTitle && !this.seo.titulo) {
      this.seo.titulo = this.metaTitle;
    }
    if (this.metaDescription && !this.seo.descripcion) {
      this.seo.descripcion = this.metaDescription;
    }
  }
  
  next();
});

// Middleware: Query helper para excluir eliminados por defecto
servicioSchema.pre(/^find/, function(next) {
  // Solo aplicar si no se especifica explícitamente incluir eliminados
  if (!this.getOptions().includeDeleted) {
    this.where({ eliminado: false });
  }
  next();
});

// Método para obtener resumen
servicioSchema.methods.getResumen = function() {
  return {
    id: this._id,
    titulo: this.titulo,
    descripcionCorta: this.descripcionCorta || this.descripcion.substring(0, 100) + '...',
    precio: this.precio,
    precioMin: this.precioMin,
    precioMax: this.precioMax,
    tipoPrecio: this.tipoPrecio,
    categoria: this.categoria,
    estado: this.estado,
    slug: this.slug,
    icono: this.icono,
    colorIcono: this.colorIcono,
    colorFondo: this.colorFondo
  };
};

// Método para soft delete
servicioSchema.methods.softDelete = function() {
  this.eliminado = true;
  this.eliminadoAt = new Date();
  this.activo = false;
  return this.save();
};

// Método para restaurar
servicioSchema.methods.restore = function() {
  this.eliminado = false;
  this.eliminadoAt = null;
  return this.save();
};

// Método para incrementar ventas
servicioSchema.methods.registrarVenta = function(monto) {
  this.vecesVendido += 1;
  this.ingresoTotal += monto;
  return this.save();
};

// Método para actualizar rating
servicioSchema.methods.actualizarRating = function(nuevoRating) {
  const totalRating = this.rating * this.numeroReviews;
  this.numeroReviews += 1;
  this.rating = (totalRating + nuevoRating) / this.numeroReviews;
  return this.save();
};

// Método estático para buscar servicios destacados
servicioSchema.statics.findDestacados = function() {
  return this.find({ destacado: true, activo: true, visibleEnWeb: true }).sort({ orden: 1, createdAt: -1 });
};

// Método estático para buscar por categoría
servicioSchema.statics.findByCategoria = function(categoria) {
  return this.find({ categoria, activo: true, visibleEnWeb: true }).sort({ orden: 1, destacado: -1 });
};

// Método estático para estadísticas
servicioSchema.statics.getEstadisticas = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$estado',
        count: { $sum: 1 },
        ingresoTotal: { $sum: '$ingresoTotal' },
        vecesVendido: { $sum: '$vecesVendido' }
      }
    }
  ]);
  
  return stats;
};

// Método estático para top servicios
servicioSchema.statics.getTopServicios = function(limit = 5) {
  return this.find({ activo: true })
    .sort({ vecesVendido: -1, ingresoTotal: -1 })
    .limit(limit);
};

// Método estático para búsqueda avanzada
servicioSchema.statics.buscar = function(termino, filtros = {}) {
  const query = {
    $or: [
      { titulo: new RegExp(termino, 'i') },
      { descripcion: new RegExp(termino, 'i') },
      { etiquetas: new RegExp(termino, 'i') }
    ],
    ...filtros
  };
  
  return this.find(query).sort({ destacado: -1, orden: 1 });
};

const Servicio = mongoose.model('Servicio', servicioSchema);

export default Servicio;
