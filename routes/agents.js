/**
 * Rutas para el sistema de agentes AI
 * Endpoints para interactuar con el cerebro central y agentes especializados
 */

import express from 'express';
import { requireAuth, requireAnyRole } from '../middleware/clerkAuth.js';
import { requireAdmin, requireModerator, requireUser, requireSuperAdmin } from '../middleware/roleAuth.js';
import rateLimit from 'express-rate-limit';
import {
  getAgentStatus,
  processCommand,
  optimizeBlogContent,
  analyzeBlogContent,
  generateBlogTags,
  optimizeSEO,
  analyzeBlogPerformance,
  getAgentCapabilities,
  reinitializeAgents,
  getAgentHealth,
  getAgentConfigs,
  getAgentConfig,
  updateAgentConfig,
  resetAgentConfig,
  chatWithBlogAgent,
  generateContent,
  processContextPattern
} from '../controllers/agentController.js';

// 🆕 IMPORTACIONES PARA SERVICIOS AGENT (FASE 2)
import {
  generateAllBlocks,
  generateCaracteristicas,
  generatePrecios,
  generateContenido,
  generateFAQ,
  generateQueIncluye,
  generateConfiguraciones
} from '../controllers/servicesAgentController.js';

import { testAgentConfiguration } from '../controllers/testController.js';

const router = express.Router();

// Rate limiting específico para agentes (más restrictivo)
const agentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 30 : 100, // 30 en prod, 100 en dev
  message: 'Demasiadas peticiones al sistema de agentes, intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development'
});

// Rate limiting más estricto para comandos de IA
const aiCommandLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: process.env.NODE_ENV === 'production' ? 10 : 50, // 10 en prod, 50 en dev
  message: 'Límite de comandos de IA alcanzado, espera unos minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development'
});

// Aplicar rate limiting a todas las rutas de agentes
router.use(agentLimiter);

// ============================================================================
// RUTAS PÚBLICAS (solo información básica)
// ============================================================================

/**
 * GET /api/agents/health
 * Health check público del sistema
 */
router.get('/health', getAgentHealth);

/**
 * GET /api/agents/capabilities
 * Obtener capacidades disponibles (público)
 */
router.get('/capabilities', getAgentCapabilities);

// ============================================================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================================================

// Middleware de autenticación para rutas protegidas
router.use(requireAuth);

/**
 * GET /api/agents/status
 * Estado detallado del sistema (requiere autenticación)
 */
router.get('/status', getAgentStatus);

// ============================================================================
// COMANDOS DE LENGUAJE NATURAL
// ============================================================================

/**
 * POST /api/agents/command
 * Procesar comando de lenguaje natural
 * Requiere: Usuario autenticado
 */
router.post('/command', 
  aiCommandLimiter,
  ...requireUser,
  processCommand
);

// ============================================================================
// BLOG AGENT - FUNCIONALIDADES ESPECÍFICAS
// ============================================================================

/**
 * POST /api/agents/blog/optimize
 * Optimizar contenido específico de blog
 * Requiere: Moderador o superior
 */
router.post('/blog/optimize',
  ...requireModerator,
  optimizeBlogContent
);

/**
 * POST /api/agents/blog/analyze
 * Analizar contenido de blog
 * Requiere: Usuario autenticado
 */
router.post('/blog/analyze',
  ...requireUser,
  analyzeBlogContent
);

/**
 * POST /api/agents/blog/tags
 * Generar tags para contenido
 * Requiere: Usuario autenticado
 */
router.post('/blog/tags',
  ...requireUser,
  generateBlogTags
);

/**
 * POST /api/agents/blog/seo
 * Optimizar SEO de contenido
 * Requiere: Usuario autenticado
 */
router.post('/blog/seo',
  ...requireUser,
  optimizeSEO
);

/**
 * POST /api/agents/blog/chat
 * Chat conversacional con BlogAgent
 * Requiere: Usuario autenticado
 */
router.post('/blog/chat',
  aiCommandLimiter,
  ...requireUser,
  chatWithBlogAgent
);

/**
 * POST /api/agents/blog/generate-content
 * Generar contenido con BlogAgent
 * Requiere: Usuario autenticado
 */
