# 🧪 GUÍA DE TESTING - Sistema de Mensajería CRM

## 📋 Índice
1. [Preparación](#preparación)
2. [Endpoints de Mensajería](#endpoints-de-mensajería)
3. [Endpoints de Adjuntos](#endpoints-de-adjuntos)
4. [Endpoints de Plantillas](#endpoints-de-plantillas)
5. [Endpoints de Leads](#endpoints-de-leads)
6. [Testing de Email](#testing-de-email)
7. [Testing de Permisos](#testing-de-permisos)
8. [Casos de Uso Comunes](#casos-de-uso-comunes)

---

## 🔧 Preparación

### 1. Iniciar el servidor
```bash
npm run dev
```

### 2. Crear datos de prueba
```bash
npm run seed:mensajeria
```

### 3. Variables de entorno necesarias
Asegúrate de tener en tu `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/web-scuti
CLERK_SECRET_KEY=your_clerk_secret_key
PORT=5000
```

### 4. Obtener tokens de prueba
Necesitarás tokens JWT de Clerk para cada rol:
- **ADMIN Token**: Para testing completo
- **MODERATOR Token**: Para testing de permisos limitados
- **CLIENT Token**: Para testing del portal cliente

---

## 💬 ENDPOINTS DE MENSAJERÍA

### 1. Obtener mensajes de un lead
```http
GET /api/crm/leads/:leadId/messages
Authorization: Bearer {TOKEN}
```

**Query Parameters:**
- `incluirPrivados=true` - Incluir notas internas (solo ADMIN/MODERATOR)
- `tipo=nota_interna` - Filtrar por tipo
- `page=1` - Página
- `limit=50` - Límite por página

**Ejemplo con curl:**
```bash
curl -X GET "http://localhost:5000/api/crm/leads/673f12345678901234567890/messages?incluirPrivados=true&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "data": {
    "mensajes": [
      {
        "_id": "673f...",
        "tipo": "mensaje_cliente",
        "autor": {
          "nombre": "Admin Principal",
          "email": "admin@scuti.com"
        },
        "contenido": "Hola Juan...",
        "esPrivado": false,
        "estado": "leido",
        "createdAt": "2025-11-02T10:30:00.000Z"
      }
    ],
    "lead": {
      "id": "673f...",
      "nombre": "Juan Pérez",
      "email": "juan.perez@ejemplo.com"
    },
    "stats": {
      "total": 5,
      "noLeidos": 1,
      "privados": 2,
      "publicos": 3
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

### 2. Enviar mensaje interno (nota privada)
```http
POST /api/crm/leads/:leadId/messages/internal
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "contenido": "Cliente muy interesado. Llamar mañana a las 10am.",
  "prioridad": "alta",
  "etiquetas": ["seguimiento", "llamada"]
}
```

**Respuesta esperada (201):**
```json
{
  "success": true,
  "message": "Nota interna agregada exitosamente",
  "data": {
    "_id": "673f...",
    "tipo": "nota_interna",
    "contenido": "Cliente muy interesado...",
    "esPrivado": true,
    "prioridad": "alta"
  }
}
```

**Errores posibles:**
- `400` - Contenido vacío
- `403` - Sin permisos
- `404` - Lead no encontrado

---

### 3. Enviar mensaje al cliente
```http
POST /api/crm/leads/:leadId/messages/client
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "asunto": "Seguimiento de tu proyecto",
  "contenido": "Hola Juan, quisiera coordinar una llamada para revisar los detalles del proyecto.",
  "prioridad": "normal",
  "canal": "sistema"
}
```

**Respuesta esperada (201):**
```json
{
  "success": true,
  "message": "Mensaje enviado al cliente exitosamente",
  "data": {
    "_id": "673f...",
    "tipo": "mensaje_cliente",
    "asunto": "Seguimiento de tu proyecto",
    "destinatario": {
      "userId": "user_client_test_1",
      "nombre": "Juan Pérez",
      "email": "juan.perez@ejemplo.com"
    }
  }
}
```

**Errores posibles:**
- `400` - Lead no tiene usuario vinculado
- `403` - Sin permisos

---

### 4. Responder mensaje
```http
POST /api/crm/messages/:messageId/reply
Authorization: Bearer {TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "contenido": "Perfecto, tengo disponibilidad el martes a las 3pm. ¿Te viene bien?"
}
```

**Ejemplo CLIENT respondiendo:**
```bash
curl -X POST "http://localhost:5000/api/crm/messages/673f12345678901234567890/reply" \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contenido": "Perfecto, tengo disponibilidad el martes a las 3pm"
  }'
```

---

### 5. Marcar mensaje como leído
```http
PATCH /api/crm/messages/:messageId/read
Authorization: Bearer {TOKEN}
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "message": "Mensaje marcado como leído",
  "data": {
    "_id": "673f...",
    "leido": true,
    "fechaLectura": "2025-11-02T15:30:00.000Z"
  }
}
```

---

### 6. Obtener mensajes no leídos
```http
GET /api/crm/messages/unread
Authorization: Bearer {TOKEN}
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "data": {
    "mensajes": [...],
    "total": 3
  }
}
```

---

### 7. Buscar mensajes
```http
GET /api/crm/messages/search?q=proyecto&page=1&limit=20
Authorization: Bearer {TOKEN}
```

**Query Parameters:**
- `q` - Texto a buscar (mínimo 3 caracteres)
- `leadId` - Filtrar por lead específico
- `tipo` - Filtrar por tipo de mensaje
- `desde` - Fecha desde (ISO 8601)
- `hasta` - Fecha hasta (ISO 8601)

---

## � ENDPOINTS DE ADJUNTOS

### 1. Subir archivo a un lead
```http
POST /api/crm/leads/:leadId/attachments
Authorization: Bearer {TOKEN}
Content-Type: multipart/form-data
```

**Form Data:**
- `archivo` (file) - El archivo a subir

**Ejemplo con curl:**
```bash
curl -X POST "http://localhost:5000/api/crm/leads/673f12345678901234567890/attachments" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "archivo=@C:\Users\tu_usuario\Desktop\cotizacion.pdf"
```

**Respuesta esperada (201):**
```json
{
  "success": true,
  "message": "Archivo subido exitosamente",
  "data": {
    "nombre": "cotizacion.pdf",
    "url": "https://res.cloudinary.com/...",
    "tipo": "pdf",
    "mimetype": "application/pdf",
    "tamaño": 245632,
    "cloudinaryId": "leads/673f.../attachments/1730563200000_cotizacion",
    "subidoPor": "user_123",
    "fechaSubida": "2025-11-02T17:00:00.000Z"
  }
}
```

**Tipos de archivo permitidos:**
- Documentos: PDF, Word, Excel, PowerPoint, TXT, CSV
- Imágenes: JPEG, PNG, GIF, WebP, SVG
- Comprimidos: ZIP, RAR, 7Z
- Tamaño máximo: 10 MB

---

### 2. Obtener adjuntos de un mensaje
```http
GET /api/crm/messages/:messageId/attachments
Authorization: Bearer {TOKEN}
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "data": {
    "adjuntos": [
      {
        "nombre": "cotizacion.pdf",
        "url": "https://res.cloudinary.com/...",
        "tipo": "pdf",
        "tamaño": 245632
      }
    ],
    "total": 1
  }
}
```

---

### 3. Obtener todos los adjuntos de un lead
```http
GET /api/crm/leads/:leadId/attachments?tipo=pdf&page=1&limit=20
Authorization: Bearer {TOKEN}
```

**Query Parameters:**
- `tipo` - Filtrar por tipo (pdf, documento, imagen, etc.)
- `page` - Página (default: 1)
- `limit` - Límite por página (default: 50)

**Respuesta esperada (200):**
```json
{
  "success": true,
  "data": {
    "adjuntos": [...],
    "stats": {
      "total": 5,
      "tamaño_total": 1245632,
      "por_tipo": {
        "pdf": 3,
        "imagen": 2
      }
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5
    }
  }
}
```

---

### 4. Eliminar adjunto
```http
DELETE /api/crm/messages/:messageId/attachments/:cloudinaryId
Authorization: Bearer {ADMIN_TOKEN}
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "message": "Adjunto eliminado exitosamente",
  "data": {
    "nombreArchivo": "cotizacion.pdf"
  }
}
```

**Permisos:**
- ADMIN/SUPER_ADMIN pueden eliminar cualquier adjunto
- Autor del mensaje puede eliminar sus propios adjuntos

---

### 5. Enviar mensaje con adjunto
```http
POST /api/crm/leads/:leadId/messages/client
Authorization: Bearer {TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "asunto": "Cotización de tu proyecto",
  "contenido": "Hola Juan, te envío la cotización para tu proyecto.",
  "adjuntos": [
    {
      "nombre": "cotizacion.pdf",
      "url": "https://res.cloudinary.com/...",
      "tipo": "pdf",
      "tamaño": 245632,
      "cloudinaryId": "leads/673f.../attachments/1730563200000_cotizacion"
    }
  ]
}
```

**Resultado:**
- ✅ Mensaje guardado con adjunto
- ✅ Email enviado al cliente con enlace al archivo
- ✅ Cliente puede descargar archivo desde portal

---

## 📧 TESTING DE EMAIL

### Verificar configuración de email

El sistema verifica automáticamente si Resend está configurado. Si `RESEND_API_KEY` no está configurada, el sistema funciona normalmente pero sin enviar emails.

### Configurar Resend para testing

1. Crea cuenta en [https://resend.com](https://resend.com) (gratis)
2. Obtén tu API Key en **Settings → API Keys**
3. Agrega a tu `.env`:
```env
RESEND_API_KEY=re_tu_api_key_aqui
EMAIL_FROM=onboarding@resend.dev
EMAIL_REPLY_TO=tu_email@ejemplo.com
```

4. **Sin dominio verificado:** Solo puedes enviar a emails verificados en Resend
   - Ve a **Settings → Verified Emails**
   - Agrega tu email de prueba
   - Verifica el email

### Testing de emails

**Test 1: Email al enviar mensaje a cliente**
```bash
# 1. Enviar mensaje a cliente con usuario vinculado
curl -X POST "http://localhost:5000/api/crm/leads/673f123/messages/client" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "asunto": "Test de email",
    "contenido": "Este es un mensaje de prueba"
  }'
