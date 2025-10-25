# 🔐 Sistema de Roles - Web Scuti Backend

## 📋 Descripción General

Sistema completo de roles y permisos implementado donde **MongoDB es la fuente de verdad** para la gestión de roles. Clerk se utiliza únicamente para autenticación JWT, mientras que todos los roles y permisos son gestionados desde nuestra base de datos.

## 🏗️ Arquitectura del Sistema

### Flujo de Autenticación/Autorización:
1. **Autenticación**: Clerk valida el JWT token del usuario
2. **Sincronización**: Usuario se sincroniza en MongoDB via webhook
3. **Autorización**: Roles y permisos se obtienen desde MongoDB
4. **Gestión**: Administradores controlan roles desde API administrativa

## 👥 Roles Implementados

| Rol | Descripción | Nivel | Icono |
|-----|-------------|-------|-------|
| **SUPER_ADMIN** | Control total del sistema, gestión de administradores | 5 | 👑 |
| **ADMIN** | Gestión de usuarios, contenido y servicios | 4 | ⚡ |
| **MODERATOR** | Moderación de contenido y gestión limitada | 3 | 🛡️ |
| **CLIENT** | Acceso a servicios contratados | 2 | 💼 |
| **USER** | Acceso básico a contenido público | 1 | 👤 |

## 🔑 Matriz de Permisos

| Recurso | SUPER_ADMIN | ADMIN | MODERATOR | CLIENT | USER |
|---------|-------------|-------|-----------|--------|------|
| **Gestión de Usuarios** | ✅ CRUD | ✅ CRU* | ✅ R | ❌ | ❌ |
| **Contenido CMS** | ✅ CRUD | ✅ CRUD | ✅ RU | ✅ R | ✅ R |
| **Servicios** | ✅ CRUD | ✅ CRUD | ✅ R | ✅ R | ✅ R |
| **Uploads** | ✅ CRUD | ✅ CRUD | ✅ RU | ✅ RU | ❌ |
| **Analytics** | ✅ R | ✅ R | ✅ R | ❌ | ❌ |
| **Configuración Sistema** | ✅ CRUD | ❌ | ❌ | ❌ | ❌ |
| **Gestión de Roles** | ✅ CRUD | ✅ RU* | ❌ | ❌ | ❌ |

*\*No puede gestionar usuarios de su mismo nivel o superior*

## 🚀 Instalación y Configuración

### 1. Dependencias Instaladas
```bash
npm install @clerk/clerk-sdk-node  # ✅ Ya instalado
```

### 2. Variables de Entorno Requeridas
```bash
# Clerk Authentication
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
CLERK_PUBLISHABLE_KEY=pk_live_...

# Sistema de Roles
DEFAULT_SUPER_ADMIN_EMAIL=admin@scuti.com
```

### 3. Ejecutar Migración (Primera vez)
```bash
# Migrar usuarios existentes al nuevo sistema
node scripts/migrate-roles.js migrate

# Verificar integridad del sistema
node scripts/migrate-roles.js verify

# Ambos procesos
node scripts/migrate-roles.js both
```

## 📁 Estructura de Archivos Implementada

```
backend/
├── config/
│   └── roles.js              # ✅ Configuración de roles y permisos
├── controllers/
│   ├── adminController.js    # ✅ API administrativa
│   ├── userController.js     # ✅ Actualizado con roles
│   └── webhookController.js  # ✅ Sincronización con roles
├── middleware/
│   ├── clerkAuth.js         # ✅ Autenticación JWT + roles DB
│   └── roleAuth.js          # ✅ Autorización por roles
├── models/
│   └── User.js              # ✅ Actualizado con nuevo schema
├── routes/
│   ├── admin.js             # ✅ Rutas administrativas
│   ├── cms.js               # ✅ Protegido con nuevos roles
│   └── upload.js            # ✅ Protegido con nuevos roles
├── scripts/
│   └── migrate-roles.js     # ✅ Script de migración
└── utils/
    └── roleHelper.js        # ✅ Utilidades de roles
```

## 🔧 API Endpoints Administrativos

### 📊 Información y Estadísticas
```
GET    /api/admin/stats              # Estadísticas generales
GET    /api/admin/roles              # Información de roles disponibles
```

### 👥 Gestión de Usuarios
```
GET    /api/admin/users              # Lista de usuarios con filtros
GET    /api/admin/users/:userId      # Usuario específico
PUT    /api/admin/users/:userId/role # Asignar rol
PUT    /api/admin/users/:userId/status # Activar/desactivar
```

### 🔐 Super Admin Exclusivo
```
GET    /api/admin/super/system-info  # Información del sistema
POST   /api/admin/super/create-admin # Crear administrador
```

## 💡 Uso de Middlewares

### Autenticación Básica
```javascript
import { requireAuth } from '../middleware/clerkAuth.js';

// Requiere usuario autenticado (cualquier rol)
router.get('/protected', requireAuth, handler);
```

