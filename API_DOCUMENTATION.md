# 📚 API DOCUMENTATION - WEB SCUTI BACKEND
*Documentación completa para desarrolladores frontend*

## 🔧 CONFIGURACIÓN INICIAL

### Base URL
```
Desarrollo: http://localhost:5000/api
Producción: https://tu-dominio.com/api
```

### Headers Requeridos
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${clerkToken}` // Solo para endpoints protegidos
}
```

### Variables de Entorno Frontend
```env
VITE_API_URL=http://localhost:5000/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
```

---

## 🔐 AUTENTICACIÓN CON CLERK

### Configuración Inicial
```javascript
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </ClerkProvider>
  )
}
```

### Obtener Token de Autenticación
```javascript
import { useAuth } from '@clerk/clerk-react'

function MyComponent() {
  const { getToken } = useAuth()
  
  const fetchProtectedData = async () => {
    const token = await getToken()
    const response = await fetch('/api/admin/posts', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    return response.json()
  }
}
```

### Roles y Permisos Disponibles
```javascript
// Roles principales
"admin"           // Acceso completo al sistema
"content_manager" // Gestión de contenido
"moderator"       // Moderación de comentarios

// Permisos específicos
"create_posts"        // Crear posts
"edit_posts"         // Editar posts
"delete_posts"       // Eliminar posts
"moderate_comments"  // Moderar comentarios
"manage_users"       // Gestionar usuarios
"view_analytics"     // Ver estadísticas
"manage_settings"    // Configuraciones del sistema
```

---

## 📝 ENDPOINTS DEL BLOG

### 🔍 Obtener Posts

#### **GET /blog/posts** - Lista de posts públicos
```javascript
// Sin parámetros
const posts = await fetch('/api/blog/posts')

// Con filtros
const posts = await fetch('/api/blog/posts?' + new URLSearchParams({
  page: 1,
  limit: 10,
  categoria: 'tecnologia',
  search: 'javascript',
  sort: 'publishedAt',
  order: 'desc'
}))
```

**Respuesta:**
```javascript
{
  success: true,
  data: {
    data: [
      {
        _id: "507f1f77bcf86cd799439011",
        title: "Título del post",
        slug: "titulo-del-post",
        excerpt: "Resumen del contenido...",
        featuredImage: "https://cloudinary.com/image.jpg",
        publishedAt: "2025-11-03T10:00:00.000Z",
        readingTime: 5,
        categoria: {
          _id: "507f1f77bcf86cd799439012",
          nombre: "Tecnología",
          slug: "tecnologia"
        },
        author: {
          _id: "507f1f77bcf86cd799439013",
          firstName: "Juan",
          lastName: "Pérez",
          avatar: "https://images.clerk.dev/avatar.jpg"
        },
        stats: {
          views: 150,
          commentsCount: 12
        }
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 25,
      pages: 3
    }
  }
}
```

#### **GET /blog/posts/:slug** - Post individual
```javascript
const post = await fetch('/api/blog/posts/mi-primer-post')
```

**Respuesta:**
```javascript
{
  success: true,
  data: {
    _id: "507f1f77bcf86cd799439011",
    title: "Mi Primer Post",
    slug: "mi-primer-post",
    content: "Contenido completo en markdown...",
    excerpt: "Resumen del post...",
    featuredImage: "https://cloudinary.com/image.jpg",
    publishedAt: "2025-11-03T10:00:00.000Z",
    readingTime: 5,
    tags: ["javascript", "react", "nodejs"],
    seo: {
      metaTitle: "Título SEO",
      metaDescription: "Descripción SEO",
      canonicalUrl: "https://tu-dominio.com/blog/mi-primer-post"
    },
    categoria: {
      _id: "507f1f77bcf86cd799439012",
      nombre: "Tecnología",
      slug: "tecnologia",
      color: "#3B82F6"
    },
    author: {
      _id: "507f1f77bcf86cd799439013",
      firstName: "Juan",
      lastName: "Pérez",
      avatar: "https://images.clerk.dev/avatar.jpg",
      bio: "Desarrollador Full Stack"
    },
    stats: {
      views: 150,
      commentsCount: 12,
      approvedCommentsCount: 10,
      averageRating: 4.5
    },
    allowComments: true,
    isPublished: true
  }
}
```

### 📂 Categorías

#### **GET /blog/categorias** - Lista de categorías
```javascript
const categorias = await fetch('/api/blog/categorias')
```

**Respuesta:**
```javascript
{
  success: true,
  data: [
    {
      _id: "507f1f77bcf86cd799439012",
      nombre: "Tecnología",
      slug: "tecnologia",
      descripcion: "Posts sobre tecnología y desarrollo",
      color: "#3B82F6",
      icono: "💻",
      postsCount: 15,
      isActive: true
    }
  ]
}
```

---

