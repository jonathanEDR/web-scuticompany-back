# 🧪 GUÍA DE PRUEBAS - CRM SYSTEM
## Endpoints para probar con Thunder Client / Postman

**Base URL:** `http://localhost:5000/api/crm`

---

## 🔒 AUTENTICACIÓN

**IMPORTANTE:** Todas las peticiones requieren el header:
```
Authorization: Bearer {CLERK_TOKEN}
```

Para obtener el token de Clerk:
1. Inicia sesión en tu frontend
2. Abre DevTools > Console
3. Ejecuta: `await window.Clerk.session.getToken()`
4. Copia el token y úsalo en las peticiones

---

## 📋 1. OBTENER TODOS LOS LEADS

**Endpoint:** `GET /leads`

**Headers:**
```
Authorization: Bearer {CLERK_TOKEN}
```

**Query Parameters (opcionales):**
```
?estado=nuevo                  // Filtrar por estado
?search=carlos                 // Búsqueda en nombre, email, empresa
?page=1                        // Página actual
&limit=10                      // Leads por página
&asignado=user_123            // Filtrar por usuario asignado
&prioridad=alta               // Filtrar por prioridad
&tipoServicio=web             // Filtrar por tipo de servicio
&origen=web                   // Filtrar por origen
```

**Ejemplo completo:**
```
GET http://localhost:5000/api/crm/leads?estado=nuevo&limit=5
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "67...",
      "nombre": "Carlos Mendoza",
      "celular": "+51 987654321",
      "correo": "carlos@email.com",
      "empresa": "Tech Solutions",
      "tipoServicio": "web",
      "descripcionProyecto": "Necesito un sitio web corporativo",
      "estado": "nuevo",
      "prioridad": "media",
      "origen": "web",
      "actividades": [],
      "creadoPor": {
        "userId": "user_xxx",
        "nombre": "Admin User",
        "email": "admin@scuti.com"
      },
      "tags": [],
      "activo": true,
      "createdAt": "2025-10-25T...",
      "updatedAt": "2025-10-25T..."
    }
  ],
  "pagination": {
    "current": 1,
    "total": 1,
    "count": 1,
    "totalRecords": 1
  }
}
```

---

## 📄 2. OBTENER UN LEAD ESPECÍFICO

**Endpoint:** `GET /leads/:id`

**Ejemplo:**
```
GET http://localhost:5000/api/crm/leads/67...
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "_id": "67...",
    "nombre": "Carlos Mendoza",
    "celular": "+51 987654321",
    // ... resto de campos
  }
}
```

---

## ➕ 3. CREAR NUEVO LEAD

**Endpoint:** `POST /leads`

**Headers:**
```
Authorization: Bearer {CLERK_TOKEN}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "nombre": "Ana Torres",
  "celular": "+51 912345678",
  "correo": "ana@empresa.com",
  "empresa": "Marketing Digital SAC",
  "tipoServicio": "app",
  "descripcionProyecto": "Necesito desarrollar una aplicación móvil para delivery",
  "presupuestoEstimado": 5000,
  "fechaDeseada": "2025-12-01",
  "prioridad": "alta",
  "origen": "web",
  "tags": ["app-movil", "delivery", "urgente"]
}
```

**Campos requeridos:**
- `nombre` ✅
- `celular` ✅
- `correo` ✅
- `tipoServicio` ✅
- `descripcionProyecto` ✅

**Campos opcionales:**
- `empresa`
- `presupuestoEstimado`
- `fechaDeseada`
- `prioridad` (default: "media")
- `origen` (default: "web")
- `tags`

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Lead creado exitosamente",
  "data": {
    "_id": "67...",
    "nombre": "Ana Torres",
    // ... resto de campos
    "actividades": [
      {
        "tipo": "nota",
        "descripcion": "Lead creado en el sistema",
        "usuarioNombre": "Admin User",
        "fecha": "2025-10-25T..."
      }
    ]
  }
}
```

---

## ✏️ 4. ACTUALIZAR LEAD

**Endpoint:** `PUT /leads/:id`

**Body (JSON) - Solo campos que quieres actualizar:**
```json
{
  "nombre": "Ana Torres García",
  "celular": "+51 912345679",
  "presupuestoEstimado": 6000,
  "prioridad": "urgente",
  "tags": ["app-movil", "delivery", "urgente", "ios"]
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Lead actualizado exitosamente",
  "data": {
    // Lead actualizado
  }
}
```

---

## 🔄 5. CAMBIAR ESTADO DEL LEAD

**Endpoint:** `PATCH /leads/:id/estado`

**Body (JSON):**
```json
{
  "estado": "contactado",
  "razon": "Cliente contactado por teléfono, interesado en cotización"
}
```

**Estados disponibles:**
- `nuevo`
- `contactado`
- `calificado`
- `propuesta`
- `negociacion`
- `ganado`
- `perdido`
- `pausado`

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Estado actualizado exitosamente",
  "data": {
    // Lead con estado actualizado y nueva actividad registrada
  }
}
```

---

## 📝 6. AGREGAR ACTIVIDAD

**Endpoint:** `POST /leads/:id/actividades`

**Body (JSON):**
```json
{
  "tipo": "llamada",
  "descripcion": "Llamada realizada. Cliente solicita propuesta económica detallada."
}
```

