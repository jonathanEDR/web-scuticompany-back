import mongoose from 'mongoose';

const servicioSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      maxlength: [100, 'El título no puede tener más de 100 caracteres']
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      maxlength: [500, 'La descripción no puede tener más de 500 caracteres']
    },
    icono: {
      type: String,
      default: '🚀'
    },
    precio: {
      type: Number,
      min: [0, 'El precio no puede ser negativo']
    },
    categoria: {
      type: String,
      enum: ['desarrollo', 'diseño', 'marketing', 'consultoría', 'otro'],
      default: 'otro'
    },
    destacado: {
      type: Boolean,
      default: false
    },
    activo: {
      type: Boolean,
      default: true
    },
    imagenes: [{
      type: String
    }],
    caracteristicas: [{
      type: String
    }],
    // Campos para SEO
    metaTitle: {
      type: String,
      maxlength: 60
    },
    metaDescription: {
      type: String,
      maxlength: 160
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    }
  },
  {
    timestamps: true, // Crea automáticamente createdAt y updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índices para mejorar rendimiento de búsquedas
servicioSchema.index({ titulo: 'text', descripcion: 'text' });
servicioSchema.index({ categoria: 1, destacado: -1 });

// Middleware: Generar slug automáticamente antes de guardar
servicioSchema.pre('save', function(next) {
  if (this.isModified('titulo') && !this.slug) {
    this.slug = this.titulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^a-z0-9]+/g, '-') // Reemplazar espacios y caracteres especiales
      .replace(/^-+|-+$/g, ''); // Quitar guiones del inicio y final
  }
  next();
});

// Método para obtener resumen
servicioSchema.methods.getResumen = function() {
  return {
    id: this._id,
    titulo: this.titulo,
    descripcion: this.descripcion.substring(0, 100) + '...',
    precio: this.precio,
    categoria: this.categoria,
    slug: this.slug
  };
};

// Método estático para buscar servicios destacados
servicioSchema.statics.findDestacados = function() {
  return this.find({ destacado: true, activo: true }).sort({ createdAt: -1 });
};

const Servicio = mongoose.model('Servicio', servicioSchema);

export default Servicio;
