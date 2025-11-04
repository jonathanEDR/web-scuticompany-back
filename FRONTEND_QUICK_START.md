# 🚀 GUÍA DE INICIO RÁPIDO - FRONTEND
*Todo lo necesario para comenzar con el desarrollo frontend*

## ⚡ CONFIGURACIÓN INICIAL (5 minutos)

### 1. Variables de Entorno (.env)
```env
# API Backend
VITE_API_URL=http://localhost:5000/api

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Opcional - Para desarrollo
VITE_ENVIRONMENT=development
VITE_DEBUG=true
```

### 2. Dependencias Mínimas
```bash
npm install @clerk/clerk-react axios react-router-dom
```

### 3. Configuración Base App.jsx
```javascript
import React from 'react'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import BlogList from './pages/BlogList'
import BlogPost from './pages/BlogPost'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ClerkProvider>
  )
}

export default App
```

---

## 📡 SERVICIO DE API (apiService.js)

### Implementación Completa
```javascript
import axios from 'axios'

class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Interceptor para agregar token automáticamente
    this.client.interceptors.request.use((config) => {
      const token = this.getStoredToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Interceptor para manejar errores
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado o inválido
          this.clearToken()
          window.location.href = '/sign-in'
        }
        return Promise.reject(error.response?.data || error.message)
      }
    )
  }

  setToken(token) {
    localStorage.setItem('auth_token', token)
  }

  getStoredToken() {
    return localStorage.getItem('auth_token')
  }

  clearToken() {
    localStorage.removeItem('auth_token')
  }

  // ==========================================
  // MÉTODOS DEL BLOG
  // ==========================================

  // Obtener lista de posts
  async getBlogPosts(filters = {}) {
    const params = new URLSearchParams(filters).toString()
    return this.client.get(`/blog/posts?${params}`)
  }

  // Obtener post individual
  async getBlogPost(slug) {
    return this.client.get(`/blog/posts/${slug}`)
  }

  // Obtener categorías
  async getCategories() {
    return this.client.get('/blog/categorias')
  }

  // ==========================================
  // COMENTARIOS
  // ==========================================

  // Obtener comentarios de un post
  async getComments(postSlug, options = {}) {
    const params = new URLSearchParams({
      page: 1,
      limit: 20,
      includeReplies: true,
      ...options
    }).toString()
    return this.client.get(`/blog/${postSlug}/comments?${params}`)
  }

  // Crear comentario
  async createComment(postSlug, commentData) {
    return this.client.post(`/blog/${postSlug}/comments`, commentData)
  }

  // Votar comentario
  async voteComment(commentId, voteType, guestId = null) {
    return this.client.post(`/comments/${commentId}/vote`, {
      type: voteType, // 'like', 'dislike', 'remove'
      guestId
    })
  }

  // Reportar comentario
  async reportComment(commentId, reason, description = '') {
    return this.client.post(`/comments/${commentId}/report`, {
      reason,
      description,
      reporterEmail: 'anonymous@example.com' // Para usuarios no auth
    })
  }

  // ==========================================
  // ADMINISTRACIÓN (Requiere Auth)
  // ==========================================

  // Gestión de posts
  async getAdminPosts(filters = {}) {
    const params = new URLSearchParams(filters).toString()
    return this.client.get(`/admin/posts?${params}`)
  }

  async createPost(postData) {
    return this.client.post('/admin/posts', postData)
  }

  async updatePost(postId, postData) {
    return this.client.put(`/admin/posts/${postId}`, postData)
  }

  async deletePost(postId) {
    return this.client.delete(`/admin/posts/${postId}`)
  }

  // Moderación de comentarios
  async getModerationQueue(filters = {}) {
    const params = new URLSearchParams({
      status: 'pending',
      page: 1,
      limit: 50,
      ...filters
    }).toString()
    return this.client.get(`/admin/comments/moderation/queue?${params}`)
  }

  async moderateComment(commentId, action, reason = '') {
    return this.client.put(`/admin/comments/${commentId}/moderate`, {
      action, // 'approve', 'reject', 'spam', 'hide'
      reason,
      notifyUser: true
    })
  }

  // Subir imagen
  async uploadImage(file, category = 'general') {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('category', category)

    return this.client.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  // ==========================================
  // CONTACTO
  // ==========================================

  async sendContactMessage(messageData) {
    return this.client.post('/contact', messageData)
  }
}

// Instancia única
const apiService = new ApiService()
export default apiService
```

