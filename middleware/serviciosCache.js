/**
 * 🌐 Middleware de Cache HTTP para Servicios
 * 
 * Implementa headers de cache para optimizar respuestas HTTP de servicios:
 * - Cache-Control
 * - ETag
 * - Last-Modified
 * - Expires
 * 
 * Evita descargas innecesarias cuando el contenido no ha cambiado
 * 
 * @author Web Scuti
 * @version 1.0.0
 */

import crypto from 'crypto';

/**
 * Configuración de cache por tipo de ruta de servicios
 */
const CACHE_CONFIG = {
  'service-list': {
    maxAge: 300,        // 5 minutos
    staleWhileRevalidate: 60,
    public: true
  },
  'service-detail': {
    maxAge: 600,        // 10 minutos
    staleWhileRevalidate: 120,
    public: true
  },
  'featured-services': {
    maxAge: 900,        // 15 minutos
    staleWhileRevalidate: 180,
    public: true
  },
  'service-categories': {
    maxAge: 1800,       // 30 minutos
    staleWhileRevalidate: 300,
    public: true
  },
  'service-packages': {
    maxAge: 600,        // 10 minutos
    staleWhileRevalidate: 120,
    public: true
  },
  'service-stats': {
    maxAge: 1200,       // 20 minutos
    staleWhileRevalidate: 240,
    public: false
  },
  'no-cache': {
    maxAge: 0,
    noCache: true,
    noStore: true,
    mustRevalidate: true
  }
};

/**
 * Generar ETag basado en el contenido
 */
const generateETag = (data) => {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('md5').update(content).digest('hex');
};

/**
 * Construir header Cache-Control
 */
const buildCacheControl = (config) => {
  const directives = [];
  
  if (config.noCache) {
    directives.push('no-cache');
  }
  
  if (config.noStore) {
    directives.push('no-store');
  }
  
  if (config.mustRevalidate) {
    directives.push('must-revalidate');
  }
  
  if (config.public) {
    directives.push('public');
  } else if (config.public === false) {
    directives.push('private');
  }
  
  if (config.maxAge !== undefined) {
    directives.push(`max-age=${config.maxAge}`);
  }
  
  if (config.staleWhileRevalidate) {
    directives.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
  }
  
  return directives.join(', ');
};

/**
 * Middleware base para cache
 */
const createCacheMiddleware = (configKey) => {
  return (req, res, next) => {
    const config = CACHE_CONFIG[configKey];
    
    // Interceptar res.json para aplicar cache headers
    const originalJson = res.json;
    res.json = function(data) {
      // Generar ETag
      const etag = generateETag(data);
      
      // Verificar If-None-Match
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
      }
      
      // Verificar If-Modified-Since (usar timestamp de 1 hora atrás por defecto)
      const lastModified = new Date(Date.now() - (config.maxAge * 1000)).toUTCString();
      if (req.headers['if-modified-since'] && 
          new Date(req.headers['if-modified-since']) >= new Date(lastModified)) {
        return res.status(304).end();
      }
      
      // Aplicar headers de cache
      res.setHeader('Cache-Control', buildCacheControl(config));
      res.setHeader('ETag', etag);
      res.setHeader('Last-Modified', lastModified);
      
      if (config.maxAge > 0) {
        const expires = new Date(Date.now() + (config.maxAge * 1000)).toUTCString();
        res.setHeader('Expires', expires);
      }
      
      // Llamar al método original
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// ============================================
// MIDDLEWARES ESPECÍFICOS
// ============================================

/**
 * Cache para listado público de servicios
 */
export const cachePublicServices = createCacheMiddleware('service-list');

/**
 * Cache para detalle de servicio individual
 */
export const cacheServiceDetail = createCacheMiddleware('service-detail');

/**
 * Cache para servicios destacados
 */
export const cacheFeaturedServices = createCacheMiddleware('featured-services');

/**
 * Cache para categorías de servicios
 */
export const cacheServiceCategories = createCacheMiddleware('service-categories');

/**
 * Cache para paquetes de servicios
 */
export const cacheServicePackages = createCacheMiddleware('service-packages');

/**
 * Cache para estadísticas de servicios
 */
export const cacheServiceStats = createCacheMiddleware('service-stats');

/**
 * Sin cache para rutas administrativas
 */
export const noCache = createCacheMiddleware('no-cache');

/**
 * Middleware para invalidar cache en mutaciones
 */
export const invalidateCacheOnMutation = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Si es una operación exitosa (POST, PUT, DELETE)
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) && res.statusCode < 400) {
      // Añadir headers para invalidar cache del cliente
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      if (import.meta.env?.DEV) {
        console.log(`🗑️ Cache invalidated for ${req.method} ${req.originalUrl}`);
      }
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

export default {
  cachePublicServices,
  cacheServiceDetail,
  cacheFeaturedServices,
  cacheServiceCategories,
  cacheServicePackages,
  cacheServiceStats,
  noCache,
  invalidateCacheOnMutation
};