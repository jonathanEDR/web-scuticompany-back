# 📋 MODELOS Y SCHEMAS - WEB SCUTI BACKEND
*Documentación completa de estructuras de datos*

## 📝 BLOGPOST MODEL

### Schema Completo
```javascript
{
  // Información básica
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 200
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ // Solo letras, números y guiones
  },
  
  content: {
    type: String,
    required: true,
    minlength: 100 // Mínimo 100 caracteres
  },
  
  excerpt: {
    type: String,
    maxlength: 500,
    trim: true
  },
  
  // Metadatos
  readingTime: {
    type: Number, // En minutos
    default: 1
  },
  
  wordCount: {
    type: Number,
    default: 0
  },
  
  // Estado y fechas
  isPublished: {
    type: Boolean,
    default: false
  },
  
  publishedAt: {
    type: Date,
    default: null
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Autor
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Categorización
  categoria: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoria',
    required: true
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 30
  }],
  
  // Imágenes
  featuredImage: {
    type: String, // URL de Cloudinary
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\//.test(v);
      },
      message: 'featuredImage debe ser una URL válida'
    }
  },
  
  images: [{
    url: String,
    alt: String,
    caption: String
  }],
  
  // SEO
  seo: {
    metaTitle: {
      type: String,
      maxlength: 60
    },
    metaDescription: {
      type: String,
      maxlength: 160
    },
    canonicalUrl: String,
    ogImage: String,
    keywords: [String]
  },
  
  // Configuraciones
  allowComments: {
    type: Boolean,
    default: true
  },
  
  isPinned: {
    type: Boolean,
    default: false
  },
  
  // Estadísticas
  views: {
    type: Number,
    default: 0
  },
  
  // Control de versiones
  version: {
    type: Number,
    default: 1
  },
  
  history: [{
    version: Number,
    content: String,
    updatedAt: Date,
    updatedBy: mongoose.Schema.Types.ObjectId
  }]
}
```

### Ejemplo de Documento
```javascript
{
  _id: "507f1f77bcf86cd799439011",
  title: "Introducción al Desarrollo Web Moderno",
  slug: "introduccion-desarrollo-web-moderno",
  content: "# Introducción\n\nEn este artículo vamos a explorar...",
  excerpt: "Una guía completa para comenzar en el desarrollo web moderno con las mejores prácticas y herramientas actuales.",
  readingTime: 8,
  wordCount: 1250,
  isPublished: true,
  publishedAt: "2025-11-03T10:00:00.000Z",
  createdAt: "2025-11-02T15:30:00.000Z",
  updatedAt: "2025-11-03T09:45:00.000Z",
  author: "507f1f77bcf86cd799439013",
  categoria: "507f1f77bcf86cd799439012",
  tags: ["javascript", "html", "css", "tutorial", "principiantes"],
  featuredImage: "https://res.cloudinary.com/tu-cloud/image/upload/v1699000000/blog/web-development.jpg",
  seo: {
    metaTitle: "Desarrollo Web Moderno: Guía Completa 2025",
    metaDescription: "Aprende desarrollo web moderno con JavaScript, HTML5, CSS3 y las mejores prácticas para crear aplicaciones web.",
    canonicalUrl: "https://tu-dominio.com/blog/introduccion-desarrollo-web-moderno",
    keywords: ["desarrollo web", "javascript", "html5", "css3", "tutorial"]
  },
  allowComments: true,
  isPinned: false,
  views: 1247,
  version: 2
}
```

### Validaciones Importantes
- **title**: Obligatorio, entre 5-200 caracteres
- **slug**: Único, solo minúsculas, números y guiones
- **content**: Obligatorio, mínimo 100 caracteres
- **excerpt**: Máximo 500 caracteres
- **tags**: Máximo 30 caracteres cada uno
- **seo.metaTitle**: Máximo 60 caracteres
- **seo.metaDescription**: Máximo 160 caracteres

