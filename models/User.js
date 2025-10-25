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
    // Sistema de roles - La DB es la fuente de verdad
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'CLIENT', 'USER'],
      default: 'USER',
      required: true
    },
    // Permisos adicionales específicos (opcional)
    customPermissions: [{
      type: String,
      enum: [
        'MANAGE_USERS',
        'MANAGE_CONTENT', 
        'MANAGE_SERVICES',
        'MANAGE_UPLOADS',
        'VIEW_ANALYTICS',
        'MANAGE_SYSTEM',
        'MODERATE_CONTENT'
      ]
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    // Gestión de roles y permisos
    roleAssignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    roleAssignedAt: {
      type: Date,
      default: null
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

// Métodos para gestión de roles
userSchema.methods.hasRole = function(role) {
  return this.role === role;
};

userSchema.methods.hasPermission = function(permission) {
  // Verificar permisos por rol
  const rolePermissions = {
    'SUPER_ADMIN': ['MANAGE_USERS', 'MANAGE_CONTENT', 'MANAGE_SERVICES', 'MANAGE_UPLOADS', 'VIEW_ANALYTICS', 'MANAGE_SYSTEM', 'MODERATE_CONTENT'],
    'ADMIN': ['MANAGE_USERS', 'MANAGE_CONTENT', 'MANAGE_SERVICES', 'MANAGE_UPLOADS', 'VIEW_ANALYTICS', 'MODERATE_CONTENT'],
    'MODERATOR': ['MANAGE_CONTENT', 'MODERATE_CONTENT', 'VIEW_ANALYTICS'],
    'CLIENT': ['MANAGE_UPLOADS'],
    'USER': []
  };
  
  const userPermissions = rolePermissions[this.role] || [];
  return userPermissions.includes(permission) || this.customPermissions.includes(permission);
};

userSchema.methods.canManageUser = function(targetUser) {
  const roleHierarchy = {
    'SUPER_ADMIN': 5,
    'ADMIN': 4,
    'MODERATOR': 3,
    'CLIENT': 2,
    'USER': 1
  };
  
  return roleHierarchy[this.role] > roleHierarchy[targetUser.role];
};

userSchema.methods.assignRole = function(newRole, assignedBy) {
  this.role = newRole;
  this.roleAssignedBy = assignedBy;
  this.roleAssignedAt = new Date();
  return this.save();
};

// Método estático para crear el primer super admin
userSchema.statics.createSuperAdmin = async function(userData) {
  const superAdminData = {
    ...userData,
    role: 'SUPER_ADMIN',
    roleAssignedAt: new Date()
  };
  return await this.create(superAdminData);
};

const User = mongoose.model('User', userSchema);

export default User;