router.post('/blog/generate-content',
  aiCommandLimiter,
  ...requireUser,
  generateContent
);

/**
 * POST /api/agents/blog/process-pattern
 * Procesar patrón contextual #...#
 * Sistema avanzado de sugerencias con patrones
 * Requiere: Usuario autenticado
 */
router.post('/blog/process-pattern',
  aiCommandLimiter,
  ...requireUser,
  processContextPattern
);

/**
 * GET /api/agents/blog/performance
 * Analizar rendimiento del blog
 * Requiere: content_manager, admin o moderator
 */
router.get('/blog/performance',
  requireAnyRole(['content_manager', 'admin', 'moderator']),
  analyzeBlogPerformance
);

/**
 * GET /api/agents/test/config
 * Probar configuración actual del BlogAgent (para desarrollo)
 * Requiere: Usuario autenticado
 */
router.get('/test/config',
  ...requireUser,
  testAgentConfiguration
);

// ============================================================================
// RUTAS ADMINISTRATIVAS (solo admin)
// ============================================================================

/**
 * POST /api/agents/reinitialize
 * Reinicializar sistema de agentes
 * Requiere: admin
 */
router.post('/reinitialize',
  requireAnyRole(['admin']),
  reinitializeAgents
);

// ============================================================================
// RUTAS DE EJEMPLO Y TESTING
// ============================================================================

/**
 * GET /api/agents/examples
 * Obtener ejemplos de comandos disponibles
 */
router.get('/examples', (req, res) => {
  const examples = {
    natural_language_commands: [
      {
        command: "optimizar el post con slug 'mi-primer-articulo'",
        description: "Optimiza un post específico usando su slug",
        endpoint: "POST /api/agents/command",
        roles: ["content_manager", "admin"]
      },
      {
        command: "analizar rendimiento del blog en los últimos 30 días",
        description: "Análisis de rendimiento del blog",
        endpoint: "POST /api/agents/command",
        roles: ["content_manager", "admin", "moderator"]
      },
      {
        command: "generar tags para contenido sobre React y JavaScript",
        description: "Generación de tags para contenido específico",
        endpoint: "POST /api/agents/command",
        roles: ["content_manager", "admin"]
      },
      {
        command: "revisar SEO de todos los posts de la categoría tecnología",
        description: "Análisis SEO masivo por categoría",
        endpoint: "POST /api/agents/command", 
        roles: ["content_manager", "admin"]
      }
    ],
    direct_api_calls: [
      {
        endpoint: "POST /api/agents/blog/optimize",
        description: "Optimización directa de contenido",
        example_body: {
          postId: "507f1f77bcf86cd799439011"
        },
        roles: ["content_manager", "admin"]
      },
      {
        endpoint: "POST /api/agents/blog/analyze",
        description: "Análisis directo de contenido",
        example_body: {
          category: "tecnologia",
          limit: 10
        },
        roles: ["user", "content_manager", "admin", "moderator"]
      },
      {
        endpoint: "GET /api/agents/blog/performance?timeframe=7d",
        description: "Análisis de rendimiento por período",
        roles: ["content_manager", "admin", "moderator"]
      }
    ],
    response_format: {
      success: {
        success: true,
        message: "Descripción del resultado",
        data: "{ /* datos específicos */ }",
        timestamp: "ISO timestamp",
        agentName: "Nombre del agente que procesó",
        agentId: "ID único del agente"
      },
      error: {
        success: false,
        error: "Descripción del error",
        timestamp: "ISO timestamp"
      }
    }
  };

  res.json({
    success: true,
    data: examples,
    documentation: "Consulta la documentación completa en /docs/agents"
  });
});

/**
 * POST /api/agents/test
 * Endpoint de testing para desarrollo
 * Solo disponible en desarrollo
 */
if (process.env.NODE_ENV === 'development') {
  router.post('/test', 
    requireAnyRole(['admin']),
    async (req, res) => {
      try {
        const { testType, params } = req.body;
        
        let result;
        switch (testType) {
          case 'blog_optimize':
            result = await optimizeBlogContent(req, res);
            break;
          case 'blog_analyze':
            result = await analyzeBlogContent(req, res);
            break;
          case 'natural_command':
            result = await processCommand(req, res);
            break;
          default:
            return res.json({
              success: false,
              error: 'Unknown test type',
              availableTests: ['blog_optimize', 'blog_analyze', 'natural_command']
            });
        }
        
        // Si llegamos aquí, la función ya respondió
        
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          stack: error.stack
        });
      }
    }
  );
}