---

## 💬 BLOGCOMMENT MODEL

### Schema Completo
```javascript
{
  // Contenido
  content: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 5000
  },
  
  // Relaciones
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogPost',
    required: true
  },
  
  author: {
    // Usuario autenticado
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // O usuario invitado
    name: {
      type: String,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Email inválido'
      }
    },
    website: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\//.test(v);
        },
        message: 'Website debe ser una URL válida'
      }
    },
    avatar: String,
    ip: String // IP anonimizada
  },
  
  // Jerarquía (sistema de hilos)
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogComment',
    default: null
  },
  
  level: {
    type: Number,
    default: 0,
    min: 0,
    max: 5 // Máximo 5 niveles de anidación
  },
  
  // Estado y moderación
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'spam', 'hidden'],
    default: 'pending'
  },
  
  moderation: {
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    flags: [{
      type: {
        type: String,
        enum: ['spam', 'inappropriate', 'suspicious', 'links', 'caps', 'profanity']
      },
      confidence: Number,
      description: String
    }],
    moderatedBy: mongoose.Schema.Types.ObjectId,
    moderatedAt: Date,
    reason: String
  },
  
  // Votaciones
  votes: {
    likes: {
      type: Number,
      default: 0
    },
    dislikes: {
      type: Number,
      default: 0
    },
    score: {
      type: Number,
      default: 0 // likes - dislikes
    },
    voters: [{
      userId: mongoose.Schema.Types.ObjectId, // Para usuarios auth
      guestId: String, // Para usuarios invitados
      type: {
        type: String,
        enum: ['like', 'dislike']
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Reportes
  isReported: {
    type: Boolean,
    default: false
  },
  
  reports: [{
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'harassment', 'off_topic', 'other'],
      required: true
    },
    description: String,
    reportedBy: {
      userId: mongoose.Schema.Types.ObjectId,
      email: String,
      ip: String
    },
    reportedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending'
    }
  }],
  
  // Historial de ediciones
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  
  // Fechas
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  editedAt: Date
}
```

### Ejemplo de Documento
```javascript
{
  _id: "507f1f77bcf86cd799439014",
  content: "Excelente artículo! Me ayudó mucho a entender los conceptos básicos.",
  post: "507f1f77bcf86cd799439011",
  author: {
    userId: "507f1f77bcf86cd799439013", // Usuario autenticado
    // O para invitados:
    name: "Juan Pérez",
    email: "juan@email.com",
    website: "https://juanperez.com",
    ip: "192.168.1.xxx" // IP anonimizada
  },
  parentComment: null, // Comentario principal
  level: 0,
  status: "approved",
  moderation: {
    score: 95,
    flags: [],
    moderatedBy: "507f1f77bcf86cd799439015",
    moderatedAt: "2025-11-03T11:00:00.000Z",
    reason: "Content approved after automatic moderation"
  },
  votes: {
    likes: 12,
    dislikes: 1,
    score: 11,
    voters: [
      {
        userId: "507f1f77bcf86cd799439016",
        type: "like",
        votedAt: "2025-11-03T11:15:00.000Z"
      }
    ]
  },
  isReported: false,
  reports: [],
  editHistory: [],
  createdAt: "2025-11-03T10:45:00.000Z",
  updatedAt: "2025-11-03T11:00:00.000Z"
}
```

### Validaciones y Reglas
- **content**: 2-5000 caracteres obligatorio
- **author**: Debe tener userId O (name + email) para invitados
- **level**: Máximo 5 niveles de anidación
- **status**: Solo valores del enum permitidos
- **moderation.score**: Entre 0-100
- **votes**: No permitir votos duplicados por usuario

---

## 📂 CATEGORIA MODEL

