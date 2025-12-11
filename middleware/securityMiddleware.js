/**
 * 🔒 Middleware Centralizado de Seguridad - Web Scuti
 * ====================================================
 * Gestiona:
 * - Rate limiting por tipo de endpoint
 * - Validación de inputs
 * - CSRF protection
 * - Sanitización
 * - Auditoría
 * 
 * Creado: Diciembre 10, 2024
 * Versión: 1.0
 */

import rateLimit from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import helmet from 'helmet';
import logger from '../utils/logger.js';

// ============================================
// 🚦 RATE LIMITERS
// ============================================

// Configuración base para deshabilitar validación de IPv6 (estamos en un entorno controlado)
const baseRateLimitConfig = {
  validate: false  // Disable all validation warnings - we handle security at infrastructure level
};

/**
 * Rate limiter general para todas las API
 * Permite: 200 requests por 15 minutos por IP (más razonable para SPAs)
 */
export const generalLimiter = rateLimit({
  ...baseRateLimitConfig,
  windowMs: 15 * 60 * 1000,        // 15 minutos
  max: 200,                        // 200 requests por ventana
  message: {
    success: false,
    message: 'Demasiadas peticiones. Intenta en 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 900
  },
  standardHeaders: true,           // Retorna info en RateLimit-* headers
  legacyHeaders: false,
  skip: () => false,               // ✅ NUNCA saltar, ni en desarrollo
  keyGenerator: (req) => {
    // Obtener IP real considerando proxies
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || 'unknown';
  },
  handler: (req, res) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
    // Solo loguear en nivel info, no warn (para reducir ruido en producción)
    if (process.env.NODE_ENV === 'production') {
      // En producción, loguear menos frecuentemente
      console.log(`[RATE_LIMIT] IP: ${ip} - Path: ${req.path}`);
    } else {
      logger.warn(`🚫 Rate limit exceeded for IP: ${ip} - Path: ${req.path}`);
    }
    res.status(429).json({
      success: false,
      message: 'Demasiadas peticiones. Intenta más tarde.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 900
    });
  }
});

/**
 * Rate limiter para desarrollo (más permisivo)
 */