// ============================================================================
// CONFIGURACIÓN DE AGENTES (Admin only)
// ============================================================================

/**
 * GET /api/agents/config
 * Obtener configuración de todos los agentes
 * Requiere: Admin
 */
router.get('/config',
  ...requireAdmin,
  getAgentConfigs
);

/**
 * GET /api/agents/config/:agentName
 * Obtener configuración de un agente específico
 * Requiere: Admin
 */
router.get('/config/:agentName',
  ...requireAdmin,
  getAgentConfig
);

/**
 * PUT /api/agents/config/:agentName
 * Actualizar configuración de un agente
 * Requiere: Admin
 */
router.put('/config/:agentName',
  ...requireAdmin,
  updateAgentConfig
);

/**
 * POST /api/agents/config/:agentName/reset
 * Resetear configuración de un agente a valores por defecto
 * Requiere: Admin
 */
router.post('/config/:agentName/reset',
  ...requireAdmin,
  resetAgentConfig
);

// ============================================================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ============================================================================
// RUTAS PARA SEOAGENT
// ============================================================================

// Obtener configuración del SEOAgent
router.get('/config/SEOAgent',
  requireAuth,
  ...requireSuperAdmin,
  async (req, res, next) => {
    try {
      const AgentConfig = (await import('../models/AgentConfig.js')).default;
      const config = await AgentConfig.findOne({ agentName: 'seo' }); // Cambio a agentName
      
      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Configuración del SEOAgent no encontrada'
        });
      }

      res.json(config);
    } catch (error) {
      next(error);
    }
  }
);

// Actualizar entrenamiento del SEOAgent
router.put('/config/SEOAgent/training',
  requireAuth,
  ...requireSuperAdmin,
  async (req, res, next) => {
    try {
      const { trainingConfig } = req.body;
      const AgentConfig = (await import('../models/AgentConfig.js')).default;
      
      const config = await AgentConfig.findOneAndUpdate(
        { agentName: 'seo' }, // Cambio a agentName
        { $set: { trainingConfig } },
        { new: true, upsert: true }
      );

      res.json({
        success: true,
        message: 'Configuración de entrenamiento actualizada',
        config
      });
    } catch (error) {
      next(error);
    }
  }
);

// Probar el SEOAgent
router.post('/seo/test',
  requireAuth,
  ...requireSuperAdmin,
  aiCommandLimiter,
  async (req, res, next) => {
    try {
      const { input } = req.body;
      const { SEOAgent } = await import('../agents/specialized/SEOAgent.js');
      
      const seoAgent = new SEOAgent();
      const result = await seoAgent.executeTask({
        type: 'generic_analysis',
        input: input
      });

      res.json({
        success: true,
        output: JSON.stringify(result, null, 2)
      });
    } catch (error) {
      next(error);
    }
  }
);

// Ejecutar tarea específica del SEOAgent
router.post('/seo/execute',
  requireAuth,
  requireAnyRole(['admin', 'super_admin', 'moderator']),
  aiCommandLimiter,
  async (req, res, next) => {
    try {
      const { taskType, params } = req.body;
      const { SEOAgent } = await import('../agents/specialized/SEOAgent.js');
      
      const seoAgent = new SEOAgent();
      const result = await seoAgent.executeTask({
        type: taskType,
        ...params
      });

      res.json({
        success: true,
        result
      });
    } catch (error) {
      next(error);
    }
  }
);

