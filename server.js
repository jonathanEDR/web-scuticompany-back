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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
dotenv.config();

// Conectar a la base de datos
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// IMPORTANTE: Webhooks deben ir ANTES de los middlewares de JSON
// porque necesitan el raw body para verificar la firma
app.use('/api/webhooks', webhooksRoutes);

// Middlewares
// CORS configurado para permitir solo frontend específico
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
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

// Rutas
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 API Web Scuti funcionando correctamente',
    version: '1.0.0',
    status: 'OK'
  });
});

// Ruta principal para el "Hola Mundo"
app.get('/api/hello', (req, res) => {
  res.json({ 
    message: '¡Hola Mundo desde Web Scuti! 🌟',
    timestamp: new Date().toISOString(),
    backend: 'Node.js + Express',
    status: 'success'
  });
});

// Ruta para obtener información de la empresa
app.get('/api/info', (req, res) => {
  res.json({
    empresa: 'Web Scuti',
    descripcion: 'Plataforma web empresarial con SEO optimizado',
    tecnologias: {
      backend: 'Node.js + Express + MongoDB',
      frontend: 'React + Vite + Tailwind CSS'
    },
    database: 'MongoDB'
  });
});

// Rutas de la API
app.use('/api/servicios', serviciosRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/upload', uploadRoutes);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.path 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
