import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    username: {
      type: String,
      unique: true,
      sparse: true, // Permite valores nulos únicos
      trim: true
    },
    profileImage: {
      type: String
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    // Información adicional
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    },
    // Metadatos de Clerk
    clerkCreatedAt: {
      type: Date
    },
    clerkUpdatedAt: {
      type: Date
    }
  },
  {
    timestamps: true, // createdAt, updatedAt automáticos
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual para nombre completo
userSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.lastName || this.username || 'Usuario';
});

// Índice solo para consultas por fecha de creación
userSchema.index({ createdAt: -1 });

// Método para actualizar último login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Método estático para buscar por Clerk ID
userSchema.statics.findByClerkId = function(clerkId) {
  return this.findOne({ clerkId });
};

// Método estático para buscar o crear usuario
userSchema.statics.findOrCreate = async function(userData) {
  let user = await this.findOne({ clerkId: userData.clerkId });
  if (!user) {
    user = await this.create(userData);
  }
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;