// Chat con SEOAgent (similar al BlogAgent)
router.post('/seo/chat',
  requireAuth,
  requireAnyRole(['admin', 'super_admin', 'moderator']),
  aiCommandLimiter,
  async (req, res, next) => {
    try {
      const { message, context } = req.body;
      const { SEOAgent } = await import('../agents/specialized/SEOAgent.js');
      
      const seoAgent = new SEOAgent();
      
      // Simular chat procesando el mensaje como comando
      const result = await seoAgent.executeTask({
        type: 'chat_interaction',
        message,
        context: context || {}
      });

      res.json({
        success: true,
        result: result.response || result,
        data: result.response || result
      });
    } catch (error) {
      console.error('SEO Agent chat error:', error);
      res.json({
        success: false,
        error: error.message || 'Error procesando mensaje con SEO Agent'
      });
    }
  }
);

// Optimizar contenido SEO (endpoint específico)
router.post('/seo/optimize',
  requireAuth,
  requireAnyRole(['admin', 'super_admin', 'moderator']),
  aiCommandLimiter,
  async (req, res, next) => {
    try {
      const { content, title, optimize = true } = req.body;
      const { SEOAgent } = await import('../agents/specialized/SEOAgent.js');
      
      const seoAgent = new SEOAgent();
      const result = await seoAgent.executeTask({
        type: 'content_optimization',
        content,
        title,
        optimize
      });

      res.json({
        success: true,
        result,
        data: result
      });
    } catch (error) {
      console.error('SEO optimization error:', error);
      res.json({
        success: false,
        error: error.message || 'Error optimizando contenido SEO'
      });
    }
  }
);

// Analizar contenido SEO específico
router.post('/seo/analyze',
  requireAuth,
  requireAnyRole(['admin', 'super_admin', 'moderator']),
  aiCommandLimiter,
  async (req, res, next) => {
    try {
      const { content, title, keywords, description } = req.body;
      const { SEOAgent } = await import('../agents/specialized/SEOAgent.js');
      
      const seoAgent = new SEOAgent();
      const result = await seoAgent.executeTask({
        type: 'content_analysis',
        content,
        title,
        keywords,
        description
      });

      res.json({
        success: true,
        result,
        data: result
      });
    } catch (error) {
      console.error('SEO analysis error:', error);
      res.json({
        success: false,
        error: error.message || 'Error analizando contenido SEO'
      });
    }
  }
);

// Generar estructura de contenido SEO
router.post('/seo/structure',
  requireAuth,
  requireAnyRole(['admin', 'super_admin', 'moderator']),
  aiCommandLimiter,
  async (req, res, next) => {
    try {
      const { topic, keywords, targetAudience } = req.body;
      const { SEOAgent } = await import('../agents/specialized/SEOAgent.js');
      
      const seoAgent = new SEOAgent();
      const result = await seoAgent.executeTask({
        type: 'generate_structure',
        topic,
        keywords,
        targetAudience
      });

      res.json({
        success: true,
        result,
        data: result
      });
    } catch (error) {
      console.error('SEO structure generation error:', error);
      res.json({
        success: false,
        error: error.message || 'Error generando estructura SEO'
      });
    }
  }
);

// Revisar contenido completo SEO
router.post('/seo/review',
  requireAuth,
  requireAnyRole(['admin', 'super_admin', 'moderator']),
  aiCommandLimiter,
  async (req, res, next) => {
    try {
      const { content, title, description, keywords } = req.body;
      const { SEOAgent } = await import('../agents/specialized/SEOAgent.js');
      
      const seoAgent = new SEOAgent();
      const result = await seoAgent.executeTask({
        type: 'content_review',
        content,
        title,
        description,
        keywords
      });

      res.json({
        success: true,
        result,
        data: result
      });
    } catch (error) {
      console.error('SEO review error:', error);
      res.json({
        success: false,
        error: error.message || 'Error revisando contenido SEO'
      });
    }
  }
);

// Analizar keywords específico
router.post('/seo/keywords',
  requireAuth,
  requireAnyRole(['admin', 'super_admin', 'moderator']),
  aiCommandLimiter,
  async (req, res, next) => {
    try {
      const { content, targetKeywords } = req.body;
      const { SEOAgent } = await import('../agents/specialized/SEOAgent.js');
      
      const seoAgent = new SEOAgent();
      const result = await seoAgent.executeTask({
        type: 'keyword_research',
        content,
        keywords: targetKeywords
      });

      res.json({
        success: true,
        result,
        data: result
      });
    } catch (error) {
      console.error('SEO keywords analysis error:', error);
      res.json({
        success: false,
        error: error.message || 'Error analizando keywords SEO'
      });
    }
  }
);