### Schema Completo
```javascript
{
  nombre: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
    unique: true
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  },
  
  descripcion: {
    type: String,
    maxlength: 200,
    trim: true
  },
  
  color: {
    type: String,
    match: /^#[0-9A-F]{6}$/i, // Hexadecimal color
    default: '#6B7280'
  },
  
  icono: {
    type: String,
    maxlength: 10, // Para emojis o iconos
    default: '📝'
  },
  
  orden: {
    type: Number,
    default: 0
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  seo: {
    metaTitle: {
      type: String,
      maxlength: 60
    },
    metaDescription: {
      type: String,
      maxlength: 160
    }
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

### Ejemplo de Documento
```javascript
{
  _id: "507f1f77bcf86cd799439012",
  nombre: "Tecnología",
  slug: "tecnologia",
  descripcion: "Artículos sobre desarrollo web, programación y nuevas tecnologías",
  color: "#3B82F6",
  icono: "💻",
  orden: 1,
  isActive: true,
  seo: {
    metaTitle: "Tecnología - Blog Web Scuti",
    metaDescription: "Descubre los últimos avances en tecnología y desarrollo web"
  },
  createdAt: "2025-10-01T00:00:00.000Z",
  updatedAt: "2025-11-01T00:00:00.000Z"
}
```

---

## 👤 USER MODEL (Clerk Integration)

### Campos Sincronizados con Clerk
```javascript
{
  clerkId: {
    type: String,
    required: true,
    unique: true
  },
  
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  
  avatar: {
    type: String // URL de Clerk
  },
  
  // Campos adicionales del sistema
  role: {
    type: String,
    enum: ['user', 'moderator', 'content_manager', 'admin'],
    default: 'user'
  },
  
  permissions: [{
    type: String,
    enum: [
      'create_posts',
      'edit_posts',
      'delete_posts',
      'moderate_comments',
      'manage_users',
      'view_analytics',
      'manage_settings',
      'upload_images'
    ]
  }],
  
  bio: {
    type: String,
    maxlength: 500
  },
  
  website: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\//.test(v);
      }
    }
  },
  
  social: {
    twitter: String,
    linkedin: String,
    github: String
  },
  
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    }
  },
  
  stats: {
    postsCount: {
      type: Number,
      default: 0
    },
    commentsCount: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    }
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastLoginAt: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

### Ejemplo de Usuario
```javascript
{
  _id: "507f1f77bcf86cd799439013",
  clerkId: "user_2abcdefghijklmnop",
  firstName: "Juan",
  lastName: "Pérez",
  email: "juan@email.com",
  avatar: "https://images.clerk.dev/uploaded/img_2abcdefghijklmnop.png",
  role: "content_manager",
  permissions: ["create_posts", "edit_posts", "moderate_comments"],
  bio: "Desarrollador Full Stack especializado en React y Node.js",
  website: "https://juanperez.dev",
  social: {
    twitter: "juanperez_dev",
    github: "juanperez"
  },
  preferences: {
    emailNotifications: true,
    theme: "dark"
  },
  stats: {
    postsCount: 25,
    commentsCount: 150,
    totalViews: 12500
  },
  isActive: true,
  lastLoginAt: "2025-11-03T09:30:00.000Z",
  createdAt: "2025-08-15T00:00:00.000Z",
  updatedAt: "2025-11-03T09:30:00.000Z"
}
```

---

## 🖼️ IMAGE MODEL

### Schema Completo
```javascript
{
  originalName: {
    type: String,
    required: true
  },
  
  filename: {
    type: String,
    required: true
  },
  
  url: {
    type: String,
    required: true
  },
  
  publicId: {
    type: String,
    required: true // Para Cloudinary
  },
  
  format: {
    type: String,
    required: true // jpg, png, webp, etc.
  },
  
  width: {
    type: Number,
    required: true
  },
  
  height: {
    type: Number,
    required: true
  },
  
  size: {
    type: Number, // En bytes
    required: true
  },
  
  category: {
    type: String,
    enum: ['blog', 'avatar', 'general', 'featured'],
    default: 'general'
  },
  
  alt: {
    type: String,
    maxlength: 200
  },
  
  caption: {
    type: String,
    maxlength: 500
  },
  
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  usedIn: [{
    modelType: {
      type: String,
      enum: ['BlogPost', 'Page', 'User']
    },
    modelId: mongoose.Schema.Types.ObjectId,
    field: String // 'featuredImage', 'avatar', etc.
  }],
  
  tags: [String],
  
  metadata: {
    exif: mongoose.Schema.Types.Mixed,
    colors: [String], // Colores dominantes
    faces: Number // Número de caras detectadas
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}
```

