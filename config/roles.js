/**
 * Configuración del Sistema de Roles
 * La base de datos MongoDB es la fuente de verdad para roles y permisos
 */

// Definición de roles disponibles
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN', 
  MODERATOR: 'MODERATOR',
  CLIENT: 'CLIENT',
  USER: 'USER'
};

// Jerarquía de roles (mayor número = mayor privilegio)
export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 5,
  [ROLES.ADMIN]: 4,
  [ROLES.MODERATOR]: 3,
  [ROLES.CLIENT]: 2,
  [ROLES.USER]: 1
};

// Definición de permisos disponibles
export const PERMISSIONS = {
  // Gestión de usuarios
  MANAGE_USERS: 'MANAGE_USERS',
  VIEW_USERS: 'VIEW_USERS',
  
  // Gestión de contenido CMS
  MANAGE_CONTENT: 'MANAGE_CONTENT',
  MODERATE_CONTENT: 'MODERATE_CONTENT',
  VIEW_CONTENT: 'VIEW_CONTENT',
  
  // Gestión de servicios
  MANAGE_SERVICES: 'MANAGE_SERVICES',
  VIEW_SERVICES: 'VIEW_SERVICES',
  
  // Gestión de uploads
  MANAGE_UPLOADS: 'MANAGE_UPLOADS',
  UPLOAD_FILES: 'UPLOAD_FILES',
  
  // Analytics y reportes
  VIEW_ANALYTICS: 'VIEW_ANALYTICS',
  EXPORT_DATA: 'EXPORT_DATA',
  
  // Configuración del sistema
  MANAGE_SYSTEM: 'MANAGE_SYSTEM',
  VIEW_LOGS: 'VIEW_LOGS',
  
  // Gestión de roles
  ASSIGN_ROLES: 'ASSIGN_ROLES',
  VIEW_ROLES: 'VIEW_ROLES'
};

// Matriz de permisos por rol
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // Todos los permisos
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_CONTENT,
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.VIEW_CONTENT,
    PERMISSIONS.MANAGE_SERVICES,
    PERMISSIONS.VIEW_SERVICES,
    PERMISSIONS.MANAGE_UPLOADS,
    PERMISSIONS.UPLOAD_FILES,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.MANAGE_SYSTEM,
    PERMISSIONS.VIEW_LOGS,
    PERMISSIONS.ASSIGN_ROLES,
    PERMISSIONS.VIEW_ROLES
  ],
  
  [ROLES.ADMIN]: [
    // Gestión completa excepto sistema y otros admins
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_CONTENT,
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.VIEW_CONTENT,
    PERMISSIONS.MANAGE_SERVICES,
    PERMISSIONS.VIEW_SERVICES,
    PERMISSIONS.MANAGE_UPLOADS,
    PERMISSIONS.UPLOAD_FILES,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.VIEW_LOGS,
    PERMISSIONS.ASSIGN_ROLES, // Solo a roles inferiores
    PERMISSIONS.VIEW_ROLES
  ],
  
  [ROLES.MODERATOR]: [
    // Moderación y gestión limitada
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.VIEW_CONTENT,
    PERMISSIONS.MANAGE_CONTENT, // Contenido limitado
    PERMISSIONS.VIEW_SERVICES,
    PERMISSIONS.UPLOAD_FILES,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_ROLES
  ],
  
  [ROLES.CLIENT]: [
    // Acceso limitado para clientes
    PERMISSIONS.VIEW_CONTENT,
    PERMISSIONS.VIEW_SERVICES,
    PERMISSIONS.UPLOAD_FILES,
    PERMISSIONS.VIEW_ROLES // Solo su propio rol
  ],
  
  [ROLES.USER]: [
    // Acceso básico
    PERMISSIONS.VIEW_CONTENT,
    PERMISSIONS.VIEW_SERVICES
  ]
};

// Descripción de roles para la interfaz
export const ROLE_DESCRIPTIONS = {
  [ROLES.SUPER_ADMIN]: {
    name: 'Super Administrador',
    description: 'Control total del sistema, gestión de administradores y configuración',
    color: '#dc2626', // rojo
    icon: '👑'
  },
  [ROLES.ADMIN]: {
    name: 'Administrador',
    description: 'Gestión de usuarios, contenido y servicios. No puede gestionar super admins',
    color: '#ea580c', // naranja
    icon: '⚡'
  },
  [ROLES.MODERATOR]: {
    name: 'Moderador',
    description: 'Moderación de contenido y gestión limitada',
    color: '#0891b2', // cyan
    icon: '🛡️'
  },
  [ROLES.CLIENT]: {
    name: 'Cliente',
    description: 'Acceso a servicios contratados y funcionalidades cliente',
    color: '#16a34a', // verde
    icon: '💼'
  },
  [ROLES.USER]: {
    name: 'Usuario',
    description: 'Acceso básico a contenido público',
    color: '#6b7280', // gris
    icon: '👤'
  }
};

// Validar si un rol puede asignar otro rol
export const canAssignRole = (assignerRole, targetRole) => {
  const assignerLevel = ROLE_HIERARCHY[assignerRole];
  const targetLevel = ROLE_HIERARCHY[targetRole];
  
  // Solo se puede asignar roles de nivel inferior
  return assignerLevel > targetLevel;
};

// Obtener permisos de un rol
export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

// Verificar si un rol tiene un permiso específico
export const roleHasPermission = (role, permission) => {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
};

// Obtener roles que puede gestionar un usuario
export const getManageableRoles = (userRole) => {
  const userLevel = ROLE_HIERARCHY[userRole];
  return Object.keys(ROLES).filter(role => 
    ROLE_HIERARCHY[role] < userLevel
  );
};

// Configuración por defecto para el primer super admin
export const DEFAULT_SUPER_ADMIN = {
  email: process.env.DEFAULT_SUPER_ADMIN_EMAIL || 'admin@scuti.com',
  role: ROLES.SUPER_ADMIN
};

export default {
  ROLES,
  ROLE_HIERARCHY,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLE_DESCRIPTIONS,
  canAssignRole,
  getRolePermissions,
  roleHasPermission,
  getManageableRoles,
  DEFAULT_SUPER_ADMIN
};