---

## 🎯 HOOKS PERSONALIZADOS

### 1. Hook para Blog Posts
```javascript
import { useState, useEffect } from 'react'
import apiService from '../services/apiService'

export function useBlogPosts(filters = {}) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(null)

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.getBlogPosts(filters)
      setPosts(response.data.data)
      setPagination(response.data.pagination)
    } catch (err) {
      setError(err.message || 'Error al cargar los posts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [JSON.stringify(filters)])

  const refetch = () => fetchPosts()

  return { 
    posts, 
    loading, 
    error, 
    pagination, 
    refetch 
  }
}

// Uso
function BlogList() {
  const { posts, loading, error, pagination } = useBlogPosts({
    categoria: 'tecnologia',
    limit: 9,
    page: 1
  })

  if (loading) return <div>Cargando posts...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map(post => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  )
}
```

### 2. Hook para Comentarios
```javascript
import { useState, useEffect } from 'react'
import apiService from '../services/apiService'

export function useComments(postSlug) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(null)

  const fetchComments = async () => {
    if (!postSlug) return

    try {
      setLoading(true)
      const response = await apiService.getComments(postSlug)
      setComments(response.data.data)
      setPagination(response.data.pagination)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [postSlug])

  const addComment = async (commentData) => {
    try {
      const response = await apiService.createComment(postSlug, commentData)
      await fetchComments() // Recargar comentarios
      return response.data
    } catch (err) {
      throw new Error(err.message || 'Error al crear comentario')
    }
  }

  const voteComment = async (commentId, voteType) => {
    try {
      await apiService.voteComment(commentId, voteType)
      await fetchComments() // Recargar para ver los votos actualizados
    } catch (err) {
      throw new Error(err.message || 'Error al votar')
    }
  }

  return {
    comments,
    loading,
    error,
    pagination,
    addComment,
    voteComment,
    refetch: fetchComments
  }
}
```

### 3. Hook para Autenticación con Clerk
```javascript
import { useAuth, useUser } from '@clerk/clerk-react'
import { useEffect } from 'react'
import apiService from '../services/apiService'

export function useAuthSetup() {
  const { getToken, isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()

  useEffect(() => {
    if (isSignedIn && isLoaded) {
      // Configurar token en el servicio API
      const setupToken = async () => {
        const token = await getToken()
        apiService.setToken(token)
      }
      setupToken()
    } else {
      // Limpiar token si no está autenticado
      apiService.clearToken()
    }
  }, [isSignedIn, isLoaded, getToken])

  const hasPermission = (permission) => {
    return user?.publicMetadata?.permissions?.includes(permission) || false
  }

  const hasRole = (role) => {
    return user?.publicMetadata?.role === role
  }

  return {
    user,
    isSignedIn,
    isLoaded,
    hasPermission,
    hasRole,
    isAdmin: hasRole('admin'),
    isModerator: hasRole('moderator') || hasRole('admin'),
    isContentManager: hasRole('content_manager') || hasRole('admin')
  }
}
```

---

## 🎨 COMPONENTES PRINCIPALES

