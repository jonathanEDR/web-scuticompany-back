import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import serviciosRoutes from './routes/servicios.js';
import webhooksRoutes from './routes/webhooks.js';
import webhooksTestRoutes from './routes/webhooks-test.js';
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
app.use(cors());
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

// Rutas de prueba (después de los middlewares JSON)
app.use('/api/webhooks-test', webhooksTestRoutes);

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
  console.log(`🚀 Servidor Web Scuti corriendo en http://localhost:${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
});
