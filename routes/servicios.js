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
router.get('/dashboard', canViewServicesStats, getDashboard);
router.get('/stats', canViewServicesStats, getEstadisticas);
router.get('/stats/ventas', canViewServicesStats, getEstadisticasVentas);
router.get('/stats/conversion', canViewServicesStats, getMetricasConversion);

// ============================================
// RUTAS ESPECIALES (antes de las rutas con parámetros)
// ============================================
router.get('/destacados', getServiciosDestacados);
router.get('/buscar', buscarServicios);
router.get('/top/vendidos', getTopServicios);

// Cambio de estado masivo - Solo admins
router.patch('/bulk/estado', canManageServices, cambiarEstadoMasivo);

// ============================================
// RUTAS POR CATEGORÍA (públicas)
// ============================================
router.get('/categoria/:categoria', getServiciosPorCategoria);

// ============================================
// RUTAS CRUD PRINCIPALES
// ============================================
router.route('/')
  .get(getServicios)                    // GET /api/servicios - Público
  .post(canCreateServices, createServicio); // POST /api/servicios - Requiere permiso

router.route('/:id')
  .get(getServicio)                     // GET /api/servicios/:id - Público
  .put(requireAuth, canEditService, updateServicio)  // PUT /api/servicios/:id - Requiere auth + permiso
  .delete(requireAuth, canDeleteService, deleteServicio); // DELETE /api/servicios/:id - Solo admins

// ============================================
// RUTAS DE ACCIONES ESPECIALES POR SERVICIO
// ============================================
router.post('/:id/duplicar', requireAuth, canDuplicateServices, duplicarServicio);
router.patch('/:id/estado', requireAuth, canEditService, cambiarEstado);
router.delete('/:id/soft', requireAuth, canDeleteService, softDeleteServicio);
router.patch('/:id/restaurar', requireAuth, canManageServices, restaurarServicio);

// Rutas de AI Agent por servicio específico
router.post('/:id/agent/edit', requireAuth, canEditService, aiCommandLimiter, editServiceWithAgent);
router.post('/:id/agent/analyze', requireAuth, ...requireUser, agentLimiter, analyzeServiceWithAgent);
router.post('/:id/agent/generate-content', requireAuth, ...requireUser, agentLimiter, generateContentWithAgent); // 🆕
router.post('/:id/agent/analyze-pricing', requireAuth, ...requireUser, agentLimiter, analyzePricing);

// ============================================
// RUTAS DE PAQUETES POR SERVICIO
// ============================================
router.route('/:servicioId/paquetes')
  .get(getPaquetes)                       // GET /api/servicios/:servicioId/paquetes - Público
  .post(canManagePaquetes, createPaquete); // POST /api/servicios/:servicioId/paquetes - Requiere permiso

router.get('/:servicioId/paquetes/popular', getPaqueteMasPopular);
router.get('/:id/stats/paquetes', canViewServicesStats, getEstadisticasPaquetes);

export default router;

