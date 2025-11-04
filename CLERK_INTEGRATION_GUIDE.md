# 🔐 GUÍA DE AUTENTICACIÓN CON CLERK
*Implementación completa para el frontend*

## 🚀 CONFIGURACIÓN INICIAL

### 1. Instalación
```bash
npm install @clerk/clerk-react
# o
yarn add @clerk/clerk-react
```

### 2. Variables de Entorno (.env)
```env
# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# API Backend
VITE_API_URL=http://localhost:5000/api
```

### 3. Configuración en App.jsx
```javascript
import React from 'react'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPubKey) {
  throw new Error('Missing Publishable Key')
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        {/* Tu aplicación aquí */}
      </BrowserRouter>
    </ClerkProvider>
  )
}

export default App
```

---

## 🎯 COMPONENTES PRINCIPALES

### 1. Layout con Autenticación
```javascript
import { 
  SignedIn, 
  SignedOut, 
  SignInButton, 
  UserButton,
  useUser 
} from '@clerk/clerk-react'

function Layout({ children }) {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return <div className="loading">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Web Scuti Blog</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                    Iniciar Sesión
                  </button>
                </SignInButton>
              </SignedOut>
              
              <SignedIn>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">
                    ¡Hola, {user?.firstName}!
                  </span>
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "h-8 w-8"
                      }
                    }}
                  />
                </div>
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main>
        {children}
      </main>
    </div>
  )
}

export default Layout
```

### 2. Rutas Protegidas
```javascript
import { useAuth } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children, requiredRole = null, requiredPermissions = [] }) {
  const { isLoaded, userId, sessionId, getToken } = useAuth()
  const { user } = useUser()

  if (!isLoaded) {
    return <div>Cargando...</div>
  }

  if (!userId) {
    return <Navigate to="/sign-in" />
  }

  // Verificar roles específicos
  if (requiredRole && user?.publicMetadata?.role !== requiredRole) {
    return <div className="text-red-500">No tienes permisos para acceder a esta página</div>
  }

  // Verificar permisos específicos
  if (requiredPermissions.length > 0) {
    const userPermissions = user?.publicMetadata?.permissions || []
    const hasPermissions = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    )
    
    if (!hasPermissions) {
      return <div className="text-red-500">Permisos insuficientes</div>
    }
  }

  return children
}

// Uso
function AdminDashboard() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div>Panel de Administración</div>
    </ProtectedRoute>
  )
}

function ModerationPanel() {
  return (
    <ProtectedRoute requiredPermissions={['moderate_comments']}>
      <div>Panel de Moderación</div>
    </ProtectedRoute>
  )
}
```

### 3. Hook Personalizado para API
```javascript
import { useAuth } from '@clerk/clerk-react'
import { useState, useCallback } from 'react'

function useApi() {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const apiCall = useCallback(async (endpoint, options = {}) => {
    setLoading(true)
    setError(null)

    try {
      const token = await getToken()
      const baseURL = import.meta.env.VITE_API_URL
      
      const response = await fetch(`${baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        },
        ...options
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}`)
      }

      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [getToken])

  return { apiCall, loading, error }
}

// Uso del hook
function BlogManager() {
  const { apiCall, loading, error } = useApi()
  const [posts, setPosts] = useState([])

  const fetchPosts = async () => {
    try {
      const response = await apiCall('/admin/posts')
      setPosts(response.data.data)
    } catch (err) {
      console.error('Error fetching posts:', err)
    }
  }

  const createPost = async (postData) => {
    try {
      const response = await apiCall('/admin/posts', {
        method: 'POST',
        body: JSON.stringify(postData)
      })
      return response.data
    } catch (err) {
      console.error('Error creating post:', err)
    }
  }

  // ... resto del componente
}
```

---

## 👤 GESTIÓN DE USUARIOS Y ROLES

