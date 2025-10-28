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

// Importar middlewares de autenticación y autorización
import { requireAuth } from '../middleware/clerkAuth.js';
import {
  canViewServicesStats,
  canCreateServices,
  canManageServices,
  canEditService,
  canDeleteService,
  canDuplicateServices,
  canManagePaquetes
} from '../middleware/roleAuth.js';

const router = express.Router();

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

// ============================================
// RUTAS DE PAQUETES POR SERVICIO
// ============================================
router.route('/:servicioId/paquetes')
  .get(getPaquetes)                       // GET /api/servicios/:servicioId/paquetes - Público
  .post(canManagePaquetes, createPaquete); // POST /api/servicios/:servicioId/paquetes - Requiere permiso

router.get('/:servicioId/paquetes/popular', getPaqueteMasPopular);
router.get('/:id/stats/paquetes', canViewServicesStats, getEstadisticasPaquetes);

export default router;