// Analizar competencia
router.post('/seo/competitors',
  requireAuth,
  requireAnyRole(['admin', 'super_admin', 'moderator']),
  aiCommandLimiter,
  async (req, res, next) => {
    try {
      const { keywords, industry, competitors } = req.body;
      const { SEOAgent } = await import('../agents/specialized/SEOAgent.js');
      
      const seoAgent = new SEOAgent();
      const result = await seoAgent.executeTask({
        type: 'competitor_analysis',
        keywords,
        industry,
        competitors
      });

      res.json({
        success: true,
        result,
        data: result
      });
    } catch (error) {
      console.error('SEO competitors analysis error:', error);
      res.json({
        success: false,
        error: error.message || 'Error analizando competencia SEO'
      });
    }
  }
);

// Obtener configuración SEO
router.get('/seo/config',
  requireAuth,
  requireAnyRole(['admin', 'super_admin']),
  async (req, res, next) => {
    try {
      const { SEOAgent } = await import('../agents/specialized/SEOAgent.js');
      
      const seoAgent = new SEOAgent();
      const config = await seoAgent.getConfiguration();

      res.json({
        success: true,
        result: config,
        data: config
      });
    } catch (error) {
      console.error('SEO config get error:', error);
      res.json({
        success: false,
        error: error.message || 'Error obteniendo configuración SEO'
      });
    }
  }
);

// Actualizar configuración SEO
router.post('/seo/config',
  requireAuth,
  requireAnyRole(['admin', 'super_admin']),
  async (req, res, next) => {
    try {
      const { config } = req.body;
      const { SEOAgent } = await import('../agents/specialized/SEOAgent.js');
      
      const seoAgent = new SEOAgent();
      const result = await seoAgent.updateConfiguration(config);

      res.json({
        success: true,
        result,
        data: result
      });
    } catch (error) {
      console.error('SEO config update error:', error);
      res.json({
        success: false,
        error: error.message || 'Error actualizando configuración SEO'
      });
    }
  }
);

// ============================================================================

// ============================================================================
// 🆕 RUTAS PARA SERVICES AGENT (FASE 2) - GENERACIÓN DE BLOQUES INDIVIDUALES
// ============================================================================

// 🎯 Generar TODOS los bloques (7 bloques completos)
router.post('/services/generate-all-blocks', 
  requireAuth, 
  requireUser, 
  aiCommandLimiter,
  generateAllBlocks
);

// 🎯 Generar solo CARACTERÍSTICAS Y BENEFICIOS
router.post('/services/generate-caracteristicas', 
  requireAuth, 
  requireUser, 
  aiCommandLimiter,
  generateCaracteristicas
);

// 💰 Generar solo PRECIOS Y COMERCIAL
router.post('/services/generate-precios', 
  requireAuth, 
  requireUser, 
  aiCommandLimiter,
  generatePrecios
);

// 📝 Generar solo CONTENIDO AVANZADO
router.post('/services/generate-contenido', 
  requireAuth, 
  requireUser, 
  aiCommandLimiter,
  generateContenido
);

// ❓ Generar solo FAQ
router.post('/services/generate-faq', 
  requireAuth, 
  requireUser, 
  aiCommandLimiter,
  generateFAQ
);

// ✅ Generar solo QUÉ INCLUYE/NO INCLUYE
router.post('/services/generate-incluye', 
  requireAuth, 
  requireUser, 
  aiCommandLimiter,
  generateQueIncluye
);

// 🔧 Generar solo CONFIGURACIONES
router.post('/services/generate-configuraciones', 
  requireAuth, 
  requireUser, 
  aiCommandLimiter,
  generateConfiguraciones
);

// Middleware para manejar errores específicos de agentes
router.use((error, req, res, next) => {
  console.error('Agent route error:', error);
  
  // Errores específicos de agentes
  if (error.message.includes('Agent') || error.message.includes('OpenAI')) {
    return res.status(503).json({
      success: false,
      error: 'Servicio de agentes temporalmente no disponible',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      retry_after: 30 // segundos
    });
  }
  
  // Error genérico
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

export default router;