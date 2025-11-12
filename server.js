import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import serviciosRoutes from './routes/servicios.js';
import paquetesRoutes from './routes/paquetes.js';
import webhooksRoutes from './routes/webhooks.js';
import usersRoutes from './routes/users.js';
import cmsRoutes from './routes/cms.js';
import uploadRoutes from './routes/upload.js';
import adminRoutes from './routes/admin.js';
import demoRoutes from './routes/demo.js';
import crmRoutes from './routes/crm.js';
import contactRoutes from './routes/contact.js';
import categoriasRoutes from './routes/categorias.js';
import clientRoutes from './routes/client.js';
import blogRoutes from './routes/blog.js';
import commentsRoutes from './routes/comments.js';
import profileRoutes from './routes/profile.js';
import userBlogRoutes from './routes/userBlog.js';
import agentsRoutes from './routes/agents.js';
import agentTestingRoutes from './routes/agentTesting.js';
import aiAnalyticsRoutes from './routes/ai/analytics.js';
import { cmsLogger } from './middleware/logger.js';
import { initializeDatabase, checkDatabaseHealth } from './utils/dbInitializer.js';
import { inicializarCategorias } from './utils/categoriaInitializer.js';
import { inicializarPlantillasMensajes } from './utils/messageInitializer.js';
import { initializeCacheConfig } from './utils/cacheInitializer.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ========================================
// 🚀 INICIALIZACIÓN SECUENCIAL
// ========================================
// IMPORTANTE: No iniciar servidor hasta que DB esté lista
let isDbReady = false;

// Función de inicialización asíncrona
async function initializeServer() {
  try {
    logger.startup('Iniciando Web Scuti Backend Server');
    
    // 1. Conectar a MongoDB PRIMERO
    await connectDB();
    logger.success('Conexión a MongoDB establecida');
    
    // 2. Inicializar datos base de datos
    await initializeDatabase();
    await inicializarCategorias();
    await inicializarPlantillasMensajes();
    await initializeCacheConfig();
    
    // 3. Marcar DB como lista
    isDbReady = true;
    logger.success('✅ Base de datos y configuraciones inicializadas');
    
  } catch (err) {
    logger.error('❌ Error durante inicialización:', err);
    process.exit(1); // Salir si no puede inicializar
  }
}

// Iniciar proceso de inicialización
initializeServer();

// IMPORTANTE: Webhooks deben ir ANTES de los middlewares de JSON
// porque necesitan el raw body para verificar la firma
app.use('/api/webhooks', webhooksRoutes);

// Middlewares
// CORS configurado para permitir frontend específico con fallbacks seguros
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'https://web-scuticompany.vercel.app',
      'https://web-scuti.vercel.app'
    ];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como apps móviles o curl)
    if (!origin) return callback(null, true);

    // Verificar si el origin está en la lista permitida
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } 
    // En desarrollo, ser más permisivo con localhost
    else if (process.env.NODE_ENV === 'development' && origin && 
             (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      callback(null, true);
    }
    // Verificar patrones de dominios de producción conocidos
    else if (origin && (
      origin.includes('web-scuti') || 
      origin.includes('scuticompany') || 
      origin.includes('vercel.app') ||
      origin.includes('netlify.app')
    )) {
      callback(null, true);
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`⚠️  CORS blocked request from origin: ${origin}`);
      }
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// ========================================
// 🚦 RATE LIMITING OPTIMIZADO
// ========================================

// Rate Limiting General - Para todas las rutas API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // 500 requests / 15min = ~33/min (más realista que 100)
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP. Intenta de nuevo en 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development', // Deshabilitar en desarrollo
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Demasiadas peticiones. Intenta de nuevo más tarde.',
      retryAfter: 900
    });
  }
});

// Rate Limiting para Autenticación (más estricto)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 intentos / 15min (aumentado de 20)
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación. Intenta más tarde.',
    code: 'AUTH_RATE_LIMIT'
  },
  skipSuccessfulRequests: true, // No contar requests exitosos
  skip: () => process.env.NODE_ENV === 'development'
});

// Rate Limiting para Lectura Pública (muy permisivo)
const publicReadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 60, // 60 requests/min para lectura pública
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method !== 'GET' || process.env.NODE_ENV === 'development'
});