### 1. Configuración de Metadata en Clerk Dashboard
```javascript
// En el Dashboard de Clerk, configurar Public Metadata para cada usuario:
{
  "role": "admin", // "user", "moderator", "content_manager", "admin"
  "permissions": [
    "create_posts",
    "edit_posts", 
    "moderate_comments",
    "view_analytics"
  ]
}
```

### 2. Hook para Verificar Permisos
```javascript
import { useUser } from '@clerk/clerk-react'

function usePermissions() {
  const { user } = useUser()
  
  const hasRole = (requiredRole) => {
    const userRole = user?.publicMetadata?.role
    const roleHierarchy = {
      'user': 0,
      'moderator': 1, 
      'content_manager': 2,
      'admin': 3
    }
    
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
  }

  const hasPermission = (permission) => {
    const permissions = user?.publicMetadata?.permissions || []
    return permissions.includes(permission)
  }

  const hasAnyPermission = (permissionList) => {
    return permissionList.some(permission => hasPermission(permission))
  }

  const hasAllPermissions = (permissionList) => {
    return permissionList.every(permission => hasPermission(permission))
  }

  return {
    user,
    role: user?.publicMetadata?.role || 'user',
    permissions: user?.publicMetadata?.permissions || [],
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin: hasRole('admin'),
    isModerator: hasRole('moderator'),
    isContentManager: hasRole('content_manager')
  }
}

// Uso
function NavigationMenu() {
  const { hasPermission, isAdmin } = usePermissions()

  return (
    <nav>
      <ul>
        <li><Link to="/">Inicio</Link></li>
        <li><Link to="/blog">Blog</Link></li>
        
        {hasPermission('create_posts') && (
          <li><Link to="/admin/posts/new">Crear Post</Link></li>
        )}
        
        {hasPermission('moderate_comments') && (
          <li><Link to="/admin/moderation">Moderación</Link></li>
        )}
        
        {isAdmin && (
          <li><Link to="/admin/users">Usuarios</Link></li>
        )}
      </ul>
    </nav>
  )
}
```

### 3. Componente de Autorización
```javascript
function CanAccess({ 
  role = null, 
  permissions = [], 
  requireAll = true,
  fallback = null,
  children 
}) {
  const { hasRole, hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions()

  // Verificar role si es requerido
  if (role && !hasRole(role)) {
    return fallback
  }

  // Verificar permisos si son requeridos
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
    
    if (!hasRequiredPermissions) {
      return fallback
    }
  }

  return children
}

// Uso
function BlogPost({ post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
      
      <CanAccess permissions={['edit_posts']}>
        <button>Editar Post</button>
      </CanAccess>
      
      <CanAccess role="admin">
        <button className="text-red-500">Eliminar Post</button>
      </CanAccess>
    </article>
  )
}
```

---

## 🎨 PERSONALIZACIÓN DE UI

### 1. Personalizar Componentes de Clerk
```javascript
import { SignIn, SignUp } from '@clerk/clerk-react'

function CustomSignIn() {
  return (
    <SignIn
      appearance={{
        elements: {
          formButtonPrimary: 
            'bg-blue-500 hover:bg-blue-600 text-sm normal-case',
          card: 'shadow-lg',
          headerTitle: 'text-2xl font-bold text-gray-900',
          headerSubtitle: 'text-gray-600'
        },
        variables: {
          colorPrimary: '#3B82F6',
          colorTextOnPrimaryBackground: '#FFFFFF'
        }
      }}
      redirectUrl="/dashboard"
      signUpUrl="/sign-up"
    />
  )
}

function CustomSignUp() {
  return (
    <SignUp
      appearance={{
        elements: {
          formButtonPrimary: 
            'bg-blue-500 hover:bg-blue-600 text-sm normal-case'
        }
      }}
      redirectUrl="/onboarding"
      signInUrl="/sign-in"
    />
  )
}
```

