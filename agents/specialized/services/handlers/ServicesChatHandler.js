/**
 * ServicesChatHandler - Manejador de chat interactivo para ServicesAgent
 * 
 * Responsabilidades:
 * - Chat conversacional sobre servicios
 * - Responder preguntas del usuario
 * - Proporcionar recomendaciones personalizadas
 * - Guiar en creación y optimización de servicios
 * - Mantener contexto de conversación
 */

import openaiService from '../../../services/OpenAIService.js';
import Servicio from '../../../../models/Servicio.js';
import PaqueteServicio from '../../../../models/PaqueteServicio.js';
import Categoria from '../../../../models/Categoria.js';
import logger from '../../../../utils/logger.js';

class ServicesChatHandler {
  constructor(config = {}) {
    this.config = {
      maxContextLength: config.maxContextLength || 10,
      maxResponseLength: config.maxResponseLength || 500,
      includeRecommendations: config.includeRecommendations !== false,
      includeExamples: config.includeExamples !== false,
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1500,
      ...config
    };

    // Caché de sesiones
    this.sessions = new Map();
    
    // Métricas
    this.metrics = {
      totalChats: 0,
      successCount: 0,
      errorCount: 0,
      averageResponseTime: 0
    };

    logger.info('✅ ServicesChatHandler initialized');
  }

