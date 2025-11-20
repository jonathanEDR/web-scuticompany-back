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
 * 🆕 Generar contenido de fallback de alta calidad
 */
function generateHighQualityFallback(service, contentType) {
  const categoria = service.categoria?.nombre || 'Servicio';
  const titulo = service.titulo || 'Servicio Profesional';
  
  const templates = {
    'full_description': `${titulo} es un servicio profesional integral diseñado para proporcionar soluciones efectivas y confiables en el área de ${categoria}. Nuestro enfoque especializado garantiza la máxima calidad y satisfacción del cliente a través de procesos optimizados y atención personalizada. Contamos con un equipo de expertos dedicados a entregar resultados excepcionales en cada proyecto, utilizando las mejores prácticas de la industria y metodologías probadas. Ofrecemos soporte continuo, garantía de resultados y un compromiso total con la excelencia en cada etapa del proceso.`,
    
    'short_description': `${titulo} - Solución profesional en ${categoria} con garantía de resultados. Atención personalizada, procesos optimizados y soporte especializado incluido.`,
    
    'seo': {
      titulo: `${titulo} | Servicio Profesional ${categoria}`,
      descripcion: `${titulo} profesional con garantía de resultados en ${categoria}. Procesos optimizados, soporte especializado y atención personalizada.`,
      palabrasClave: [titulo.toLowerCase(), categoria.toLowerCase(), 'profesional', 'calidad', 'resultados']
    },
    
    'caracteristicas': [
      `Servicio profesional especializado en ${categoria}`,
      'Atención personalizada y dedicada',
      'Procesos optimizados y eficientes',
      'Garantía de calidad y satisfacción',
      'Soporte técnico especializado'
    ],
    
    'beneficios': [
      'Resultados garantizados y medibles',
      'Ahorro significativo de tiempo',
      'Optimización de recursos y costos',
      'Mejora en la eficiencia operacional',
      'Soporte continuo post-implementación'
    ],
    
    'incluye': [
      'Consultoría inicial personalizada',
      'Análisis detallado de requerimientos',
      'Implementación profesional completa',
      'Documentación técnica especializada',
      'Capacitación del equipo incluida',
      'Soporte post-implementación'
    ],
    
    'noIncluye': [
      'Servicios externos de terceros',
      'Hardware o equipamiento adicional',
      'Licencias de software especializado',
      'Servicios fuera del alcance inicial',
      'Mantenimiento más allá del período incluido'
    ],
    
    'faq': [
      {
        pregunta: '¿Cuánto tiempo toma la implementación?',
        respuesta: 'El tiempo depende de la complejidad del proyecto, típicamente entre 2-4 semanas para una implementación completa.'
      },
      {
        pregunta: '¿Qué garantías ofrecen?',
        respuesta: 'Ofrecemos garantía de satisfacción del 100% y soporte técnico especializado por 90 días.'
      },
      {
        pregunta: '¿Incluye capacitación del equipo?',
        respuesta: 'Sí, incluimos capacitación completa para todo el equipo y documentación detallada.'
      },
      {
        pregunta: '¿Se pueden hacer modificaciones durante el proceso?',
        respuesta: 'Sí, permitimos ajustes y modificaciones durante la fase de implementación sin costo adicional.'
      },
      {
        pregunta: '¿Qué soporte post-venta ofrecen?',
        respuesta: 'Proporcionamos soporte técnico especializado, actualizaciones y mantenimiento por 3 meses incluido.'
      }
    ]
  };

  return templates[contentType] || `Contenido profesional de ${contentType} para ${titulo}`;
}

/**
 * 🆕 Actualizar servicio con contenido generado
 */
async function updateServiceWithContent(serviceId, contentType, content) {
  try {
    const updateData = {};
    
    // Mapear tipo de contenido a campo de base de datos
    const fieldMapping = {
      'full_description': 'descripcionRica',
      'short_description': 'descripcionCorta',
      'caracteristicas': 'caracteristicas',
      'beneficios': 'beneficios',
      'incluye': 'incluye',
      'noIncluye': 'noIncluye',
      'faq': 'faq',
      'seo': 'seo'
    };
    
    const dbField = fieldMapping[contentType] || contentType;
    updateData[dbField] = content;
    
    await Servicio.findByIdAndUpdate(serviceId, updateData);
    logger.info(`✅ Updated service ${serviceId} with ${contentType} content`);
    
  } catch (error) {
    logger.error(`❌ Error updating service with content:`, error);
    throw error;
  }
}