```

**Resultado esperado:**
- ✅ Respuesta con `"emailEnviado": true`
- ✅ Email recibido en bandeja de entrada del cliente
- ✅ Email con diseño profesional (gradientes, botones)
- ✅ Enlace funcional al portal

**Test 2: Email cuando cliente responde**
```bash
# Cliente responde (usando CLIENT token)
curl -X POST "http://localhost:5000/api/crm/messages/673f456/reply" \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contenido": "Gracias por el mensaje, tengo algunas preguntas..."
  }'
```

**Resultado esperado:**
- ✅ Email enviado al autor del mensaje original
- ✅ Notificación de nueva respuesta del cliente

### Verificar logs de email

Los logs del servidor muestran:
```
📧 Enviando email a cliente: juan.perez@ejemplo.com
✅ Email enviado exitosamente - ID: abc123
```

Si falla:
```
⚠️  Email no pudo ser enviado: Invalid API key
```

### Plantillas de email incluidas

1. **Mensaje al cliente** - Diseño limpio con mensaje y botón CTA
2. **Mensaje con adjuntos** - Lista de archivos con iconos y tamaños
3. **Respuesta del cliente** - Notificación al equipo
4. **Lead asignado** - Notificación de asignación

Todas responsive y con gradientes modernos.

---

## �📄 ENDPOINTS DE PLANTILLAS

### 1. Listar plantillas disponibles
```http
GET /api/crm/templates
Authorization: Bearer {TOKEN}
```

**Query Parameters:**
- `tipo=bienvenida` - Filtrar por tipo
- `categoria=ventas` - Filtrar por categoría
- `favoritos=true` - Solo favoritas
- `search=cotizacion` - Buscar por texto

**Respuesta esperada (200):**
```json
{
  "success": true,
  "data": {
    "plantillas": [
      {
        "_id": "673f...",
        "titulo": "Bienvenida - Nuevo Lead",
        "descripcion": "Mensaje de bienvenida automático",
        "tipo": "bienvenida",
        "variables": [
          { "nombre": "nombre", "descripcion": "Nombre del cliente", "requerido": true }
        ],
        "vecesUsada": 15,
        "esFavorito": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "pages": 1
    }
  }
}
```

---

### 2. Usar plantilla (procesar variables)
```http
POST /api/crm/templates/:id/use
Authorization: Bearer {TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "valores": {
    "nombre": "Juan Pérez",
    "servicio": "desarrollo web",
    "nombre_agente": "María González"
  }
}
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "data": {
    "asunto": "¡Gracias por contactarnos, Juan Pérez!",
    "contenido": "Hola Juan Pérez,\n\n¡Gracias por ponerte en contacto...",
    "plantillaId": "673f...",
    "titulo": "Bienvenida - Nuevo Lead"
  }
}
```

---

### 3. Crear plantilla
```http
POST /api/crm/templates
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "titulo": "Recordatorio de Reunión",
  "descripcion": "Plantilla para recordar reuniones programadas",
  "asunto": "Recordatorio: Reunión {fecha}",
  "contenido": "Hola {nombre},\n\nTe recuerdo nuestra reunión programada para {fecha} a las {hora}.\n\nSaludos,\n{nombre_agente}",
  "tipo": "recordatorio",
  "categoria": "ventas",
  "variables": [
    { "nombre": "nombre", "descripcion": "Nombre del cliente", "requerido": true },
    { "nombre": "fecha", "descripcion": "Fecha de la reunión", "requerido": true },
    { "nombre": "hora", "descripcion": "Hora de la reunión", "requerido": true },
    { "nombre": "nombre_agente", "descripcion": "Nombre del agente", "requerido": true }
  ],
  "esPrivada": false,
  "etiquetas": ["reunion", "recordatorio"]
}
```

---

### 4. Toggle favorito
```http
POST /api/crm/templates/:id/favorite
Authorization: Bearer {TOKEN}
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "message": "Agregado a favoritos",
  "data": {
    "esFavorito": true
  }
}
```

---

## 🎯 ENDPOINTS DE LEADS (Nuevos)

### 1. Obtener timeline completo del lead
```http
GET /api/crm/leads/:id/timeline?incluirPrivados=true
Authorization: Bearer {ADMIN_TOKEN}
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "data": {
    "lead": {
      "id": "673f...",
      "nombre": "Juan Pérez",
      "estado": "contactado"
    },
    "timeline": [
      {
        "fecha": "2025-11-02T10:00:00.000Z",
        "tipo": "mensaje_cliente",
        "descripcion": "Hola Juan, fue un placer...",
        "usuarioNombre": "Moderador Ventas",
        "esPrivado": false,
        "direccion": "saliente"
      }
    ],
    "stats": {
      "totalActividades": 5,
      "mensajesNoLeidos": 1
    }
  }
}
```

---

### 2. Vincular usuario registrado al lead
```http
POST /api/crm/leads/:leadId/vincular-usuario
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "usuarioId": "user_client_test_1"
}
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "message": "Usuario vinculado exitosamente",
  "data": {
    "lead": {
      "id": "673f...",
      "nombre": "Juan Pérez",
      "usuarioRegistrado": {
        "userId": "user_client_test_1",
        "nombre": "Juan Pérez",
        "email": "juan.perez@ejemplo.com",
        "vinculadoEn": "2025-11-02T10:00:00.000Z"
      }
    }
  }
}
```

---

### 3. Portal Cliente: Mis Leads
```http
GET /api/crm/cliente/mis-leads?page=1&limit=10
Authorization: Bearer {CLIENT_TOKEN}
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "data": {
    "leads": [
      {
        "_id": "673f...",
        "nombre": "Juan Pérez",
        "correo": "juan.perez@ejemplo.com",
        "estado": "contactado",
        "prioridad": "alta",
        "mensajesNoLeidos": 2,
        "createdAt": "2025-11-01T08:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

---

## 🔐 TESTING DE PERMISOS

### Matriz de Testing por Rol

| Endpoint | SUPER_ADMIN | ADMIN | MODERATOR | CLIENT | Esperado |
|----------|-------------|-------|-----------|--------|----------|
| Ver mensajes de cualquier lead | ✅ | ✅ | ❌ | ❌ | 403 |
| Ver mensajes de lead asignado | ✅ | ✅ | ✅ | ❌ | 200 |
| Ver mensajes privados | ✅ | ✅ | ✅ | ❌ | Filtrados |
| Enviar mensaje interno | ✅ | ✅ | ✅ | ❌ | 201/403 |
| Enviar mensaje a cliente | ✅ | ✅ | ✅ | ❌ | 201/403 |
| Responder mensajes | ✅ | ✅ | ✅ | ✅ | 201 |
| Eliminar mensajes | ✅ | ✅ | ❌ | ❌ | 200/403 |
| Crear plantillas | ✅ | ✅ | ❌ | ❌ | 201/403 |
| Usar plantillas | ✅ | ✅ | ✅ | ❌ | 200/403 |
| Vincular usuario a lead | ✅ | ✅ | ❌ | ❌ | 200/403 |
| Ver mis leads (portal) | ❌ | ❌ | ❌ | ✅ | 200/403 |

---

## 🎬 CASOS DE USO COMUNES

### Caso 1: Nuevo Lead - Flujo Completo

**1. Cliente llena formulario → Se crea Lead**
```bash
POST /api/crm/leads
{
  "nombre": "Test Cliente",
  "correo": "test@ejemplo.com",
  ...
}
```

**2. Admin asigna lead a Moderator**
```bash
PATCH /api/crm/leads/:id/asignar
{ "asignadoA": "user_moderator_test" }
```

**3. Moderator agrega nota interna**
```bash
POST /api/crm/leads/:id/messages/internal
{ "contenido": "Llamar mañana" }
```

**4. Admin vincula usuario registrado**
```bash
POST /api/crm/leads/:id/vincular-usuario
{ "usuarioId": "user_client_test" }
```

**5. Moderator envía mensaje al cliente**
```bash
POST /api/crm/leads/:id/messages/client
{
  "asunto": "Bienvenida",
  "contenido": "Hola..."
}
```

**6. Cliente ve mensaje en portal**
```bash
GET /api/crm/cliente/mis-leads
GET /api/crm/leads/:id/messages (solo mensajes públicos)
```

**7. Cliente responde**
```bash
POST /api/crm/messages/:messageId/reply
{ "contenido": "Gracias por contactarme..." }
```

---

### Caso 2: Usar Plantilla para Responder

**1. Listar plantillas disponibles**
```bash
GET /api/crm/templates?tipo=seguimiento
```

**2. Usar plantilla con variables**
```bash
POST /api/crm/templates/:id/use
{
  "valores": {
    "nombre": "Juan",
    "empresa": "TechStart",
    "nombre_agente": "María"
  }
}
```

**3. Enviar mensaje procesado al cliente**
```bash
POST /api/crm/leads/:leadId/messages/client
{
  "asunto": "{asunto procesado de la plantilla}",
  "contenido": "{contenido procesado}"
}
```

---

## 🐛 ERRORES COMUNES Y SOLUCIONES

### Error: "Lead no tiene usuario vinculado"
**Solución:** Primero vincular usuario con:
```bash
POST /api/crm/leads/:id/vincular-usuario
```

### Error: "No tienes acceso a este lead"
**Solución:** Verificar que:
- ADMIN/SUPER_ADMIN pueden ver todos
- MODERATOR solo ve leads asignados
- CLIENT solo ve leads vinculados a su usuario

### Error: "Token inválido"
**Solución:** Verificar que el token JWT de Clerk sea válido y no haya expirado

---

## ✅ CHECKLIST DE TESTING

- [ ] Servidor inicia sin errores
- [ ] Plantillas se inicializan automáticamente
- [ ] Datos de prueba se crean correctamente (`npm run seed:mensajeria`)
- [ ] ADMIN puede ver todos los mensajes
- [ ] MODERATOR solo ve mensajes de leads asignados
- [ ] CLIENT solo ve mensajes públicos de sus leads
- [ ] Mensajes internos no se exponen a clientes
- [ ] Respuestas crean threading correctamente
- [ ] Plantillas procesan variables correctamente
- [ ] Notificaciones se registran (verificar logs)
- [ ] Permisos de eliminación funcionan correctamente
- [ ] Búsqueda de mensajes funciona
- [ ] Paginación funciona en todos los endpoints
- [ ] Contador de mensajes no leídos es correcto
- [ ] Portal cliente solo muestra leads vinculados

---

## 📞 SOPORTE

Si encuentras algún error durante el testing:
1. Revisar logs del servidor
2. Verificar estructura de datos en MongoDB
3. Comprobar que los permisos en `config/roles.js` están correctos
4. Verificar que el modelo Lead tiene los nuevos métodos

---

**Última actualización:** Noviembre 2, 2025