## 💬 SISTEMA DE COMENTARIOS

### 📖 Obtener Comentarios

#### **GET /blog/:slug/comments** - Comentarios de un post
```javascript
const comments = await fetch('/api/blog/mi-primer-post/comments?' + new URLSearchParams({
  page: 1,
  limit: 20,
  includeReplies: true,
  sort: 'createdAt',
  order: 'desc'
}))
```

**Respuesta:**
```javascript
{
  success: true,
  data: {
    data: [
      {
        _id: "507f1f77bcf86cd799439014",
        content: "Excelente artículo, muy útil!",
        status: "approved",
        level: 0,
        parentComment: null,
        author: {
          // Usuario registrado
          userId: "507f1f77bcf86cd799439013",
          firstName: "Juan",
          lastName: "Pérez",
          avatar: "https://images.clerk.dev/avatar.jpg"
          // O usuario invitado
          name: "Visitante",
          email: "visitante@email.com",
          website: "https://ejemplo.com"
        },
        votes: {
          likes: 5,
          dislikes: 0,
          score: 5
        },
        createdAt: "2025-11-03T10:30:00.000Z",
        editedAt: null,
        replies: [
          {
            _id: "507f1f77bcf86cd799439015",
            content: "Gracias por el comentario!",
            level: 1,
            parentComment: "507f1f77bcf86cd799439014",
            // ... resto de campos
          }
        ]
      }
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 35,
      pages: 2
    }
  }
}
```

#### **GET /comments/:id** - Comentario individual
```javascript
const comment = await fetch('/api/comments/507f1f77bcf86cd799439014')
```

### ✍️ Crear Comentarios

#### **POST /blog/:slug/comments** - Nuevo comentario
```javascript
// Comentario de usuario invitado
const newComment = await fetch('/api/blog/mi-primer-post/comments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: "Mi comentario aquí",
    name: "Juan Pérez",
    email: "juan@email.com",
    website: "https://juanperez.com", // Opcional
    parentComment: "507f1f77bcf86cd799439014" // Para respuestas
  })
})

// Comentario de usuario autenticado
const newComment = await fetch('/api/blog/mi-primer-post/comments', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    content: "Mi comentario autenticado",
    parentComment: null // Comentario principal
  })
})
```

**Respuesta:**
```javascript
{
  success: true,
  message: "Comentario creado exitosamente",
  data: {
    comment: {
      _id: "507f1f77bcf86cd799439016",
      content: "Mi comentario aquí",
      status: "pending", // "approved", "rejected", "spam", "hidden"
      level: 0,
      parentComment: null,
      // ... resto de campos
    },
    moderation: {
      score: 95,
      flags: [],
      action: "approved", // "pending", "rejected", "spam"
      reason: "Content passed all moderation checks"
    }
  }
}
```

### 👍 Votar Comentarios

#### **POST /comments/:id/vote** - Votar comentario
```javascript
const vote = await fetch('/api/comments/507f1f77bcf86cd799439014/vote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: "like", // "like" | "dislike" | "remove"
    guestId: "guest_12345" // Para usuarios no autenticados
  })
})
```

**Respuesta:**
```javascript
{
  success: true,
  message: "Voto registrado exitosamente",
  data: {
    votes: {
      likes: 6,
      dislikes: 0,
      score: 6
    },
    userVote: "like" // Voto actual del usuario
  }
}
```

### 🚨 Reportar Comentarios

#### **POST /comments/:id/report** - Reportar comentario
```javascript
const report = await fetch('/api/comments/507f1f77bcf86cd799439014/report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reason: "spam", // "spam", "inappropriate", "harassment", "off_topic", "other"
    description: "Descripción detallada del problema", // Opcional
    reporterEmail: "reporter@email.com" // Para usuarios no autenticados
  })
})
```

### 📊 Estadísticas de Comentarios

#### **GET /blog/:slug/comments/stats** - Stats de comentarios
```javascript
const stats = await fetch('/api/blog/mi-primer-post/comments/stats')
```

**Respuesta:**
```javascript
{
  success: true,
  data: {
    total: 45,
    approved: 40,
    pending: 3,
    rejected: 1,
    spam: 1,
    hidden: 0
  }
}
```

---

## 🔒 ENDPOINTS ADMINISTRATIVOS

### 📝 Gestión de Posts (Requiere autenticación)

