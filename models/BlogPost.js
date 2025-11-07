import mongoose from 'mongoose';

const BlogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    maxlength: [200, 'El título no puede exceder 200 caracteres']
  },
  slug: {
    type: String,
    required: true,
    unique: true, // Ya crea índice automáticamente
    lowercase: true,
    trim: true
  },
  excerpt: {
    type: String,
    required: [true, 'El extracto es requerido'],
    trim: true,
    maxlength: [300, 'El extracto no puede exceder 300 caracteres']
  },
  content: {
    type: String,
    required: [true, 'El contenido es requerido']
  },
  contentFormat: {
    type: String,
    enum: ['html', 'markdown'],
    default: 'html'
  },
  // ✅ SIMPLIFICADO: featuredImage como STRING (igual que Media Library)
  featuredImage: {
    type: String,
    default: ''
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogCategory',
    required: true,
    index: true
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogTag'
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  publishedAt: {
    type: Date,
    default: null,
    index: true
  },
  scheduledPublishAt: {
    type: Date,
    default: null
  },
  // SEO Metadata
  seo: {
    metaTitle: {
      type: String,
      maxlength: [60, 'El meta título no puede exceder 60 caracteres']
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'La meta descripción no puede exceder 160 caracteres']
    },
    keywords: [{
      type: String,
      trim: true
    }],
    // Open Graph
    ogTitle: {
      type: String,
      maxlength: [60, 'El título OG no puede exceder 60 caracteres']
    },
    ogDescription: {
      type: String,
      maxlength: [160, 'La descripción OG no puede exceder 160 caracteres']
    },
    ogImage: {
      type: String
    },
    ogType: {
      type: String,
      default: 'article'
    },
    // Twitter Card
    twitterCard: {
      type: String,
      enum: ['summary', 'summary_large_image', 'app', 'player'],
      default: 'summary_large_image'
    },
    twitterTitle: {
      type: String,
      maxlength: [60, 'El título de Twitter no puede exceder 60 caracteres']
    },
    twitterDescription: {
      type: String,
      maxlength: [160, 'La descripción de Twitter no puede exceder 160 caracteres']
    },
    twitterImage: {
      type: String
    },
    // Otros
    canonicalUrl: {
      type: String
    },
    robots: {
      type: String,
      default: 'index, follow'
    },
    // Schema.org JSON-LD
    schema: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  // Optimización para IA (SGE - Search Generative Experience)
  aiOptimization: {
    // Resumen TL;DR
    tldr: {
      type: String,
      maxlength: [200, 'El TL;DR no puede exceder 200 caracteres']
    },
    // Puntos clave
    keyPoints: [{
      type: String,
      maxlength: [150, 'Cada punto clave no puede exceder 150 caracteres']
    }],
    // FAQ Items
    faqItems: [{
      question: {
        type: String,
        required: true,
        maxlength: [200, 'La pregunta no puede exceder 200 caracteres']
      },
      answer: {
        type: String,
        required: true,
        maxlength: [500, 'La respuesta no puede exceder 500 caracteres']
      }
    }],
    // Entidades mencionadas
    entities: [{
      name: String,
      type: {
        type: String,
        enum: ['Person', 'Organization', 'Product', 'Event', 'Place', 'Concept']
      },
      description: String
    }],
    // Comparaciones o tablas de datos
    comparisons: [{
      criteria: String,
      options: [String]
    }],
    
    // ========== CAMPOS NUEVOS - SPRINT 3 ==========
    
    // Metadata AI extendida
    aiMetadata: {
      primaryKeywords: [String],
      secondaryKeywords: [String],
      detectedTopics: [String],
      targetAudience: {
        primary: String,
        secondary: [String],
        characteristics: [String]
      },
      expertiseLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert']
      },
      contentFormat: {
        type: String,
        enum: ['tutorial', 'guide', 'article', 'reference', 'opinion', 'news']
      },
      tone: {
        type: String,
        enum: ['formal', 'professional', 'casual', 'technical']
      }
    },
    
    // Análisis semántico
    semanticAnalysis: {
      keywords: [{
        word: String,
        frequency: Number,
        relevance: Number
      }],
      entities: {
        technologies: [String],
        concepts: [String]
      },
      topics: [{
        name: String,
        weight: Number,
        confidence: Number
      }],
      readabilityScore: Number,
      sentimentScore: Number
    },
    
    // Formato conversacional (para LLMs)
    conversationalData: {
      summary: String,
      keyTakeaways: [String],
      answersQuestions: [{
        question: String,
        confidence: String,
        type: String
      }]
    },
    
    // Content Score
    contentScore: {
      total: Number,
      seo: Number,
      readability: Number,
      structure: Number,
      engagement: Number,
      grade: String,
      lastCalculated: Date
    },
    
    // Marca de optimización AI
    isAIOptimized: {
      type: Boolean,
      default: false
    },
    aiOptimizedAt: Date,
    
    // Score SEO calculado
    seoScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  // Métricas y Analytics
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    uniqueVisitors: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    shares: {
      facebook: { type: Number, default: 0 },
      twitter: { type: Number, default: 0 },
      linkedin: { type: Number, default: 0 },
      whatsapp: { type: Number, default: 0 }
    },
    avgTimeOnPage: {
      type: Number,
      default: 0 // en segundos
    },
    bounceRate: {
      type: Number,
      default: 0 // porcentaje
    }
  },
  readingTime: {
    type: Number, // en minutos
    default: 0
  },
  // Configuración
  isPublished: {
    type: Boolean,
    default: false,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  commentCount: {
    type: Number,
    default: 0
  },
  // Interacciones de usuarios
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  bookmarkedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// ========================================
// ÍNDICES
// ========================================

// Índice de texto completo para búsqueda
BlogPostSchema.index({ 
  title: 'text', 
  excerpt: 'text', 
  content: 'text',
  'seo.keywords': 'text'
}, {
  weights: {
    title: 10,
    excerpt: 5,
    'seo.keywords': 3,
    content: 1
  }
});

// Índices compuestos para consultas frecuentes
BlogPostSchema.index({ status: 1, publishedAt: -1 });
BlogPostSchema.index({ isPublished: 1, publishedAt: -1 });
BlogPostSchema.index({ category: 1, isPublished: 1, publishedAt: -1 });
BlogPostSchema.index({ author: 1, status: 1, publishedAt: -1 });
BlogPostSchema.index({ isFeatured: 1, isPublished: 1, publishedAt: -1 });
BlogPostSchema.index({ 'analytics.views': -1 });

// ========================================
// VIRTUALS
// ========================================

BlogPostSchema.virtual('url').get(function() {
  return `/blog/${this.slug}`;
});

BlogPostSchema.virtual('isScheduled').get(function() {
  return this.scheduledPublishAt && this.scheduledPublishAt > new Date() && this.status === 'draft';
});

// ========================================
// MÉTODOS DE INSTANCIA
// ========================================

// Publicar post
BlogPostSchema.methods.publish = async function() {
  this.status = 'published';
  this.isPublished = true;
  this.publishedAt = this.publishedAt || new Date();
  await this.save();
  
  // Incrementar contador de posts en categoría
  await this.model('BlogCategory').findByIdAndUpdate(
    this.category,
    { $inc: { postCount: 1 } }
  );
  
  // Incrementar contador en tags
  if (this.tags && this.tags.length > 0) {
    await this.model('BlogTag').updateMany(
      { _id: { $in: this.tags } },
      { $inc: { usageCount: 1 } }
    );
  }
};

// Despublicar post
BlogPostSchema.methods.unpublish = async function() {
  const wasPublished = this.isPublished;
  
  this.status = 'draft';
  this.isPublished = false;
  await this.save();
  
  // Decrementar contador si estaba publicado
  if (wasPublished) {
    await this.model('BlogCategory').findByIdAndUpdate(
      this.category,
      { $inc: { postCount: -1 } }
    );
    
    if (this.tags && this.tags.length > 0) {
      await this.model('BlogTag').updateMany(
        { _id: { $in: this.tags } },
        { $inc: { usageCount: -1 } }
      );
    }
  }
};

// Archivar post
BlogPostSchema.methods.archive = async function() {
  const wasPublished = this.isPublished;
  
  this.status = 'archived';
  this.isPublished = false;
  await this.save();
  
  if (wasPublished) {
    await this.model('BlogCategory').findByIdAndUpdate(
      this.category,
      { $inc: { postCount: -1 } }
    );
    
    if (this.tags && this.tags.length > 0) {
      await this.model('BlogTag').updateMany(
        { _id: { $in: this.tags } },
        { $inc: { usageCount: -1 } }
      );
    }
  }
};

// Incrementar vistas
BlogPostSchema.methods.incrementViews = async function() {
  this.analytics.views += 1;
  await this.save();
};

// Dar like
BlogPostSchema.methods.toggleLike = async function(userId) {
  const index = this.likedBy.indexOf(userId);
  
  if (index === -1) {
    // Agregar like
    this.likedBy.push(userId);
    this.analytics.likes += 1;
  } else {
    // Quitar like
    this.likedBy.splice(index, 1);
    this.analytics.likes -= 1;
  }
  
  await this.save();
  return index === -1; // true si se agregó, false si se quitó
};

// Guardar/Quitar bookmark
BlogPostSchema.methods.toggleBookmark = async function(userId) {
  const index = this.bookmarkedBy.indexOf(userId);
  
  if (index === -1) {
    this.bookmarkedBy.push(userId);
  } else {
    this.bookmarkedBy.splice(index, 1);
  }
  
  await this.save();
  return index === -1;
};

// ========================================
// MÉTODOS ESTÁTICOS
// ========================================

// Obtener posts publicados con paginación
BlogPostSchema.statics.getPublishedPosts = async function(options = {}) {
  const {
    page = 1,
    limit = 10,
    category = null,
    tag = null,
    author = null,
    featured = null,
    sortBy = '-publishedAt'
  } = options;
  
  const query = { isPublished: true, status: 'published' };
  
  if (category) query.category = category;
  if (tag) query.tags = tag;
  if (author) query.author = author;
  if (featured !== null) query.isFeatured = featured;
  
  const posts = await this.find(query)
    .populate('author', 'firstName lastName email')
    .populate('category', 'name slug color')
    .populate('tags', 'name slug color')
    .sort(sortBy)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  
  const total = await this.countDocuments(query);
  
  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Obtener posts relacionados
BlogPostSchema.statics.getRelatedPosts = async function(postId, limit = 3) {
  const post = await this.findById(postId);
  
  if (!post) return [];
  
  return await this.find({
    _id: { $ne: postId },
    isPublished: true,
    status: 'published',
    $or: [
      { category: post.category },
      { tags: { $in: post.tags } }
    ]
  })
    .populate('author', 'firstName lastName')
    .populate('category', 'name slug color')
    .sort({ 'analytics.views': -1, publishedAt: -1 })
    .limit(limit)
    .lean();
};

// Obtener posts más populares
BlogPostSchema.statics.getPopularPosts = async function(limit = 5, days = 30) {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);
  
  return await this.find({
    isPublished: true,
    status: 'published',
    publishedAt: { $gte: dateLimit }
  })
    .populate('author', 'firstName lastName')
    .populate('category', 'name slug color')
    .sort({ 'analytics.views': -1, 'analytics.likes': -1 })
    .limit(limit)
    .lean();
};

// Búsqueda de texto completo
BlogPostSchema.statics.searchPosts = async function(searchTerm, options = {}) {
  const { page = 1, limit = 10 } = options;
  
  const posts = await this.find(
    {
      $text: { $search: searchTerm },
      isPublished: true,
      status: 'published'
    },
    { score: { $meta: 'textScore' } }
  )
    .populate('author', 'firstName lastName')
    .populate('category', 'name slug color')
    .populate('tags', 'name slug')
    .sort({ score: { $meta: 'textScore' } })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  
  const total = await this.countDocuments({
    $text: { $search: searchTerm },
    isPublished: true,
    status: 'published'
  });
  
  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// ========================================
// MIDDLEWARE
// ========================================

// Pre-save: Generar datos SEO automáticos si no existen
BlogPostSchema.pre('save', function(next) {
  // Auto-generar meta title si no existe
  if (!this.seo.metaTitle) {
    this.seo.metaTitle = this.title.substring(0, 60);
  }
  
  // Auto-generar meta description si no existe
  if (!this.seo.metaDescription) {
    this.seo.metaDescription = this.excerpt.substring(0, 160);
  }
  
  // Auto-generar Open Graph si no existe
  if (!this.seo.ogTitle) {
    this.seo.ogTitle = this.seo.metaTitle;
  }
  if (!this.seo.ogDescription) {
    this.seo.ogDescription = this.seo.metaDescription;
  }
  if (!this.seo.ogImage && this.featuredImage.url) {
    this.seo.ogImage = this.featuredImage.url;
  }
  
  // Auto-generar Twitter Card si no existe
  if (!this.seo.twitterTitle) {
    this.seo.twitterTitle = this.seo.metaTitle;
  }
  if (!this.seo.twitterDescription) {
    this.seo.twitterDescription = this.seo.metaDescription;
  }
  if (!this.seo.twitterImage && this.featuredImage.url) {
    this.seo.twitterImage = this.featuredImage.url;
  }
  
  next();
});

// Configurar toJSON para incluir virtuals
BlogPostSchema.set('toJSON', { virtuals: true });
BlogPostSchema.set('toObject', { virtuals: true });

const BlogPost = mongoose.model('BlogPost', BlogPostSchema);

export default BlogPost;
