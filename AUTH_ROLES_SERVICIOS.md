# 🔐 INTEGRACIÓN DE AUTENTICACIÓN Y ROLES - Módulo de Servicios

## 📋 RESUMEN

Se ha completado la integración del módulo de servicios con el sistema de autenticación de **Clerk** y el sistema de **roles y permisos** existente en el proyecto.

---

## 🎯 PERMISOS IMPLEMENTADOS

### Nuevos Permisos Agregados a `config/roles.js`:

```javascript
// Gestión de servicios
MANAGE_SERVICES: 'MANAGE_SERVICES',         // Gestión completa de servicios
CREATE_SERVICES: 'CREATE_SERVICES',         // Crear servicios
EDIT_ALL_SERVICES: 'EDIT_ALL_SERVICES',     // Editar cualquier servicio
EDIT_OWN_SERVICES: 'EDIT_OWN_SERVICES',     // Editar solo servicios propios
DELETE_SERVICES: 'DELETE_SERVICES',         // Eliminar servicios
VIEW_SERVICES: 'VIEW_SERVICES',             // Ver servicios públicos
VIEW_SERVICES_STATS: 'VIEW_SERVICES_STATS', // Ver estadísticas y dashboard
MANAGE_PAQUETES: 'MANAGE_PAQUETES',         // Gestionar paquetes de servicios
DUPLICATE_SERVICES: 'DUPLICATE_SERVICES',   // Duplicar servicios
```

---

## 👥 PERMISOS POR ROL

### 👑 SUPER_ADMIN
**Acceso total al módulo de servicios**
- ✅ MANAGE_SERVICES
- ✅ CREATE_SERVICES
- ✅ EDIT_ALL_SERVICES
- ✅ EDIT_OWN_SERVICES
- ✅ DELETE_SERVICES
- ✅ VIEW_SERVICES
- ✅ VIEW_SERVICES_STATS
- ✅ MANAGE_PAQUETES
- ✅ DUPLICATE_SERVICES

**Puede hacer:**
- Crear, editar y eliminar cualquier servicio
- Ver dashboard y estadísticas completas
- Gestionar todos los paquetes
- Duplicar servicios
- Cambiar estados masivos
- Restaurar servicios eliminados

---

### ⚡ ADMIN
**Gestión completa excepto algunos ajustes del sistema**
- ✅ MANAGE_SERVICES
- ✅ CREATE_SERVICES
- ✅ EDIT_ALL_SERVICES
- ✅ EDIT_OWN_SERVICES
- ✅ DELETE_SERVICES
- ✅ VIEW_SERVICES
- ✅ VIEW_SERVICES_STATS
- ✅ MANAGE_PAQUETES
- ✅ DUPLICATE_SERVICES

**Puede hacer:**
- Igual que SUPER_ADMIN para servicios
- Crear, editar y eliminar cualquier servicio
- Ver dashboard y estadísticas
- Gestionar paquetes
- Duplicar servicios

---

### 🛡️ MODERATOR
**Gestión limitada de servicios**
- ✅ CREATE_SERVICES
- ✅ EDIT_OWN_SERVICES
- ✅ VIEW_SERVICES
- ✅ VIEW_SERVICES_STATS

**Puede hacer:**
- Crear nuevos servicios
- Editar SOLO los servicios donde es responsable
- Ver todos los servicios públicos
- Ver estadísticas y dashboard
- **NO puede** eliminar servicios
- **NO puede** editar servicios de otros

---

### 💼 CLIENT
**Acceso de solo lectura**
- ✅ VIEW_SERVICES

**Puede hacer:**
- Ver servicios públicos
- Ver detalles de servicios
- Ver paquetes disponibles
- **NO puede** crear, editar o eliminar

---

### 👤 USER
**Acceso básico**
- ✅ VIEW_SERVICES

**Puede hacer:**
- Ver servicios públicos
- Ver detalles de servicios y paquetes

---

## 🛡️ MIDDLEWARES CREADOS

### En `middleware/roleAuth.js`:

```javascript
// Middleware general
canManageServices       // Gestión completa
canCreateServices       // Crear servicios
canEditAllServices      // Editar cualquier servicio
canEditOwnServices      // Editar solo propios
canDeleteServices       // Eliminar servicios
canViewServicesStats    // Ver estadísticas
canManagePaquetes       // Gestionar paquetes
canDuplicateServices    // Duplicar servicios

// Middleware especiales con lógica
canEditService          // Valida ownership para edición
canDeleteService        // Valida permisos para eliminar
```

---

## 🛣️ RUTAS PROTEGIDAS

### Estadísticas y Dashboard (Solo con permisos)
```javascript
GET /api/servicios/dashboard           → canViewServicesStats
GET /api/servicios/stats               → canViewServicesStats
GET /api/servicios/stats/ventas        → canViewServicesStats
GET /api/servicios/stats/conversion    → canViewServicesStats
```