**Tipos de actividad:**
- `nota` - Nota general
- `llamada` - Llamada telefónica
- `email` - Email enviado
- `reunion` - Reunión presencial o virtual
- `propuesta` - Propuesta enviada
- `cambio_estado` - Cambio de estado (automático)

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Actividad agregada exitosamente",
  "data": {
    // Lead con nueva actividad en el array
  }
}
```

---

## 👤 7. ASIGNAR LEAD A USUARIO

**Endpoint:** `PATCH /leads/:id/asignar`

**Body (JSON):**
```json
{
  "usuarioId": "user_2..."
}
```

**Nota:** El `usuarioId` debe ser un ID válido de Clerk.

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Lead asignado exitosamente",
  "data": {
    // Lead con asignadoA actualizado
  }
}
```

---

## 🗑️ 8. ELIMINAR LEAD (Soft Delete)

**Endpoint:** `DELETE /leads/:id`

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Lead eliminado exitosamente"
}
```

**Nota:** Es un soft delete, el lead se marca como `activo: false` pero no se elimina físicamente.

---

## 📊 9. OBTENER ESTADÍSTICAS

**Endpoint:** `GET /estadisticas`

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "total": 15,
    "porEstado": [
      { "_id": "nuevo", "count": 5 },
      { "_id": "contactado", "count": 3 },
      { "_id": "ganado", "count": 2 }
    ],
    "porPrioridad": [
      { "_id": "alta", "count": 4 },
      { "_id": "media", "count": 8 },
      { "_id": "baja", "count": 3 }
    ],
    "porOrigen": [
      { "_id": "web", "count": 10 },
      { "_id": "referido", "count": 3 },
      { "_id": "redes_sociales", "count": 2 }
    ],
    "porTipoServicio": [
      { "_id": "web", "count": 6 },
      { "_id": "app", "count": 4 }
    ],
    "porMes": [
      { "_id": { "year": 2025, "month": 10 }, "count": 15 }
    ],
    "pendientesSeguimiento": 3
  }
}
```

---

## 📅 10. OBTENER LEADS PENDIENTES DE SEGUIMIENTO

**Endpoint:** `GET /leads/pendientes`

**Respuesta esperada:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    // Array de leads con fechaProximoSeguimiento <= HOY
  ]
}
```

---

## 🔐 PERMISOS POR ROL

### SUPER_ADMIN ✅
- ✅ Ver todos los leads
- ✅ Crear leads
- ✅ Editar cualquier lead
- ✅ Eliminar leads
- ✅ Asignar leads
- ✅ Cambiar estados
- ✅ Agregar actividades
- ✅ Ver reportes
- ✅ Exportar datos

### ADMIN ✅
- ✅ Ver todos los leads
- ✅ Crear leads
- ✅ Editar cualquier lead
- ❌ Eliminar leads
- ✅ Asignar leads
- ✅ Cambiar estados
- ✅ Agregar actividades
- ✅ Ver reportes
- ✅ Exportar datos

### MODERATOR ⚠️
- ⚠️ Ver solo leads asignados a ellos
- ✅ Crear leads
- ⚠️ Editar solo sus leads
- ❌ Eliminar leads
- ❌ Asignar leads
- ✅ Cambiar estados (sus leads)
- ✅ Agregar actividades (sus leads)
- ❌ Ver reportes
- ❌ Exportar datos

### CLIENT / USER ❌
- ❌ Sin acceso al CRM

---

## 🎯 SECUENCIA DE PRUEBA RECOMENDADA

1. **Crear lead** → `POST /leads`
2. **Ver todos los leads** → `GET /leads`
3. **Ver lead específico** → `GET /leads/:id`
4. **Agregar nota** → `POST /leads/:id/actividades`
5. **Cambiar a "contactado"** → `PATCH /leads/:id/estado`
6. **Agregar actividad "llamada"** → `POST /leads/:id/actividades`
7. **Actualizar presupuesto** → `PUT /leads/:id`
8. **Cambiar a "propuesta"** → `PATCH /leads/:id/estado`
9. **Ver estadísticas** → `GET /estadisticas`
10. **Eliminar lead** → `DELETE /leads/:id`

---

## 🚨 MANEJO DE ERRORES

### 401 - No autenticado
```json
{
  "success": false,
  "message": "No autenticado"
}
```

### 403 - Sin permisos
```json
{
  "success": false,
  "message": "No tienes permisos para ver leads"
}
```

### 404 - No encontrado
```json
{
  "success": false,
  "message": "Lead no encontrado"
}
```

### 400 - Validación
```json
{
  "success": false,
  "message": "Error de validación",
  "errors": [
    "El nombre es requerido",
    "Email inválido"
  ]
}
```

### 500 - Error del servidor
```json
{
  "success": false,
  "message": "Error del servidor"
}
```

---

## 💡 CONSEJOS PARA PRUEBAS

1. **Usa variables de entorno en Postman/Thunder Client:**
   - `{{base_url}}` = `http://localhost:5000/api/crm`
   - `{{token}}` = Tu token de Clerk

2. **Prueba con diferentes roles** para verificar permisos

3. **Usa `page` y `limit`** para probar paginación

4. **Prueba filtros combinados** para verificar queries complejas

5. **Verifica que las actividades se registren** en cada acción

---

¡Listo para probar! 🚀