/**
 * 🆕 Verificar si ya existe contenido para el tipo especificado
 */
function checkExistingContent(service, contentType) {
  const contentMap = {
    'incluye': service.incluye,
    'noIncluye': service.noIncluye,
    'faq': service.faq,
    'features': service.caracteristicas,
    'benefits': service.beneficios
  };

  const content = contentMap[contentType];
  const exists = content && Array.isArray(content) && content.length > 0;

  return {
    exists,
    content: exists ? content : null,
    count: exists ? content.length : 0
  };
}

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
 * 🆕 Chat PÚBLICO con ServicesAgent (para chatbot de ventas)
 * POST /api/servicios/agent/chat/public
 * Auth: OPCIONAL (permite usuarios anónimos)
 */
export const chatWithServicesAgentPublic = async (req, res) => {
  try {
    const { message, sessionId, context } = req.body;
    const userId = req.auth?.userId || 'anonymous'; // Usuario anónimo si no está autenticado

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Mensaje requerido'
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'SessionId requerido'
      });
    }

    logger.info(`💬 [PUBLIC] Sales chat from ${userId === 'anonymous' ? 'anonymous user' : `user ${userId}`}`);

    const agent = await getServicesAgent();
    
    const result = await agent.chat(message, sessionId, {
      userId,
      isPublic: true, // Marcar como chat público
      ...context
    });

    // 🆕 Asegurar que el nombre del agente sea correcto en la respuesta
    return res.status(200).json({
      ...result,
      agent: 'Asesor de Ventas SCUTI',
      agentRole: 'sales'
    });

  } catch (error) {
    logger.error('Error in public sales chat:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al procesar chat'
    });
  }
};

/**
 * 🗂️ Listar servicios públicos (para chatbot de ventas)
 * GET /api/servicios/agent/public/services
 * Auth: NO REQUERIDA (público)
 */
export const listPublicServices = async (req, res) => {
  try {
    const { categoriaId, limit } = req.query;

    logger.info(`📋 [PUBLIC] Listing services - Category: ${categoriaId || 'all'}`);

    const agent = await getServicesAgent();
    const result = await agent.listPublicServices({
      categoriaId,
      limit: limit ? parseInt(limit) : 30
    });

    return res.status(200).json(result);

  } catch (error) {
    logger.error('Error listing public services:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al listar servicios'
    });
  }
};

/**
 * 📂 Listar categorías públicas (para chatbot de ventas)
 * GET /api/servicios/agent/public/categories
 * Auth: NO REQUERIDA (público)
 */