// Rate Limiting para Escritura (más restrictivo)
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 writes / 15min
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET' || process.env.NODE_ENV === 'development'
});

// Aplicar rate limiting general solo en producción
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', (req, res, next) => {
    // Skip rate limiting para rutas de agent (tienen su propio limiter)
    if (req.path.includes('/agent/') || req.path.includes('/agents')) {
      return next();
    }
    limiter(req, res, next);
  });
}

// ========================================
// 🛡️ MIDDLEWARE DE SEGURIDAD Y LÍMITES
// ========================================

// Limitar tamaño de payload JSON (previene ataques de memoria)
app.use(express.json({ 
  limit: '2mb', // Max 2MB por request JSON
  strict: true
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '2mb' 
}));

// Middleware para subir archivos (configuración mejorada)
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 5 * 1024 * 1024,  // 5MB por archivo
    files: 5                     // Max 5 archivos simultáneos
  },
  abortOnLimit: true,
  responseOnLimit: 'El archivo excede el tamaño máximo permitido (5MB)',
  useTempFiles: true,            // Usar archivos temporales en vez de memoria
  tempFileDir: '/tmp/',
  safeFileNames: true,           // Sanitizar nombres de archivo
  preserveExtension: true
}));

// ========================================
// 📊 MONITOREO DE MEMORIA (Middleware)
// ========================================
app.use((req, res, next) => {
  const used = process.memoryUsage();
  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  
  // Advertencia si el uso de memoria es alto
  if (heapUsedMB > 400) {
    logger.warn(`⚠️ High memory usage: ${heapUsedMB}MB`);
  }
  
  // Rechazar requests si la memoria está crítica (>500MB)
  if (heapUsedMB > 500) {
    logger.error(`🚨 Critical memory usage: ${heapUsedMB}MB - Rejecting request`);
    return res.status(503).json({
      success: false,
      message: 'Servidor temporalmente sobrecargado. Intenta de nuevo en unos momentos.',
      code: 'MEMORY_OVERLOAD'
    });
  }
  
  next();
});

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware de logging para CMS (debe ir antes de las rutas)
app.use(cmsLogger);

// Rutas
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 API Web Scuti funcionando correctamente',
    version: '1.0.0',
    status: 'OK'
  });
});

// Simple health check (sin db check para rapidez)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const { checkDatabaseHealth } = await import('./utils/dbInitializer.js');
    const dbHealth = await checkDatabaseHealth();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
});

// Endpoint mejorado para el dashboard
app.get('/api/dashboard-status', async (req, res) => {
  const startTime = Date.now();
  
  try {
    logger.debug('Procesando request de dashboard status');
    
    const dbHealth = await checkDatabaseHealth();
    
    // Información del servidor
    const serverInfo = {
      status: 'Conectado exitosamente ✅',
      message: '🚀 Backend funcionando correctamente',
      database: {
        connected: dbHealth.healthy,
        host: process.env.MONGODB_URI ? 'MongoDB Atlas' : 'localhost',
        name: 'web-scuti',
        status: dbHealth.healthy ? 'Conectado ✅' : 'Desconectado ❌'
      },
      server: {
        port: process.env.PORT || 5000,
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString()
      }
    };

    logger.api('GET', '/api/dashboard-status', 200, Date.now() - startTime);
    
    res.json({
      success: true,
      data: serverInfo
    });
  } catch (error) {
    logger.error('Error en endpoint dashboard-status', error);
    logger.api('GET', '/api/dashboard-status', 500, Date.now() - startTime);
    
    res.status(500).json({
      success: false,
      message: '❌ Error de conexión',
      error: error.message
    });
  }
});