#### **GET /admin/posts** - Posts para administración
```javascript
const posts = await fetch('/api/admin/posts', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

#### **POST /admin/posts** - Crear nuevo post
```javascript
const newPost = await fetch('/api/admin/posts', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({
    title: "Título del post",
    content: "# Contenido en markdown",
    excerpt: "Resumen del post",
    categoria: "507f1f77bcf86cd799439012",
    tags: ["javascript", "tutorial"],
    featuredImage: "https://cloudinary.com/image.jpg",
    seo: {
      metaTitle: "SEO Title",
      metaDescription: "SEO Description",
      canonicalUrl: "https://example.com/canonical"
    },
    isPublished: true,
    allowComments: true,
    publishedAt: "2025-11-03T10:00:00.000Z"
  })
})
```

#### **PUT /admin/posts/:id** - Actualizar post
```javascript
const updatedPost = await fetch('/api/admin/posts/507f1f77bcf86cd799439011', {
  method: 'PUT',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({
    title: "Título actualizado",
    content: "Contenido actualizado"
  })
})
```

#### **DELETE /admin/posts/:id** - Eliminar post
```javascript
const deleted = await fetch('/api/admin/posts/507f1f77bcf86cd799439011', {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
})
```

### 🛡️ Moderación de Comentarios

#### **GET /admin/comments/moderation/queue** - Cola de moderación
```javascript
const queue = await fetch('/api/admin/comments/moderation/queue?' + new URLSearchParams({
  status: 'pending', // 'pending', 'reported', 'all'
  page: 1,
  limit: 50,
  sortBy: 'createdAt',
  sortOrder: 'desc'
}), {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

#### **PUT /admin/comments/:id/moderate** - Moderar comentario
```javascript
const moderated = await fetch('/api/admin/comments/507f1f77bcf86cd799439014/moderate', {
  method: 'PUT',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: "approve", // "approve", "reject", "spam", "hide"
    reason: "Comentario apropiado",
    notifyUser: true
  })
})
```

#### **GET /admin/comments/stats** - Estadísticas de moderación
```javascript
const stats = await fetch('/api/admin/comments/stats', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

**Respuesta:**
```javascript
{
  success: true,
  data: {
    total: 1250,
    pending: 15,
    approved: 1100,
    rejected: 35,
    spam: 85,
    hidden: 15,
    reported: 8,
    avgModerationTime: "2h 30m",
    spamDetectionRate: 0.95
  }
}
```

### 👥 Gestión de Usuarios

#### **GET /admin/users** - Lista de usuarios
```javascript
const users = await fetch('/api/admin/users', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

#### **PUT /admin/users/:id/role** - Cambiar rol de usuario
```javascript
const roleChanged = await fetch('/api/admin/users/507f1f77bcf86cd799439013/role', {
  method: 'PUT',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    role: "moderator",
    permissions: ["moderate_comments", "view_analytics"]
  })
})
```

---

## 🎨 CMS ENDPOINTS

### 🖼️ Gestión de Imágenes

#### **POST /upload/image** - Subir imagen
```javascript
const formData = new FormData()
formData.append('image', file)
formData.append('category', 'blog') // 'blog', 'avatar', 'general'

const upload = await fetch('/api/upload/image', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
})
```

**Respuesta:**
```javascript
{
  success: true,
  data: {
    _id: "507f1f77bcf86cd799439017",
    originalName: "imagen.jpg",
    url: "https://res.cloudinary.com/tu-cloud/image/upload/v1699000000/blog/imagen.jpg",
    publicId: "blog/imagen",
    format: "jpg",
    width: 1920,
    height: 1080,
    size: 245760,
    category: "blog",
    uploadedBy: "507f1f77bcf86cd799439013",
    createdAt: "2025-11-03T10:45:00.000Z"
  }
}
```

#### **GET /cms/images** - Galería de imágenes
```javascript
const images = await fetch('/api/cms/images?' + new URLSearchParams({
  category: 'blog',
  page: 1,
  limit: 20,
  search: 'logo'
}), {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

### 📄 Páginas Estáticas

#### **GET /cms/pages** - Lista de páginas
```javascript
const pages = await fetch('/api/cms/pages')
```

#### **GET /cms/pages/:slug** - Página específica
```javascript
const page = await fetch('/api/cms/pages/acerca-de')
```

**Respuesta:**
```javascript
{
  success: true,
  data: {
    _id: "507f1f77bcf86cd799439018",
    title: "Acerca de",
    slug: "acerca-de",
    content: "# Acerca de nosotros\n\nContenido de la página...",
    seo: {
      metaTitle: "Acerca de - Mi Blog",
      metaDescription: "Conoce más sobre nosotros"
    },
    isPublished: true,
    createdAt: "2025-11-03T08:00:00.000Z",
    updatedAt: "2025-11-03T09:00:00.000Z"
  }
}
```

---

## 📞 CONTACTO

### **POST /contact** - Enviar mensaje de contacto
```javascript
const message = await fetch('/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Juan Pérez",
    email: "juan@email.com",
    subject: "Consulta sobre servicios",
    message: "Hola, me gustaría saber más sobre...",
    phone: "+1234567890", // Opcional
    company: "Mi Empresa" // Opcional
  })
})
```

---

## ⚠️ MANEJO DE ERRORES

### Estructura de Respuestas de Error
```javascript
{
  success: false,
  message: "Mensaje de error amigable",
  error: "Detalles técnicos del error", // Solo en development
  code: "ERROR_CODE", // Opcional
  details: { // Opcional
    field: "title",
    validationErrors: ["El título es requerido"]
  }
}
```

### Códigos de Estado HTTP
```javascript
200 // OK - Operación exitosa
201 // Created - Recurso creado
400 // Bad Request - Datos inválidos
401 // Unauthorized - No autenticado
403 // Forbidden - Sin permisos
404 // Not Found - Recurso no encontrado
429 // Too Many Requests - Rate limit excedido
500 // Internal Server Error - Error del servidor
```

### Ejemplo de Manejo de Errores
```javascript
async function fetchWithErrorHandling(url, options = {}) {
  try {
    const response = await fetch(url, options)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Error en la petición')
    }
    
    return data
  } catch (error) {
    console.error('Error:', error.message)
    throw error
  }
}
```

---

## 🔄 RATE LIMITING

### Límites por Endpoint
```javascript
// Endpoints públicos
GET /blog/posts: 100 requests/min
GET /blog/posts/:slug: 60 requests/min
POST /blog/:slug/comments: 10 requests/min