### CRUD de Servicios
```javascript
GET  /api/servicios                    → Público
POST /api/servicios                    → canCreateServices
GET  /api/servicios/:id                → Público
PUT  /api/servicios/:id                → canEditService (valida ownership)
DELETE /api/servicios/:id              → canDeleteService (solo admins)
```

### Acciones Especiales
```javascript
POST   /api/servicios/:id/duplicar     → canDuplicateServices
PATCH  /api/servicios/:id/estado       → canEditService
DELETE /api/servicios/:id/soft         → canDeleteService
PATCH  /api/servicios/:id/restaurar    → canManageServices
PATCH  /api/servicios/bulk/estado      → canManageServices
```

### Paquetes
```javascript
GET  /api/servicios/:id/paquetes       → Público
POST /api/servicios/:id/paquetes       → canManagePaquetes
PUT  /api/paquetes/:id                 → canManagePaquetes
DELETE /api/paquetes/:id               → canManagePaquetes
POST /api/paquetes/:id/duplicar        → canDuplicateServices
POST /api/paquetes/:id/venta           → canManagePaquetes
```

---

## 🔍 VALIDACIÓN DE OWNERSHIP

### Middleware `canEditService`
Valida que el usuario puede editar un servicio:

1. **Si tiene `EDIT_ALL_SERVICES`** → Puede editar cualquiera
2. **Si tiene `EDIT_OWN_SERVICES`** → Solo puede editar si:
   - El campo `responsable` del servicio coincide con su `user.id`
3. **Sin permisos** → Rechazado

```javascript
// Ejemplo de uso
router.put('/:id', canEditService, updateServicio);
```

---

## 📝 TRACKING AUTOMÁTICO

### Responsable Automático
Al crear un servicio, se asigna automáticamente el usuario como responsable:

```javascript
// En servicioController.js
export const createServicio = async (req, res) => {
  const servicioData = {
    ...req.body,
    responsable: req.user.id  // ✅ Asignado automáticamente
  };
  
  const servicio = await Servicio.create(servicioData);
  // ...
};
```

---

## 🔐 FLUJO DE AUTENTICACIÓN

### 1. Cliente envía request con token
```http
POST /api/servicios
Authorization: Bearer <CLERK_JWT_TOKEN>
Content-Type: application/json

{
  "titulo": "Mi Servicio",
  "descripcion": "..."
}
```

### 2. Middleware `requireAuth` valida token
- Verifica token con Clerk
- Busca usuario en MongoDB por `clerkId`
- Obtiene role y permisos del usuario
- Agrega `req.user` con toda la información

### 3. Middleware de permisos valida acceso
```javascript
canCreateServices → Verifica PERMISSIONS.CREATE_SERVICES
```

### 4. Si pasa validación, ejecuta controlador
```javascript
createServicio → Crea servicio con usuario como responsable
```

---

## 🧪 TESTING CON DIFERENTES ROLES

### Testing como SUPER_ADMIN o ADMIN

```bash
# 1. Login en tu frontend con usuario ADMIN
# 2. Copiar el JWT token
# 3. Usar en Postman/Thunder Client

# Crear servicio
POST http://localhost:5000/api/servicios
Authorization: Bearer <TOKEN_ADMIN>

{
  "titulo": "Nuevo Servicio Premium",
  "categoria": "desarrollo",
  "precio": 5000
}

# Ver dashboard
GET http://localhost:5000/api/servicios/dashboard
Authorization: Bearer <TOKEN_ADMIN>

# Eliminar servicio
DELETE http://localhost:5000/api/servicios/:id
Authorization: Bearer <TOKEN_ADMIN>
```

---

### Testing como MODERATOR

```bash
# 1. Login con usuario MODERATOR
# 2. Copiar token

# Crear servicio (✅ Permitido)
POST http://localhost:5000/api/servicios
Authorization: Bearer <TOKEN_MODERATOR>

# Editar su propio servicio (✅ Permitido si es responsable)
PUT http://localhost:5000/api/servicios/:id
Authorization: Bearer <TOKEN_MODERATOR>

# Intentar editar servicio de otro (❌ Rechazado)
PUT http://localhost:5000/api/servicios/:otro_id
Authorization: Bearer <TOKEN_MODERATOR>
# Respuesta: 403 "Solo puedes editar servicios de los que eres responsable"

# Intentar eliminar servicio (❌ Rechazado)
DELETE http://localhost:5000/api/servicios/:id
Authorization: Bearer <TOKEN_MODERATOR>
# Respuesta: 403 "No tienes permisos para eliminar servicios"
```

---

### Testing como CLIENT o USER

```bash
# Ver servicios públicos (✅ Permitido)
GET http://localhost:5000/api/servicios

# Intentar crear servicio (❌ Rechazado)
POST http://localhost:5000/api/servicios
Authorization: Bearer <TOKEN_CLIENT>
# Respuesta: 403 "Insufficient permissions"

# Intentar ver dashboard (❌ Rechazado)
GET http://localhost:5000/api/servicios/dashboard
Authorization: Bearer <TOKEN_CLIENT>
# Respuesta: 403 "Insufficient permissions"
```

---

