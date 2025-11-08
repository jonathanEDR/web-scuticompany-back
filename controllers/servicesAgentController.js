/**
 * Services Agent Controller - Endpoints para interacción con ServicesAgent
 * 
 * Rutas protegidas con autenticación y permisos:
 * - Chat: requireAuth + requireUser
 * - Create: requireAuth + canCreateServices
 * - Edit: requireAuth + canEditService
 * - Analyze: requireAuth + requireUser
 * - Pricing: requireAuth + requireUser
 */

import ServicesAgent from '../agents/specialized/services/ServicesAgent.js';
import Servicio from '../models/Servicio.js';
import logger from '../utils/logger.js';

// Instancia singleton del agente
let servicesAgentInstance = null;

/**
 * Obtener instancia del ServicesAgent
 */
const getServicesAgent = async () => {
  if (!servicesAgentInstance) {
    servicesAgentInstance = new ServicesAgent({
      enabled: true,
      name: 'ServicesAgent'
    });
    // Activar el agente para inicializar todos los handlers
    await servicesAgentInstance.activate();
    logger.info('✅ ServicesAgent instance created and activated');
  }
  return servicesAgentInstance;
};

/**
 * Chat con ServicesAgent
 * POST /api/servicios/agent/chat
 * Auth: requireAuth + requireUser
 */
export const chatWithServicesAgent = async (req, res) => {
  try {
    const { message, context } = req.body;
    const userId = req.auth?.userId;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Mensaje requerido'
      });
    }

    logger.info(`💬 Chat request from user ${userId}`);

    const agent = await getServicesAgent();
    
    // Extraer sessionId del context y pasar el resto por separado
    const { sessionId, previousMessages, ...restContext } = context || {};
    
    logger.info(`🔑 [CONTROLLER] Session ID: ${sessionId || 'NONE'}`);
    
    const result = await agent.chat(message, sessionId, {
      userId,
      previousMessages,
      ...restContext
    });

    return res.status(200).json(result);

  } catch (error) {
    logger.error('Error in chat with services agent:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al procesar chat'
    });
  }
};

/**
 * Crear servicio con IA
 * POST /api/servicios/agent/create
 * Auth: requireAuth + canCreateServices
 */
export const createServiceWithAgent = async (req, res) => {
  try {
    const { prompt, serviceData, options } = req.body;
    const userId = req.auth?.userId;

    if (!prompt && !serviceData) {
      return res.status(400).json({
        success: false,
        error: 'Prompt o serviceData requerido'
      });
    }

    logger.info(`🎨 Create service request from user ${userId}`);

    const agent = await getServicesAgent();
    const result = await agent.createService(prompt || serviceData, {
      userId,
      ...options
    });

    // Si la creación fue exitosa, devolver el servicio creado
    if (result.success && result.data?.serviceId) {
      const service = await Servicio.findById(result.data.serviceId)
        .populate('categoria')
        .lean();
      
      return res.status(201).json({
        success: true,
        message: 'Servicio creado exitosamente',
        data: {
          service,
          ...result.data
        },
        metadata: result.metadata
      });
    }

    return res.status(200).json(result);

  } catch (error) {
    logger.error('Error creating service with agent:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al crear servicio'
    });
  }
};

/**
 * Editar servicio con IA
 * POST /api/servicios/:id/agent/edit
 * Auth: requireAuth + canEditService
 */
export const editServiceWithAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { instructions, optimizationType, options } = req.body;
    const userId = req.auth?.userId;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID de servicio requerido'
      });
    }

    if (!instructions) {
      return res.status(400).json({
        success: false,
        error: 'Instrucciones de edición requeridas'
      });
    }

    // Verificar que el servicio existe
    const service = await Servicio.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado'
      });
    }

    logger.info(`✏️ Edit service ${id} request from user ${userId}`);

    const agent = await getServicesAgent();
    const result = await agent.editService(id, instructions, {
      userId,
      optimizationType,
      ...options
    });

    // Si la edición fue exitosa, devolver el servicio actualizado
    if (result.success) {
      const updatedService = await Servicio.findById(id)
        .populate('categoria')
        .lean();
      
      return res.status(200).json({
        success: true,
        message: 'Servicio editado exitosamente',
        data: {
          service: updatedService,
          changes: result.data?.changes || []
        },
        metadata: result.metadata
      });
    }

    return res.status(200).json(result);

  } catch (error) {
    logger.error('Error editing service with agent:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al editar servicio'
    });
  }
};

/**
 * Analizar servicio con IA
 * POST /api/servicios/:id/agent/analyze
 * Auth: requireAuth + requireUser
 */
export const analyzeServiceWithAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { analysisType, options } = req.body;
    const userId = req.auth?.userId;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID de servicio requerido'
      });
    }

    // Verificar que el servicio existe
    const service = await Servicio.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado'
      });
    }

    logger.info(`📊 Analyze service ${id} request from user ${userId}`);

    const agent = await getServicesAgent();
    const result = await agent.analyzeService(id, {
      userId,
      analysisType,
      ...options
    });

    return res.status(200).json(result);

  } catch (error) {
    logger.error('Error analyzing service with agent:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al analizar servicio'
    });
  }
};

/**
 * 🆕 Generar contenido específico para servicio
 * POST /api/servicios/:id/agent/generate-content
 * Auth: requireAuth + requireUser
 */