// Endpoint para información del proyecto
app.get('/api/project-info', async (req, res) => {
  const startTime = Date.now();
  
  try {
    logger.debug('Procesando request de project info');
    
    const Page = (await import('./models/Page.js')).default;
    
    // Obtener información de las páginas
    const pages = await Page.find({}).select('pageSlug pageName isPublished lastUpdated updatedBy');
    const homePage = pages.find(p => p.pageSlug === 'home');
    
    logger.database('QUERY', 'pages', { found: pages.length });
    
    const projectInfo = {
      empresa: 'Scuti Company',
      descripcion: 'Plataforma de gestión de contenido con auto-inicialización',
      status: 'Sistema funcionando correctamente ✅',
      database: {
        totalPages: pages.length,
        pages: pages.map(p => ({
          slug: p.pageSlug,
          name: p.pageName,
          published: p.isPublished,
          lastUpdate: p.lastUpdated,
          updatedBy: p.updatedBy
        }))
      },
      currentPage: homePage ? {
        name: homePage.pageName,
        lastUpdate: homePage.lastUpdated,
        updatedBy: homePage.updatedBy,
        status: homePage.isPublished ? 'Publicada ✅' : 'Borrador 📝'
      } : null,
      tecnologias: {
        backend: 'Node.js + Express + MongoDB',
        frontend: 'React + TypeScript + Vite',
        database: 'MongoDB con auto-inicialización',
        auth: 'Clerk Authentication'
      },
      features: [
        'Auto-inicialización de base de datos',
        'Sistema de monitoreo integrado',
        'CMS Manager para edición',
        'Logging detallado',
        'Health checks automáticos'
      ],
      timestamp: new Date().toISOString()
    };

    logger.api('GET', '/api/project-info', 200, Date.now() - startTime);
    
    res.json({
      success: true,
      data: projectInfo
    });
  } catch (error) {
    logger.error('Error al obtener información del proyecto', error);
    logger.api('GET', '/api/project-info', 500, Date.now() - startTime);
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener información del proyecto',
      error: error.message
    });
  }
});

// Rutas de la API
app.use('/api/servicios', serviciosRoutes);
app.use('/api/paquetes', paquetesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/crm', crmRoutes); // 💼 CRM Routes
app.use('/api/contact', contactRoutes); // 📧 Contact Routes (público + admin)
app.use('/api/categorias', categoriasRoutes); // 📁 Categorías Routes
app.use('/api/client', clientRoutes); // 🎉 Client Onboarding Routes
app.use('/api/blog', blogRoutes); // 📝 Blog Routes (Sprint 1)
app.use('/api', commentsRoutes); // 💬 Comments & Moderation Routes (Sprint 4)
app.use('/api/profile', profileRoutes); // 👤 Profile Routes (Social System)
app.use('/api/user-blog', userBlogRoutes); // 📚 User Blog Activity Routes (Dashboard)
app.use('/api/agents', agentsRoutes); // 🤖 AI Agents System Routes (NEW)
app.use('/api/ai', aiAnalyticsRoutes); // 📊 AI Analytics & Tracking Routes (NEW)
app.use('/api/agents/testing', agentTestingRoutes); // 🧪 Advanced AI Testing Suite (NEW)

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.path 
  });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message
  });
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.startup(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  logger.startup(`API available at: http://localhost:${PORT}/api`);
  logger.success('Web Scuti Backend Server iniciado correctamente');
});

// ========================================
// 🛡️ GRACEFUL SHUTDOWN MEJORADO
// ========================================
const gracefulShutdown = async (signal) => {
  console.log(`\n📡 ${signal} received: iniciando cierre gracioso del servidor...`);
  
  // 1. Dejar de aceptar nuevas conexiones
  server.close(() => {
    console.log('✓ HTTP server cerrado - no acepta nuevas conexiones');
  });
  
  // 2. Timeout de seguridad (forzar cierre después de 30s)
  const forceShutdownTimeout = setTimeout(() => {
    console.error('⚠️ Forzando cierre después de timeout (30s)');
    process.exit(1);
  }, 30000);
  
  try {
    // 3. Cerrar conexión a MongoDB
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close(false);
      console.log('✓ Conexión a MongoDB cerrada correctamente');
    }
    
    // 4. Cerrar otras conexiones (Redis, etc.) cuando se implementen
    // TODO: Agregar cierre de Redis cuando se implemente
    // if (redis && redis.status === 'ready') {
    //   await redis.quit();
    //   console.log('✓ Conexión a Redis cerrada correctamente');
    // }
    
    // 5. Limpiar timeout y salir limpiamente
    clearTimeout(forceShutdownTimeout);
    console.log('✅ Graceful shutdown completado exitosamente');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error durante graceful shutdown:', error);
    clearTimeout(forceShutdownTimeout);
    process.exit(1);
  }
};

// Manejar señales de terminación
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});
