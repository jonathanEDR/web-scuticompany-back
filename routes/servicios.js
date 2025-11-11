import express from 'express';
import {
  getServicios,
  getServiciosAdmin,
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
  // generateContentWithAgent, // ❌ DEPRECADO - Usar generateCompleteServiceWithAgent
  generateCompleteServiceWithAgent, // 🚀 PRINCIPAL OPTIMIZADO
  generateAllContentWithAgent, // 🆕 (Legacy)
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

// ✅ Middlewares de validación para servicios
import { 
  validateServiceUpdate, 
  validateServiceCreate 
} from '../middleware/validateServiceData.js';

// ✅ Sistema de logging para servicios
import { serviceOperationLogger } from '../utils/serviceLogger.js';

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
// RUTAS ADMINISTRATIVAS (sin cache)
// ============================================
// Listado admin sin cache - debe estar ANTES de las rutas públicas
router.get('/admin/list', 
  noCache,
  requireAuth,
  canViewServicesStats,
  getServiciosAdmin
);

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
  .get(cachePublicServices, getServicios)                              // GET /api/servicios - Público con cache
  .post(
    noCache, 
    canCreateServices, 
    validateServiceCreate,
    serviceOperationLogger('create'),
    createServicio
  ); // POST /api/servicios - Con validación

router.route('/:id')
  .get(cacheServiceDetail, getServicio)                               // GET /api/servicios/:id - Público con cache
  .put(
    noCache, 
    requireAuth, 
    canEditService, 
    validateServiceUpdate, 
    serviceOperationLogger('update'),
    invalidateCacheOnMutation, 
    updateServicio
  )  // PUT /api/servicios/:id - Con validación y cache
  .delete(
    noCache, 
    requireAuth, 
    canDeleteService,
    serviceOperationLogger('delete'), 
    deleteServicio
  );     // DELETE /api/servicios/:id - Con logging

// ============================================
// RUTAS DE ACCIONES ESPECIALES POR SERVICIO
// ============================================
router.post('/:id/duplicar', noCache, requireAuth, canDuplicateServices, duplicarServicio);
router.patch('/:id/estado', noCache, requireAuth, canEditService, cambiarEstado);
router.delete('/:id/soft', noCache, requireAuth, canDeleteService, softDeleteServicio);
router.patch('/:id/restaurar', noCache, requireAuth, canManageServices, restaurarServicio);

// Rutas de AI Agent por servicio específico
router.post('/:id/agent/edit', 
  noCache, 
  requireAuth, 
  canEditService, 
  validateServiceUpdate,
  serviceOperationLogger('agent_edit'),
  aiCommandLimiter, 
  editServiceWithAgent
);
router.post('/:id/agent/analyze', 
  noCache, 
  requireAuth, 
  ...requireUser, 
  serviceOperationLogger('agent_analyze'),
  agentLimiter, 
  analyzeServiceWithAgent
);
// ❌ ENDPOINT DEPRECADO - Usar /generate-complete en su lugar
// router.post('/:id/agent/generate-content', 
//   noCache, 
//   requireAuth, 
//   ...requireUser, 
//   serviceOperationLogger('agent_generate'),
//   agentLimiter, 
//   generateContentWithAgent
// );

// 🚀 ENDPOINT PRINCIPAL OPTIMIZADO - Una sola consulta para todo el contenido
router.post('/:id/agent/generate-complete', 
  noCache, 
  requireAuth, 
  ...requireUser, 
  serviceOperationLogger('agent_generate_unified'),
  agentLimiter, 
  generateCompleteServiceWithAgent
);
// 🔄 Legacy endpoint para compatibilidad (deprecar eventualmente)
router.post('/:id/agent/generate-all-content', 
  noCache, 
  requireAuth, 
  ...requireUser, 
  serviceOperationLogger('agent_generate_bulk'),
  agentLimiter, 
  generateAllContentWithAgent
);
router.post('/:id/agent/analyze-pricing', 
  noCache, 
  requireAuth, 
  ...requireUser, 
  serviceOperationLogger('agent_pricing'),
  agentLimiter, 
  analyzePricing
);

// ============================================
// RUTAS DE PAQUETES POR SERVICIO
// ============================================
router.route('/:servicioId/paquetes')
  .get(cacheServicePackages, getPaquetes)                       // GET /api/servicios/:servicioId/paquetes - Público con cache
  .post(noCache, canManagePaquetes, createPaquete); // POST /api/servicios/:servicioId/paquetes - Sin cache

router.get('/:servicioId/paquetes/popular', cacheServicePackages, getPaqueteMasPopular);
router.get('/:id/stats/paquetes', cacheServiceStats, canViewServicesStats, getEstadisticasPaquetes);

export default router;

