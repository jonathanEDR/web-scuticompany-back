import express from 'express';
import {
  getServicios,
  getServicio,
  createServicio,
  updateServicio,
  deleteServicio,
  getServiciosDestacados,
  buscarServicios,
  getServiciosPorCategoria,
  duplicarServicio,
  cambiarEstado,
  cambiarEstadoMasivo,
  softDeleteServicio,
  restaurarServicio,
  getTopServicios
} from '../controllers/servicioController.js';

import {
  getPaquetes,
  createPaquete,
  getPaqueteMasPopular
} from '../controllers/paqueteController.js';

import {
  getDashboard,
  getEstadisticas,
  getEstadisticasVentas,
  getMetricasConversion,
  getEstadisticasPaquetes
} from '../controllers/servicioStatsController.js';

// Importar ServicesAgent controller
import {
  chatWithServicesAgent,
  createServiceWithAgent,
  editServiceWithAgent,
  analyzeServiceWithAgent,
  generateContentWithAgent, // 🆕
  analyzePortfolio,
  suggestPricing,
  analyzePricing,
  optimizePackagesPricing,
  getAgentMetrics,
  getAgentStatus
} from '../controllers/servicesAgentController.js';

// ✅ Middlewares de cache HTTP para servicios
import {
  cachePublicServices,
  cacheServiceDetail,
  cacheFeaturedServices,
  cacheServiceCategories,
  cacheServicePackages,
  cacheServiceStats,
  noCache,
  invalidateCacheOnMutation
} from '../middleware/serviciosCache.js';

// Importar middlewares de autenticación y autorización
import { requireAuth } from '../middleware/clerkAuth.js';
import {
  requireUser,
  requireModerator,
  canViewServicesStats,
  canCreateServices,
  canManageServices,
  canEditService,
  canDeleteService,
  canDuplicateServices,
  canManagePaquetes
} from '../middleware/roleAuth.js';

// Rate limiters para endpoints de AI
import rateLimit from 'express-rate-limit';

const agentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // 30 requests por ventana
  message: 'Demasiadas solicitudes al agente, intenta nuevamente más tarde',
  standardHeaders: true,
  legacyHeaders: false
});

const aiCommandLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10, // 10 comandos AI por ventana
  message: 'Límite de comandos AI excedido, espera unos minutos',
  standardHeaders: true,
  legacyHeaders: false
});

const router = express.Router();

// ============================================
// RUTAS DEL SERVICESAGENT (antes de todo)
// ============================================
// Chat con el agente
router.post('/agent/chat', requireAuth, ...requireUser, agentLimiter, chatWithServicesAgent);

// Crear servicio con IA
router.post('/agent/create', requireAuth, canCreateServices, aiCommandLimiter, createServiceWithAgent);

// Análisis de portfolio
router.post('/agent/analyze-portfolio', requireAuth, ...requireUser, agentLimiter, analyzePortfolio);

// Sugerir pricing
router.post('/agent/suggest-pricing', requireAuth, ...requireUser, agentLimiter, suggestPricing);

// Optimizar paquetes
router.post('/agent/optimize-packages', requireAuth, ...requireUser, aiCommandLimiter, optimizePackagesPricing);

// Métricas del agente (admin)
router.get('/agent/metrics', requireAuth, ...requireModerator, getAgentMetrics);

// Status del agente
router.get('/agent/status', requireAuth, ...requireUser, getAgentStatus);

// ============================================
// RUTAS DE ESTADÍSTICAS Y DASHBOARD
// ============================================
router.get('/dashboard', cacheServiceStats, canViewServicesStats, getDashboard);
router.get('/stats', cacheServiceStats, canViewServicesStats, getEstadisticas);
router.get('/stats/ventas', cacheServiceStats, canViewServicesStats, getEstadisticasVentas);
router.get('/stats/conversion', cacheServiceStats, canViewServicesStats, getMetricasConversion);

// ============================================
// RUTAS ESPECIALES (antes de las rutas con parámetros)
// ============================================
router.get('/destacados', cacheFeaturedServices, getServiciosDestacados);
router.get('/buscar', cachePublicServices, buscarServicios);
router.get('/top/vendidos', cacheFeaturedServices, getTopServicios);

// Cambio de estado masivo - Solo admins
router.patch('/bulk/estado', noCache, canManageServices, cambiarEstadoMasivo);

// ============================================
// RUTAS POR CATEGORÍA (públicas)
// ============================================
router.get('/categoria/:categoria', cacheServiceCategories, getServiciosPorCategoria);

// ============================================
// RUTAS CRUD PRINCIPALES
// ============================================
router.route('/')
  .get(cachePublicServices, getServicios)                    // GET /api/servicios - Público con cache
  .post(noCache, canCreateServices, createServicio); // POST /api/servicios - Sin cache

router.route('/:id')
  .get(cacheServiceDetail, getServicio)                     // GET /api/servicios/:id - Público con cache
  .put(noCache, requireAuth, canEditService, updateServicio)  // PUT /api/servicios/:id - Sin cache
  .delete(noCache, requireAuth, canDeleteService, deleteServicio); // DELETE /api/servicios/:id - Sin cache

// ============================================
// RUTAS DE ACCIONES ESPECIALES POR SERVICIO
// ============================================
router.post('/:id/duplicar', noCache, requireAuth, canDuplicateServices, duplicarServicio);
router.patch('/:id/estado', noCache, requireAuth, canEditService, cambiarEstado);
router.delete('/:id/soft', noCache, requireAuth, canDeleteService, softDeleteServicio);
router.patch('/:id/restaurar', noCache, requireAuth, canManageServices, restaurarServicio);

// Rutas de AI Agent por servicio específico
router.post('/:id/agent/edit', noCache, requireAuth, canEditService, aiCommandLimiter, editServiceWithAgent);
router.post('/:id/agent/analyze', noCache, requireAuth, ...requireUser, agentLimiter, analyzeServiceWithAgent);
router.post('/:id/agent/generate-content', noCache, requireAuth, ...requireUser, agentLimiter, generateContentWithAgent); // 🆕
router.post('/:id/agent/analyze-pricing', noCache, requireAuth, ...requireUser, agentLimiter, analyzePricing);

// ============================================
// RUTAS DE PAQUETES POR SERVICIO
// ============================================
router.route('/:servicioId/paquetes')
  .get(cacheServicePackages, getPaquetes)                       // GET /api/servicios/:servicioId/paquetes - Público con cache
  .post(noCache, canManagePaquetes, createPaquete); // POST /api/servicios/:servicioId/paquetes - Sin cache

router.get('/:servicioId/paquetes/popular', cacheServicePackages, getPaqueteMasPopular);
router.get('/:id/stats/paquetes', cacheServiceStats, canViewServicesStats, getEstadisticasPaquetes);

export default router;