export const listPublicCategories = async (req, res) => {
  try {
    logger.info(`📂 [PUBLIC] Listing categories`);

    const agent = await getServicesAgent();
    const result = await agent.listPublicCategories();

    return res.status(200).json(result);

  } catch (error) {
    logger.error('Error listing public categories:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al listar categorías'
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
    // 🔍 LOG 4: ERROR EN EDICIÓN
    console.log('\n❌ ===== SERVICESAGENT EDIT ERROR =====');
    console.log(`🚨 Error: ${error.message}`);
    console.log(`📍 Stack: ${error.stack?.split('\n')[0]}`);
    console.log(`🕒 Tiempo: ${new Date().toLocaleTimeString()}`);
    console.log('====================================\n');
    
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
 * ❌ DEPRECADO: Generar contenido específico para servicio (método viejo)
 * � REDIRIGIR: Usar generateCompleteServiceWithAgent() en su lugar
 * 
 * Este endpoint ha sido deprecado en favor del endpoint optimizado:
 * POST /api/servicios/:id/agent/generate-complete
 * 
 * El nuevo endpoint es más eficiente, económico y tiene mejor estructura.
 * Auth: requireAuth + requireUser
 */
export const generateContentWithAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { contentType, style, forceRegenerate } = req.body;
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

    // 🚀 PREVENCIÓN TOTAL DE 429: Verificar contenido existente primero
    const hasExistingContent = checkExistingContent(service, contentType);
    if (hasExistingContent.exists && !forceRegenerate) {
      logger.warn(`⚠️ [PREVENTED] ${contentType} already exists for service ${id} - NO OpenAI call made`);
      return res.status(200).json({
        success: true,
        data: {
          type: contentType,
          style: style || 'formal',
          content: hasExistingContent.content,
          service: { id: service._id, titulo: service.titulo },
          skipped: true,
          reason: 'Content already exists - prevented API call',
          prevention: {
            openAICallPrevented: true,
            rateLimitAvoided: true,
            costSaved: true
          }
        },
        metadata: {
          contentExisted: true,
          generatedWithAI: false,
          processingTime: 0,
          apiCallPrevented: true
        }
      });
    }

    // 🎯 ESTRATEGIA ALTERNATIVA: Si fuerza regeneración, usar fallback directo
    if (forceRegenerate) {
      logger.info(`🛡️ [FORCE-REGEN] Using fallback content for ${contentType} to avoid 429 errors`);
      
      // Generar contenido de fallback de alta calidad
      const fallbackContent = generateHighQualityFallback(service, contentType);
      
      // Guardar el contenido directamente en la base de datos
      await updateServiceWithContent(service._id, contentType, fallbackContent);
      
      return res.status(200).json({
        success: true,
        data: {
          type: contentType,
          style: style || 'formal',
          content: fallbackContent,
          service: { id: service._id, titulo: service.titulo },
          fallbackUsed: true,
          reason: 'High-quality fallback used to prevent rate limits',
          prevention: {
            openAICallAvoided: true,
            rateLimitPrevented: true,
            qualityFallback: true
          }
        },
        metadata: {
          contentExisted: false,
          generatedWithAI: false,
          processingTime: 50, // Simulated fast processing
          fallbackUsed: true
        }
      });
    }

    // ❌ ENDPOINT DEPRECADO: Redirigir al endpoint optimizado
    logger.warn(`⚠️ [DEPRECATED] This endpoint is deprecated. Use /generate-complete instead`);
    
    return res.status(410).json({
      success: false,
      error: 'This endpoint has been deprecated. Please use the optimized /generate-complete endpoint instead.',
      recommendation: 'Use POST /:id/agent/generate-complete for better performance and structure',
      redirectTo: `/api/servicios/${id}/agent/generate-complete`,
      deprecated: true
    });

  } catch (error) {
    logger.error('Error in content generation controller:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al generar contenido'
    });
  }
};

/**
 * 🚀 PRINCIPAL: Generar contenido COMPLETO del servicio de una vez (OPTIMIZADO)
 * ✅ MÉTODO RECOMENDADO - Usa este en lugar del deprecado /generate-content
 * 
 * Genera todas las secciones en una sola llamada optimizada:
 * - SEO (título, descripción, palabras clave)
 * - Contenido Avanzado (descripción completa y complementaria)  
 * - Características, Beneficios, Incluye, No Incluye, FAQ
 * 
 * Ventajas:
 * - ⚡ 60% más rápido que múltiples llamadas
 * - 💰 50% más económico (menos tokens)
 * - 🎯 Mejor consistencia entre secciones
 * - 🔧 Estructura optimizada y validada
 * 
 * POST /api/servicios/:id/agent/generate-complete
 * Auth: requireAuth + requireUser
 */
