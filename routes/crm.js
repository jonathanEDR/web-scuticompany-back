import express from 'express';
import {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  cambiarEstado,
  agregarActividad,
  asignarLead,
  getEstadisticas,
  getLeadsPendientes
} from '../controllers/leadController.js';
import { requireAuth } from '../middleware/clerkAuth.js';

const router = express.Router();

/**
 * 🔒 Aplicar autenticación a todas las rutas CRM
 * Todas las rutas requieren que el usuario esté autenticado con Clerk
 */
router.use(requireAuth);

// ========================================
// 📊 RUTAS DE ESTADÍSTICAS Y REPORTES
// ========================================
router.get('/estadisticas', getEstadisticas);         // GET /api/crm/estadisticas
router.get('/leads/pendientes', getLeadsPendientes);  // GET /api/crm/leads/pendientes

// ========================================
// 💼 RUTAS PRINCIPALES DE LEADS
// ========================================
router.route('/leads')
  .get(getLeads)      // GET    /api/crm/leads - Obtener todos los leads (con filtros)
  .post(createLead);  // POST   /api/crm/leads - Crear nuevo lead

router.route('/leads/:id')
  .get(getLead)       // GET    /api/crm/leads/:id - Obtener lead específico
  .put(updateLead)    // PUT    /api/crm/leads/:id - Actualizar lead
  .delete(deleteLead);// DELETE /api/crm/leads/:id - Eliminar lead (soft delete)

// ========================================
// 🔧 RUTAS DE ACCIONES ESPECÍFICAS
// ========================================
router.patch('/leads/:id/estado', cambiarEstado);        // PATCH /api/crm/leads/:id/estado
router.post('/leads/:id/actividades', agregarActividad); // POST  /api/crm/leads/:id/actividades
router.patch('/leads/:id/asignar', asignarLead);         // PATCH /api/crm/leads/:id/asignar

export default router;