---

## 📄 PAGE MODEL (CMS)

### Schema Completo
```javascript
{
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  
  content: {
    type: String,
    required: true
  },
  
  excerpt: {
    type: String,
    maxlength: 300
  },
  
  template: {
    type: String,
    enum: ['default', 'landing', 'contact', 'about'],
    default: 'default'
  },
  
  seo: {
    metaTitle: String,
    metaDescription: String,
    canonicalUrl: String,
    noIndex: {
      type: Boolean,
      default: false
    }
  },
  
  isPublished: {
    type: Boolean,
    default: false
  },
  
  publishedAt: Date,
  
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

---

## 📞 CONTACT MODEL

### Schema Completo
```javascript
{
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  
  phone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  
  company: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'closed'],
    default: 'new'
  },
  
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  replies: [{
    message: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  metadata: {
    ip: String,
    userAgent: String,
    referer: String
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

---

## 🔍 ÍNDICES DE BASE DE DATOS

### Índices Principales
```javascript
// BlogPost
{ slug: 1 } // unique
{ isPublished: 1, publishedAt: -1 }
{ categoria: 1, publishedAt: -1 }
{ author: 1, createdAt: -1 }
{ tags: 1 }
{ 'seo.keywords': 1 }

// BlogComment
{ post: 1, status: 1, createdAt: -1 }
{ post: 1, parentComment: 1 }
{ status: 1, createdAt: -1 }
{ 'author.userId': 1 }
{ isReported: 1, status: 1 }

// Categoria
{ slug: 1 } // unique
{ isActive: 1, orden: 1 }

// User
{ clerkId: 1 } // unique
{ email: 1 } // unique
{ role: 1 }

// Image
{ uploadedBy: 1, createdAt: -1 }
{ category: 1, createdAt: -1 }
{ publicId: 1 } // unique

// Page
{ slug: 1 } // unique
{ isPublished: 1 }

// Contact
{ status: 1, createdAt: -1 }
{ assignedTo: 1, status: 1 }
```

---

## ⚠️ VALIDACIONES IMPORTANTES

### Validaciones de Seguridad
```javascript
// Sanitización de contenido
- HTML tags permitidos en content: h1-h6, p, strong, em, ul, ol, li, a, img, blockquote, code, pre
- XSS protection automático
- URL validation para enlaces y imágenes

// Rate limiting por modelo
- BlogComment: 10 comentarios por hora por IP
- Contact: 5 mensajes por hora por IP
- Image upload: 50MB máximo por archivo

// Restricciones de tamaño
- BlogPost content: Sin límite técnico (MongoDB 16MB doc limit)
- BlogComment content: 5000 caracteres máximo
- Image upload: 10MB máximo por defecto
```

### Hooks de Pre-save
```javascript
// BlogPost
- Auto-generación de slug si no existe
- Cálculo automático de readingTime y wordCount
- Auto-excerpt si no se proporciona
- Validación de fechas publishedAt

// BlogComment
- Moderación automática en pre-save
- Cálculo de level basado en parentComment
- Validación de jerarquía máxima (5 niveles)

// User
- Sincronización automática con Clerk
- Validación de permissions basada en role
```

---

*Documentación actualizada: 3 de noviembre de 2025*
*Modelos basados en Sprint 4 completado ✅*