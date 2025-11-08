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
        logger.info(`📝 Generated new session ID: ${sessionId}`);
      }

      logger.info(`💬 Processing chat message for session: ${sessionId}`);

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

      // Detectar intención del mensaje
      const intent = await this.detectIntent(message, context);

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
        preferences: {}
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

    // Palabras clave para diferentes intenciones
    const intentKeywords = {
      create_service: ['crear', 'nuevo servicio', 'agregar servicio', 'generar servicio'],
      edit_service: ['editar', 'modificar', 'actualizar', 'cambiar'],
      analyze_service: ['analizar', 'análisis', 'revisar', 'evaluar', 'cómo está'],
      optimize_service: ['optimizar', 'mejorar', 'perfeccionar'],
      pricing_help: ['precio', 'cuánto cobrar', 'pricing', 'costo', 'tarifa'],
      package_help: ['paquete', 'bundle', 'combo', 'plan'],
      recommendation: ['recomendar', 'sugerir', 'aconsejar', 'qué servicio'],
      general_question: ['qué', 'cómo', 'por qué', 'cuál', 'dónde']
    };

    // Detectar intención basada en palabras clave
    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      if (keywords.some(keyword => messageLower.includes(keyword))) {
        return {
          type: intent,
          confidence: 0.8,
          keywords: keywords.filter(k => messageLower.includes(k))
        };
      }
    }

    return {
      type: 'general_question',
      confidence: 0.5,
      keywords: []
    };
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
            { action: 'create', label: 'Crear Servicio Ahora' },
            { action: 'viewTemplate', label: 'Ver Templates' }
          ];
          break;

        case 'pricing_help':
          if (servicesContext.stats.pricing) {
            enriched.suggestions = [
              `El precio promedio en tu portafolio es S/ ${Math.round(servicesContext.stats.pricing.avgPrice)}`,
              'Considera el valor percibido y la complejidad del servicio',
              'Ofrece diferentes niveles de precio para maximizar conversiones'
            ];
          }
          break;

        case 'optimize_service':
          enriched.suggestions = [
            'Optimiza el título con palabras clave relevantes',
            'Mejora la descripción destacando beneficios sobre características',
            'Agrega pruebas sociales o casos de éxito'
          ];
          enriched.quickActions = [
            { action: 'analyzeService', label: 'Analizar Servicio' },
            { action: 'optimizeSEO', label: 'Optimizar SEO' }
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