### 2. Modal de Login Personalizado
```javascript
import { useSignIn } from '@clerk/clerk-react'
import { useState } from 'react'

function CustomLoginModal({ isOpen, onClose }) {
  const { signIn, isLoaded } = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isLoaded) return

    setLoading(true)
    try {
      const result = await signIn.create({
        identifier: email,
        password
      })

      if (result.status === 'complete') {
        onClose()
        // Redirigir o actualizar UI
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Iniciar Sesión</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Iniciar Sesión'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 p-2 rounded-md hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

---

## 🔄 SINCRONIZACIÓN CON BACKEND

### 1. Webhook para Sincronizar Usuarios
```javascript
// En tu backend (ya implementado)
// webhook que sincroniza usuarios de Clerk con tu DB
```

### 2. Hook para Sincronizar Metadata
```javascript
import { useUser } from '@clerk/clerk-react'
import { useEffect } from 'react'

function useUserSync() {
  const { user } = useUser()
  const { apiCall } = useApi()

  useEffect(() => {
    if (user) {
      syncUserData()
    }
  }, [user])

  const syncUserData = async () => {
    try {
      // Obtener datos actuales del usuario desde tu backend
      const response = await apiCall(`/users/${user.id}`)
      const userData = response.data

      // Si hay diferencias, actualizar Clerk metadata
      if (userData.role !== user.publicMetadata?.role) {
        await user.update({
          publicMetadata: {
            role: userData.role,
            permissions: userData.permissions
          }
        })
      }
    } catch (error) {
      console.error('Error syncing user data:', error)
    }
  }

  return { syncUserData }
}
```

### 3. Actualizar Roles desde el Frontend
```javascript
function UserRoleManager({ targetUser }) {
  const { apiCall } = useApi()
  const [newRole, setNewRole] = useState(targetUser.role)

  const updateUserRole = async () => {
    try {
      await apiCall(`/admin/users/${targetUser.id}/role`, {
        method: 'PUT',
        body: JSON.stringify({
          role: newRole,
          permissions: getRolePermissions(newRole)
        })
      })

      // El webhook de Clerk actualizará automáticamente la metadata
      alert('Rol actualizado exitosamente')
    } catch (error) {
      alert('Error al actualizar el rol')
    }
  }

  const getRolePermissions = (role) => {
    const rolePermissions = {
      user: [],
      moderator: ['moderate_comments', 'view_analytics'],
      content_manager: ['create_posts', 'edit_posts', 'moderate_comments'],
      admin: ['create_posts', 'edit_posts', 'delete_posts', 'moderate_comments', 'manage_users', 'view_analytics', 'manage_settings']
    }
    return rolePermissions[role] || []
  }

  return (
    <div>
      <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
        <option value="user">Usuario</option>
        <option value="moderator">Moderador</option>
        <option value="content_manager">Editor</option>
        <option value="admin">Administrador</option>
      </select>
      <button onClick={updateUserRole}>Actualizar Rol</button>
    </div>
  )
}
```

---

## 📱 EXPERIENCIA DE USUARIO

### 1. Estado de Carga
```javascript
function AuthStateHandler({ children }) {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return children
}
```

### 2. Redirección Inteligente
```javascript
import { useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

function useAuthRedirect() {
  const { isSignedIn, isLoaded } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isLoaded) return

    const from = location.state?.from?.pathname || '/dashboard'

    if (isSignedIn && location.pathname === '/sign-in') {
      navigate(from, { replace: true })
    } else if (!isSignedIn && location.pathname.startsWith('/admin')) {
      navigate('/sign-in', { 
        state: { from: location },
        replace: true 
      })
    }
  }, [isSignedIn, isLoaded, navigate, location])
}
```

### 3. Componente de Perfil de Usuario
```javascript
function UserProfile() {
  const { user } = useUser()
  const { role, permissions } = usePermissions()
  const [isEditing, setIsEditing] = useState(false)

  const roleLabels = {
    user: 'Usuario',
    moderator: 'Moderador',
    content_manager: 'Editor de Contenido',
    admin: 'Administrador'
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-4 mb-6">
        <img 
          src={user?.imageUrl} 
          alt="Avatar" 
          className="h-16 w-16 rounded-full"
        />
        <div>
          <h1 className="text-2xl font-bold">
            {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-gray-600">{user?.primaryEmailAddress?.emailAddress}</p>
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
            {roleLabels[role]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Información</h3>
          <p><strong>Rol:</strong> {roleLabels[role]}</p>
          <p><strong>Miembro desde:</strong> {new Date(user?.createdAt).toLocaleDateString()}</p>
          <p><strong>Último acceso:</strong> {new Date(user?.lastSignInAt).toLocaleDateString()}</p>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Permisos</h3>
          <div className="space-y-1">
            {permissions.length > 0 ? (
              permissions.map(permission => (
                <span 
                  key={permission}
                  className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-1"
                >
                  {permission.replace('_', ' ')}
                </span>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Sin permisos especiales</p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-700 mb-3">Acciones</h3>
        <div className="space-x-2">
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Editar Perfil
          </button>
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                rootBox: "inline-block"
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
```

---

## 🔒 SEGURIDAD Y MEJORES PRÁCTICAS

### 1. Validación de Tokens
```javascript
import { useAuth } from '@clerk/clerk-react'

function useSecureApi() {
  const { getToken, isSignedIn } = useAuth()

  const secureApiCall = async (endpoint, options = {}) => {
    if (!isSignedIn) {
      throw new Error('Usuario no autenticado')
    }

    const token = await getToken()
    
    if (!token) {
      throw new Error('No se pudo obtener el token de autenticación')
    }

    // Verificar expiración del token (opcional)
    const tokenPayload = JSON.parse(atob(token.split('.')[1]))
    if (tokenPayload.exp * 1000 < Date.now()) {
      throw new Error('Token expirado')
    }

    return fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
  }

  return { secureApiCall }
}
```

### 2. Rate Limiting del Frontend
```javascript
function useRateLimit(maxRequests = 10, windowMs = 60000) {
  const [requests, setRequests] = useState([])

  const canMakeRequest = () => {
    const now = Date.now()
    const validRequests = requests.filter(time => now - time < windowMs)
    
    if (validRequests.length >= maxRequests) {
      return false
    }

    setRequests([...validRequests, now])
    return true
  }

  return { canMakeRequest }
}
```

### 3. Manejo de Errores de Autenticación
```javascript
function AuthErrorBoundary({ children }) {
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleAuthError = (error) => {
      if (error.code === 'session_token_missing') {
        // Redirigir a login
        window.location.href = '/sign-in'
      } else if (error.code === 'insufficient_permissions') {
        setError('No tienes permisos para realizar esta acción')
      }
    }

    window.addEventListener('clerk-error', handleAuthError)
    return () => window.removeEventListener('clerk-error', handleAuthError)
  }, [])

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    )
  }

  return children
}
```

---

## 🧪 TESTING

### 1. Mock de Clerk para Tests
```javascript
// __mocks__/@clerk/clerk-react.js
export const useAuth = () => ({
  isLoaded: true,
  isSignedIn: true,
  userId: 'test-user-id',
  getToken: jest.fn().mockResolvedValue('mock-token')
})

export const useUser = () => ({
  user: {
    id: 'test-user-id',
    firstName: 'Test',
    lastName: 'User',
    publicMetadata: {
      role: 'admin',
      permissions: ['create_posts', 'moderate_comments']
    }
  },
  isLoaded: true
})

export const SignedIn = ({ children }) => children
export const SignedOut = ({ children }) => null
export const UserButton = () => <div>UserButton</div>
```

### 2. Test de Componente con Autenticación
```javascript
import { render, screen } from '@testing-library/react'
import { ClerkProvider } from '@clerk/clerk-react'
import ProtectedComponent from './ProtectedComponent'

describe('ProtectedComponent', () => {
  test('renders when user has correct permissions', () => {
    render(
      <ClerkProvider publishableKey="pk_test_mock">
        <ProtectedComponent />
      </ClerkProvider>
    )
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
```

---

*Guía actualizada: 3 de noviembre de 2025*
*Compatible con Clerk SDK v4.x*
*Backend Web Scuti API v1.0.0*