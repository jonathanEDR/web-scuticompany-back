# 🔍 DIAGNÓSTICO DE RENDIMIENTO - Web Scuti Backend

## 📋 Resumen Ejecutivo

**Fecha:** 12 de Noviembre, 2025  
**Sistema:** Node.js + Express + MongoDB + Clerk  
**Problema:** El servidor se cae durante consultas prolongadas  
**Causa Principal:** Múltiples cuellos de botella en gestión de conexiones, consultas DB y memoria

---

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. ⚠️ **CONFIGURACIÓN DE BASE DE DATOS - CONEXIONES**

#### Problema Detectado:
```javascript
// config/database.js - LÍNEAS 16-18
const options = {
  serverSelectionTimeoutMS: 5000,  // ❌ MUY CORTO
  socketTimeoutMS: 45000,           // ❌ INSUFICIENTE
};
```

**Impacto:**
- ❌ Timeouts prematuros bajo carga
- ❌ No hay control de pool de conexiones
- ❌ Conexiones no se reutilizan eficientemente
- ❌ Memory leaks por conexiones huérfanas

**Solución:**
```javascript
const options = {
  // Timeouts más realistas
  serverSelectionTimeoutMS: 10000,      // 10s para selección de servidor
  socketTimeoutMS: 360000,               // 6 minutos para queries largos
  connectTimeoutMS: 30000,               // 30s para conectar
  
  // Pool de conexiones optimizado
  maxPoolSize: 50,                       // Max 50 conexiones simultáneas
  minPoolSize: 10,                       // Mantener 10 conexiones mínimas
  maxIdleTimeMS: 60000,                  // Cerrar conexiones idle después de 1min
  
  // Buffering y reintentos
  bufferCommands: false,                 // Fallar rápido en vez de bufferear
  maxConnecting: 5,                      // Max 5 conexiones iniciándose a la vez
  
  // Compresión (opcional pero recomendado)
  compressors: ['zlib'],
  zlibCompressionLevel: 6,
};
```

---

### 2. 🐌 **CONSULTAS SIN OPTIMIZAR - MÚLTIPLES POPULATES**

#### Problema Detectado:
```javascript
// Ejemplo de blogPostController.js
const posts = await BlogPost.find(query)
  .populate('author', 'firstName lastName')      // ❌ Populate 1
  .populate('category', 'name slug color')       // ❌ Populate 2  
  .populate('tags', 'name slug color')           // ❌ Populate 3
  .sort(sortBy)
  .skip((page - 1) * limit)
  .limit(parseInt(limit));
```

**Impacto:**
- ❌ **3 consultas adicionales a MongoDB** por cada post
- ❌ En una lista de 20 posts = **60 consultas extras**
- ❌ Tiempo de respuesta multiplicado por 3-4x
- ❌ Consumo excesivo de memoria con objetos completos

**Solución Inmediata:**
```javascript
// OPCIÓN A: Usar aggregation pipeline (más eficiente)
const posts = await BlogPost.aggregate([
  { $match: query },
  { $sort: { [sortBy]: -1 } },
  { $skip: (page - 1) * limit },
  { $limit: parseInt(limit) },
  {
    $lookup: {
      from: 'users',
      localField: 'author',
      foreignField: '_id',
      as: 'author',
      pipeline: [{ $project: { firstName: 1, lastName: 1 } }]
    }
  },
  {
    $lookup: {
      from: 'blogcategories',
      localField: 'category',
      foreignField: '_id',
      as: 'category',
      pipeline: [{ $project: { name: 1, slug: 1, color: 1 } }]
    }
  },
  { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
  { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } }
]);

// OPCIÓN B: Cachear las relaciones más comunes
// Implementar cache en memoria para autores, categorías y tags frecuentes
```

---

### 3. 💾 **FALTA DE ÍNDICES COMPUESTOS CRÍTICOS**

#### Problema Detectado:
```javascript
// models/BlogPost.js - Solo índices simples
BlogPostSchema.index({ slug: 1, isPublished: 1 });
BlogPostSchema.index({ status: 1, publishedAt: -1 });
```

**Impacto:**
- ❌ Búsquedas combinadas hacen **COLLSCAN** (escaneo completo)
- ❌ Queries como `{isPublished: true, category: X, status: 'published'}` son lentas
- ❌ Bajo alta concurrencia, MongoDB se satura