// Endpoints administrativos
GET /admin/*: 200 requests/min
POST /admin/*: 50 requests/min
PUT /admin/*: 30 requests/min
DELETE /admin/*: 20 requests/min

// Upload de archivos
POST /upload/*: 5 requests/min
```

### Headers de Rate Limiting
```javascript
// El servidor incluye estos headers en las respuestas
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699000000
```

---

## 🌐 CORS Y CONFIGURACIÓN

### CORS Headers Permitidos
```javascript
Access-Control-Allow-Origin: http://localhost:3000, https://tu-dominio.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

### WebSockets (Para futuras implementaciones)
```javascript
// Endpoint para conexiones en tiempo real
ws://localhost:5000/socket.io

// Eventos disponibles
'comment:new' // Nuevo comentario en tiempo real
'post:updated' // Post actualizado
'moderation:action' // Acción de moderación
```

---

## 🚀 EJEMPLOS DE USO PRÁCTICOS

### Hook de React para Posts
```javascript
import { useState, useEffect } from 'react'

function useBlogPosts(filters = {}) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/blog/posts?' + new URLSearchParams(filters))
        const data = await response.json()
        
        if (data.success) {
          setPosts(data.data.data)
        } else {
          setError(data.message)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPosts()
  }, [JSON.stringify(filters)])
  
  return { posts, loading, error }
}

// Uso
function BlogList() {
  const { posts, loading, error } = useBlogPosts({ categoria: 'tecnologia', limit: 10 })
  
  if (loading) return <div>Cargando...</div>
  if (error) return <div>Error: {error}</div>
  
  return (
    <div>
      {posts.map(post => (
        <BlogPost key={post._id} post={post} />
      ))}
    </div>
  )
}
```

### Servicio de API Centralizado
```javascript
class ApiService {
  constructor(baseURL, getToken) {
    this.baseURL = baseURL
    this.getToken = getToken
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const token = await this.getToken()
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    }
    
    const response = await fetch(url, config)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Error en la petición')
    }
    
    return data
  }
  
  // Métodos específicos
  async getBlogPosts(filters = {}) {
    return this.request('/blog/posts?' + new URLSearchParams(filters))
  }
  
  async getBlogPost(slug) {
    return this.request(`/blog/posts/${slug}`)
  }
  
  async createComment(postSlug, commentData) {
    return this.request(`/blog/${postSlug}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData)
    })
  }
  
  async voteComment(commentId, voteData) {
    return this.request(`/comments/${commentId}/vote`, {
      method: 'POST',
      body: JSON.stringify(voteData)
    })
  }
}

// Uso con Clerk
import { useAuth } from '@clerk/clerk-react'

function useApi() {
  const { getToken } = useAuth()
  return new ApiService(import.meta.env.VITE_API_URL, getToken)
}
```

---

## 🔧 TROUBLESHOOTING

### Problemas Comunes

#### Error 401 - Unauthorized
```javascript
// Verificar que el token esté presente y válido
const token = await getToken()
if (!token) {
  // Redirigir a login o mostrar error
}
```

#### Error 403 - Forbidden
```javascript
// El usuario no tiene permisos suficientes
// Verificar roles y permisos en Clerk Dashboard
```

#### Error 429 - Rate Limit
```javascript
// Implementar retry con backoff
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 1
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
        continue
      }
      return response
    } catch (error) {
      if (i === maxRetries - 1) throw error
    }
  }
}
```

---

*Documentación actualizada: 3 de noviembre de 2025*
*Versión del API: 1.0.0*
*Backend Sprint 4 completado ✅*