import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import serviciosRoutes from './routes/servicios.js';
import webhooksRoutes from './routes/webhooks.js';
import usersRoutes from './routes/users.js';
import cmsRoutes from './routes/cms.js';
import uploadRoutes from './routes/upload.js';
import adminRoutes from './routes/admin.js';
import demoRoutes from './routes/demo.js';
import { cmsLogger } from './middleware/logger.js';
import { initializeDatabase, checkDatabaseHealth } from './utils/dbInitializer.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
dotenv.config();

// Conectar a la base de datos e inicializar
logger.startup('Iniciando Web Scuti Backend Server');

connectDB().then(() => {
  logger.success('Conexión a MongoDB establecida');
  // Inicializar páginas por defecto si no existen
  initializeDatabase();
}).catch(err => {
  logger.error('Error al conectar a la base de datos', err);
});

const app = express();
const PORT = process.env.PORT || 5000;

// IMPORTANTE: Webhooks deben ir ANTES de los middlewares de JSON
// porque necesitan el raw body para verificar la firma
app.use('/api/webhooks', webhooksRoutes);

// Middlewares
// CORS configurado para permitir solo frontend específico
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173'];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como apps móviles o curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Rate Limiting - Limitar requests por IP
// Más permisivo en desarrollo para evitar bloqueos
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 en dev, 100 en prod
  message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development' // Deshabilitar en desarrollo
});

// Rate limiting más estricto para rutas de autenticación y upload
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 500, // 500 en dev, 20 en prod
  message: 'Demasiados intentos, por favor intenta más tarde.',
  skip: () => process.env.NODE_ENV === 'development' // Deshabilitar en desarrollo
});

// Aplicar rate limiting general (deshabilitado en desarrollo)
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', limiter);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para subir archivos
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  abortOnLimit: true
}));

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
app.use('/api/users', usersRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/demo', demoRoutes);

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

// Manejo de cierre gracioso
process.on('SIGTERM', () => {
  logger.warn('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