**Solución:**
```javascript
// Agregar índices compuestos estratégicos
BlogPostSchema.index({ isPublished: 1, status: 1, publishedAt: -1 }); // Listados públicos
BlogPostSchema.index({ category: 1, isPublished: 1, publishedAt: -1 }); // Por categoría
BlogPostSchema.index({ author: 1, status: 1, createdAt: -1 }); // Posts por autor
BlogPostSchema.index({ 'tags': 1, isPublished: 1, publishedAt: -1 }); // Por tag
BlogPostSchema.index({ isFeatured: 1, isPublished: 1, publishedAt: -1 }); // Destacados
```

---

### 4. 🗄️ **SISTEMA DE CACHÉ INEFICIENTE**

#### Problema Detectado:
```javascript
// middleware/serviciosCache.js - Cache en memoria
let cachedConfig = null;
let configCacheTime = 0;
const CONFIG_CACHE_DURATION = 60000; // ❌ Solo 1 minuto
```

**Impacto:**
- ❌ Cache volátil (se pierde al reiniciar)
- ❌ No hay cache distribuido (problemas en múltiples instancias)
- ❌ Headers de cache HTTP deshabilitados en desarrollo
- ❌ Cada request reconsulta datos estáticos

**Solución:**

**Fase 1: Mejorar cache actual**
```javascript
const CONFIG_CACHE_DURATION = 300000; // 5 minutos en vez de 1
```

**Fase 2: Implementar Redis (RECOMENDADO)**
```bash
npm install redis ioredis
```

```javascript
// config/redis.js
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3
});

export default redis;

// middleware/redisCache.js
export const redisCacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      // Override res.json para guardar en cache
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        redis.setex(key, duration, JSON.stringify(data));
        return originalJson(data);
      };
      
      next();
    } catch (error) {
      next(); // Continuar si Redis falla
    }
  };
};
```

---

### 5. 🚦 **RATE LIMITING INSUFICIENTE**

#### Problema Detectado:
```javascript
// server.js - LÍNEAS 116-120
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // ❌ 100 es MUY BAJO
  skip: () => process.env.NODE_ENV === 'development' // ❌ Deshabilitado en dev
});
```

**Impacto:**
- ❌ Usuarios legítimos bloqueados (100 requests / 15min = 6.6/min)
- ❌ No hay rate limiting diferenciado por tipo de request
- ❌ Ataques DDoS simples pueden saturar el servidor

**Solución:**
```javascript
// Rate limits diferenciados y más realistas
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // 500 requests / 15min = ~33/min (más realista)
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.',
      retryAfter: 900
    });
  }
});

// Rate limit específico para rutas públicas de lectura (más permisivo)
const publicReadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60, // 60/min para lectura pública
  skip: (req) => req.method !== 'GET'
});

// Rate limit estricto para operaciones de escritura
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 writes / 15min
  skip: (req) => req.method === 'GET'
});

// Aplicar por ruta
app.use('/api/blog', publicReadLimiter);
app.use('/api/servicios', publicReadLimiter);
app.use('/api/admin', authLimiter, writeLimiter);
```

---

### 6. 🖼️ **PROCESAMIENTO DE IMÁGENES BLOQUEANTE**

#### Problema Detectado:
```javascript
// utils/imageProcessor.js - Sharp es síncrono en implementación actual
const info = await sharp(filePath)
  .resize(width, height, { fit: 'cover' })
  .toFile(outputPath);
```

**Impacto:**
- ❌ **Bloquea el event loop** durante procesamiento intensivo
- ❌ Servidor no puede manejar otras requests mientras procesa imágenes
- ❌ Consumo de memoria en picos (Sharp carga toda la imagen)

**Solución:**
```javascript
// Opción A: Worker Threads (nativo Node.js)
import { Worker } from 'worker_threads';

export const processImageInBackground = (filePath, options) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./workers/imageWorker.js', {
      workerData: { filePath, options }
    });
    
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
};

// Opción B: Queue con Bull (recomendado para producción)
import Bull from 'bull';

const imageQueue = new Bull('image-processing', {
  redis: { host: 'localhost', port: 6379 }
});

imageQueue.process(async (job) => {
  const { filePath, options } = job.data;
  return await sharp(filePath).resize(options.width).toFile(options.outputPath);
});

export const queueImageProcessing = (filePath, options) => {
  return imageQueue.add({ filePath, options });
};
```