export const devLimiter = rateLimit({
  ...baseRateLimitConfig,
  windowMs: 1 * 60 * 1000,         // 1 minuto
  max: 100,                        // 100 requests/min en dev
  message: {
    success: false,
    message: 'Rate limit alcanzado (modo desarrollo)',
    code: 'DEV_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => false
});

/**
 * Rate limiter ESTRICTO para autenticación
 * Permite: 5 intentos/15 minutos
 */
export const authLimiter = rateLimit({
  ...baseRateLimitConfig,
  windowMs: 15 * 60 * 1000,        // 15 minutos
  max: 5,                          // 5 intentos
  skipSuccessfulRequests: true,    // No contar exitosos
  skipFailedRequests: false,       // Contar todos los fallos
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación. Intenta en 15 minutos.',
    code: 'AUTH_RATE_LIMIT',
    retryAfter: 900
  },
  keyGenerator: (req) => {
    // Usar email si está disponible, sino IP
    return req.body?.email || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  },
  handler: (req, res) => {
    logger.warn(`🔐 Auth rate limit exceeded: ${req.body?.email || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Demasiados intentos de autenticación. Intenta en 15 minutos.',
      code: 'AUTH_RATE_LIMIT',
      retryAfter: 900
    });
  }
});

/**
 * Rate limiter para creación de leads/contactos
 * Permite: 3 registros/minuto por IP
 */
export const contactLimiter = rateLimit({
  ...baseRateLimitConfig,
  windowMs: 1 * 60 * 1000,         // 1 minuto
  max: 3,                          // 3 leads máximo
  message: {
    success: false,
    message: 'Has alcanzado el límite de envíos. Intenta en 1 minuto.',
    code: 'CONTACT_RATE_LIMIT',
    retryAfter: 60
  },
  keyGenerator: (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
  handler: (req, res) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
    logger.warn(`📧 Contact form spam attempt from IP: ${ip}`);
    res.status(429).json({
      success: false,
      message: 'Demasiados envíos. Por favor intenta más tarde.',
      code: 'CONTACT_RATE_LIMIT',
      retryAfter: 60
    });
  }
});

/**
 * Rate limiter para operaciones de escritura
 * Permite: 20 escrituras/5 minutos
 */
export const writeLimiter = rateLimit({
  ...baseRateLimitConfig,
  windowMs: 5 * 60 * 1000,         // 5 minutos
  max: 20,                         // 20 operaciones
  message: {
    success: false,
    message: 'Demasiadas operaciones de escritura. Intenta más tarde.',
    code: 'WRITE_RATE_LIMIT',
    retryAfter: 300
  },
  skip: (req) => req.method === 'GET',  // Solo aplicar a POST/PUT/DELETE
  keyGenerator: (req) => req.user?.id || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip
});

/**
 * Rate limiter para llamadas de IA
 * Permite: 5 calls/minuto por usuario o IP
 * CRÍTICO: Cada call cuesta dinero
 */
export const aiChatLimiter = rateLimit({
  ...baseRateLimitConfig,
  windowMs: 1 * 60 * 1000,         // 1 minuto
  max: 5,                          // 5 calls máximo
  message: {
    success: false,
    message: 'Límite de llamadas al agente alcanzado. Intenta en 1 minuto.',
    code: 'AI_RATE_LIMIT',
    retryAfter: 60
  },
  keyGenerator: (req) => {
    // Por usuario autenticado, sino por IP
    return req.user?.id || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  },
  handler: (req, res) => {
    const identifier = req.user?.id || req.ip;
    logger.warn(`🤖 AI chat rate limit exceeded: ${identifier}`);
    res.status(429).json({
      success: false,
      message: 'Límite de llamadas al agente alcanzado',
      code: 'AI_RATE_LIMIT',
      retryAfter: 60
    });
  }
});

/**
 * Rate limiter para uploads
 * Permite: 10 uploads/hora por usuario
 */
export const uploadLimiter = rateLimit({
  ...baseRateLimitConfig,
  windowMs: 60 * 60 * 1000,        // 1 hora
  max: 10,                         // 10 uploads
  message: {
    success: false,
    message: 'Límite de subidas alcanzado. Intenta en 1 hora.',
    code: 'UPLOAD_RATE_LIMIT',
    retryAfter: 3600
  },
  keyGenerator: (req) => req.user?.id || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip
});

/**
 * Rate limiter para chat público (sin autenticación)
 * MÁS ESTRICTO porque cualquiera puede llamarlo
 */
export const publicChatLimiter = rateLimit({
  ...baseRateLimitConfig,
  windowMs: 10 * 60 * 1000,        // 10 minutos
  max: 15,                         // 15 mensajes cada 10 min
  message: {
    success: false,
    error: '⏱️ Has alcanzado el límite de mensajes. Por favor espera unos minutos.',
    retryAfter: 600
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
  handler: (req, res) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
    logger.warn(`🚫 [PUBLIC CHAT] Rate limit exceeded for IP: ${ip}`);
    res.status(429).json({
      success: false,
      error: '⏱️ Has alcanzado el límite de mensajes. Por favor espera unos minutos.',
      retryAfter: 600
    });
  }
});

// ============================================
// ✅ VALIDADORES DE INPUTS
// ============================================

/**
 * Patrones peligrosos a bloquear (exportado para tests)
 */
export const DANGEROUS_PATTERNS = [
  '<script',
  'javascript:',
  'onerror=',
  'onload=',
  'onclick=',
  'onmouseover=',
  'onfocus=',
  'eval(',
  'setTimeout(',
  'setInterval(',
  'Function(',
  'document.cookie',
  'localStorage',
  'sessionStorage'
];

/**
 * Verificar si un string contiene patrones peligrosos
 */
const containsDangerousPatterns = (value) => {
  if (typeof value !== 'string') return false;
  const lowerValue = value.toLowerCase();
  return DANGEROUS_PATTERNS.some(pattern => lowerValue.includes(pattern.toLowerCase()));
};

/**
 * Objeto con validadores reutilizables
 * Uso: router.post('/endpoint', validators.nombre, ...)
 */
export const validators = {
  // Email
  email: body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Email muy largo'),

  correo: body('correo')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Email muy largo'),

  // Nombre/razón social
  nombre: body('nombre')
    .trim()
    .notEmpty()
    .withMessage('Nombre requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener 2-100 caracteres')
    .matches(/^[a-zA-Z0-9\s\-'áéíóúÁÉÍÓÚñÑüÜ\.]+$/)
    .withMessage('Nombre contiene caracteres inválidos')
    .custom(value => {
      if (containsDangerousPatterns(value)) {
        throw new Error('Nombre contiene patrones no permitidos');
      }
      return true;
    }),

  // Teléfono
  celular: body('celular')
    .optional()
    .trim()
    .matches(/^\+?[0-9\s\-\(\)]{7,20}$/)
    .withMessage('Teléfono inválido (mínimo 7 dígitos)'),

  // Texto descriptivo (mensaje, descripción)
  mensaje: body('mensaje')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Mensaje debe tener 10-5000 caracteres')
    .custom(value => {
      if (containsDangerousPatterns(value)) {
        throw new Error('Mensaje contiene patrones no permitidos');
      }
      return true;
    }),

  descripcion: body('descripcion')
    .optional()
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Descripción debe tener 10-10000 caracteres')
    .custom(value => {
      if (containsDangerousPatterns(value)) {
        throw new Error('Descripción contiene patrones no permitidos');
      }
      return true;
    }),

  // Categoría (enum)
  categoria: body('categoria')
    .optional()
    .trim()
    .isIn([
      'web',
      'app',
      'ecommerce',
      'sistemas',
      'consultoria',
      'diseño',
      'marketing',
      'otro'
    ])
    .withMessage('Categoría inválida'),

  // Número (precio, monto)
  precio: body('precio')
    .optional()
    .isFloat({ min: 0, max: 999999 })
    .withMessage('Precio inválido'),

  // MongoDB ObjectId
  mongoId: param('id')
    .isMongoId()
    .withMessage('ID inválido'),

  // Paginación
  pagination: [
    query('skip')
      .optional()
      .isInt({ min: 0, max: 100000 })
      .toInt()
      .withMessage('Skip inválido'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .toInt()
      .withMessage('Limit inválido (máximo 100)')
  ],

  // Búsqueda
  search: query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Búsqueda debe tener 1-100 caracteres')
    .custom(value => {
      if (containsDangerousPatterns(value)) {
        throw new Error('Búsqueda contiene patrones no permitidos');
      }
      return true;
    }),

  // ============================================
  // 👤 VALIDADORES DE USUARIO
  // ============================================
  
  // ClerkId (siempre viene de Clerk)
  clerkId: body('clerkId')
    .trim()
    .notEmpty()
    .withMessage('ClerkId es requerido')
    .isLength({ min: 10, max: 100 })
    .withMessage('ClerkId inválido')
    .matches(/^user_[a-zA-Z0-9]+$/)
    .withMessage('Formato de ClerkId inválido'),

  // Username
  username: body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username debe tener 3-30 caracteres')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username solo puede contener letras, números, guiones y guiones bajos'),

  // Nombres (firstName, lastName)
  firstName: body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Nombre muy largo (máx 50 caracteres)')
    .custom(value => {
      if (value && containsDangerousPatterns(value)) {
        throw new Error('Nombre contiene patrones no permitidos');
      }
      return true;
    }),

  lastName: body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Apellido muy largo (máx 50 caracteres)')
    .custom(value => {
      if (value && containsDangerousPatterns(value)) {
        throw new Error('Apellido contiene patrones no permitidos');
      }
      return true;
    }),

  // Profile image URL
  profileImage: body('profileImage')
    .optional()
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('URL de imagen inválida'),

  // ============================================
  // 📝 VALIDADORES DE BLOG
  // ============================================

  // Título de post
  blogTitle: body('title')
    .trim()
    .notEmpty()
    .withMessage('Título es requerido')
    .isLength({ min: 5, max: 200 })
    .withMessage('Título debe tener 5-200 caracteres')
    .custom(value => {
      if (containsDangerousPatterns(value)) {
        throw new Error('Título contiene patrones no permitidos');
      }
      return true;
    }),

  // Excerpt/Resumen
  blogExcerpt: body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Resumen muy largo (máx 500 caracteres)')
    .custom(value => {
      if (value && containsDangerousPatterns(value)) {
        throw new Error('Resumen contiene patrones no permitidos');
      }
      return true;
    }),

  // Contenido HTML del blog (permitimos HTML pero sanitizado)
  blogContent: body('content')
    .optional()
    .trim()
    .isLength({ min: 10, max: 100000 })
    .withMessage('Contenido debe tener 10-100000 caracteres')
    .custom(value => {
      // Bloquear scripts pero permitir HTML básico
      if (/<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(value)) {
        throw new Error('Scripts no están permitidos en el contenido');
      }
      if (/javascript:/gi.test(value)) {
        throw new Error('URLs de JavaScript no están permitidas');
      }
      if (/on\w+\s*=/gi.test(value)) {
        throw new Error('Event handlers no están permitidos');
      }
      return true;
    }),

  // Slug de post/categoría
  slug: param('slug')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug inválido (solo minúsculas, números y guiones)'),

  slugBody: body('slug')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug inválido'),

  // ============================================
  // 📄 VALIDADORES DE CMS
  // ============================================

  // Page slug
  pageSlug: param('slug')
    .trim()
    .notEmpty()
    .withMessage('Slug de página requerido')
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug de página inválido'),

  // Contenido CMS (estructura JSON)
  cmsContent: body('content')
    .optional()
    .custom(value => {
      if (!value) return true;
      
      // Verificar que sea un objeto válido
      if (typeof value !== 'object') {
        throw new Error('Contenido CMS debe ser un objeto');
      }
      
      // Verificar tamaño (prevenir payloads gigantes)
      const jsonString = JSON.stringify(value);
      if (jsonString.length > 500000) {  // 500KB max
        throw new Error('Contenido CMS muy grande (máx 500KB)');
      }
      
      // Verificar patrones peligrosos en valores de texto
      const checkObject = (obj, path = '') => {
        for (const key in obj) {
          const fullPath = path ? `${path}.${key}` : key;
          const val = obj[key];
          
          if (typeof val === 'string') {
            if (/<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(val)) {
              throw new Error(`Scripts no permitidos en ${fullPath}`);
            }
            if (/javascript:/gi.test(val)) {
              throw new Error(`JavaScript URLs no permitidos en ${fullPath}`);
            }
          } else if (typeof val === 'object' && val !== null) {
            checkObject(val, fullPath);
          }
        }
      };
      
      checkObject(value);
      return true;
    }),

  // ============================================
  // 📎 VALIDADORES DE UPLOAD
  // ============================================

  // Metadatos de imagen
  imageAlt: body('alt')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Alt text muy largo (máx 255 caracteres)')
    .custom(value => {
      if (value && containsDangerousPatterns(value)) {
        throw new Error('Alt text contiene patrones no permitidos');
      }
      return true;
    }),

  imageTitle: body('title')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Título muy largo (máx 255 caracteres)')
    .custom(value => {
      if (value && containsDangerousPatterns(value)) {
        throw new Error('Título contiene patrones no permitidos');
      }
      return true;
    }),

  imageDescription: body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Descripción muy larga (máx 1000 caracteres)')
    .custom(value => {
      if (value && containsDangerousPatterns(value)) {
        throw new Error('Descripción contiene patrones no permitidos');
      }
      return true;
    }),

  // Tags de imagen (array de strings)
  imageTags: body('tags')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Máximo 20 tags por imagen'),

  // ============================================
  // 🎯 VALIDADORES DE ROLES
  // ============================================

  // Rol de usuario
  userRole: body('role')
    .optional()
    .trim()
    .isIn(['user', 'client', 'editor', 'author', 'admin', 'super_admin'])
    .withMessage('Rol inválido'),

  // userId (MongoDB ObjectId o ClerkId)
  userId: param('userId')
    .trim()
    .notEmpty()
    .withMessage('UserId es requerido')
    .custom(value => {
      // Puede ser MongoDB ObjectId o ClerkId
      const isMongoId = /^[a-f\d]{24}$/i.test(value);
      const isClerkId = /^user_[a-zA-Z0-9]+$/.test(value);
      if (!isMongoId && !isClerkId) {
        throw new Error('UserId inválido');
      }
      return true;
    })
};

// ============================================
// 🔒 MIDDLEWARE DE VALIDACIÓN
// ============================================

/**
 * Middleware que ejecuta validación y maneja errores
 * Debe usarse DESPUÉS de todos los validators
 * ⚠️ IMPORTANTE: Declarado ANTES de los grupos de validadores
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
    logger.warn(`⚠️ Validation failed - Path: ${req.path} - IP: ${ip}`, {
      errors: errors.array().map(e => e.param)
    });

    return res.status(400).json({
      success: false,
      message: 'Validación fallida',
      code: 'VALIDATION_ERROR',
      errors: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg
      }))
    });
  }

  next();
};

// ============================================
// 📦 GRUPOS DE VALIDADORES (Combinaciones comunes)
// ============================================

/**
 * Validación para sincronización de usuario (Clerk -> MongoDB)
 */
export const validateUserSync = [
  validators.clerkId,
  validators.email,
  validators.firstName,
  validators.lastName,
  validators.username,
  validators.profileImage,
  handleValidationErrors
];

/**
 * Validación para creación de contacto/lead
 */
export const validateContactCreation = [
  validators.nombre,
  validators.email,
  validators.correo,
  validators.celular,
  validators.mensaje,
  validators.categoria,
  handleValidationErrors
];

/**
 * Validación para creación/edición de blog post
 */
export const validateBlogPost = [
  validators.blogTitle,
  validators.blogExcerpt,
  validators.blogContent,
  validators.slugBody,
  handleValidationErrors
];

/**
 * Validación para actualización de metadatos de imagen
 */
export const validateImageMetadata = [
  validators.mongoId,
  validators.imageAlt,
  validators.imageTitle,
  validators.imageDescription,
  validators.imageTags,
  handleValidationErrors
];

/**
 * Validación para actualización de rol de usuario
 */
export const validateRoleUpdate = [
  validators.userId,
  validators.userRole,
  handleValidationErrors
];

/**
 * Validación para actualización de contenido CMS
 */
export const validateCmsUpdate = [
  validators.pageSlug,
  validators.cmsContent,
  handleValidationErrors
];

// ============================================
// 🛡️ HELMET CONFIGURATION
// ============================================

/**
 * Configuración de Helmet para security headers
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],  // Necesario para algunas libs
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "https://api.clerk.com",
        "https://api.clerk.dev",
        "https://api.cloudinary.com",
        "https://res.cloudinary.com",
        "wss://*.clerk.accounts.dev"
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      frameSrc: ["'self'", "https://accounts.clerk.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https:"],
      workerSrc: ["'self'", "blob:"]
    }
  },
  crossOriginEmbedderPolicy: false,  // Necesario para cargar recursos externos
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,        // 1 año
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' }
});

// ============================================
// 🔧 UTILIDADES DE SEGURIDAD
// ============================================

/**
 * Campos sensibles a redactar en logs
 */
const SENSITIVE_FIELDS = [
  'password',
  'contraseña',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'creditCard',
  'tarjeta',
  'ssn',
  'clerkId',
  'authorization',
  'cookie'
];

/**
 * Sanitizar datos para logging
 * Redacta campos sensibles antes de loguear
 */
export function sanitizeForLogging(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  try {
    const sanitized = JSON.parse(JSON.stringify(obj));

    const sanitizeObj = (o) => {
      for (const key in o) {
        if (SENSITIVE_FIELDS.some(s => key.toLowerCase().includes(s.toLowerCase()))) {
          o[key] = '***REDACTED***';
        } else if (typeof o[key] === 'object' && o[key] !== null) {
          sanitizeObj(o[key]);
        }
      }
    };

    sanitizeObj(sanitized);
    return sanitized;
  } catch (e) {
    return '[Error sanitizing data]';
  }
}

/**
 * Middleware de auditoría
 * Loguea acciones críticas (POST, PUT, DELETE, PATCH)
 */
export const auditLog = (req, res, next) => {
  // Solo loguear operaciones de escritura
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return next();
  }

  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function (data) {
    const duration = Date.now() - startTime;
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
    
    // Log de auditoría
    logger.info(`📝 [AUDIT] ${req.method} ${req.path}`, {
      timestamp: new Date().toISOString(),
      user: req.user?.id || req.user?.clerkId || 'anonymous',
      ip: ip,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      body: req.body ? sanitizeForLogging(req.body) : null
    });

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware para verificar tamaño de payload ANTES de parsear
 */
export const checkPayloadSize = (maxSizeBytes = 2 * 1024 * 1024) => {
  return (req, res, next) => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
      const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
      logger.warn(`🚫 Payload too large from IP: ${ip} - Size: ${contentLength} bytes`);
      
      return res.status(413).json({
        success: false,
        message: `Payload demasiado grande (máximo ${Math.round(maxSizeBytes / 1024 / 1024)}MB)`,
        code: 'PAYLOAD_TOO_LARGE'
      });
    }
    
    next();
  };
};

/**
 * Middleware para sanitizar query params básicos
 */
export const sanitizeQueryParams = (req, res, next) => {
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        // Detectar patrones peligrosos en query params
        if (containsDangerousPatterns(req.query[key])) {
          const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
          logger.warn(`🚫 Dangerous query param blocked from IP: ${ip} - Param: ${key}`);
          
          return res.status(400).json({
            success: false,
            message: 'Parámetros de búsqueda inválidos',
            code: 'INVALID_QUERY_PARAMS'
          });
        }
      }
    }
  }
  next();
};

// ============================================
// 🚀 INICIALIZACIÓN DE SEGURIDAD GLOBAL
// ============================================

/**
 * Función que aplica todos los middlewares de seguridad
 * Usar en server.js
 *
 * Ejemplo:
 * const app = express();
 * initializeSecurityMiddleware(app);
 */
export function initializeSecurityMiddleware(app) {
  // 1. HELMET.JS - Headers de seguridad (PRIMERO)
  app.use(helmetConfig);

  // 2. Verificar tamaño de payload antes de parsear
  app.use(checkPayloadSize(2 * 1024 * 1024));  // 2MB max

  // 3. Sanitizar query params
  app.use(sanitizeQueryParams);

  // 4. Auditoría de operaciones de escritura
  app.use(auditLog);

  logger.info('🛡️ Security middleware initialized successfully');
}

// ============================================
// 📊 EXPORTS SUMMARY
// ============================================

export default {
  // Rate Limiters
  generalLimiter,
  devLimiter,
  authLimiter,
  contactLimiter,
  writeLimiter,
  aiChatLimiter,
  uploadLimiter,
  publicChatLimiter,
  
  // Individual Validators
  validators,
  handleValidationErrors,
  
  // Validator Groups
  validateUserSync,
  validateContactCreation,
  validateBlogPost,
  validateImageMetadata,
  validateRoleUpdate,
  validateCmsUpdate,
  
  // Security
  helmetConfig,
  auditLog,
  sanitizeForLogging,
  checkPayloadSize,
  sanitizeQueryParams,
  
  // Initializer
  initializeSecurityMiddleware
};