### Por Roles Específicos
```javascript
import { 
  requireSuperAdmin,
  requireAdmin,
  requireModerator 
} from '../middleware/roleAuth.js';

// Solo Super Admin
router.post('/critical', requireSuperAdmin, handler);

// Admin o Super Admin
router.get('/manage', requireAdmin, handler);

// Moderador, Admin o Super Admin  
router.put('/moderate', requireModerator, handler);
```

### Por Permisos Específicos
```javascript
import { 
  canManageUsers,
  canManageContent,
  canUploadFiles 
} from '../middleware/roleAuth.js';

// Requiere permiso específico
router.post('/users', canManageUsers, handler);
router.put('/content', canManageContent, handler);
router.post('/upload', canUploadFiles, handler);
```

### Gestión Avanzada
```javascript
import { 
  canManageSpecificUser,
  canAssignSpecificRole 
} from '../middleware/roleAuth.js';

// Verificar jerarquía y permisos específicos
router.put('/users/:userId/role', [
  ...canAssignRoles,
  canManageSpecificUser,
  canAssignSpecificRole
], assignRole);
```

## 🔒 Reglas de Seguridad Implementadas

### Jerarquía de Roles
- Los usuarios solo pueden gestionar roles de **nivel inferior**
- **Nadie puede cambiar su propio rol**
- Super Admin es el único que puede gestionar otros Super Admins

### Protección de Datos
- **Roles almacenados en MongoDB** (fuente de verdad)
- **Clerk solo provee autenticación** (no roles)
- **Webhooks preservan roles** existentes durante sincronización

### Validaciones Automáticas
- ✅ Verificación de token JWT con Clerk
- ✅ Validación de permisos en cada request
- ✅ Logs detallados de cambios de roles
- ✅ Cleanup automático de roles inconsistentes

## 📈 Monitoreo y Logs

### Eventos Monitoreados
```javascript
// Logs automáticos para:
- Asignación de roles
- Cambios de estado de usuarios
- Intentos de acceso no autorizado
- Creación de Super Admins
- Sincronización de usuarios vía webhook
```

### Reportes de Seguridad
```javascript
// Generar reporte completo
import { generateRoleSecurityReport } from './utils/roleHelper.js';

const report = await generateRoleSecurityReport();
```

## 🧪 Testing y Verificación

### Script de Verificación
```bash
# Verificar integridad del sistema
node scripts/migrate-roles.js verify
```

### Health Check
```bash
# Endpoint de salud incluyendo roles
GET /api/health
```

## 🚨 Troubleshooting

### Problemas Comunes

#### 1. Token JWT Inválido
```javascript
// Error: Token inválido o expirado
// Solución: Verificar CLERK_SECRET_KEY en .env
```

#### 2. Usuario No Sincronizado
```javascript
// Error: Usuario no encontrado. Sincronización requerida
// Solución: Forzar sync desde frontend o verificar webhooks
```

#### 3. Permisos Insuficientes
```javascript
// Error: Permisos insuficientes
// Solución: Verificar rol del usuario en DB
```

### Comandos de Diagnóstico
```bash
# Limpiar roles inconsistentes
node -e "
import('./utils/roleHelper.js').then(m => 
  m.cleanupInconsistentRoles()
)"

# Verificar Super Admin
node -e "
import('./utils/roleHelper.js').then(m => 
  m.ensureSuperAdminExists()
)"
```

## 🔄 Migración de Usuarios Existentes

El sistema incluye migración automática para usuarios existentes:

- ✅ **user** → **USER**
- ✅ **admin** → **ADMIN** 
- ✅ **moderator** → **MODERATOR**
- ✅ Promoción automática del primer Super Admin
- ✅ Limpieza de roles inconsistentes

## 📝 Próximos Pasos

### Funcionalidades Adicionales Sugeridas
1. **Panel de Administración Web** - Interface gráfica para gestión de roles
2. **Roles Temporales** - Asignación de roles con expiración
3. **Audit Log UI** - Interfaz para ver logs de cambios
4. **Invitaciones de Admin** - Sistema de invitación por email
5. **Permisos Granulares** - Permisos específicos por recurso

### Integraciones Futuras
1. **Notificaciones** - Alerts por cambios de roles críticos
2. **Two-Factor Auth** - 2FA obligatorio para Super Admins
3. **Session Management** - Control de sesiones activas
4. **API Rate Limiting** - Límites específicos por rol

---

## ✅ Estado de Implementación

- ✅ **Modelo de Datos**: Usuario con roles y permisos
- ✅ **Autenticación**: JWT con Clerk + roles en DB
- ✅ **Autorización**: Middlewares por rol y permiso
- ✅ **API Administrativa**: Gestión completa de usuarios y roles
- ✅ **Webhooks**: Sincronización preservando roles
- ✅ **Migración**: Script para usuarios existentes
- ✅ **Logging**: Monitoreo completo de acciones
- ✅ **Documentación**: Guía completa de uso

**🎉 Sistema de Roles completamente implementado y listo para producción**