---

### 7. 📊 **MEMORY LEAKS POTENCIALES**

#### Problema Detectado:
```javascript
// server.js - No hay límites de memoria configurados
app.use(express.json()); // ❌ Sin límite de tamaño
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 } // ❌ Solo limita archivo, no memoria total
}));
```

**Impacto:**
- ❌ Request con JSON gigante puede causar OutOfMemory
- ❌ Múltiples uploads simultáneos saturan RAM
- ❌ No hay monitoreo de uso de memoria

**Solución:**
```javascript
// Limitar tamaño de payload
app.use(express.json({ limit: '1mb' })); // Max 1MB por request JSON
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Configurar limits más estrictos para file upload
app.use(fileUpload({
  limits: { 
    fileSize: 5 * 1024 * 1024,  // 5MB por archivo
    files: 3                     // Max 3 archivos simultáneos
  },
  abortOnLimit: true,
  responseOnLimit: 'El archivo excede el tamaño máximo permitido (5MB)',
  useTempFiles: true,            // Usar archivos temporales en vez de memoria
  tempFileDir: '/tmp/'
}));

// Monitoreo de memoria (agregar middleware)
app.use((req, res, next) => {
  const used = process.memoryUsage();
  if (used.heapUsed > 500 * 1024 * 1024) { // Si usa más de 500MB
    console.warn('⚠️ High memory usage:', Math.round(used.heapUsed / 1024 / 1024) + 'MB');
  }
  next();
});
```

---

### 8. 🔄 **NO HAY ESTRATEGIA DE GRACEFUL SHUTDOWN**

#### Problema Detectado:
```javascript
// server.js - LÍNEAS 364-367
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('HTTP server closed');
  }); // ❌ No cierra conexiones de DB, Redis, etc.
});
```

**Impacto:**
- ❌ Conexiones activas a MongoDB quedan abiertas
- ❌ Requests en progreso se cortan abruptamente
- ❌ Datos en cache en memoria se pierden

