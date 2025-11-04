import express from 'express';
const router = express.Router();

// Middleware
import { requireAuth, requirePermission } from '../middleware/clerkAuth.js';

// Alias para compatibilidad
const hasPermission = requirePermission;

// Controllers
import {
  getPostComments,
  getComment,
  createComment,
  updateComment,
  deleteComment,
  voteComment,
  reportComment,
  getPostCommentStats,
  getUserComments,
  pinComment,
  unpinComment
} from '../controllers/commentController.js';

import {
  getModerationQueue,
  approveComment,
  rejectComment,
  markAsSpam,
  bulkApprove,
  bulkReject,
  bulkSpam,
  getReports,
  resolveReport,
  dismissReport,
  getModerationStats,
  getReportStats,
  reanalyzeComments,
  getModerationSettings
} from '../controllers/commentModerationController.js';

// ========================================
// RUTAS PÚBLICAS - COMENTARIOS
// ========================================

/**
 * Obtener comentarios de un post
 * GET /api/blog/:slug/comments
 * Query params: page, limit, sortBy, sortOrder, includeReplies
 */
router.get('/blog/:slug/comments', getPostComments);

/**
 * Obtener estadísticas de comentarios de un post
 * GET /api/blog/:slug/comments/stats
 */
router.get('/blog/:slug/comments/stats', getPostCommentStats);

/**
 * Obtener un comentario específico con su thread
 * GET /api/comments/:id
 */
router.get('/comments/:id', getComment);

/**
 * Crear un nuevo comentario
 * POST /api/blog/:slug/comments
 * Body: { content, parentCommentId?, name?, email?, website? }
 * Si está autenticado, usa datos del usuario
 * Si no, requiere name y email
 */
router.post('/blog/:slug/comments', createComment);

/**
 * Votar un comentario (like/dislike)
 * POST /api/comments/:id/vote
 * Body: { type: 'like' | 'dislike' }
 */
router.post('/comments/:id/vote', voteComment);

/**
 * Reportar un comentario
 * POST /api/comments/:id/report
 * Body: { reason, description?, email? }
 */
router.post('/comments/:id/report', reportComment);

// ========================================
// RUTAS AUTENTICADAS - COMENTARIOS
// ========================================

/**
 * Editar un comentario propio
 * PUT /api/comments/:id
 * Body: { content }
 * Requiere: Ser el autor o moderador
 */
router.put('/comments/:id', requireAuth, updateComment);

/**
 * Eliminar un comentario propio
 * DELETE /api/comments/:id
 * Requiere: Ser el autor o moderador
 */
router.delete('/comments/:id', requireAuth, deleteComment);

/**
 * Obtener comentarios de un usuario
 * GET /api/users/:userId/comments
 * Query params: page, limit, status
 * Requiere: Ser el mismo usuario o moderador
 */
router.get('/users/:userId/comments', requireAuth, getUserComments);

// ========================================
// RUTAS DE MODERACIÓN - REQUIEREN PERMISOS
// ========================================

/**
 * Obtener cola de moderación
 * GET /api/admin/comments/moderation/queue
 * Query params: page, limit, status, sortBy, sortOrder
 * Requiere: Permiso moderate_comments
 */
router.get(
  '/admin/comments/moderation/queue',
  requireAuth,
  hasPermission('moderate_comments'),
  getModerationQueue
);

/**
 * Aprobar un comentario
 * POST /api/admin/comments/:id/approve
 * Body: { notes? }
 * Requiere: Permiso moderate_comments
 */
router.post(
  '/admin/comments/:id/approve',
  requireAuth,
  hasPermission('moderate_comments'),
  approveComment
);

/**
 * Rechazar un comentario
 * POST /api/admin/comments/:id/reject
 * Body: { reason, notes? }
 * Requiere: Permiso moderate_comments
 */
router.post(
  '/admin/comments/:id/reject',
  requireAuth,
  hasPermission('moderate_comments'),
  rejectComment
);

/**
 * Marcar comentario como spam
 * POST /api/admin/comments/:id/spam
 * Body: { notes? }
 * Requiere: Permiso moderate_comments
 */
router.post(
  '/admin/comments/:id/spam',
  requireAuth,
  hasPermission('moderate_comments'),
  markAsSpam
);

