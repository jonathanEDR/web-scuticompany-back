/**
 * Rutas para sesiones conversacionales de blog
 * Endpoints para crear contenido mediante conversación guiada
 */

import express from 'express';
import { requireAuth } from '../middleware/clerkAuth.js';
import * as blogSessionController from '../controllers/blogSessionController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

/**
 * POST /api/agents/blog/session/start
 * Iniciar nueva sesión conversacional
 * 
 * Body: {
 *   startedFrom?: string // 'dashboard', 'toolbar', etc
 * }
 * 
 * Response: {
 *   success: true,
 *   data: {
 *     sessionId: string,
 *     message: string,
 *     questions: string[],
 *     status: 'active',
 *     stage: 'topic_discovery'
 *   }
 * }
 */
router.post('/start', blogSessionController.startSession);

/**
 * POST /api/agents/blog/session/:sessionId/message
 * Enviar mensaje en la conversación
 * 
 * Body: {
 *   message: string // Respuesta del usuario (max 2000 chars)
 * }
 * 
 * Response: {
 *   success: true,
 *   data: {
 *     message: string, // Respuesta del agente
 *     questions?: string[], // Preguntas para el usuario
 *     stage: string, // Etapa actual
 *     progress: number, // 0-100
 *     context?: object, // Contexto adicional
 *     shouldGenerate?: boolean // Si debe iniciar generación
 *   }
 * }
 */
router.post('/:sessionId/message', blogSessionController.sendMessage);

/**
 * POST /api/agents/blog/session/:sessionId/generate
 * Generar contenido (endpoint directo)
 * 
 * Response: {
 *   success: true,
 *   data: {
 *     status: 'generating',
 *     message: string,
 *     sessionId: string,
 *     pollUrl: string,
 *     estimatedTime: string
 *   }
 * }
 */
router.post('/:sessionId/generate', blogSessionController.generateContent);

/**
 * GET /api/agents/blog/session/:sessionId
 * Obtener estado de la sesión
 * 
 * Response: {
 *   success: true,
 *   data: {
 *     sessionId: string,
 *     status: string,
 *     stage: string,
 *     progress: number,
 *     collected: object,
 *     conversationHistory: array,
 *     generation?: object,
 *     createdPost?: object,
 *     actions?: array
 *   }
 * }
 */
router.get('/:sessionId', blogSessionController.getSession);

/**
 * POST /api/agents/blog/session/:sessionId/save
 * Guardar contenido generado como borrador
 * 
 * Body: {
 *   tags?: string[], // Tags personalizados
 *   customData?: object // Datos adicionales (excerpt, etc)
 * }
 * 
 * Response: {
 *   success: true,
 *   message: string,
 *   data: {
 *     id: string,
 *     title: string,
 *     slug: string,
 *     status: 'draft',
 *     url: string,
 *     nextSteps: string[]
 *   }
 * }
 */
router.post('/:sessionId/save', blogSessionController.saveDraft);

/**
 * DELETE /api/agents/blog/session/:sessionId
 * Cancelar sesión
 * 
 * Response: {
 *   success: true,
 *   message: string,
 *   data: {
 *     sessionId: string,
 *     status: 'cancelled'
 *   }
 * }
 */
router.delete('/:sessionId', blogSessionController.cancelSession);

/**
 * GET /api/agents/blog/sessions
 * Listar sesiones del usuario
 * 
 * Query params:
 * - status?: 'active' | 'completed' | 'cancelled' | 'expired'
 * - limit?: number (default 10)
 * - page?: number (default 1)
 * 
 * Response: {
 *   success: true,
 *   data: {
 *     sessions: array,
 *     pagination: {
 *       page: number,
 *       limit: number,
 *       total: number,
 *       pages: number
 *     }
 *   }
 * }
 */
router.get('/', blogSessionController.listSessions);

export default router;