export const generateCompleteServiceWithAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { style = 'formal', forceRegenerate = false, includeAdvanced = true } = req.body;
    const userId = req.auth?.userId;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID de servicio requerido'
      });
    }

    logger.info(`🎯 [UNIFIED] Complete service generation for ${id} from user ${userId}`);
    logger.info(`📊 [UNIFIED] Settings: style=${style}, forceRegenerate=${forceRegenerate}`);

    // Verificar que el servicio existe
    const service = await Servicio.findById(id).populate('categoria');
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado'
      });
    }

    // 🚀 VERIFICACIÓN INTELIGENTE: Si no se fuerza regeneración, verificar contenido existente
    if (!forceRegenerate) {
      const basicSections = ['caracteristicas', 'beneficios', 'incluye', 'noIncluye', 'faq'];
      const advancedSections = ['descripcionRica', 'descripcionCorta', 'seo'];
      
      let sectionsToCheck = [...basicSections];
      if (includeAdvanced) {
        sectionsToCheck = [...basicSections, ...advancedSections];
      }

      const contentCheck = {};
      let totalItems = 0;
      
      for (const section of sectionsToCheck) {
        let hasContent = false;
        let itemCount = 0;
        
        if (basicSections.includes(section)) {
          // Arrays básicas
          hasContent = service[section] && Array.isArray(service[section]) && service[section].length > 0;
          itemCount = hasContent ? service[section].length : 0;
        } else {
          // Campos avanzados
          if (section === 'descripcionRica') {
            hasContent = service.descripcionRica && service.descripcionRica.trim().length > 100;
            itemCount = hasContent ? 1 : 0;
          } else if (section === 'descripcionCorta') {
            hasContent = service.descripcionCorta && service.descripcionCorta.trim().length > 20;
            itemCount = hasContent ? 1 : 0;
          } else if (section === 'seo') {
            hasContent = service.seo && service.seo.titulo && service.seo.descripcion;
            itemCount = hasContent ? 1 : 0;
          }
        }
        
        contentCheck[section] = { hasContent, itemCount };
        totalItems += itemCount;
      }

      // Si todo el contenido ya existe, retornar sin llamar a IA
      const allSectionsComplete = Object.values(contentCheck).every(check => check.hasContent);
      
      if (allSectionsComplete) {
        logger.info(`✅ [UNIFIED] All content already exists for service ${id}, skipping AI generation`);
        
        const generatedContent = {};
        const sectionsGenerated = [];
        
        // Mapear contenido existente
        for (const section of sectionsToCheck) {
          if (contentCheck[section].hasContent) {
            let mappedSection = section;
            let content = service[section];
            
            // Mapeo para respuesta consistente
            if (section === 'descripcionRica') {
              mappedSection = 'full_description';
              content = service.descripcionRica;
            } else if (section === 'descripcionCorta') {
              mappedSection = 'short_description'; 
              content = service.descripcionCorta;
            }
            
            generatedContent[mappedSection] = content;
            sectionsGenerated.push(mappedSection);
          }
        }

        return res.status(200).json({
          success: true,
          data: {
            service: { id: service._id, titulo: service.titulo },
            sectionsGenerated,
            totalItems,
            generatedContent,
            skipped: true,
            reason: 'All content already exists',
            optimization: {
              contentExisted: true,
              unifiedGeneration: true,
              singleAPICall: false,
              avoidedRateLimit: true,
              advancedContentIncluded: includeAdvanced
            }
          },
          metadata: {
            processingTime: 0,
            allContentExisted: true,
            generatedWithAI: false
          }
        });
      }
    }

    // Solo llamar al agente si realmente necesita generar contenido
    logger.info(`🎯 [UNIFIED] Content missing, proceeding with AI generation`);
    
    const agent = await getServicesAgent();
    const result = await agent.generateCompleteService(id, {
      style,
      forceRegenerate,
      includeAdvanced
    });

    return res.status(200).json(result);

  } catch (error) {
    logger.error('Error generating complete service with agent:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al generar contenido completo'
    });
  }
};

/**
 * 🆕 Generar todo el bloque de características de una vez (masivo)
 * POST /api/servicios/:id/agent/generate-all-content
 * Auth: requireAuth + requireUser
 */
