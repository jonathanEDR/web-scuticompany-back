/**
 * Rutas para el Gerente General
 * Endpoints centralizados para coordinación de agentes
 */

import express from 'express';
import { requireAuth, requireRole } from '../middleware/clerkAuth.js';
import rateLimit from 'express-rate-limit';

import agentController from '../controllers/agentController.js';

const router = express.Router();

// ============================================================================
// RATE LIMITERS
// ============================================================================

// Rate limiter general para endpoints del Gerente
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 30 : 100,
  message: {
    success: false,
    error: 'Demasiadas peticiones al Gerente General, intenta de nuevo más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para comandos (más restrictivo)
const commandLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: process.env.NODE_ENV === 'production' ? 10 : 50,
  message: {
    success: false,
    error: 'Demasiados comandos al Gerente, intenta de nuevo más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// RUTAS PÚBLICAS (solo autenticación)
// ============================================================================

/**
 * GET /api/gerente/health
 * Health check del Gerente General
 */
router.get(
  '/health',
  generalLimiter,
  agentController.getGerenteHealth
);
/**
 * POST /api/gerente/test-routing
 * Testing endpoint para probar routing del GerenteGeneral con acceso a agentes reales
 * Sin autenticación requerida (solo para desarrollo)
 */
router.post(
  '/test-routing',
  generalLimiter,
  async (req, res) => {
    try {
      const { command, action = 'coordinate', servicioId } = req.body;
      
      if (!command) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere comando para prueba'
        });
      }

      // Importar el AgentOrchestrator global (que tiene los agentes reales)
      const { default: AgentOrchestrator } = await import('../agents/core/AgentOrchestrator.js');

      // Obtener el GerenteGeneral directamente del AgentOrchestrator (usar ID real)
      let gerenteGeneral = null;
      const availableAgents = Array.from(AgentOrchestrator.agents?.keys() || []);
      
      // Buscar GerenteGeneral por ID que contiene 'gerentegeneral'
      for (const agentId of availableAgents) {
        if (agentId.toLowerCase().includes('gerentegeneral')) {
          gerenteGeneral = AgentOrchestrator.agents.get(agentId);
          break;
        }
      }
      
      if (!gerenteGeneral) {
        return res.status(500).json({
          success: false,
          error: 'GerenteGeneral no disponible en el orchestrator',
          availableAgents: availableAgents
        });
      }

      // Crear contexto de prueba
      const context = {
        userId: 'test-user',
        userRole: 'SUPER_ADMIN',
        sessionId: `routing-${Date.now()}`,
        source: 'test-endpoint'
      };

      // Añadir servicioId a los parámetros si se proporciona
      const taskParams = {};
      if (servicioId) {
        taskParams.servicioId = servicioId;
      }

      // Procesar con GerenteGeneral REAL del orchestrator
      const result = await gerenteGeneral.processTask({ 
        action, 
        command,
        params: taskParams
      }, context);

      res.json({
        success: result.success !== false,
        data: result,
        note: 'Endpoint temporal con acceso a agentes reales',
        orchestratorInfo: {
          totalAgents: AgentOrchestrator.agents?.size || 0,
          activeAgents: Array.from(AgentOrchestrator.activeAgents || []),
          gerenteAvailable: !!gerenteGeneral
        }
      });

    } catch (error) {
      logger.error(`Error en routing de prueba: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
        note: 'Error en endpoint de prueba'
      });
    }
  }
);

/**
 * GET /api/gerente/status
 * Obtener estado completo del sistema
 */
router.get(
  '/status',
  requireAuth,
  generalLimiter,
  agentController.getGerenteStatus
);

// ============================================================================
// RUTAS DE COMANDOS (requieren autenticación)
// ============================================================================

/**
 * POST /api/gerente/command
 * Procesar comando a través del Gerente General
 * Body: { command, action, params, sessionId, targetAgent }
 */
router.post(
  '/command',
  requireAuth,
  commandLimiter,
  agentController.processGerenteCommand
);

// ============================================================================
// RUTAS DE SESIONES
// ============================================================================

/**
 * GET /api/gerente/sessions/:sessionId
 * Obtener información de sesión específica
 */
router.get(
  '/sessions/:sessionId',
  requireAuth,
  generalLimiter,
  agentController.getGerenteSession
);

/**
 * GET /api/gerente/sessions/user/:userId
 * Obtener sesiones de un usuario específico
 */
router.get(
  '/sessions/user/:userId',
  requireAuth,
  generalLimiter,
  agentController.getUserSessions
);

/**
 * POST /api/gerente/sessions/:sessionId/complete
 * Completar/finalizar una sesión
 */
router.post(
  '/sessions/:sessionId/complete',
  requireAuth,
  generalLimiter,
  agentController.completeSession
);

// ============================================================================
// RUTAS DE CONFIGURACIÓN (requieren autenticación)
// ============================================================================

/**
 * GET /api/gerente/config
 * Obtener configuración actual del Gerente General
 */
router.get(
  '/config',
  requireAuth,
  generalLimiter,
  agentController.getGerenteConfig
);

/**
 * PUT /api/gerente/config
 * Actualizar configuración del Gerente General (solo admin)
 */
router.put(
  '/config',
  requireAuth,
  requireRole(['admin', 'superadmin']),
  generalLimiter,
  agentController.updateGerenteConfig
);

/**
 * POST /api/gerente/config/reload
 * Recargar configuración desde la base de datos (solo admin)
 */
router.post(
  '/config/reload',
  requireAuth,
  requireRole(['admin', 'superadmin']),
  generalLimiter,
  agentController.reloadGerenteConfig
);

/**
 * GET /api/gerente/routing-rules
 * Obtener reglas de routing actuales
 */
router.get(
  '/routing-rules',
  requireAuth,
  generalLimiter,
  agentController.getGerenteRoutingRules
);

/**
 * PUT /api/gerente/routing-rules
 * Actualizar reglas de routing (solo admin)
 */
router.put(
  '/routing-rules',
  requireAuth,
  requireRole(['admin', 'superadmin']),
  generalLimiter,
  agentController.updateGerenteRoutingRules
);

// ============================================================================
// RUTAS DE ADMINISTRACIÓN (requieren rol admin)
// ============================================================================

/**
 * GET /api/gerente/admin/sessions/stats
 * Obtener estadísticas de todas las sesiones (solo admin)
 */
router.get(
  '/admin/sessions/stats',
  requireAuth,
  requireRole(['admin', 'superadmin']),
  generalLimiter,
  async (req, res) => {
    try {
      const { centralizedContext } = await import('../agents/context/CentralizedContextManager.js');
      const stats = await centralizedContext.default.getSessionStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

export default router;