### 1. BlogCard Component
```javascript
import { Link } from 'react-router-dom'

function BlogCard({ post }) {
  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {post.featuredImage && (
        <img 
          src={post.featuredImage} 
          alt={post.title}
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-3">
          <span 
            className="px-2 py-1 text-xs rounded-full text-white"
            style={{ backgroundColor: post.categoria.color }}
          >
            {post.categoria.nombre}
          </span>
          <span className="text-gray-500 text-sm">
            {new Date(post.publishedAt).toLocaleDateString()}
          </span>
        </div>

        <h2 className="text-xl font-semibold mb-3 line-clamp-2">
          <Link 
            to={`/blog/${post.slug}`}
            className="hover:text-blue-600 transition-colors"
          >
            {post.title}
          </Link>
        </h2>

        <p className="text-gray-600 mb-4 line-clamp-3">
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={post.author.avatar} 
              alt={post.author.firstName}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm text-gray-700">
              {post.author.firstName} {post.author.lastName}
            </span>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>{post.readingTime} min</span>
            <span>{post.stats.views} vistas</span>
            <span>{post.stats.commentsCount} comentarios</span>
          </div>
        </div>
      </div>
    </article>
  )
}

export default BlogCard
```

### 2. CommentForm Component
```javascript
import { useState } from 'react'
import { useAuthSetup } from '../hooks/useAuthSetup'

function CommentForm({ postSlug, onCommentAdded, parentComment = null }) {
  const { isSignedIn, user } = useAuthSetup()
  const [formData, setFormData] = useState({
    content: '',
    name: '',
    email: '',
    website: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const commentData = {
        content: formData.content,
        parentComment,
        ...(isSignedIn ? {} : {
          name: formData.name,
          email: formData.email,
          website: formData.website
        })
      }

      await apiService.createComment(postSlug, commentData)
      
      // Limpiar form y notificar
      setFormData({ content: '', name: '', email: '', website: '' })
      onCommentAdded?.()
      
    } catch (err) {
      setError(err.message || 'Error al enviar comentario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Escribe tu comentario..."
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="4"
          required
        />
      </div>

      {!isSignedIn && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Tu nombre"
            className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Tu email"
            className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="url"
            value={formData.website}
            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
            placeholder="Tu sitio web (opcional)"
            className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 md:col-span-2"
          />
        </div>
      )}

      <div className="flex justify-between items-center">
        {isSignedIn ? (
          <div className="flex items-center space-x-3">
            <img 
              src={user?.imageUrl} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm text-gray-700">
              Comentando como {user?.firstName}
            </span>
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            Los comentarios están sujetos a moderación
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !formData.content.trim()}
          className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enviando...' : 'Enviar Comentario'}
        </button>
      </div>
    </form>
  )
}

export default CommentForm
```

### 3. CommentsList Component
```javascript
import { useState } from 'react'
import CommentItem from './CommentItem'

function CommentsList({ comments, onVote, onReply }) {
  const [sortBy, setSortBy] = useState('newest') // 'newest', 'oldest', 'popular'

  const sortedComments = [...comments].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt)
      case 'popular':
        return b.votes.score - a.votes.score
      case 'newest':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt)
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Comentarios ({comments.length})
        </h3>
        
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-3 py-1"
        >
          <option value="newest">Más recientes</option>
          <option value="oldest">Más antiguos</option>
          <option value="popular">Más populares</option>
        </select>
      </div>

      <div className="space-y-4">
        {sortedComments.map(comment => (
          <CommentItem
            key={comment._id}
            comment={comment}
            onVote={onVote}
            onReply={onReply}
          />
        ))}
      </div>
    </div>
  )
}

export default CommentsList
```

---

## 📱 PÁGINAS PRINCIPALES