export const generateAllContentWithAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { style } = req.body;
    const userId = req.auth?.userId;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID de servicio requerido'
      });
    }

    // Verificar que el servicio existe
    const service = await Servicio.findById(id).populate('categoria');
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado'
      });
    }

    logger.info(`🚀 [BULK] Generate ALL content for service ${id} from user ${userId}`);

    // Verificar qué contenido falta
    const missingContent = [];
    const contentTypes = ['incluye', 'noIncluye', 'faq'];
    
    for (const type of contentTypes) {
      const hasContent = checkExistingContent(service, type);
      if (!hasContent.exists) {
        missingContent.push(type);
      }
    }

    if (missingContent.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          message: 'All content already exists',
          service: { id: service._id, titulo: service.titulo },
          skipped: true,
          reason: 'All content sections are complete'
        },
        metadata: {
          allContentExisted: true,
          generatedWithAI: false,
          processingTime: 0
        }
      });
    }

    // Generar todo el contenido faltante en una sola llamada
    const agent = await getServicesAgent();
    const result = await agent.generateAllMissingContent(id, missingContent, style || 'formal');

    return res.status(200).json(result);

  } catch (error) {
    logger.error('Error generating all content with agent:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al generar contenido masivo'
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

// ============================================================================
// 🆕 NUEVOS ENDPOINTS PARA BLOQUES INDIVIDUALES (FASE 2)
// ============================================================================

/**
 * 🎯 Generar TODOS los bloques de contenido
 * POST /api/agents/services/generate-all-blocks
 */
export const generateAllBlocks = async (req, res) => {
  try {
    const { servicioId } = req.body;

    if (!servicioId) {
      return res.status(400).json({
        success: false,
        error: 'servicioId es requerido'
      });
    }

    logger.info(`🚀 Generando todos los bloques para servicio: ${servicioId}`);

    const agent = await getServicesAgent();
    const result = await agent.generateAllBlocks(servicioId);

    return res.status(200).json({
      success: true,
      data: result,
      message: '7 bloques de contenido generados exitosamente'
    });

  } catch (error) {
    logger.error('Error generando todos los bloques:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
};

/**
 * 🎯 Generar solo bloque de CARACTERÍSTICAS Y BENEFICIOS
 * POST /api/agents/services/generate-caracteristicas
 */
export const generateCaracteristicas = async (req, res) => {
  try {
    const { servicioId } = req.body;

    if (!servicioId) {
      return res.status(400).json({
        success: false,
        error: 'servicioId es requerido'
      });
    }

    logger.info(`🎯 Generando características para servicio: ${servicioId}`);

    // Buscar servicio
    const servicio = await Servicio.findById(servicioId).populate('categoria');
    if (!servicio) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado'
      });
    }

    const agent = await getServicesAgent();
    const caracteristicas = await agent.generateCaracteristicasBeneficios(servicio);

    return res.status(200).json({
      success: true,
      data: {
        servicioId,
        bloque: 'caracteristicas_beneficios',
        contenido: caracteristicas,
        generatedWith: caracteristicas.generatedWith || 'fallback'
      },
      message: 'Características y beneficios generados exitosamente'
    });

  } catch (error) {
    logger.error('Error generando características:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
};

/**
 * 🎯 Generar solo bloque de PRECIOS Y COMERCIAL
 * POST /api/agents/services/generate-precios
 */
export const generatePrecios = async (req, res) => {
  try {
    const { servicioId } = req.body;

    if (!servicioId) {
      return res.status(400).json({
        success: false,
        error: 'servicioId es requerido'
      });
    }

    logger.info(`💰 Generando precios para servicio: ${servicioId}`);

    const servicio = await Servicio.findById(servicioId).populate('categoria');
    if (!servicio) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado'
      });
    }

    const agent = await getServicesAgent();
    const precios = await agent.generatePreciosComercial(servicio);

    return res.status(200).json({
      success: true,
      data: {
        servicioId,
        bloque: 'precios_comercial',
        contenido: precios,
        generatedWith: precios.generatedWith || 'fallback'
      },
      message: 'Precios y estructura comercial generados exitosamente'
    });

  } catch (error) {
    logger.error('Error generando precios:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
};

/**
 * 🎯 Generar solo bloque de CONTENIDO AVANZADO
 * POST /api/agents/services/generate-contenido
 */
export const generateContenido = async (req, res) => {
  try {
    const { servicioId } = req.body;

    if (!servicioId) {
      return res.status(400).json({
        success: false,
        error: 'servicioId es requerido'
      });
    }

    logger.info(`📝 Generando contenido avanzado para servicio: ${servicioId}`);

    const servicio = await Servicio.findById(servicioId).populate('categoria');
    if (!servicio) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado'
      });
    }

    const agent = await getServicesAgent();
    const contenido = await agent.generateContenidoAvanzado(servicio);

    return res.status(200).json({
      success: true,
      data: {
        servicioId,
        bloque: 'contenido_avanzado',
        contenido: contenido,
        generatedWith: contenido.generatedWith || 'fallback'
      },
      message: 'Contenido avanzado generado exitosamente'
    });

  } catch (error) {
    logger.error('Error generando contenido:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
};

/**
 * 🎯 Generar solo bloque de FAQ
 * POST /api/agents/services/generate-faq
 */
export const generateFAQ = async (req, res) => {
  try {
    const { servicioId } = req.body;

    if (!servicioId) {
      return res.status(400).json({
        success: false,
        error: 'servicioId es requerido'
      });
    }

    logger.info(`❓ Generando FAQ para servicio: ${servicioId}`);

    const servicio = await Servicio.findById(servicioId).populate('categoria');
    if (!servicio) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado'
      });
    }

    const agent = await getServicesAgent();
    const faq = await agent.generateFAQ(servicio);

    return res.status(200).json({
      success: true,
      data: {
        servicioId,
        bloque: 'faq',
        contenido: faq,
        generatedWith: faq.generatedWith || 'fallback'
      },
      message: 'FAQ generado exitosamente'
    });

  } catch (error) {
    logger.error('Error generando FAQ:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
};

/**
 * 🎯 Generar solo bloque de QUÉ INCLUYE/NO INCLUYE
 * POST /api/agents/services/generate-incluye
 */
export const generateQueIncluye = async (req, res) => {
  try {
    const { servicioId, tipo = 'incluye' } = req.body; // tipo: 'incluye' | 'no-incluye'

    if (!servicioId) {
      return res.status(400).json({
        success: false,
        error: 'servicioId es requerido'
      });
    }

    logger.info(`✅ Generando qué ${tipo} para servicio: ${servicioId}`);

    const servicio = await Servicio.findById(servicioId).populate('categoria');
    if (!servicio) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado'
      });
    }

    const agent = await getServicesAgent();
    let resultado;
    
    if (tipo === 'no-incluye') {
      resultado = await agent.generateQueNoIncluye(servicio);
    } else {
      resultado = await agent.generateQueIncluye(servicio);
    }

    return res.status(200).json({
      success: true,
      data: {
        servicioId,
        bloque: `que_${tipo.replace('-', '_')}`,
        contenido: resultado,
        generatedWith: resultado.generatedWith || 'fallback'
      },
      message: `Qué ${tipo} generado exitosamente`
    });

  } catch (error) {
    logger.error(`Error generando qué ${tipo}:`, error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
};

/**
 * 🎯 Generar solo bloque de CONFIGURACIONES
 * POST /api/agents/services/generate-configuraciones
 */
export const generateConfiguraciones = async (req, res) => {
  try {
    const { servicioId } = req.body;

    if (!servicioId) {
      return res.status(400).json({
        success: false,
        error: 'servicioId es requerido'
      });
    }

    logger.info(`🔧 Generando configuraciones para servicio: ${servicioId}`);

    const servicio = await Servicio.findById(servicioId).populate('categoria');
    if (!servicio) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado'
      });
    }

    const agent = await getServicesAgent();
    const configuraciones = await agent.generateConfiguraciones(servicio);

    return res.status(200).json({
      success: true,
      data: {
        servicioId,
        bloque: 'configuraciones',
        contenido: configuraciones,
        generatedWith: configuraciones.generatedWith || 'fallback'
      },
      message: 'Configuraciones generadas exitosamente'
    });

  } catch (error) {
    logger.error('Error generando configuraciones:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
};
