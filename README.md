# � WEB SCUTI BACKEND - DOCUMENTACIÓN COMPLETA
*Todo lo que necesitas para desarrollar el frontend*

## 🎯 ESTADO DEL PROYECTO

### ✅ Backend Completado (Sprint 1-4)
- ✅ **Sprint 1**: Sistema básico de blog con autenticación Clerk
- ✅ **Sprint 2**: CMS completo con gestión de imágenes y páginas
- ✅ **Sprint 3**: Sistema de usuarios, roles y permisos
- ✅ **Sprint 4**: **Sistema completo de comentarios y moderación** (100% funcional)

### 🏗️ Funcionalidades Disponibles
- ✅ Autenticación con Clerk (roles: user, moderator, content_manager, admin)
- ✅ CRUD completo de posts del blog
- ✅ Sistema de categorías y tags
- ✅ Gestión de imágenes con Cloudinary
- ✅ CMS para páginas estáticas
- ✅ **Sistema de comentarios con hilos (5 niveles)**
- ✅ **Moderación automática con NLP en español**
- ✅ **Sistema de votación (like/dislike)**
- ✅ **Sistema de reportes**
- ✅ **Detección automática de spam**
- ✅ Formulario de contacto
- ✅ Rate limiting y validaciones
- ✅ **Tests automatizados (15/15 passing - 100%)**

---

## 📖 DOCUMENTACIÓN DISPONIBLE

### 🚀 [FRONTEND_QUICK_START.md](./FRONTEND_QUICK_START.md)
**¡EMPEZAR AQUÍ!** - Guía paso a paso para desarrolladores frontend
- ⚡ Configuración inicial (5 minutos)
- 📡 Servicio de API completo (apiService.js)
- 🎯 Hooks personalizados listos para usar
- 🎨 Componentes de ejemplo (BlogCard, CommentForm, etc.)
- 📱 Páginas completas (BlogPost, AdminDashboard)
- 🌐 Configuración de producción

### 📚 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
**Referencia completa de la API**
- 🔧 Configuración inicial y headers
- 📝 Todos los endpoints del blog (15+)
- 💬 Sistema completo de comentarios (8 endpoints)
- 🔒 Endpoints administrativos (10+)
- 🎨 CMS y gestión de imágenes
- ⚠️ Manejo de errores y rate limiting
- 🔄 Ejemplos de uso con fetch/axios

### � [MODELS_DOCUMENTATION.md](./MODELS_DOCUMENTATION.md)
**Estructuras de datos y schemas**
- 📝 BlogPost: Campos, validaciones, ejemplo completo
- 💬 BlogComment: Sistema de hilos, moderación, votación
- 📂 Categoria: Configuración y SEO
- 👤 User: Integración con Clerk, roles y permisos
- 🖼️ Image: Gestión con Cloudinary
- 📄 Page: CMS de páginas estáticas
- 🔍 Índices de base de datos optimizados

### 🔐 [CLERK_INTEGRATION_GUIDE.md](./CLERK_INTEGRATION_GUIDE.md)
**Guía completa de autenticación**
- 🚀 Configuración inicial con React
- 🎯 Componentes principales (Layout, ProtectedRoute)
- 👤 Gestión de usuarios y roles
- 🎨 Personalización de UI
- 🔄 Sincronización con backend
- 📱 Mejores prácticas UX
- 🔒 Seguridad y testing

---

## 🚀 INICIO RÁPIDO (5 MINUTOS)

### 1. Clonar y Configurar
```bash
# Clonar el repositorio del frontend (cuando lo crees)
git clone tu-repo-frontend
cd tu-proyecto-frontend

# Instalar dependencias mínimas
npm install @clerk/clerk-react axios react-router-dom
```

### 2. Variables de Entorno (.env)
```env
# API Backend (ya funcionando)
VITE_API_URL=http://localhost:5000/api

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_tu_key_aqui
```

### 3. Código Base Mínimo
```javascript
// App.jsx - Configuración básica
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'
import apiService from './services/apiService' // Ver FRONTEND_QUICK_START.md

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        {/* Tu aplicación aquí */}
      </BrowserRouter>
    </ClerkProvider>
  )
}
```