## 🎨 CASOS DE USO REALES

### Caso 1: Moderador crea un servicio
```javascript
// Request
POST /api/servicios
Authorization: Bearer <TOKEN_MODERATOR>

{
  "titulo": "Desarrollo de Landing Page",
  "categoria": "desarrollo",
  "precio": 1500
}

// Response
{
  "success": true,
  "data": {
    "_id": "...",
    "titulo": "Desarrollo de Landing Page",
    "responsable": "USER_ID_DEL_MODERATOR",  // ✅ Asignado automáticamente
    "estado": "activo",
    ...
  }
}
```

---

### Caso 2: Moderador intenta editar servicio de otro
```javascript
// Request
PUT /api/servicios/SERVICIO_DE_OTRO_USER
Authorization: Bearer <TOKEN_MODERATOR>

{
  "precio": 2000
}

// Response
{
  "success": false,
  "message": "Solo puedes editar servicios de los que eres responsable",
  "code": "NOT_SERVICE_OWNER"
}
```

---

### Caso 3: Admin edita cualquier servicio
```javascript
// Request
PUT /api/servicios/CUALQUIER_SERVICIO
Authorization: Bearer <TOKEN_ADMIN>

{
  "precio": 3000,
  "estado": "pausado"
}

// Response
{
  "success": true,
  "message": "Servicio actualizado exitosamente",
  "data": { ... }
}
```

---

### Caso 4: Admin ve dashboard
```javascript
// Request
GET /api/servicios/dashboard
Authorization: Bearer <TOKEN_ADMIN>

// Response
{
  "success": true,
  "data": {
    "resumen": {
      "serviciosActivos": 12,
      "serviciosEnProgreso": 8,
      "serviciosCompletados": 45
    },
    "ingresos": {
      "mes": 12500,
      "anio": 87500
    },
    "topServicios": [...]
  }
}
```

---

## 📊 MATRIZ DE PERMISOS

| Acción | SUPER_ADMIN | ADMIN | MODERATOR | CLIENT | USER |
|--------|-------------|-------|-----------|--------|------|
| Ver servicios públicos | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver detalles de servicio | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crear servicio | ✅ | ✅ | ✅ | ❌ | ❌ |
| Editar cualquier servicio | ✅ | ✅ | ❌ | ❌ | ❌ |
| Editar propio servicio | ✅ | ✅ | ✅ | ❌ | ❌ |
| Eliminar servicio | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver dashboard/stats | ✅ | ✅ | ✅ | ❌ | ❌ |
| Duplicar servicio | ✅ | ✅ | ❌ | ❌ | ❌ |
| Cambiar estado | ✅ | ✅ | ✅* | ❌ | ❌ |
| Gestionar paquetes | ✅ | ✅ | ❌ | ❌ | ❌ |
| Registrar ventas | ✅ | ✅ | ❌ | ❌ | ❌ |

`*` Solo si es responsable del servicio

---

## 🔧 CONFIGURACIÓN REQUERIDA

### Variables de Entorno
```env
CLERK_SECRET_KEY=sk_test_...
MONGODB_URI=mongodb://...
```

### Asegurarse que el usuario esté sincronizado
Cuando un usuario se registra con Clerk, debe ser sincronizado a MongoDB con su `clerkId` y `role` asignado.

Ver: `routes/webhooks.js` para sincronización automática

---

## 🚀 PRÓXIMOS PASOS OPCIONALES

### 1. **Historial de Cambios**
Implementar tracking de quién modificó qué y cuándo:
```javascript
{
  servicioId: ObjectId,
  usuarioId: ObjectId,
  accion: 'actualizado',
  cambios: { antes: {...}, despues: {...} },
  fecha: Date
}
```

### 2. **Notificaciones**
Notificar al responsable cuando:
- Su servicio es editado por un admin
- Su servicio recibe una venta
- Su servicio cambia de estado

### 3. **Auditoría**
Logs detallados de todas las acciones en servicios:
- Quién creó qué
- Quién editó qué
- Quién eliminó qué

### 4. **Filtros por Responsable**
Agregar endpoint para que moderadores vean solo sus servicios:
```javascript
GET /api/servicios/mis-servicios
```

---

## 📚 DOCUMENTACIÓN RELACIONADA

- `config/roles.js` - Definición de roles y permisos
- `middleware/clerkAuth.js` - Autenticación con Clerk
- `middleware/roleAuth.js` - Autorización por roles
- `models/User.js` - Modelo de usuario
- `README_SERVICIOS.md` - Guía de uso del API

---

## ✅ CHECKLIST DE INTEGRACIÓN

- [x] Permisos de servicios agregados a `config/roles.js`
- [x] Permisos asignados a cada rol
- [x] Middlewares de autorización creados
- [x] Rutas protegidas con middlewares
- [x] Validación de ownership implementada
- [x] Usuario responsable asignado automáticamente
- [x] Testing de permisos documentado
- [x] Matriz de permisos documentada

---

**Última actualización**: 26 de Octubre, 2025
**Versión**: 1.0