export const generateContentWithAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { contentType, style } = req.body;
    const userId = req.auth?.userId;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID de servicio requerido'
      });
    }

    if (!contentType) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de contenido requerido (full_description, short_description, features, benefits, faq)'
      });
    }

    // Verificar que el servicio existe
    const service = await Servicio.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado'
      });
    }

    logger.info(`📝 Generate content ${contentType} for service ${id} from user ${userId}`);

    const agent = await getServicesAgent();
    const result = await agent.generateContent(id, contentType, style || 'formal');

    return res.status(200).json(result);

  } catch (error) {
    logger.error('Error generating content with agent:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al generar contenido'
    });
  }
};

/**
 * Analizar portfolio completo
 * POST /api/servicios/agent/analyze-portfolio
 * Auth: requireAuth + requireUser
 */
export const analyzePortfolio = async (req, res) => {
  try {
    const { filters, options } = req.body;
    const userId = req.auth?.userId;

    logger.info(`📊 Analyze portfolio request from user ${userId}`);

    const agent = await getServicesAgent();
    
    // Construir query de servicios
    const query = { estado: 'activo' };
    if (filters?.categoria) query.categoria = filters.categoria;
    
    const services = await Servicio.find(query).populate('categoria').lean();

    if (services.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No hay servicios para analizar',
        data: {
          stats: { total: 0 },
          recommendations: []
        }
      });
    }

    // Usar el analyzer directamente para análisis de portfolio
    const result = await agent.executeTask('analyze_portfolio', {
      services,
      ...options
    });

    return res.status(200).json(result);

  } catch (error) {
    logger.error('Error analyzing portfolio:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al analizar portfolio'
    });
  }
};

/**
 * Sugerir pricing para servicio
 * POST /api/servicios/agent/suggest-pricing
 * Auth: requireAuth + requireUser
 */
export const suggestPricing = async (req, res) => {
  try {
    const { serviceData, marketData, options } = req.body;
    const userId = req.auth?.userId;

    if (!serviceData) {
      return res.status(400).json({
        success: false,
        error: 'Datos de servicio requeridos'
      });
    }

    logger.info(`💰 Pricing suggestion request from user ${userId}`);

    const agent = await getServicesAgent();
    const result = await agent.executeTask('suggest_pricing', {
      serviceData,
      marketData,
      ...options
    });

    return res.status(200).json(result);

  } catch (error) {
    logger.error('Error suggesting pricing:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al sugerir pricing'
    });
  }
};

/**
 * Analizar pricing actual de un servicio
 * POST /api/servicios/:id/agent/analyze-pricing
 * Auth: requireAuth + requireUser
 */
export const analyzePricing = async (req, res) => {
  try {
    const { id } = req.params;
    const { marketData, options } = req.body;
    const userId = req.auth?.userId;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID de servicio requerido'
      });
    }

    const service = await Servicio.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado'
      });
    }

    logger.info(`💰 Analyze pricing for service ${id} from user ${userId}`);

    const agent = await getServicesAgent();
    const result = await agent.executeTask('analyze_pricing', {
      serviceId: id,
      marketData,
      ...options
    });

    return res.status(200).json(result);

  } catch (error) {
    logger.error('Error analyzing pricing:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al analizar pricing'
    });
  }
};

/**
 * Optimizar pricing de paquetes
 * POST /api/servicios/agent/optimize-packages
 * Auth: requireAuth + requireUser
 */
export const optimizePackagesPricing = async (req, res) => {
  try {
    const { packages, options } = req.body;
    const userId = req.auth?.userId;

    if (!packages || !Array.isArray(packages)) {
      return res.status(400).json({
        success: false,
        error: 'Array de paquetes requerido'
      });
    }

    logger.info(`📦 Optimize packages pricing from user ${userId}`);

    const agent = await getServicesAgent();
    const result = await agent.executeTask('optimize_packages', {
      packages,
      ...options
    });

    return res.status(200).json(result);

  } catch (error) {
    logger.error('Error optimizing packages pricing:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al optimizar pricing de paquetes'
    });
  }
};

/**
 * Obtener métricas del ServicesAgent
 * GET /api/servicios/agent/metrics
 * Auth: requireAuth + requireModerator
 */
export const getAgentMetrics = async (req, res) => {
  try {
    const agent = await getServicesAgent();
    const metrics = agent.getMetrics();

    return res.status(200).json({
      success: true,
      data: metrics
    });

  } catch (error) {
    logger.error('Error getting agent metrics:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener métricas'
    });
  }
};

/**
 * Obtener status del ServicesAgent
 * GET /api/servicios/agent/status
 * Auth: requireAuth + requireUser
 */
export const getAgentStatus = async (req, res) => {
  try {
    const agent = await getServicesAgent();
    const metrics = agent.getMetrics();

    return res.status(200).json({
      success: true,
      data: {
        name: 'ServicesAgent',
        enabled: true,
        capabilities: agent.capabilities || [],
        metrics: {
          totalTasks: metrics.totalTasks || 0,
          successRate: metrics.successRate || 0,
          averageTime: metrics.averageTime || 0
        },
        status: 'operational'
      }
    });

  } catch (error) {
    logger.error('Error getting agent status:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener status'
    });
  }
};

export default {
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
};