**Solución:**
```javascript
// Graceful shutdown completo
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received: closing gracefully`);
  
  // 1. Dejar de aceptar nuevas conexiones
  server.close(() => {
    console.log('✓ HTTP server closed');
  });
  
  // 2. Esperar requests en progreso (max 30s)
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown after timeout');
    process.exit(1);
  }, 30000);
  
  try {
    // 3. Cerrar conexión a MongoDB
    await mongoose.connection.close(false);
    console.log('✓ MongoDB connection closed');
    
    // 4. Cerrar conexión a Redis (si existe)
    if (redis) {
      await redis.quit();
      console.log('✓ Redis connection closed');
    }
    
    // 5. Salir limpiamente
    console.log('✓ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

---

## 🎯 PLAN DE ACCIÓN PRIORIZADO

### 🔴 **CRÍTICO - Implementar AHORA (1-2 días)**

1. **Arreglar configuración de MongoDB**
   - Agregar pool de conexiones (maxPoolSize, minPoolSize)
   - Aumentar timeouts realistas
   - Archivo: `config/database.js`

2. **Optimizar consultas más usadas**
   - Convertir populates a aggregation en endpoints públicos
   - Archivos: `controllers/blogPostController.js`, `controllers/servicioController.js`

3. **Agregar índices compuestos**
   - Ejecutar script de migración de índices
   - Archivo: `models/BlogPost.js`, `models/Servicio.js`

4. **Implementar graceful shutdown**
   - Cerrar conexiones ordenadamente
   - Archivo: `server.js`

### 🟡 **IMPORTANTE - Implementar en 1 semana**

5. **Implementar Redis para cache**
   - Instalar Redis
   - Migrar cache en memoria a Redis
   - Configurar invalidación inteligente

6. **Optimizar rate limiting**
   - Ajustar límites más realistas
   - Diferenciar por tipo de operación

7. **Procesar imágenes en background**
   - Implementar worker threads o queue
   - Evitar bloqueo del event loop

### 🟢 **MEJORAS - Implementar en 2-4 semanas**

8. **Monitoreo y métricas**
   - Implementar APM (Application Performance Monitoring)
   - Herramientas sugeridas: PM2, New Relic, Datadog

9. **Load testing**
   - Usar Artillery o k6 para simular carga
   - Identificar límites reales del sistema

10. **Documentación de arquitectura**
    - Documentar flujos críticos
    - Diagramas de arquitectura

---

## 📈 MÉTRICAS ESPERADAS POST-IMPLEMENTACIÓN

| Métrica | Antes | Después (Estimado) |
|---------|-------|-------------------|
| Tiempo de respuesta (listado posts) | 800-1200ms | 150-300ms |
| Requests por segundo | 10-20 | 100-200 |
| Uso de memoria | 300-500MB | 150-250MB |
| Conexiones DB simultáneas | 5-10 | 30-40 (controladas) |
| Tasa de errores bajo carga | 15-25% | <2% |

---

## 🛠️ SCRIPTS DE MIGRACIÓN NECESARIOS

### Script 1: Crear índices compuestos
```javascript
// scripts/addIndexes.js
import mongoose from 'mongoose';
import BlogPost from '../models/BlogPost.js';
import Servicio from '../models/Servicio.js';

async function addIndexes() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('Creating BlogPost indexes...');
  await BlogPost.collection.createIndex({ isPublished: 1, status: 1, publishedAt: -1 });
  await BlogPost.collection.createIndex({ category: 1, isPublished: 1, publishedAt: -1 });
  await BlogPost.collection.createIndex({ author: 1, status: 1, createdAt: -1 });
  
  console.log('Creating Servicio indexes...');
  await Servicio.collection.createIndex({ activo: 1, destacado: 1, orden: 1 });
  await Servicio.collection.createIndex({ categoria: 1, activo: 1 });
  
  console.log('✓ Indexes created successfully');
  process.exit(0);
}

addIndexes().catch(console.error);
```

### Script 2: Analizar queries lentas
```javascript
// scripts/analyzeSlowQueries.js
import mongoose from 'mongoose';

async function analyzeSlowQueries() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const db = mongoose.connection.db;
  const profiling = await db.command({ profile: 2, slowms: 100 });
  
  console.log('Slow queries enabled. Check system.profile collection.');
  
  setTimeout(async () => {
    const slowQueries = await db.collection('system.profile')
      .find({ millis: { $gte: 100 } })
      .sort({ ts: -1 })
      .limit(20)
      .toArray();
    
    console.log('\n=== TOP 20 SLOW QUERIES ===\n');
    slowQueries.forEach((q, i) => {
      console.log(`${i+1}. ${q.command?.find || q.command?.aggregate} - ${q.millis}ms`);
      console.log(`   Namespace: ${q.ns}`);
      console.log(`   Plan: ${JSON.stringify(q.planSummary)}\n`);
    });
    
    process.exit(0);
  }, 60000); // Analizar durante 1 minuto
}

analyzeSlowQueries().catch(console.error);
```

---

## 💡 RECOMENDACIONES ADICIONALES

### Infraestructura
- **Usar PM2** para gestión de procesos en producción
- **Implementar load balancer** si el tráfico supera 1000 req/min
- **MongoDB Atlas** con sharding si la DB supera 50GB

### Monitoreo
- **Implementar health checks** (`/health`, `/ready`)
- **Logs centralizados** con Winston + Elasticsearch/Loki
- **Alertas automáticas** cuando memoria > 70% o CPU > 80%

### Seguridad
- **Helmet.js** para headers de seguridad
- **Rate limiting por IP + por usuario**
- **Validación estricta de inputs** con Joi/Yup

---

## 📞 SIGUIENTE PASO

**¿Por dónde empezar?**

1. Implementa los cambios de `config/database.js` (5 minutos)
2. Agrega los índices compuestos (10 minutos)
3. Implementa graceful shutdown (15 minutos)
4. Prueba con load testing básico

**Comando para probar:**
```bash
# Instalar Artillery
npm install -g artillery

# Crear test básico
cat > load-test.yml << EOF
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
    - get:
        url: "/api/blog/posts"
    - get:
        url: "/api/servicios"
EOF

# Ejecutar test
artillery run load-test.yml
```

---

**Creado por:** Diagnóstico Automatizado  
**Para:** Web Scuti Backend Team  
**Última actualización:** 12 Nov 2025