  /**
   * Manejar mensaje de chat
   */
  async handleChatMessage(message, sessionId, context = {}) {
    const startTime = Date.now();
    this.metrics.totalChats++;

    try {
      // Generar sessionId si no se proporciona
      if (!sessionId) {
        sessionId = `services_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Validar entrada
      this.validateInput(message, sessionId);

      // Obtener o crear sesión
      const session = this.getOrCreateSession(sessionId);

      // Agregar mensaje del usuario al contexto
      session.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      // 🆕 VERIFICAR SI ESTAMOS EN MODO RECOPILACIÓN
      if (session.formState.isCollecting) {
        return await this.handleFormCollection(message, session, context);
      }

      // Detectar intención del mensaje
      const intent = await this.detectIntent(message, context);

      // 🆕 SI ES UNA PREGUNTA CONVERSACIONAL, RESPONDER NATURALMENTE
      if (intent.type === 'chat_question') {
        logger.info('💬 [CHAT] Conversational question - Generating AI response');
        
        // Obtener contexto relevante de servicios
        const servicesContext = await this.getServicesContext(intent, context);

        // Construir prompt con contexto
        const prompt = this.buildChatPrompt(message, session, servicesContext, intent, context);

        // Generar respuesta con IA
        const aiResponse = await this.generateAIResponse(prompt, sessionId);

        // Procesar y enriquecer respuesta
        const enrichedResponse = await this.enrichResponse(aiResponse, intent, servicesContext);

        // Agregar respuesta del asistente al contexto
        session.messages.push({
          role: 'assistant',
          content: enrichedResponse.message,
          timestamp: new Date()
        });

        // Limpiar contexto antiguo
        this.cleanupSessionContext(session);

        // Actualizar métricas
        this.updateMetrics(startTime, true);

        return {
          success: true,
          data: enrichedResponse,
          metadata: {
            sessionId: session.id,
            intent: intent.type,
            responseTime: Date.now() - startTime
          }
        };
      }

      // 🆕 SI LA INTENCIÓN ES CREAR SERVICIO, DECIDIR FLUJO
      if (intent.type === 'create_service') {
        logger.success('✨ [CREATE_SERVICE] Intent detected');
        
        // Analizar si el prompt tiene información completa
        const completeness = this.analyzePromptCompleteness(message);
        
        if (completeness.isComplete) {
          logger.success('🚀 [DIRECT_MODE] Complete prompt - Creating service directly');
          return await this.createDirectlyFromPrompt(message, session, context);
        } else {
          logger.info('💬 [FORM_MODE] Incomplete prompt - Starting form collection');
          // Extraer contexto del mensaje para ejemplos dinámicos
          const serviceContext = this.extractServiceContext(message);
          return await this.startFormCollection(session, intent, { ...context, serviceContext });
        }
      }

      // Log para otras intenciones importantes
      if (intent.type === 'edit_service') {
        logger.info('✏️ [EDIT_SERVICE] Intent detected');
      } else if (intent.type === 'analyze_service') {
        logger.info('📊 [ANALYZE_SERVICE] Intent detected');
      }

      // Obtener contexto relevante de servicios
      const servicesContext = await this.getServicesContext(intent, context);

      // Construir prompt con contexto
      const prompt = this.buildChatPrompt(message, session, servicesContext, intent, context);

      // Generar respuesta con IA
      const aiResponse = await this.generateAIResponse(prompt, sessionId);

      // Procesar y enriquecer respuesta
      const enrichedResponse = await this.enrichResponse(aiResponse, intent, servicesContext);

      // Agregar respuesta del asistente al contexto
      session.messages.push({
        role: 'assistant',
        content: enrichedResponse.message,
        timestamp: new Date()
      });

      // Limpiar contexto antiguo
      this.cleanupSessionContext(session);

      // Actualizar métricas
      this.updateMetrics(startTime, true);

      logger.success(`✅ Chat message processed in ${Date.now() - startTime}ms`);

      return {
        success: true,
        data: enrichedResponse,
        metadata: {
          sessionId,
          intent: intent.type,
          processingTime: Date.now() - startTime,
          contextSize: session.messages.length
        }
      };

    } catch (error) {
      this.updateMetrics(startTime, false);
      logger.error('❌ Error handling chat message:', error);

      return {
        success: false,
        error: error.message,
        fallbackResponse: this.getFallbackResponse(message)
      };
    }
  }

  /**
   * Validar entrada
   */
  validateInput(message, sessionId) {
    if (!message || typeof message !== 'string') {
      throw new Error('Message must be a non-empty string');
    }

    if (message.length > 1000) {
      throw new Error('Message too long (max 1000 characters)');
    }

    // sessionId ya no es requerido porque se genera automáticamente si falta
  }

  /**
   * Obtener o crear sesión
   */
  getOrCreateSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        id: sessionId,
        messages: [],
        createdAt: new Date(),
        lastActivity: new Date(),
        preferences: {},
        // 🆕 Estado del formulario conversacional
        formState: {
          isCollecting: false,
          intent: null,
          collectedData: {},
          requiredFields: [],
          currentField: null,
          completedFields: []
        }
      });
    }

    const session = this.sessions.get(sessionId);
    session.lastActivity = new Date();

    return session;
  }

  /**
   * Detectar intención del usuario
   */
  async detectIntent(message, context = {}) {
    const messageLower = message.toLowerCase();

    // 🆕 PRIORIDAD 1: Detectar preguntas conversacionales (antes que comandos)
    const questionPatterns = [
      // Preguntas sobre implementación/inteligencia artificial
      /necesito implementar/i,
      /cómo implemento/i,
      /cómo puedo implementar/i,
      /quiero implementar/i,
      /necesito (agregar|añadir|incorporar)/i,
      
      // Preguntas sobre servicios referentes/existentes
      /servicios? referentes?/i,
      /qué servicios? (tengo|hay|existen)/i,
      /(muéstrame|enséñame|cuáles son) (los|mis)? servicios?/i,
      
      // Preguntas generales
      /^(qué|cómo|cuál|cuáles|por qué|para qué|dónde|cuándo)\b/i,
      /\?$/,  // Termina en signo de pregunta
      
      // Consultas sobre capacidades
      /puedes (ayudarme|ayudar|hacer|crear)/i,
      /qué (puedes|podrías) (hacer|ayudar)/i,
      /cómo (funciona|trabajas|ayudas)/i,
      
      // Solicitudes de información
      /(explica|explicar|cuéntame|dime|háblame|información sobre)/i,
      /(necesito (saber|conocer|entender)|quiero (saber|conocer|entender))/i
    ];

    // Verificar si es una pregunta
    const isQuestion = questionPatterns.some(pattern => pattern.test(message));
    
    if (isQuestion) {
      logger.info('💬 [INTENT] Conversational question detected');
      return {
        type: 'chat_question',
        confidence: 0.95,
        keywords: ['question']
      };
    }

    // 🆕 PRIORIDAD 2: Comandos de acción específicos
    const intentKeywords = {
      // CREATE: Solo si hay comando explícito de creación
      create_service: [
        // Frases completas (alta confianza)
        'crear un servicio',
        'crea un servicio', 
        'nuevo servicio',
        'agregar servicio',
        'genera un servicio',
        'generar un servicio',
        'generar servicio',
        'quiero crear un servicio',
        // Palabras sueltas (baja confianza - solo si no es pregunta)
        'crear', 
        'crea',
        'genera',
        'generar',
        'nuevo'
      ],
      edit_service: ['editar', 'modificar', 'actualizar servicio', 'cambiar servicio'],
      analyze_service: ['analizar servicio', 'análisis del servicio', 'revisar servicio', 'evaluar servicio'],
      optimize_service: ['optimizar servicio', 'mejorar servicio', 'perfeccionar servicio'],
      pricing_help: ['precio del servicio', 'cuánto cobrar', 'pricing', 'costo', 'tarifa'],
      package_help: ['paquete', 'bundle', 'combo', 'plan']
    };

    // Buscar frases primero (mayor confianza), luego palabras sueltas
    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      // Primero buscar frases multi-palabra (más específicas)
      const phraseKeywords = keywords.filter(k => k.includes(' '));
      const matchedPhrases = phraseKeywords.filter(phrase => messageLower.includes(phrase));
      
      if (matchedPhrases.length > 0) {
        logger.success(`✅ [INTENT] ${intent} (phrase match)`);
        return {
          type: intent,
          confidence: 0.9,
          keywords: matchedPhrases
        };
      }
      
      // Palabras sueltas solo si NO es pregunta
      if (!isQuestion) {
        const wordKeywords = keywords.filter(k => !k.includes(' '));
        const matchedWords = wordKeywords.filter(word => messageLower.includes(word));
        
        if (matchedWords.length > 0) {
          logger.success(`✅ [INTENT] ${intent} (word match)`);
          return {
            type: intent,
            confidence: 0.7,  // Menor confianza para palabras sueltas
            keywords: matchedWords
          };
        }
      }
    }

    // 🆕 PRIORIDAD 3: Por defecto, es conversación general
    logger.info('💬 [INTENT] General conversation');
    return {
      type: 'chat_question',
      confidence: 0.6,
      keywords: []
    };
  }

  /**
   * Extraer contexto del tipo de servicio del mensaje
   */
  extractServiceContext(message) {
    const messageLower = message.toLowerCase();
    
    // Eliminar palabras comunes de comandos
    const cleanMessage = messageLower
      .replace(/crear?|nuevo|agregar|genera(r)?|quiero|servicio|un|de|el|la|los|las/g, '')
      .trim();
    
    // Detectar tipo de servicio mencionado
    const serviceType = cleanMessage || 'servicio profesional';
    
    logger.info(`🎯 [CONTEXT] Extracted service type: "${serviceType}"`);
    
    return {
      serviceType,
      originalMessage: message
    };
  }

  /**
   * Analizar si el prompt tiene suficiente información para crear directamente
   */
  analyzePromptCompleteness(message) {
    const words = message.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    
    // Palabras de comando que no cuentan como descriptivas
    const commandWords = ['crear', 'crea', 'creas', 'nuevo', 'nueva', 'agregar', 'agrega', 
                          'genera', 'generar', 'genero', 'servicio', 'servicios', 
                          'un', 'una', 'de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'con', 'que'];
    
    // Contar palabras descriptivas (no son comandos y tienen más de 3 letras)
    const descriptiveWords = words.filter(w => {
      const wLower = w.toLowerCase();
      return !commandWords.includes(wLower) && w.length > 3;
    });
    
    // Criterios para considerar el prompt COMPLETO:
    // 1. Más de 12 palabras totales (suficiente contexto)
    // 2. Al menos 5 palabras descriptivas
    const hasEnoughWords = wordCount > 12;
    const hasEnoughDescription = descriptiveWords.length >= 5;
    const isComplete = hasEnoughWords && hasEnoughDescription;
    
    return {
      isComplete,
      wordCount,
      descriptiveWords: descriptiveWords.length,
      confidence: isComplete ? 0.9 : 0.3
    };
  }

  /**
   * Generar ejemplo contextual basado en el tipo de servicio
   */
  generateContextualExample(serviceType, field) {
    const examples = {
      // Consultoría
      'consultoría': {
        titulo: 'Consultoría Estratégica Empresarial',
        descripcion: 'Asesoramiento profesional para optimizar procesos y aumentar la rentabilidad'
      },
      'consultoria': {
        titulo: 'Consultoría Estratégica Empresarial',
        descripcion: 'Asesoramiento profesional para optimizar procesos y aumentar la rentabilidad'
      },
      // Desarrollo
      'desarrollo': {
        titulo: 'Desarrollo de Software a Medida',
        descripcion: 'Soluciones tecnológicas personalizadas para impulsar tu negocio'
      },
      'web': {
        titulo: 'Desarrollo Web Profesional',
        descripcion: 'Sitios web modernos, responsive y optimizados para conversión'
      },
      'app': {
        titulo: 'Desarrollo de Aplicaciones Móviles',
        descripcion: 'Apps nativas e híbridas para iOS y Android con experiencia premium'
      },
      // Marketing
      'marketing': {
        titulo: 'Marketing Digital Integral',
        descripcion: 'Estrategias de marketing para aumentar tu presencia online y ventas'
      },
      'seo': {
        titulo: 'Optimización SEO Profesional',
        descripcion: 'Posiciona tu sitio en Google y aumenta el tráfico orgánico'
      },
      // Diseño
      'diseño': {
        titulo: 'Diseño Gráfico Creativo',
        descripcion: 'Diseños únicos y profesionales que comunican la esencia de tu marca'
      },
      'diseno': {
        titulo: 'Diseño Gráfico Creativo',
        descripcion: 'Diseños únicos y profesionales que comunican la esencia de tu marca'
      }
    };

    // Buscar coincidencia por palabra clave
    const serviceTypeLower = serviceType.toLowerCase().trim();
    for (const [keyword, exampleData] of Object.entries(examples)) {
      if (serviceTypeLower.includes(keyword)) {
        return exampleData[field] || exampleData.titulo;
      }
    }

    // Fallback genérico
    if (field === 'titulo') {
      return 'Servicio Profesional de Alta Calidad';
    } else {
      return 'Solución profesional adaptada a las necesidades de tu negocio';
    }
  }

  /**
   * Capitalizar título correctamente
   */
  capitalizeTitle(title) {
    // Palabras que deben ir en minúscula (excepto al inicio)
    const lowercase = ['de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'a', 'en', 'con', 'para', 'por'];
    
    return title
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
        // Primera palabra siempre capitalizada
        if (index === 0) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        // Palabras en la lista de minúsculas
        if (lowercase.includes(word)) {
          return word;
        }
        // Resto de palabras capitalizadas
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  /**
   * Normalizar categoría con fuzzy matching
   */
  async normalizeCategory(userInput) {
    const input = userInput.toLowerCase().trim();
    
    // Obtener todas las categorías de la BD
    const categorias = await Categoria.find({ activo: true }, 'nombre slug');
    
    logger.info(`🔍 [CATEGORY] Searching for: "${input}" among ${categorias.length} categories`);
    
    // Buscar coincidencia exacta o parcial
    for (const cat of categorias) {
      const nombreLower = cat.nombre.toLowerCase();
      const slugLower = cat.slug.toLowerCase();
      
      // Coincidencia exacta (case-insensitive)
      if (nombreLower === input || slugLower === input) {
        logger.success(`✅ [CATEGORY] Exact match found: ${cat.nombre}`);
        return cat; // 🆕 Devolver objeto completo con _id
      }
      
      // Coincidencia parcial (fuzzy)
      if (nombreLower.includes(input) || input.includes(nombreLower)) {
        logger.success(`✅ [CATEGORY] Fuzzy match found: ${cat.nombre}`);
        return cat; // 🆕 Devolver objeto completo con _id
      }
      
      if (slugLower.includes(input) || input.includes(slugLower)) {
        logger.success(`✅ [CATEGORY] Slug match found: ${cat.nombre}`);
        return cat; // 🆕 Devolver objeto completo con _id
      }
    }
    
    // Sin coincidencia
    logger.warn(`⚠️ [CATEGORY] No match found for: "${input}"`);
    return null;
  }

  /**
   * Obtener contexto relevante de servicios
   */
  async getServicesContext(intent, context = {}) {
    try {
      const servicesContext = {
        totalServices: 0,
        categories: [],
        recentServices: [],
        stats: {}
      };

      // Obtener estadísticas básicas
      servicesContext.totalServices = await Servicio.countDocuments({ estado: 'activo' });

      // Obtener categorías
      const categories = await Categoria.find({}, 'nombre slug').limit(10);
      servicesContext.categories = categories.map(c => ({ nombre: c.nombre, slug: c.slug }));

      // Si el contexto incluye un serviceId específico, obtener detalles
      if (context.serviceId) {
        const service = await Servicio.findById(context.serviceId)
          .select('titulo descripcion categoria precio estado')
          .lean();
        
        if (service) {
          servicesContext.currentService = service;
        }
      }

      // Si es sobre pricing, obtener rangos de precios
      if (intent.type === 'pricing_help') {
        const pricingStats = await Servicio.aggregate([
          { $match: { estado: 'activo', precio: { $exists: true, $gt: 0 } } },
          {
            $group: {
              _id: null,
              avgPrice: { $avg: '$precio' },
              minPrice: { $min: '$precio' },
              maxPrice: { $max: '$precio' }
            }
          }
        ]);

        if (pricingStats.length > 0) {
          servicesContext.stats.pricing = pricingStats[0];
        }
      }

      // Si es sobre recomendaciones, obtener servicios destacados
      if (intent.type === 'recommendation') {
        const featured = await Servicio.find({ destacado: true, estado: 'activo' })
          .select('titulo descripcionCorta precio categoria')
          .limit(5)
          .lean();

        servicesContext.recentServices = featured;
      }

      return servicesContext;

    } catch (error) {
      logger.error('Error getting services context:', error);
      return {
        totalServices: 0,
        categories: [],
        recentServices: [],
        stats: {}
      };
    }
  }

  /**
   * Construir prompt para chat
   */
  buildChatPrompt(message, session, servicesContext, intent, context = {}) {
    const systemPrompt = `Eres un asistente experto en gestión de servicios empresariales para Web Scuti.

Tu rol es ayudar a:
- Crear nuevos servicios profesionales y atractivos
- Optimizar servicios existentes
- Analizar y mejorar descripciones
- Sugerir estrategias de pricing
- Recomendar paquetes y bundles
- Responder preguntas sobre servicios

CONTEXTO DEL NEGOCIO:
- Total de servicios activos: ${servicesContext.totalServices}
- Categorías disponibles: ${servicesContext.categories.map(c => c.nombre).join(', ')}
${servicesContext.stats.pricing ? `- Rango de precios promedio: S/ ${servicesContext.stats.pricing.minPrice} - S/ ${servicesContext.stats.pricing.maxPrice}` : ''}

ESTILO DE COMUNICACIÓN:
- Profesional pero amigable
- Claro y conciso
- Orientado a la acción
- Proporciona ejemplos cuando sea útil

IMPORTANTE:
- Siempre valida la viabilidad de sugerencias
- Considera el mercado peruano
- Enfócate en crear valor para el cliente
- Sugiere mejores prácticas de la industria`;

    // Construir historial de conversación (últimos N mensajes)
    const conversationHistory = session.messages
      .slice(-this.config.maxContextLength)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // Agregar contexto específico si existe
    let contextualInfo = '';
    if (servicesContext.currentService) {
      contextualInfo = `\n\nCONTEXTO DEL SERVICIO ACTUAL:\n` +
        `- Título: ${servicesContext.currentService.titulo}\n` +
        `- Categoría: ${servicesContext.currentService.categoria}\n` +
        `- Precio: S/ ${servicesContext.currentService.precio || 'No definido'}\n` +
        `- Estado: ${servicesContext.currentService.estado}`;
    }

    return {
      system: systemPrompt,
      history: conversationHistory,
      current: message + contextualInfo,
      intent: intent.type
    };
  }

  /**
   * Generar respuesta con IA
   */
  async generateAIResponse(prompt, sessionId) {
    if (!openaiService.isAvailable()) {
      return this.getFallbackResponse(prompt.current);
    }

    try {
      // Construir mensajes para OpenAI
      const messages = [
        { role: 'system', content: prompt.system }
      ];

      // Agregar historial
      if (prompt.history && prompt.history.length > 0) {
        messages.push(...prompt.history);
      }

      // Agregar mensaje actual
      messages.push({ role: 'user', content: prompt.current });

      // Llamar a OpenAI
      const response = await openaiService.generateIntelligentResponse(
        sessionId,
        'ServicesAgent',
        prompt.current,
        {
          messages: messages,
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens,
          contextData: { intent: prompt.intent }
        }
      );

      return response.content || response.message || response;

    } catch (error) {
      logger.error('Error generating AI response:', error);
      return this.getFallbackResponse(prompt.current);
    }
  }

  /**
   * Enriquecer respuesta con información adicional
   */
  async enrichResponse(aiResponse, intent, servicesContext) {
    const enriched = {
      message: aiResponse,
      suggestions: [],
      quickActions: [],
      relatedServices: []
    };

    // Agregar sugerencias según intención
    if (this.config.includeRecommendations) {
      switch (intent.type) {
        case 'create_service':
          enriched.suggestions = [
            'Define claramente el valor que aporta tu servicio',
            'Incluye características específicas y medibles',
            'Considera crear diferentes paquetes (Básico, Pro, Premium)'
          ];
          enriched.quickActions = [
            { 
              action: 'create_service', 
              label: '✨ Crear Servicio con IA',
              description: 'El agente te ayudará a crear un servicio completo'
            }
          ];
          break;

        case 'edit_service':
          if (servicesContext.currentService) {
            enriched.quickActions = [
              { 
                action: 'edit_service', 
                label: '✏️ Editar con IA',
                description: `Optimizar "${servicesContext.currentService.titulo}"`,
                data: { serviceId: servicesContext.currentService._id }
              },
              { 
                action: 'analyze_service', 
                label: '📊 Analizar Servicio',
                description: 'Ver análisis completo de calidad',
                data: { serviceId: servicesContext.currentService._id }
              }
            ];
          }
          break;

        case 'analyze_service':
          if (servicesContext.currentService) {
            enriched.quickActions = [
              { 
                action: 'analyze_service', 
                label: '📊 Analizar Ahora',
                description: `Análisis de "${servicesContext.currentService.titulo}"`,
                data: { serviceId: servicesContext.currentService._id }
              }
            ];
          }
          break;

        case 'pricing_help':
          if (servicesContext.stats.pricing) {
            enriched.suggestions = [
              `El precio promedio en tu portafolio es S/ ${Math.round(servicesContext.stats.pricing.avgPrice)}`,
              'Considera el valor percibido y la complejidad del servicio',
              'Ofrece diferentes niveles de precio para maximizar conversiones'
            ];
            if (servicesContext.currentService) {
              enriched.quickActions = [
                { 
                  action: 'suggest_pricing', 
                  label: '💰 Sugerir Precio',
                  description: 'Obtener recomendaciones de pricing con IA',
                  data: { serviceId: servicesContext.currentService._id }
                }
              ];
            }
          }
          break;

        case 'optimize_service':
          enriched.suggestions = [
            'Optimiza el título con palabras clave relevantes',
            'Mejora la descripción destacando beneficios sobre características',
            'Agrega pruebas sociales o casos de éxito'
          ];
          if (servicesContext.currentService) {
            enriched.quickActions = [
              { 
                action: 'analyze_service', 
                label: '📊 Analizar Servicio',
                description: 'Obtener análisis detallado',
                data: { serviceId: servicesContext.currentService._id }
              },
              { 
                action: 'edit_service', 
                label: '✏️ Optimizar con IA',
                description: 'Aplicar mejoras automáticas',
                data: { serviceId: servicesContext.currentService._id }
              }
            ];
          }
          break;

        case 'recommendation':
          enriched.quickActions = [
            { 
              action: 'analyze_portfolio', 
              label: '🔍 Analizar Portafolio',
              description: 'Ver análisis completo de todos tus servicios'
            }
          ];
          break;

        case 'recommendation':
          if (servicesContext.recentServices.length > 0) {
            enriched.relatedServices = servicesContext.recentServices.slice(0, 3);
          }
          break;
      }
    }

    return enriched;
  }

  // ============================================
  // 🆕 SISTEMA DE RECOPILACIÓN CONVERSACIONAL
  // ============================================

  /**
   * Crear servicio directamente desde un prompt completo (sin preview)
   * Va directo de detección → creación en BD
   */
  async createDirectlyFromPrompt(message, session, context) {
    logger.info('🚀 [DIRECT] Creating service from complete prompt - SKIPPING PREVIEW');
    
    try {
      // Usar IA para extraer información estructurada del mensaje
      const extractionPrompt = `TAREA: Extrae EXACTAMENTE la información del mensaje y devuelve SOLO un JSON válido.

MENSAJE: "${message}"

INSTRUCCIONES CRÍTICAS:
1. Analiza el mensaje y extrae: título, categoría, descripción corta y descripción completa
2. Devuelve EXACTAMENTE en este formato JSON (sin explicaciones, sin markdown, sin comentarios):
3. Valida que el JSON sea sintácticamente correcto ANTES de responder

FORMATO REQUERIDO:
{"titulo":"Título en formato profesional","categoria":"Una de: Desarrollo, Diseño, Marketing, Consultoría, Soporte, SEO, Contenido","descripcionCorta":"Breve descripción de 50-150 caracteres","descripcion":"Descripción completa de 200-500 caracteres"}

EJEMPLO DE SALIDA VÁLIDA:
{"titulo":"Marketing Digital Profesional","categoria":"Marketing","descripcionCorta":"Gestión completa de redes sociales y campañas","descripcion":"Servicio integral de marketing digital que incluye gestión de redes sociales, campañas publicitarias, análisis de métricas y optimización de presencia digital"}

REGLAS:
- Solo respondé con el JSON, nada más
- El JSON debe ser válido y parseable
- No incluyas tildes innecesarias que rompan JSON
- Usa comillas dobles en el JSON`;

      // Construir prompt estructurado para generateAIResponse
      const structuredPrompt = {
        system: 'Eres un extractor de datos JSON ultra preciso. Tu ÚNICA función es devolver JSON válido. No añadas explicaciones, comentarios, ni información adicional. Solo JSON.',
        current: extractionPrompt,
        history: [],
        intent: 'extract_service_data'
      };

      // Usar el método generaAIResponse que ya existe en esta clase
      const aiResponse = await this.generateAIResponse(structuredPrompt, session.id);

      // Parsear respuesta JSON
      let extractedData;
      try {
        // Limpiar la respuesta
        let cleaned = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // Si no empieza con {, buscar el primer {
        if (!cleaned.startsWith('{')) {
          const jsonStart = cleaned.indexOf('{');
          if (jsonStart !== -1) {
            cleaned = cleaned.substring(jsonStart);
          }
        }
        
        // Si no termina con }, buscar el último }
        if (!cleaned.endsWith('}')) {
          const jsonEnd = cleaned.lastIndexOf('}');
          if (jsonEnd !== -1) {
            cleaned = cleaned.substring(0, jsonEnd + 1);
          }
        }
        
        extractedData = JSON.parse(cleaned);
        logger.success(`✅ [EXTRACTION] Data extracted from prompt`);
      } catch (parseError) {
        logger.error('❌ [EXTRACTION] Failed to parse AI response');
        throw new Error('No pude extraer la información del mensaje. Por favor, sé más específico.');
      }

      // Normalizar categoría
      const categoriaObj = await this.normalizeCategory(extractedData.categoria);
      if (!categoriaObj) {
        // Si no encuentra, buscar categoría por defecto "Desarrollo"
        const defaultCategoria = await Categoria.findOne({ nombre: /desarrollo/i });
        if (!defaultCategoria) {
          throw new Error('No se pudo encontrar ninguna categoría válida');
        }
        extractedData.categoria = defaultCategoria.nombre;
        logger.warn(`⚠️ [DB_CREATE] Category not found, using default: ${defaultCategoria.nombre}`);
      } else {
        extractedData.categoria = categoriaObj.nombre;
        logger.success(`✅ [DB_CREATE] Category matched: ${categoriaObj.nombre}`);
      }

      // 🆕 CREAR SERVICIO DIRECTAMENTE EN BD (SIN PREVIEW)
      logger.info('💾 [DB_CREATE] Creating service in database...');
      
      // Usar categoría normalizada (ya validada)
      const categoriaParaServicio = categoriaObj || await Categoria.findOne({ nombre: /desarrollo/i });

      // Crear documento de servicio
      const nuevoServicio = new Servicio({
        titulo: extractedData.titulo,
        categoria: categoriaParaServicio._id,
        descripcionCorta: extractedData.descripcionCorta,
        descripcion: extractedData.descripcion,
        características: [],
        activo: true,
        createdAt: new Date(),
        source: 'direct_creation_from_prompt'
      });

      const servicioGuardado = await nuevoServicio.save();
      await servicioGuardado.populate('categoria');

      logger.success(`✅ [DB_CREATE] Service created successfully`);

      // Construir mensaje de éxito
      const successMessage = `🎉 ¡Excelente! He creado tu servicio directamente:\n\n` +
        `✨ **${extractedData.titulo}**\n` +
        `📂 Categoría: ${extractedData.categoria}\n` +
        `💬 "${extractedData.descripcionCorta}"\n\n` +
        `El servicio está ahora disponible en tu portafolio. Puedes:\n` +
        `• 🖼️ Agregar imágenes y multimedia\n` +
        `• 💰 Definir precios y paquetes\n` +
        `• 🎯 Optimizar para SEO\n` +
        `• ⭐ Configurar características adicionales\n\n` +
        `¿Quieres que optimice algo o crees otro servicio?`;

      session.messages.push({
        role: 'assistant',
        content: successMessage,
        timestamp: new Date()
      });

      return {
        success: true,
        data: {
          message: successMessage,
          suggestions: [
            '📸 Agregar imágenes',
            '💰 Definir precios',
            '🎯 Optimizar SEO',
            '✏️ Crear otro servicio'
          ],
          service: {
            id: servicioGuardado._id,
            titulo: servicioGuardado.titulo,
            categoria: servicioGuardado.categoria?.nombre,
            descripcionCorta: servicioGuardado.descripcionCorta
          }
        },
        metadata: {
          sessionId: session.id,
          intent: 'create_service_success',
          source: 'direct_extraction',
          serviceId: servicioGuardado._id
        }
      };

    } catch (error) {
      logger.error('❌ [DIRECT_MODE] Error creating service:', error.message);
      
      // Fallback al flujo conversacional
      logger.warn('🔄 [FALLBACK] Switching to form collection mode');
      const serviceContext = this.extractServiceContext(message);
      return await this.startFormCollection(session, { type: 'create_service' }, { ...context, serviceContext });
    }
  }

  /**
   * Iniciar recopilación de datos para crear servicio
   */
  async startFormCollection(session, intent, context) {
    logger.info('📝 [FORM_MODE] Starting form collection');

    // Extraer contexto del servicio para ejemplos dinámicos
    const serviceContext = context.serviceContext || {};

    // Generar ejemplos contextuales
    const titleExample = this.generateContextualExample(serviceContext.serviceType || 'servicio', 'titulo');
    const descExample = this.generateContextualExample(serviceContext.serviceType || 'servicio', 'descripcion');

    // Definir campos requeridos para crear un servicio
    const requiredFields = [
      {
        name: 'titulo',
        question: '📝 ¿Qué título le pondrías al servicio?',
        type: 'text',
        example: `💡 Tip: ${titleExample}`
      },
      {
        name: 'categoria',
        question: '📂 ¿En qué categoría lo clasificarías?',
        type: 'select',
        options: await this.getCategoriaOptions(),
        example: '👇 Selecciona una categoría o escribe su nombre'
      },
      {
        name: 'descripcionCorta',
        question: '💬 Dame una breve descripción del servicio (1-2 líneas)',
        type: 'text',
        example: `💡 Tip: ${descExample}`
      }
    ];

    // Inicializar estado del formulario
    session.formState = {
      isCollecting: true,
      intent: 'create_service',
      collectedData: {},
      requiredFields: requiredFields,
      currentField: 0,
      completedFields: []
    };

    logger.success(`✅ [FORM_MODE] Form initialized - ${requiredFields.length} fields`);

    // Construir mensaje inicial
    const firstField = requiredFields[0];
    const welcomeMessage = `¡Perfecto! Voy a ayudarte a crear un nuevo servicio. 🚀\n\n` +
      `Para eso necesito algunos datos básicos. Los demás campos los completaré automáticamente con IA.\n\n` +
      `**Progreso: 1/${requiredFields.length}**\n\n` +
      `${firstField.question}\n` +
      `${firstField.example}`;

    session.messages.push({
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date()
    });

    logger.success('✅ [FORM] First question sent to user');

    return {
      success: true,
      data: {
        message: welcomeMessage,
        suggestions: [],
        quickActions: [],
        formState: {
          isCollecting: true,
          progress: `1/${requiredFields.length}`,
          currentQuestion: firstField.question,
          currentField: firstField.name,
          fieldType: firstField.type,
          options: firstField.options || []
        }
      },
      metadata: {
        sessionId: session.id,
        intent: 'create_service_collecting',
        processingTime: 0
      }
    };
  }

  /**
   * Manejar respuestas durante la recopilación
   */
  async handleFormCollection(message, session, context) {
    const formState = session.formState;
    const currentField = formState.requiredFields[formState.currentField];

    // Validar y guardar la respuesta
    const validatedValue = await this.validateFieldValue(message, currentField);

    if (!validatedValue.isValid) {
      logger.warn(`⚠️ [FORM_MODE] Validation failed for ${currentField.name}`);
      
      // Si la respuesta no es válida, pedir nuevamente
      const retryMessage = `❌ ${validatedValue.error}\n\n` +
        `Por favor, intenta de nuevo:\n${currentField.question}\n${currentField.example}`;

      session.messages.push({
        role: 'assistant',
        content: retryMessage,
        timestamp: new Date()
      });

      return {
        success: true,
        data: {
          message: retryMessage,
          suggestions: currentField.options || [],
          quickActions: [],
          formState: {
            isCollecting: true,
            progress: `${formState.currentField + 1}/${formState.requiredFields.length}`,
            currentQuestion: currentField.question,
            completedFields: formState.completedFields
          }
        },
        metadata: {
          sessionId: session.id,
          intent: 'create_service_collecting'
        }
      };
    }

    logger.success(`✅ [FORM_MODE] Field validated: ${currentField.name}`);

    // Guardar el valor validado
    formState.collectedData[currentField.name] = validatedValue.value;
    formState.completedFields.push(currentField.name);
    formState.currentField++;

    // Verificar si hay más campos
    if (formState.currentField < formState.requiredFields.length) {
      // Pasar al siguiente campo
      const nextField = formState.requiredFields[formState.currentField];
      logger.info(`📝 [FORM_MODE] Next field: ${nextField.name}`);
      
      const nextMessage = `✅ Perfecto!\n\n` +
        `**Progreso: ${formState.currentField + 1}/${formState.requiredFields.length}**\n\n` +
        `${nextField.question}\n` +
        `${nextField.example}`;

      session.messages.push({
        role: 'assistant',
        content: nextMessage,
        timestamp: new Date()
      });

      return {
        success: true,
        data: {
          message: nextMessage,
          suggestions: nextField.options || [],
          quickActions: [],
          formState: {
            isCollecting: true,
            progress: `${formState.currentField + 1}/${formState.requiredFields.length}`,
            currentQuestion: nextField.question,
            currentField: nextField.name,
            fieldType: nextField.type,
            options: nextField.options || [],
            completedFields: formState.completedFields
          }
        },
        metadata: {
          sessionId: session.id,
          intent: 'create_service_collecting'
        }
      };
    }

    // ✅ RECOPILACIÓN COMPLETADA
    formState.isCollecting = false;
    logger.success('🎉 [FORM] All fields collected successfully!');
    logger.info(`📋 [FORM] Collected data: ${JSON.stringify(formState.collectedData, null, 2)}`);

    const summaryMessage = `✅ ¡Excelente! Ya tengo toda la información necesaria:\n\n` +
      `📝 **Título:** ${formState.collectedData.titulo}\n` +
      `📂 **Categoría:** ${formState.collectedData.categoria}\n` +
      `💬 **Descripción:** ${formState.collectedData.descripcionCorta}\n\n` +
      `Con estos datos, puedo:\n` +
      `• Auto-generar características y beneficios\n` +
      `• Sugerir un precio competitivo\n` +
      `• Optimizar el contenido para SEO\n` +
      `• Agregar detalles profesionales\n\n` +
      `¿Quieres que cree el servicio ahora?`;

    session.messages.push({
      role: 'assistant',
      content: summaryMessage,
      timestamp: new Date()
    });

    // 🆕 Convertir nombre de categoría a ObjectId antes de enviar
    const categoriaObj = await this.normalizeCategory(formState.collectedData.categoria);
    if (!categoriaObj) {
      logger.error(`❌ [FORM] Category not found: ${formState.collectedData.categoria}`);
      return {
        success: false,
        error: `No se pudo encontrar la categoría "${formState.collectedData.categoria}"`
      };
    }

    logger.info(`✅ [FORM] Category resolved: ${categoriaObj.nombre} (ID: ${categoriaObj._id})`);

    // Preparar datos con categoria como ObjectId
    const serviceDataForCreation = {
      ...formState.collectedData,
      categoria: categoriaObj._id.toString() // Enviar como string del ObjectId
    };

    logger.success('✅ [FORM] Summary and action button sent to user');

    return {
      success: true,
      data: {
        message: summaryMessage,
        suggestions: [],
        quickActions: [
          {
            action: 'create_service',
            label: '✨ Crear Servicio Ahora',
            description: 'Crear y guardar el servicio en la base de datos',
            data: {
              serviceData: serviceDataForCreation, // 🆕 Usar datos con ObjectId
              autoComplete: true
            }
          }
        ],
        formState: {
          isCollecting: false,
          completed: true,
          collectedData: formState.collectedData
        }
      },
      metadata: {
        sessionId: session.id,
        intent: 'create_service_ready'
      }
    };
  }

  /**
   * Validar valor del campo
   */
  async validateFieldValue(value, field) {
    let trimmedValue = value.trim();

    // Validaciones básicas
    if (!trimmedValue || trimmedValue.length < 3) {
      return {
        isValid: false,
        error: 'La respuesta es muy corta. Por favor, proporciona más detalles.'
      };
    }

    // Validaciones específicas por tipo
    switch (field.name) {
      case 'titulo':
        if (trimmedValue.length > 100) {
          return {
            isValid: false,
            error: 'El título es demasiado largo. Máximo 100 caracteres.'
          };
        }
        
        // 🆕 Auto-capitalizar título
        trimmedValue = this.capitalizeTitle(trimmedValue);
        logger.info(`✨ [VALIDATION] Title capitalized: "${trimmedValue}"`);
        
        return { isValid: true, value: trimmedValue };

      case 'categoria':
        // 🆕 Normalizar categoría con fuzzy matching
        const categoriaObj = await this.normalizeCategory(trimmedValue);
        
        if (!categoriaObj) {
          // Listar categorías disponibles
          const availableCategories = field.options?.map(opt => opt.nombre || opt).join(', ') || 'Desarrollo, Diseño, Marketing, Consultoría, etc.';
          return {
            isValid: false,
            error: `Categoría no reconocida. Categorías disponibles: ${availableCategories}`
          };
        }
        
        logger.success(`✅ [VALIDATION] Category matched: ${categoriaObj.nombre}`);
        return { isValid: true, value: categoriaObj.nombre };

      case 'descripcionCorta':
        if (trimmedValue.length > 500) {
          return {
            isValid: false,
            error: 'La descripción es muy larga. Máximo 500 caracteres.'
          };
        }
        return { isValid: true, value: trimmedValue };

      default:
        return { isValid: true, value: trimmedValue };
    }
  }

  /**
   * Obtener opciones de categorías disponibles
   */
  async getCategoriaOptions() {
    try {
      const categorias = await Categoria.find({ activo: true }).select('nombre slug').limit(10);
      return categorias.map(cat => ({
        nombre: cat.nombre,
        slug: cat.slug
      }));
    } catch (error) {
      logger.error('Error fetching categories:', error);
      return [
        { nombre: 'Desarrollo', slug: 'desarrollo' },
        { nombre: 'Diseño', slug: 'diseno' },
        { nombre: 'Marketing', slug: 'marketing' },
        { nombre: 'Consultoría', slug: 'consultoria' },
        { nombre: 'Soporte', slug: 'soporte' }
      ];
    }
  }

  /**
   * Limpiar contexto antiguo de sesión
   */
  cleanupSessionContext(session) {
    // Mantener solo los últimos N mensajes
    if (session.messages.length > this.config.maxContextLength * 2) {
      session.messages = session.messages.slice(-this.config.maxContextLength * 2);
    }

    // Limpiar sesiones inactivas (más de 1 hora)
    const oneHourAgo = new Date(Date.now() - 3600000);
    for (const [sid, sess] of this.sessions.entries()) {
      if (sess.lastActivity < oneHourAgo) {
        this.sessions.delete(sid);
        logger.info(`🗑️  Cleaned up inactive session: ${sid}`);
      }
    }
  }

  /**
   * Respuesta de fallback
   */
  getFallbackResponse(message) {
    const fallbacks = [
      'Entiendo tu consulta sobre servicios. ¿Podrías darme más detalles para ayudarte mejor?',
      'Estoy aquí para ayudarte con la gestión de servicios. ¿Qué te gustaría hacer: crear, analizar u optimizar?',
      'Puedo asistirte con servicios. ¿Te gustaría que te ayude a crear uno nuevo o mejorar uno existente?'
    ];

    return {
      message: fallbacks[Math.floor(Math.random() * fallbacks.length)],
      suggestions: [
        'Crear un nuevo servicio',
        'Analizar un servicio existente',
        'Optimizar pricing',
        'Generar paquetes'
      ],
      quickActions: []
    };
  }

  /**
   * Actualizar métricas
   */
  updateMetrics(startTime, success) {
    const responseTime = Date.now() - startTime;

    if (success) {
      this.metrics.successCount++;
    } else {
      this.metrics.errorCount++;
    }

    const totalCompleted = this.metrics.successCount + this.metrics.errorCount;
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (totalCompleted - 1) + responseTime) / totalCompleted;
  }

  /**
   * Obtener métricas
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalChats > 0
        ? (this.metrics.successCount / this.metrics.totalChats) * 100
        : 0,
      activeSessions: this.sessions.size
    };
  }

  /**
   * Limpiar todas las sesiones
   */
  clearAllSessions() {
    this.sessions.clear();
    logger.info('🗑️  All chat sessions cleared');
  }

  /**
   * Obtener sesión específica
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }
}

export default ServicesChatHandler;