### 4. Primer Endpoint
```javascript
// Obtener posts del blog
import apiService from './services/apiService'

const posts = await apiService.getBlogPosts({
  categoria: 'tecnologia',
  limit: 10,
  page: 1
})
console.log(posts.data.data) // Array de posts
```

---

## 🔗 ENDPOINTS PRINCIPALES

### 📝 Blog
```javascript
// Posts públicos
GET /api/blog/posts                    // Lista de posts
GET /api/blog/posts/:slug              // Post individual
GET /api/blog/categorias               // Categorías

// Administración (requiere auth)
POST /api/admin/posts                  // Crear post
PUT /api/admin/posts/:id               // Editar post
DELETE /api/admin/posts/:id            // Eliminar post
```

### 💬 Comentarios (Sistema Completo)
```javascript
// Públicos
GET /api/blog/:slug/comments           // Comentarios de un post
POST /api/blog/:slug/comments          // Crear comentario
POST /api/comments/:id/vote            // Votar comentario
POST /api/comments/:id/report          // Reportar comentario

// Moderación (requiere auth)
GET /api/admin/comments/moderation/queue    // Cola de moderación
PUT /api/admin/comments/:id/moderate        // Moderar comentario
GET /api/admin/comments/stats               // Estadísticas
```

### 🖼️ CMS
```javascript
POST /api/upload/image                 // Subir imagen
GET /api/cms/images                    // Galería de imágenes
GET /api/cms/pages/:slug               // Página estática
```

---

## 🎯 FUNCIONALIDADES DESTACADAS

### � Sistema de Comentarios (Sprint 4 - 100% Funcional)
- ✅ **Comentarios públicos y autenticados**
- ✅ **Sistema de hilos (hasta 5 niveles)**
- ✅ **Moderación automática con NLP en español**
- ✅ **Detección de spam automática (120+ palabras bannedas)**
- ✅ **Sistema de votación (like/dislike)**
- ✅ **Sistema de reportes con prioridades**
- ✅ **Panel de moderación administrativo**
- ✅ **15 tests automatizados (100% passing)**

### 🔐 Autenticación y Roles
```javascript
// Roles disponibles
"user"            // Usuario básico
"moderator"       // Puede moderar comentarios
"content_manager" // Puede crear/editar posts
"admin"           // Acceso completo

// Permisos específicos
"create_posts", "edit_posts", "delete_posts",
"moderate_comments", "manage_users", "view_analytics"
```

### 🛡️ Seguridad Implementada
- ✅ Rate limiting por endpoint
- ✅ Validación de datos con Mongoose
- ✅ Sanitización de contenido
- ✅ CORS configurado
- ✅ Autenticación JWT con Clerk
- ✅ Middleware de autorización
- ✅ IP anonymization (GDPR compliant)

---

## 📊 DATOS DE PRUEBA

### Posts Disponibles
El backend ya tiene posts de ejemplo en estas categorías:
- **Tecnología** (slug: `tecnologia`)
- **Diseño** (slug: `diseno`)
- **Marketing** (slug: `marketing`)

### Endpoint de Prueba
```javascript
// Obtener primer post para probar comentarios
const response = await fetch('http://localhost:5000/api/blog/posts/introduccion-desarrollo-web-moderno')
const post = await response.json()
console.log(post.data) // Post completo con toda la información
```

### Usuario Admin por Defecto
Configurado en Clerk Dashboard con:
- **Role**: `admin`
- **Permissions**: Todos los permisos disponibles

---

## 🔧 HERRAMIENTAS DE DESARROLLO

### Testing del Backend
```bash
# Ejecutar tests de comentarios (desde backend/)
node test-comments.js
# Resultado: 15/15 tests passing (100%)
```

### Scripts Útiles
```bash
# Aprobar un comentario manualmente (desde backend/)
node approve-test-comment.js COMMENT_ID

# Verificar configuración de base de datos
node verify-db.js

# Crear datos de prueba
node seed-test-data.js
```

### Herramientas de API
- **Postman/Insomnia**: Para probar endpoints protegidos
- **MongoDB Compass**: Para ver la base de datos
- **Clerk Dashboard**: Para gestionar usuarios y roles

---

*¡El backend está listo para que construyas un frontend increíble! 🚀*

*Última actualización: 3 de noviembre de 2025*
*Sprint 4 completado - Sistema de comentarios 100% funcional ✅*