/**
 * Fijar comentario
 * POST /api/comments/:id/pin
 * Requiere: Permiso moderate_comments
 */
router.post(
  '/comments/:id/pin',
  requireAuth,
  hasPermission('moderate_comments'),
  pinComment
);

/**
 * Desfijar comentario
 * DELETE /api/comments/:id/pin
 * Requiere: Permiso moderate_comments
 */
router.delete(
  '/comments/:id/pin',
  requireAuth,
  hasPermission('moderate_comments'),
  unpinComment
);

// ========================================
// RUTAS DE MODERACIÓN EN LOTE
// ========================================

/**
 * Aprobar múltiples comentarios
 * POST /api/admin/comments/bulk-approve
 * Body: { commentIds: string[] }
 * Requiere: Permiso moderate_comments
 */
router.post(
  '/admin/comments/bulk-approve',
  requireAuth,
  hasPermission('moderate_comments'),
  bulkApprove
);

/**
 * Rechazar múltiples comentarios
 * POST /api/admin/comments/bulk-reject
 * Body: { commentIds: string[], reason: string }
 * Requiere: Permiso moderate_comments
 */
router.post(
  '/admin/comments/bulk-reject',
  requireAuth,
  hasPermission('moderate_comments'),
  bulkReject
);

/**
 * Marcar múltiples comentarios como spam
 * POST /api/admin/comments/bulk-spam
 * Body: { commentIds: string[] }
 * Requiere: Permiso moderate_comments
 */
router.post(
  '/admin/comments/bulk-spam',
  requireAuth,
  hasPermission('moderate_comments'),
  bulkSpam
);

// ========================================
// RUTAS DE GESTIÓN DE REPORTES
// ========================================

/**
 * Obtener reportes pendientes
 * GET /api/admin/comments/reports
 * Query params: page, limit, reason, priority
 * Requiere: Permiso moderate_comments
 */
router.get(
  '/admin/comments/reports',
  requireAuth,
  hasPermission('moderate_comments'),
  getReports
);

/**
 * Resolver un reporte
 * POST /api/admin/comments/reports/:id/resolve
 * Body: { action, notes? }
 * Actions: comment_removed, comment_edited, comment_approved, report_dismissed, user_warned, user_banned
 * Requiere: Permiso moderate_comments
 */
router.post(
  '/admin/comments/reports/:id/resolve',
  requireAuth,
  hasPermission('moderate_comments'),
  resolveReport
);

/**
 * Descartar un reporte
 * POST /api/admin/comments/reports/:id/dismiss
 * Body: { notes? }
 * Requiere: Permiso moderate_comments
 */
router.post(
  '/admin/comments/reports/:id/dismiss',
  requireAuth,
  hasPermission('moderate_comments'),
  dismissReport
);

/**
 * Estadísticas de reportes
 * GET /api/admin/comments/reports/stats
 * Query params: timeframe (días, default 30)
 * Requiere: Permiso moderate_comments
 */
router.get(
  '/admin/comments/reports/stats',
  requireAuth,
  hasPermission('moderate_comments'),
  getReportStats
);

// ========================================
// RUTAS DE ESTADÍSTICAS Y HERRAMIENTAS
// ========================================

/**
 * Estadísticas generales de moderación
 * GET /api/admin/comments/stats
 * Query params: timeframe (días, default 30)
 * Requiere: Permiso moderate_comments
 */
router.get(
  '/admin/comments/stats',
  requireAuth,
  hasPermission('moderate_comments'),
  getModerationStats
);

/**
 * Re-analizar comentarios pendientes
 * POST /api/admin/comments/reanalyze
 * Body: { limit? }
 * Requiere: Permiso moderate_comments
 */
router.post(
  '/admin/comments/reanalyze',
  requireAuth,
  hasPermission('moderate_comments'),
  reanalyzeComments
);

/**
 * Obtener configuración de moderación
 * GET /api/admin/comments/settings
 * Requiere: Permiso manage_settings
 */
router.get(
  '/admin/comments/settings',
  requireAuth,
  hasPermission('manage_settings'),
  getModerationSettings
);

// ========================================
// EXPORT
// ========================================

export default router;
