# 📧 CONFIGURACIÓN DE EMAIL Y ADJUNTOS

## 📋 Índice
1. [Resumen de Funcionalidades](#resumen-de-funcionalidades)
2. [Configuración de Resend](#configuración-de-resend)
3. [Configuración de Cloudinary](#configuración-de-cloudinary)
4. [Variables de Entorno](#variables-de-entorno)
5. [Endpoints de Adjuntos](#endpoints-de-adjuntos)
6. [Ejemplos de Uso](#ejemplos-de-uso)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Resumen de Funcionalidades

### Funcionalidades Implementadas (Prioridad 1)

#### 📧 Email Transaccional con Resend
- ✅ Envío automático de emails cuando se envía mensaje a cliente
- ✅ Notificación por email cuando cliente responde
- ✅ Notificación de asignación de lead a agente
- ✅ Plantillas HTML profesionales y responsive
- ✅ Tracking de emails enviados
- ✅ Fallback graceful si email falla

#### 📎 Adjuntos con Cloudinary
- ✅ Upload de archivos (PDF, Word, Excel, imágenes, etc.)
- ✅ Límite de 10MB por archivo
- ✅ Validación de tipos MIME permitidos
- ✅ Almacenamiento seguro en Cloudinary
- ✅ Descarga de adjuntos con control de permisos
- ✅ Eliminación de archivos
- ✅ Listado de adjuntos por lead o mensaje

---

## 📧 Configuración de Resend

### Paso 1: Crear cuenta en Resend

1. Ve a [https://resend.com](https://resend.com)
2. Crea una cuenta (gratis hasta 3,000 emails/mes)
3. Verifica tu email

### Paso 2: Obtener API Key

1. En el dashboard de Resend, ve a **API Keys**
2. Click en **Create API Key**
3. Nombre: `web-scuti-backend`
4. Permisos: **Sending access**
5. Copia la API Key (solo se muestra una vez)

### Paso 3: Verificar dominio (Opcional pero recomendado)

Para producción, es importante verificar tu dominio:

1. En Resend, ve a **Domains**
2. Click en **Add Domain**
3. Ingresa tu dominio: `scuti.com`
4. Agrega los registros DNS que te proporcionen:
   ```
   TXT  @  resend._domainkey  [valor proporcionado]
   ```
5. Espera verificación (puede tomar hasta 48 horas)

**Modo Desarrollo (Sin dominio verificado):**
- Puedes enviar emails solo a direcciones que hayas agregado en Resend
- Ve a **Settings → Verified Emails** y agrega tus emails de prueba

### Paso 4: Configurar remitente

En tu `.env`:
```env
EMAIL_FROM=Scuti Company <noreply@scuti.com>
EMAIL_REPLY_TO=soporte@scuti.com
```

Si no tienes dominio verificado, usa el dominio de desarrollo de Resend:
```env
EMAIL_FROM=onboarding@resend.dev
```

### Plantillas de Email Incluidas

El sistema incluye 4 plantillas HTML profesionales:

1. **Mensaje al Cliente** - Cuando el equipo envía mensaje al cliente
2. **Mensaje con Adjuntos** - Cuando se envían archivos al cliente
3. **Respuesta del Cliente** - Notifica al equipo cuando cliente responde
4. **Lead Asignado** - Notifica a agente cuando se le asigna un lead
5. **Bienvenida** - Email de bienvenida para nuevos leads

Todas las plantillas son:
- ✅ Responsive (mobile-friendly)
- ✅ Con diseño moderno (gradientes, botones, etc.)
- ✅ Personalizables con variables
- ✅ Con enlaces directos al portal/CRM

---

## 📎 Configuración de Cloudinary

### Ya configurado ✅

Tu proyecto ya tiene Cloudinary configurado en `config/cloudinary.js`.

### Verificar configuración

Asegúrate de tener en tu `.env`:
```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### Estructura de carpetas en Cloudinary

Los adjuntos se organizan así:
```
cloudinary/
└── leads/
    ├── [leadId1]/
    │   └── attachments/
    │       ├── 1730563200000_documento.pdf
    │       └── 1730563300000_imagen.jpg
    └── [leadId2]/
        └── attachments/
            └── 1730563400000_cotizacion.xlsx
```

### Tipos de archivo permitidos

- **Documentos**: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx)
- **Imágenes**: JPEG, PNG, GIF, WebP, SVG
- **Texto**: TXT, CSV, JSON
- **Comprimidos**: ZIP, RAR, 7Z

**Tamaño máximo:** 10 MB por archivo

---

## ⚙️ Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```env
# ============================================
# EMAIL CONFIGURATION (Resend)
# ============================================
RESEND_API_KEY=re_123456789abcdefghijklmnop
EMAIL_FROM=Scuti Company <noreply@scuti.com>
EMAIL_REPLY_TO=soporte@scuti.com

# URLs del sistema
APP_URL=https://scuti.com
PORTAL_URL=https://portal.scuti.com

# Para desarrollo local:
# APP_URL=http://localhost:5000
# PORTAL_URL=http://localhost:3000

# ============================================
# CLOUDINARY (Ya configurado)
# ============================================
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

---

## 📎 Endpoints de Adjuntos

### 1. Subir archivo a un lead
```http
POST /api/crm/leads/:leadId/attachments
Authorization: Bearer {TOKEN}
Content-Type: multipart/form-data
```

**Body (form-data):**
- `archivo` (file): El archivo a subir

**Ejemplo con curl:**
```bash
curl -X POST "http://localhost:5000/api/crm/leads/673f12345678901234567890/attachments" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "archivo=@/path/to/file.pdf"
```

**Respuesta (201):**
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

### 2. Obtener adjuntos de un mensaje
```http
GET /api/crm/messages/:messageId/attachments
Authorization: Bearer {TOKEN}
```

### 3. Obtener todos los adjuntos de un lead
```http
GET /api/crm/leads/:leadId/attachments?tipo=pdf&page=1&limit=20
Authorization: Bearer {TOKEN}
```

**Query Parameters:**
- `tipo` - Filtrar por tipo (pdf, documento, imagen, etc.)
- `page` - Página (default: 1)
- `limit` - Límite por página (default: 50)

### 4. Eliminar adjunto
```http
DELETE /api/crm/messages/:messageId/attachments/:cloudinaryId
Authorization: Bearer {TOKEN}
```

### 5. Obtener información de un adjunto
```http
GET /api/crm/attachments/:cloudinaryId
Authorization: Bearer {TOKEN}
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Enviar mensaje con adjunto al cliente

**Paso 1: Subir archivo**
```bash
curl -X POST "http://localhost:5000/api/crm/leads/673f123/attachments" \
  -H "Authorization: Bearer TOKEN" \
  -F "archivo=@cotizacion.pdf"
```

**Respuesta:**
```json
{
  "data": {
    "nombre": "cotizacion.pdf",
    "url": "https://res.cloudinary.com/...",
    "cloudinaryId": "leads/673f123/attachments/1730563200000_cotizacion"
  }
}
```

**Paso 2: Enviar mensaje con referencia al adjunto**
```bash
curl -X POST "http://localhost:5000/api/crm/leads/673f123/messages/client" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "asunto": "Cotización de tu proyecto",
    "contenido": "Hola Juan, te envío la cotización para tu proyecto. Por favor revísala y déjame saber si tienes preguntas.",
    "adjuntos": [{
      "nombre": "cotizacion.pdf",
      "url": "https://res.cloudinary.com/...",
      "tipo": "pdf",
      "tamaño": 245632,
      "cloudinaryId": "leads/673f123/attachments/1730563200000_cotizacion"
    }]
  }'
```

**Resultado:**
- ✅ Mensaje guardado en base de datos
- ✅ Email enviado al cliente con el mensaje
- ✅ Email incluye enlace para descargar el adjunto
- ✅ Cliente recibe notificación

### Ejemplo 2: Cliente recibe email y descarga archivo

El cliente recibirá un email como este:

```
┌─────────────────────────────────────┐
│     🚀 Scuti Company                │
├─────────────────────────────────────┤
│                                     │
│  Tienes un nuevo mensaje            │
│  con archivos adjuntos              │
│                                     │
│  María González te ha enviado      │
│  un mensaje con 1 archivo adjunto: │
│                                     │
│  ╔════════════════════════════╗    │
│  ║ Cotización de tu proyecto  ║    │
│  ╠════════════════════════════╣    │
│  ║ Hola Juan, te envío la     ║    │
│  ║ cotización...              ║    │
│  ║                            ║    │
│  ║ 📎 Archivos adjuntos:      ║    │
│  ║ • cotizacion.pdf (240 KB)  ║    │
│  ╚════════════════════════════╝    │
│                                     │
│   [Ver Mensaje y Descargar]         │
│                                     │
│  🔒 Los archivos están seguros     │
│  en nuestro portal.                │
│                                     │
└─────────────────────────────────────┘
```

### Ejemplo 3: Ver todos los adjuntos de un lead

```bash
curl -X GET "http://localhost:5000/api/crm/leads/673f123/attachments" \
  -H "Authorization: Bearer TOKEN"
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "adjuntos": [
      {
        "nombre": "cotizacion.pdf",
        "url": "https://res.cloudinary.com/...",
        "tipo": "pdf",
        "tamaño": 245632,
        "mensajeId": "673f456",
        "autorNombre": "María González",
        "fechaMensaje": "2025-11-02T17:00:00.000Z"
      }
    ],
    "stats": {
      "total": 1,
      "tamaño_total": 245632,
      "por_tipo": {
        "pdf": 1
      }
    }
  }
}
```

---

## 🔍 Troubleshooting

### ❌ Error: "Email no pudo ser enviado"

**Causa:** API Key de Resend inválida o no configurada

**Solución:**
1. Verifica que `RESEND_API_KEY` esté en tu `.env`
2. Verifica que la API Key sea válida en [resend.com/api-keys](https://resend.com/api-keys)
3. Si usas dominio personalizado, verifica que esté verificado

**El sistema continúa funcionando:** El mensaje se guarda correctamente, solo falla el email.

### ❌ Error: "Tipo de archivo no permitido"

**Causa:** El tipo MIME del archivo no está en la lista permitida

**Solución:**
Si necesitas permitir otros tipos de archivo, edita `controllers/attachmentController.js`:
```javascript
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  // ... agregar más tipos aquí
];
```

### ❌ Error: "El archivo es muy grande"

**Causa:** Archivo supera los 10MB

**Solución:**
1. Comprime el archivo
2. O aumenta el límite en `controllers/attachmentController.js`:
```javascript
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
```

### ⚠️ Emails solo llegan a mi email de prueba

**Causa:** Dominio no verificado en Resend (modo desarrollo)

**Solución:**
- Para desarrollo: Agrega más emails en Resend → Settings → Verified Emails
- Para producción: Verifica tu dominio siguiendo los pasos en Resend

### ℹ️ Verificar estado del servicio de email

```bash
# En node o tu terminal
const { getEstadoEmail } = require('./utils/emailService');
console.log(getEstadoEmail());
```

**Respuesta:**
```javascript
{
  configurado: true,
  from: 'Scuti Company <noreply@scuti.com>',
  replyTo: 'soporte@scuti.com',
  appUrl: 'https://scuti.com',
  portalUrl: 'https://portal.scuti.com'
}
```

---

## 📊 Estadísticas de Uso

### Límites de Resend (Plan Gratuito)

- ✅ 3,000 emails/mes
- ✅ 100 emails/día
- ✅ Todos los destinatarios deben estar verificados (sin dominio verificado)

### Límites de Cloudinary (Plan Gratuito)

- ✅ 25 GB de almacenamiento
- ✅ 25 GB de ancho de banda/mes
- ✅ Transformaciones ilimitadas

---

## 🎉 ¡Listo!

Ahora tu sistema CRM tiene:
- ✅ Envío automático de emails profesionales
- ✅ Adjuntos seguros con Cloudinary
- ✅ Notificaciones por email
- ✅ Tracking de archivos
- ✅ Control de permisos robusto

### Próximos pasos opcionales:

1. **Verificar dominio en Resend** (para producción)
2. **Personalizar plantillas de email** en `config/email.js`
3. **Configurar webhook de Resend** para tracking de aperturas/clicks
4. **Implementar compresión de imágenes** antes de subir
5. **Agregar preview de archivos** en el frontend

---

**Última actualización:** Noviembre 2, 2025
**Documentación por:** GitHub Copilot