### 1. BlogPost Page
```javascript
import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useComments } from '../hooks/useComments'
import CommentForm from '../components/CommentForm'
import CommentsList from '../components/CommentsList'
import apiService from '../services/apiService'

function BlogPost() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const { 
    comments, 
    loading: commentsLoading, 
    addComment, 
    voteComment,
    refetch: refetchComments 
  } = useComments(slug)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await apiService.getBlogPost(slug)
        setPost(response.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [slug])

  const handleCommentAdded = () => {
    refetchComments()
  }

  const handleVote = async (commentId, voteType) => {
    try {
      await voteComment(commentId, voteType)
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div>Cargando post...</div>
  if (error) return <div>Error: {error}</div>
  if (!post) return <div>Post no encontrado</div>

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* Header del post */}
      <header className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <span 
            className="px-3 py-1 text-sm rounded-full text-white"
            style={{ backgroundColor: post.categoria.color }}
          >
            {post.categoria.nombre}
          </span>
          <span className="text-gray-500">
            {new Date(post.publishedAt).toLocaleDateString()}
          </span>
          <span className="text-gray-500">
            {post.readingTime} min de lectura
          </span>
        </div>

        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        
        <div className="flex items-center space-x-4">
          <img 
            src={post.author.avatar} 
            alt={post.author.firstName}
            className="w-12 h-12 rounded-full"
          />
          <div>
            <p className="font-semibold">
              {post.author.firstName} {post.author.lastName}
            </p>
            <p className="text-gray-600 text-sm">
              {post.stats.views} vistas • {post.stats.commentsCount} comentarios
            </p>
          </div>
        </div>
      </header>

      {/* Imagen destacada */}
      {post.featuredImage && (
        <img 
          src={post.featuredImage} 
          alt={post.title}
          className="w-full h-64 md:h-96 object-cover rounded-lg mb-8"
        />
      )}

      {/* Contenido */}
      <div 
        className="prose prose-lg max-w-none mb-12"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <span 
                key={tag}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sección de comentarios */}
      {post.allowComments ? (
        <section className="border-t pt-8">
          <CommentForm 
            postSlug={slug} 
            onCommentAdded={handleCommentAdded}
          />
          
          <div className="mt-8">
            {commentsLoading ? (
              <div>Cargando comentarios...</div>
            ) : (
              <CommentsList 
                comments={comments}
                onVote={handleVote}
              />
            )}
          </div>
        </section>
      ) : (
        <div className="border-t pt-8 text-center text-gray-500">
          Los comentarios están deshabilitados para este post
        </div>
      )}
    </article>
  )
}

export default BlogPost
```

### 2. Admin Dashboard
```javascript
import { useAuthSetup } from '../hooks/useAuthSetup'
import { Navigate } from 'react-router-dom'

function AdminDashboard() {
  const { isLoaded, isSignedIn, hasPermission } = useAuthSetup()

  if (!isLoaded) return <div>Cargando...</div>
  if (!isSignedIn) return <Navigate to="/sign-in" />
  if (!hasPermission('view_analytics')) {
    return <div>No tienes permisos para acceder al panel administrativo</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Panel de Administración
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Posts" value="45" />
          <StatCard title="Comentarios Pendientes" value="12" />
          <StatCard title="Usuarios Activos" value="1,234" />
          <StatCard title="Vistas del Mes" value="15,678" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

export default AdminDashboard
```

---

## 🌐 CONFIGURACIÓN DE CORS Y PRODUCCIÓN

### Variables de Entorno por Ambiente
```env
# .env.development
VITE_API_URL=http://localhost:5000/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_development_key

# .env.production
VITE_API_URL=https://api.tu-dominio.com/api
VITE_CLERK_PUBLISHABLE_KEY=pk_live_production_key
```

### Configuración de Build
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

---

## 🚀 COMANDOS DE DESARROLLO

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Lint y format
npm run lint
npm run format
```

---

## 📚 RECURSOS ADICIONALES

### Documentación Relacionada
- 📖 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Todos los endpoints
- 📋 [MODELS_DOCUMENTATION.md](./MODELS_DOCUMENTATION.md) - Estructuras de datos
- 🔐 [CLERK_INTEGRATION_GUIDE.md](./CLERK_INTEGRATION_GUIDE.md) - Autenticación detallada

### Testing Recomendado
```bash
# Testing libraries
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

### Estado Global (Opcional)
```bash
# Para manejo de estado complejo
npm install zustand
# o
npm install @reduxjs/toolkit react-redux
```

---

*¡Listo para crear un frontend increíble! 🎉*
*Documentación actualizada: 3 de noviembre de 2025*