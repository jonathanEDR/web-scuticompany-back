import express from 'express';
import {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  cambiarEstado,
  agregarNota,
  getEstadisticas,
  getContactosPendientes,
  buscarContactos,
  validateContactCreation
} from '../controllers/contactController.js';
import { requireAuth, requirePermission } from '../middleware/clerkAuth.js';

const router = express.Router();

/**
 * 🌐 RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
 * Para formulario de contacto del sitio web
 */

// POST /api/contact - Crear nuevo contacto desde formulario público
router.post(
  '/',
  validateContactCreation,
  createContact
);

/**
 * 🔒 RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN Y PERMISOS)
 * Para panel de administración
 */

// GET /api/contact - Listar todos los contactos (con paginación y filtros)
router.get(
  '/',
  requireAuth,
  requirePermission('VIEW_CONTACTS'),
  getContacts
);

// GET /api/contact/stats - Obtener estadísticas de contactos
router.get(
  '/stats',
  requireAuth,
  requirePermission('VIEW_CONTACTS'),
  getEstadisticas
);

// GET /api/contact/pendientes - Obtener contactos pendientes (nuevos/en proceso)
router.get(
  '/pendientes',
  requireAuth,
  requirePermission('VIEW_CONTACTS'),
  getContactosPendientes
);

// GET /api/contact/buscar - Buscar contactos por texto
router.get(
  '/buscar',
  requireAuth,
  requirePermission('VIEW_CONTACTS'),
  buscarContactos
);

// GET /api/contact/:id - Obtener un contacto por ID
router.get(
  '/:id',
  requireAuth,
  requirePermission('VIEW_CONTACTS'),
  getContactById
);

// PATCH /api/contact/:id - Actualizar contacto
router.patch(
  '/:id',
  requireAuth,
  requirePermission('MANAGE_CONTACTS'),
  updateContact
);

// PATCH /api/contact/:id/estado - Cambiar estado del contacto
router.patch(
  '/:id/estado',
  requireAuth,
  requirePermission('MANAGE_CONTACTS'),
  cambiarEstado
);

// POST /api/contact/:id/notas - Agregar nota al contacto
router.post(
  '/:id/notas',
  requireAuth,
  requirePermission('MANAGE_CONTACTS'),
  agregarNota
);

// DELETE /api/contact/:id - Eliminar contacto
router.delete(
  '/:id',
  requireAuth,
  requirePermission('DELETE_CONTACTS'),
  deleteContact
);

export default router;
