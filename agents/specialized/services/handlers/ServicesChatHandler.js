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
import Lead from '../../../../models/Lead.js';
import logger from '../../../../utils/logger.js';

// 🌍 STORAGE GLOBAL para sesiones (persiste entre instancias)
global.servicesChatSessions = global.servicesChatSessions || new Map();

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

    // ✅ Usar almacenamiento global en lugar de Map local
    this.sessions = global.servicesChatSessions;
    
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
        
        // 🛡️ PASO -1: VALIDAR que la consulta esté relacionada con servicios/ventas
        const offTopicCheck = this.detectOffTopicQuery(message, session);
        if (offTopicCheck.isOffTopic) {
          logger.warn(`⚠️ [OFF-TOPIC] Query rejected: ${offTopicCheck.category}`);
          
          // Incrementar contador de abuse en sesión
          session.offTopicAttempts = (session.offTopicAttempts || 0) + 1;
          
          // Respuesta de redirección
          const redirectResponse = this.getOffTopicRedirectResponse(offTopicCheck.category, session.offTopicAttempts);
          
          session.messages.push(
            { role: 'user', content: message, timestamp: new Date() },
            { role: 'assistant', content: redirectResponse, timestamp: new Date() }
          );
          
          return {
            success: true,
            response: redirectResponse,
            data: {
              message: redirectResponse,
              isOffTopic: true,
              category: offTopicCheck.category,
              attempts: session.offTopicAttempts
            },
            metadata: {
              sessionId: session.id,
              intent: 'off_topic_redirect',
              offTopicCategory: offTopicCheck.category
            }
          };
        }
        
        // 💾 Inicializar contactFormData y flag de proceso activo si no existen
        if (!session.contactFormData) {
          session.contactFormData = {
            nombre: null,
            celular: null,
            correo: null
          };
        }
        if (session.isCollectingContactInfo === undefined) {
          session.isCollectingContactInfo = false;
        }
        
        // 🚩 DETECCIÓN TEMPRANA: Si el usuario solicita contacto O si ya estamos recolectando
        const messageLower = message.toLowerCase();
        const contactIntentKeywords = [
          'cotización', 'cotizar', 'presupuesto', 'precio exacto',
          'agendar', 'reunión', 'llamada', 'contacto', 'llamarme',
          'quiero contratar', 'me interesa contratar', 'solicitar',
          'enviar propuesta', 'más información', 'hablar con un asesor',
          'demo', 'prueba', 'reunión gratis', 'contactarme',
          'envíame', 'mándame', 'necesito', 'requiero'
        ];
        const wantsContactNow = contactIntentKeywords.some(kw => messageLower.includes(kw));
        
        // Si usuario solicita contacto O si ya tenemos datos guardados O si el flag ya está activo, mantener flag de recolección
        const hasStoredData = session.contactFormData.nombre || session.contactFormData.celular || session.contactFormData.correo;
        
        if (wantsContactNow || hasStoredData || session.isCollectingContactInfo) {
          session.isCollectingContactInfo = true;
        }
        
        // 🆕 PASO 0: Si estamos recolectando info, extraer datos del mensaje PRIMERO
        if (session.isCollectingContactInfo) {
          const contactInfo = this.extractContactInfo(message);
          
          // 🔄 Fusionar datos nuevos con datos guardados (acumulativos)
          if (contactInfo.nombre) session.contactFormData.nombre = contactInfo.nombre;
          if (contactInfo.celular) session.contactFormData.celular = contactInfo.celular;
          if (contactInfo.correo) session.contactFormData.correo = contactInfo.correo;
        }
        
        // 🆕 PASO 1: Obtener contexto básico
        let servicesContext = await this.getServicesContext(intent, context);
        
        // 🆕 PASO 2: Detectar nivel de conversación
        const conversationLevel = this.analyzeConversationLevel(session, message, servicesContext);
        
        // 🆕 PASO 3: Si es Level 3, 4 o 5, cargar detalles completos del servicio
        if ((conversationLevel.level >= 3 && conversationLevel.level <= 5) && conversationLevel.serviceId) {
          logger.info(`🎯 [LEVEL ${conversationLevel.level}] Re-fetching with service details: ${conversationLevel.serviceId}`);
          servicesContext = await this.getServicesContext(intent, { ...context, serviceId: conversationLevel.serviceId });
        }
        
        // Construir prompt con contexto
        const prompt = this.buildChatPrompt(message, session, servicesContext, intent, context);

        // Generar respuesta con IA
        let aiResponse = await this.generateAIResponse(prompt, sessionId);

        // 🔍 DETECCIÓN POST-RESPUESTA: Si el bot pidió datos de contacto, activar flag
        const botAskedForContactInfo = aiResponse && (
          aiResponse.toLowerCase().includes('nombre completo') ||
          aiResponse.toLowerCase().includes('número de celular') ||
          aiResponse.toLowerCase().includes('correo electrónico') ||
          (aiResponse.includes('cotización') && aiResponse.includes('nombre'))
        );
        
        if (botAskedForContactInfo && !session.isCollectingContactInfo) {
          session.isCollectingContactInfo = true;
        }

        // 🚫 DETECCIÓN DE RECHAZO: Si usuario rechaza, desactivar flag y limpiar datos
        if (session.isCollectingContactInfo && conversationLevel.level !== 5) {
          const isRejection = messageLower.includes('no gracias') || messageLower.includes('no quiero') || 
                             messageLower.includes('cancelar') || messageLower.includes('mejor no') ||
                             messageLower.includes('no me interesa');
          
          if (isRejection) {
            logger.info('🚫 [LEVEL 5] User rejected - Deactivating collection flag');
            session.isCollectingContactInfo = false;
            delete session.contactFormData;
          }
        }

        // 🆕 NIVEL 5: Manejar formulario secuencial
        if (conversationLevel.level === 5 && session.isCollectingContactInfo) {
          logger.info('📝 [LEVEL 5] Processing form submission...');
          
          // Usar los datos acumulados (ya extraídos en PASO 0)
          const accumulatedData = session.contactFormData;
          
          logger.info(`📊 [LEVEL 5] Current data - nombre: "${accumulatedData.nombre}", celular: "${accumulatedData.celular}", correo: "${accumulatedData.correo}"`);
          
          // 📝 FORMULARIO SECUENCIAL: Nombre → Teléfono → Email
          
          // 1️⃣ Si NO tiene nombre, pedir nombre primero
          if (!accumulatedData.nombre) {
            logger.info('📋 [LEVEL 5] Step 1/3 - Requesting NAME...');
            
            aiResponse = "¡Perfecto! Vamos a capturar tus datos para la cotización. 📝\n\nPrimero, ¿cuál es tu **nombre completo**? 😊";
            
            // Guardar respuesta y continuar conversación
            session.messages.push({
              role: 'assistant',
              content: aiResponse,
              timestamp: new Date()
            });
            
            return {
              success: true,
              response: aiResponse,
              data: {
                message: aiResponse,
                requiresMoreInfo: true,
                level: 5,
                step: 1,
                nextField: 'nombre'
              },
              metadata: {
                sessionId: session.id,
                intent: intent.type,
                level: 5,
                contactInfoPartial: true,
                step: 'requesting_name'
              }
            };
          }
          
          // 2️⃣ Si tiene nombre pero NO tiene teléfono, pedir teléfono
          if (accumulatedData.nombre && !accumulatedData.celular) {
            logger.info('📋 [LEVEL 5] Step 2/3 - Requesting PHONE...');
            
            aiResponse = `¡Gracias, ${accumulatedData.nombre}! 👍\n\nAhora, ¿cuál es tu **número de celular**? (Ejemplo: 987654321)`;
            
            // Guardar respuesta y continuar conversación
            session.messages.push({
              role: 'assistant',
              content: aiResponse,
              timestamp: new Date()
            });
            
            return {
              success: true,
              response: aiResponse,
              data: {
                message: aiResponse,
                requiresMoreInfo: true,
                level: 5,
                step: 2,
                nextField: 'celular',
                nombre: accumulatedData.nombre
              },
              metadata: {
                sessionId: session.id,
                intent: intent.type,
                level: 5,
                contactInfoPartial: true,
                step: 'requesting_phone'
              }
            };
          }
          
          // 3️⃣ Si tiene nombre y teléfono pero NO tiene email, pedir email
          if (accumulatedData.nombre && accumulatedData.celular && !accumulatedData.correo) {
            logger.info('📋 [LEVEL 5] Step 3/3 - Requesting EMAIL...');
            
            aiResponse = `Perfecto, ${accumulatedData.nombre}! 📱\n\nPor último, ¿cuál es tu **correo electrónico**? (Ejemplo: tu@empresa.com)`;
            
            // Guardar respuesta y continuar conversación
            session.messages.push({
              role: 'assistant',
              content: aiResponse,
              timestamp: new Date()
            });
            
            return {
              success: true,
              response: aiResponse,
              data: {
                message: aiResponse,
                requiresMoreInfo: true,
                level: 5,
                step: 3,
                nextField: 'correo',
                nombre: accumulatedData.nombre,
                celular: accumulatedData.celular
              },
              metadata: {
                sessionId: session.id,
                intent: intent.type,
                level: 5,
                contactInfoPartial: true,
                step: 'requesting_email'
              }
            };
          }

          // 4️⃣ ✅ Tenemos información completa (nombre + teléfono + email) - Crear lead en el CRM
          if (accumulatedData.nombre && accumulatedData.celular && accumulatedData.correo) {
            logger.success('✅ [LEVEL 5] Complete contact info - Creating lead...');
            
            const leadResult = await this.createLeadFromChat(
              accumulatedData,
              conversationLevel,
              session
            );

            if (leadResult.success) {
              // Respuesta de confirmación personalizada
              const confirmationMessage = `✅ ¡Perfecto, ${accumulatedData.nombre}! 

Tu solicitud ha sido registrada exitosamente. 

Uno de nuestros asesores especializados te contactará en las **próximas 2 horas** por WhatsApp o email para coordinar detalles ${conversationLevel.serviceMentioned ? `sobre **${conversationLevel.serviceMentioned}**` : 'de tu proyecto'}.

Mientras tanto, ¿hay algo más que quieras saber? 🚀`;

              aiResponse = confirmationMessage;
              
              logger.success(`🎉 [LEAD CAPTURED] ${accumulatedData.nombre} - Lead ID: ${leadResult.leadId}`);
              
              // 🧹 Limpiar datos del formulario y flag después de crear el lead
              delete session.contactFormData;
              session.isCollectingContactInfo = false;
              
              // Guardar confirmación en el historial
              session.messages.push({
                role: 'assistant',
                content: confirmationMessage,
                timestamp: new Date()
              });
              
              return {
                success: true,
                response: confirmationMessage,
                data: {
                  message: confirmationMessage,
                  leadCreated: true,
                  leadId: leadResult.leadId,
                  level: 5
                },
                metadata: {
                  sessionId: session.id,
                  intent: intent.type,
                  level: 5,
                  leadId: leadResult.leadId,
                  contactInfo: {
                    nombre: accumulatedData.nombre,
                    hasEmail: !!accumulatedData.correo,
                    hasPhone: !!accumulatedData.celular
                  }
                }
              };
            } else {
              // Error creando lead - informar al usuario
              logger.error('❌ [LEVEL 5] Failed to create lead');
              
              aiResponse = "Disculpa, hubo un problema técnico al registrar tu información. Por favor, intenta nuevamente o escríbenos directamente a contacto@scuticompany.com 🙏";
            }
          }
        }

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
          response: enrichedResponse.message, // 🔧 Frontend busca response aquí
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

      // 🆕 PASO 1: Analizar nivel de conversación (necesita servicesContext básico)
      // Primero obtener contexto SIN detalles del servicio
      let servicesContext = await this.getServicesContext(intent, context);
      
      // 🆕 PASO 2: Detectar nivel de conversación
      const conversationLevel = this.analyzeConversationLevel(session, message, servicesContext);
      
      // 🆕 PASO 3: Si es Level 3, 4 o 5, obtener contexto CON detalles del servicio
      if ((conversationLevel.level >= 3 && conversationLevel.level <= 5) && conversationLevel.serviceId) {
        logger.info(`🎯 [LEVEL ${conversationLevel.level}] Re-fetching context with service details: ${conversationLevel.serviceId}`);
        servicesContext = await this.getServicesContext(intent, { ...context, serviceId: conversationLevel.serviceId });
      }

      // Construir prompt con contexto
      const prompt = this.buildChatPrompt(message, session, servicesContext, intent, context);

      // Generar respuesta con IA
      let aiResponse = await this.generateAIResponse(prompt, sessionId);

      // 🆕 NIVEL 5: Detectar si el mensaje del usuario contiene datos de contacto
      if (conversationLevel.level === 5 && conversationLevel.providingContactInfo) {
        logger.info('📝 [LEVEL 5] User providing contact info - Extracting data...');
        
        const contactInfo = this.extractContactInfo(message);
        
        // Si encontramos al menos email O teléfono
        if (contactInfo.correo || contactInfo.celular) {
          
          // Si falta el nombre, pedirlo específicamente
          if (!contactInfo.nombre) {
            logger.info('⚠️ [LEVEL 5] Missing name - Requesting...');
            
            aiResponse = "¡Casi listo! Solo falta tu **nombre completo** para completar el registro y enviarte la cotización. 😊";
            
            // Guardar respuesta y continuar conversación
            session.messages.push({
              role: 'assistant',
              content: aiResponse,
              timestamp: new Date()
            });
            
            return {
              success: true,
              data: {
                message: aiResponse,
                requiresMoreInfo: true,
                level: 5
              },
              metadata: {
                sessionId: session.id,
                intent: intent.type,
                level: 5,
                contactInfoPartial: true
              }
            };
          }

          // ✅ Tenemos información completa - Crear lead en el CRM
          logger.success('✅ [LEVEL 5] Complete contact info - Creating lead...');
          
          const leadResult = await this.createLeadFromChat(
            contactInfo,
            conversationLevel,
            session
          );

          if (leadResult.success) {
            // Respuesta de confirmación personalizada
            const confirmationMessage = `✅ ¡Perfecto, ${contactInfo.nombre}! 

Tu solicitud ha sido registrada exitosamente. 

Uno de nuestros asesores especializados te contactará en las **próximas 2 horas** por WhatsApp o email para coordinar detalles ${conversationLevel.serviceMentioned ? `sobre **${conversationLevel.serviceMentioned}**` : 'de tu proyecto'}.

Mientras tanto, ¿hay algo más que quieras saber? 🚀`;

            aiResponse = confirmationMessage;
            
            logger.success(`🎉 [LEAD CAPTURED] ${contactInfo.nombre} - Lead ID: ${leadResult.leadId}`);
            
            // Guardar confirmación en el historial
            session.messages.push({
              role: 'assistant',
              content: confirmationMessage,
              timestamp: new Date()
            });
            
            return {
              success: true,
              data: {
                message: confirmationMessage,
                leadCreated: true,
                leadId: leadResult.leadId,
                level: 5
              },
              metadata: {
                sessionId: session.id,
                intent: intent.type,
                level: 5,
                leadId: leadResult.leadId,
                contactInfo: {
                  nombre: contactInfo.nombre,
                  hasEmail: !!contactInfo.correo,
                  hasPhone: !!contactInfo.celular
                }
              }
            };
          } else {
            // Error creando lead - informar al usuario
            logger.error('❌ [LEVEL 5] Failed to create lead');
            
            aiResponse = "Disculpa, hubo un problema técnico al registrar tu información. Por favor, intenta nuevamente o escríbenos directamente a contacto@scuticompany.com 🙏";
          }
        }
      }

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
      logger.info(`🆕 [SESSION] Creating new session: ${sessionId}`);
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
    } else {
      logger.info(`♻️ [SESSION] Reusing existing session: ${sessionId}`);
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
   * 🛡️ Detectar consultas off-topic (no relacionadas con ventas)
   */
  detectOffTopicQuery(message, session) {
    const messageLower = message.toLowerCase();
    
    // 🚨 CATEGORÍAS DE ABUSE/OFF-TOPIC
    
    // 1. Tareas académicas y educativas
    const academicPatterns = [
      /tarea|homework|assignment|examen|test|prueba/i,
      /(ayuda|ayúdame|resuelve|resolver) (con|mi|una) (tarea|examen|prueba)/i,
      /ensayo sobre|investigación sobre|trabajo de investigación/i,
      /(qué|quién|cuándo|dónde) (fue|es|son|era|fueron) (la|el|los|las)? (revolución|guerra|batalla|independencia|conquista)/i,
      /descubrió? (américa|la rueda|el fuego|la penicilina)/i,
      /fórmula (de|para|del)|teorema de|ley de (newton|gravedad)/i,
      /resume|resumen de (este|el) (texto|libro|artículo)/i,
      /traduce|traducción (de|al) (inglés|español|francés)/i
    ];
    
    // 2. Preguntas generales de conocimiento (no empresarial)
    const generalKnowledgePatterns = [
      /^(qué|quién|cuándo|dónde|cómo) (es|fue|son|era|eran) (la|el|los|las) (capital|país|presidente|continente|océano)/i,
      /^¿?(qué|cuál|cuáles) (es|son) (la|el|los|las) capital/i,
      /cuántos (países|continentes|habitantes|años)/i,
      /(historia|geografía|biología|química|física) de/i,
      /^qué significa (la palabra|el término)/i,
      /^cómo se (dice|escribe|pronuncia)/i,
      /qué idioma se habla en/i
    ];
    
    // 3. Entretenimiento y contenido casual
    const entertainmentPatterns = [
      /cuéntame (un|una) (chiste|historia|cuento|adivinanza)/i,
      /dame (un|una) (chiste|broma|adivinanza)/i,
      /hazme reír|diviérteme/i,
      /jugamos|juguemos|vamos a jugar/i,
      /canción|música|película|serie|anime|videojuego/i,
      /^hola siri|hey google|ok google|alexa/i
    ];
    
    // 4. Programación/código genérico (NO relacionado con servicios)
    const genericCodingPatterns = [
      /^(cómo|como) (hacer|crear|programar) (un|una) (calculadora|juego|app de notas)/i,
      /^(código|programa|script|función) (para|de) (sumar|restar|multiplicar|dividir)/i,
      /^escribe (código|un programa|una función) que/i,
      /^debug|debuggea|encuentra el error en este código/i,
      /^explica (este|el) código/i,
      /^qué (hace|significa) esta (función|línea de código)/i
    ];
    
    // 5. Consultas personales (salud, finanzas, legal)
    const personalAdvicePatterns = [
      /estoy (enfermo|triste|deprimido|ansioso)/i,
      /me duele|tengo dolor|síntomas de/i,
      /cómo (invierto|ahorro|gano) dinero/i,
      /préstamo|crédito|deuda/i,
      /demanda|abogado|contrato legal|juicio/i,
      /divorcio|herencia|testamento/i
    ];
    
    // 6. Spam/Testing/Abuse
    const spamPatterns = [
      /^(test|testing|prueba)$/i,
      /^(hola)+$/i,
      /^(jajaja|jeje|lol)+$/i,
      /^[a-z]$/i, // Una sola letra
      /^\d+$/, // Solo números
      /asdf|qwerty|12345|abcde/i,
      /spam|test spam|probando|test test/i
    ];
    
    // 🔍 VERIFICAR CADA CATEGORÍA
    
    // Excepción: Si está en proceso de formulario (Nivel 5), permitir respuestas cortas
    if (session.isCollectingContactInfo) {
      return { isOffTopic: false };
    }
    
    // Excepción: Saludos básicos
    if (/^(hola|buenas|buenos días|buenas tardes|hey|hi)$/i.test(messageLower.trim())) {
      return { isOffTopic: false };
    }
    
    // Verificar patrones
    if (academicPatterns.some(pattern => pattern.test(message))) {
      return { isOffTopic: true, category: 'academic' };
    }
    
    if (generalKnowledgePatterns.some(pattern => pattern.test(message))) {
      return { isOffTopic: true, category: 'general_knowledge' };
    }
    
    if (entertainmentPatterns.some(pattern => pattern.test(message))) {
      return { isOffTopic: true, category: 'entertainment' };
    }
    
    if (genericCodingPatterns.some(pattern => pattern.test(message))) {
      return { isOffTopic: true, category: 'generic_coding' };
    }
    
    if (personalAdvicePatterns.some(pattern => pattern.test(message))) {
      return { isOffTopic: true, category: 'personal_advice' };
    }
    
    if (spamPatterns.some(pattern => pattern.test(message))) {
      return { isOffTopic: true, category: 'spam' };
    }
    
    // ✅ Consulta válida
    return { isOffTopic: false };
  }

  /**
   * 🔄 Obtener respuesta de redirección para consultas off-topic
   */
  getOffTopicRedirectResponse(category, attemptCount) {
    // 🚨 Si intenta más de 3 veces, respuesta más firme
    if (attemptCount >= 3) {
      return "⚠️ Soy un asistente especializado en servicios de SCUTI Company. No puedo ayudarte con temas fuera de ese ámbito.\n\nSi necesitas servicios de desarrollo, diseño o marketing, con gusto te asesoro. De lo contrario, no podré continuar esta conversación. 🚀";
    }
    
    // Respuestas según categoría
    const responses = {
      academic: "Soy el Asesor de Ventas de SCUTI Company y estoy especializado únicamente en ayudarte con nuestros servicios de desarrollo de software, diseño y marketing.\n\nNo puedo ayudarte con tareas académicas. ¿Tienes algún proyecto empresarial o digital en mente? 💼",
      
      general_knowledge: "Soy el Asesor de Ventas de SCUTI Company y me enfoco en ayudarte con soluciones digitales para tu negocio.\n\nNo puedo responder preguntas generales. ¿Te gustaría conocer nuestros servicios? 🚀",
      
      entertainment: "Soy el Asesor de Ventas de SCUTI Company y estoy aquí para ayudarte con servicios profesionales de desarrollo y diseño.\n\nNo puedo entretener, pero sí puedo mostrarte soluciones increíbles para tu negocio. ¿Qué necesitas? 🌐",
      
      generic_coding: "Soy el Asesor de Ventas de SCUTI Company. Si necesitas desarrollo de software profesional para tu empresa, puedo ayudarte.\n\nNo brindo tutoriales de programación, pero sí desarrollo soluciones completas. ¿Tienes un proyecto en mente? 💻",
      
      personal_advice: "Soy el Asesor de Ventas de SCUTI Company y me especializo en servicios empresariales de tecnología.\n\nNo puedo dar consejos personales. ¿Te interesa algún servicio digital para tu negocio? 💼",
      
      spam: "Soy el Asesor de Ventas de SCUTI Company.\n\n¿En qué servicio de desarrollo, diseño o marketing te puedo ayudar? 🚀"
    };
    
    return responses[category] || responses.spam;
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
    // 🔧 FIX: Usar $or para buscar tanto 'activo' como 'activa' y permitir categorías sin ese campo
    const categorias = await Categoria.find({ 
      $or: [
        { activo: true },
        { activa: true },
        { activo: { $exists: false } },
        { activa: { $exists: false } }
      ]
    }, 'nombre slug');
    
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
        availableServices: [], // 🆕 Lista de servicios disponibles
        stats: {},
        serviceDetails: null // 🆕 Detalles completos del servicio (Level 3)
      };

      // Obtener estadísticas básicas
      servicesContext.totalServices = await Servicio.countDocuments({ estado: 'activo' });

      // 🔧 Obtener TODAS las categorías (incluye test, Otro, etc.)
      // FIX: Buscar categorías activas O sin campo activo/activa
      const categories = await Categoria.find({ 
        $or: [
          { activo: true },
          { activa: true },
          { activo: { $exists: false } },
          { activa: { $exists: false } }
        ]
      }, 'nombre slug descripcion').limit(20).lean();
      
      servicesContext.categories = categories.map(c => ({ 
        nombre: c.nombre, 
        slug: c.slug,
        descripcion: c.descripcion 
      }));

      logger.info(`📂 [CATEGORIES] Loaded ${servicesContext.categories.length} categories: ${servicesContext.categories.map(c => c.nombre).join(', ')}`);

      // 🆕 OBTENER SERVICIOS ACTIVOS (priorizar destacados)
      const allServices = await Servicio.find({ estado: 'activo' })
        .select('titulo descripcionCorta categoria precio duracion destacado _id')
        .populate('categoria', 'nombre')
        .sort({ destacado: -1, precio: 1 }) // Destacados primero, luego por precio
        .limit(30)
        .lean();

      // Separar servicios destacados del resto
      const featuredServices = allServices.filter(s => s.destacado);

      servicesContext.availableServices = allServices.map(s => ({
        _id: s._id,
        titulo: s.titulo || 'Servicio sin título',
        descripcion: s.descripcionCorta || 'Consulta detalles',
        categoria: s.categoria?.nombre || 'Sin categoría',
        precio: s.precio ? `S/ ${Math.round(s.precio)}` : 'Consultar precio',
        duracion: (s.duracion && s.duracion.valor) ? `${s.duracion.valor} ${s.duracion.unidad}` : '',
        destacado: s.destacado || false
      }));

      // Solo servicios destacados para el prompt (máximo 6)
      servicesContext.featuredServices = featuredServices.slice(0, 6).map(s => ({
        titulo: s.titulo,
        descripcion: s.descripcionCorta,
        categoria: s.categoria?.nombre,
        precio: s.precio ? `S/ ${Math.round(s.precio)}` : 'Consultar',
        duracion: (s.duracion && s.duracion.valor) ? `${s.duracion.valor} ${s.duracion.unidad}` : ''
      }));

      logger.info(`📊 [CONTEXT] Loaded ${servicesContext.availableServices.length} services (${featuredServices.length} featured)`);

      // 🆕 NIVEL 3: Si hay serviceId, cargar detalles COMPLETOS del servicio
      if (context.serviceId) {
        logger.info(`🎯 [LEVEL 3] Loading full details for service: ${context.serviceId}`);
        
        const serviceDetails = await Servicio.findById(context.serviceId)
          .select('titulo descripcion descripcionCorta categoria precio duracion caracteristicas beneficios')
          .populate('categoria', 'nombre')
          .lean();
        
        if (serviceDetails) {
          servicesContext.serviceDetails = {
            titulo: serviceDetails.titulo,
            descripcion: serviceDetails.descripcion || serviceDetails.descripcionCorta || '',
            categoria: serviceDetails.categoria?.nombre || 'Sin categoría',
            precio: serviceDetails.precio ? `S/ ${Math.round(serviceDetails.precio)}` : 'Consultar precio',
            duracion: (serviceDetails.duracion && serviceDetails.duracion.valor) 
              ? `${serviceDetails.duracion.valor} ${serviceDetails.duracion.unidad}` 
              : 'A consultar',
            caracteristicas: serviceDetails.caracteristicas || [],
            beneficios: serviceDetails.beneficios || []
          };
          
          logger.success(`✅ [SERVICE DETAILS] Loaded: ${servicesContext.serviceDetails.titulo}`);
        } else {
          logger.warn(`⚠️ [SERVICE DETAILS] Service not found: ${context.serviceId}`);
        }
      }

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
      if (intent.type === 'recommendation' || intent.type === 'chat_question') {
        const featured = await Servicio.find({ destacado: true, estado: 'activo' })
          .select('titulo descripcionCorta precio categoria')
          .populate('categoria', 'nombre')
          .limit(8)
          .lean();

        servicesContext.recentServices = featured.map(s => ({
          titulo: s.titulo,
          descripcion: s.descripcionCorta,
          categoria: s.categoria?.nombre || 'Sin categoría',
          precio: s.precio ? `S/ ${s.precio}` : 'Cotizar'
        }));
      }

      return servicesContext;

    } catch (error) {
      logger.error('Error getting services context:', error);
      return {
        totalServices: 0,
        categories: [],
        recentServices: [],
        availableServices: [],
        stats: {}
      };
    }
  }

  /**
   * 🧠 Analizar nivel de conversación para personalizar respuesta
   * @param {Object} session - Sesión actual con contactFormData
   * @param {String} currentMessage - Mensaje del usuario
   * @param {Object} servicesContext - Contexto de servicios
   */
  analyzeConversationLevel(session, currentMessage, servicesContext) {
    const messageCount = session.messages.filter(m => m.role === 'user').length;
    const messageLower = currentMessage.toLowerCase();
    
    // 🔧 Detectar mención de categorías DINÁMICAMENTE desde la BD con mejor fuzzy matching
    let categoryMentioned = null;
    if (servicesContext && servicesContext.categories) {
      // Primero intentar coincidencia exacta
      categoryMentioned = servicesContext.categories.find(cat => 
        messageLower.includes(cat.nombre.toLowerCase()) ||
        (cat.slug && messageLower.includes(cat.slug.toLowerCase()))
      )?.nombre;
      
      // Si no encuentra coincidencia exacta, usar fuzzy matching más agresivo
      if (!categoryMentioned) {
        for (const cat of servicesContext.categories) {
          const categoryName = cat.nombre.toLowerCase();
          const categorySlug = cat.slug ? cat.slug.toLowerCase() : '';
          
          // Buscar palabras clave dentro del mensaje
          const words = messageLower.split(/\s+/);
          
          for (const word of words) {
            // Coincidencia directa
            if (word === categoryName || word === categorySlug) {
              categoryMentioned = cat.nombre;
              break;
            }
            
            // Coincidencia parcial (palabra contiene categoría o viceversa)
            if (word.includes(categoryName) || categoryName.includes(word)) {
              if (word.length >= 4 || categoryName.length >= 4) { // Evitar matches muy cortos
                categoryMentioned = cat.nombre;
                break;
              }
            }
          }
          
          if (categoryMentioned) break;
        }
      }
    }
    
    // También detectar palabras clave relacionadas con categorías comunes (backup)
    const categoryKeywords = {
      'Desarrollo': ['desarrollo', 'web', 'móvil', 'app', 'aplicación', 'software', 'sistema', 'programación'],
      'Diseño': ['diseño', 'ux', 'ui', 'interfaz', 'gráfico', 'visual', 'logo', 'imagen'],
      'Marketing': ['marketing', 'publicidad', 'redes sociales', 'seo', 'digital', 'promoción'],
      'Consultoría': ['consultoría', 'consultoria', 'asesoría', 'asesoria', 'consultor', 'asesor', 'asesoramiento', 'consejería'],
      'Mantenimiento': ['mantenimiento', 'soporte', 'actualización', 'actualizar', 'reparación', 'support'],
      'finanzas': ['finanzas', 'financiero', 'económico', 'contabilidad', 'fiscal'],
      'Otro': ['otro', 'otros', 'diferente', 'personalizado', 'especial']
    };
    
    // Si no se detectó categoría por nombre, buscar por palabras clave
    if (!categoryMentioned) {
      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(kw => {
          // Buscar palabra clave exacta o como parte de palabras más largas
          return messageLower.includes(kw);
        })) {
          categoryMentioned = category;
          logger.info(`🎯 [CATEGORY DETECTION] Detected "${category}" via keyword matching`);
          break;
        }
      }
    } else {
      logger.info(`🎯 [CATEGORY DETECTION] Detected "${categoryMentioned}" via database matching`);
    }
    
    // 🆕 Detectar mención de SERVICIO ESPECÍFICO por nombre
    let serviceMentioned = null;
    if (servicesContext && servicesContext.availableServices) {
      serviceMentioned = servicesContext.availableServices.find(service => {
        const serviceTitleLower = service.titulo.toLowerCase();
        
        // 🔧 Coincidencia EXACTA del título completo
        if (messageLower.includes(serviceTitleLower)) {
          return true;
        }
        
        // 🔧 Coincidencia parcial: Al menos 2 palabras significativas del título
        const titleWords = serviceTitleLower.split(' ').filter(w => w.length > 3);
        const matchedWords = titleWords.filter(word => messageLower.includes(word));
        
        // Solo considerar match si coinciden al menos 2 palabras (no solo 1)
        return matchedWords.length >= 2;
      });
    }
    
    // Detectar si usuario pide detalles
    const serviceKeywords = ['cotización', 'precio', 'costo', 'cuánto', 'detalles', 'más información', 'características', 'interesa', 'quiero saber'];
    const askingForDetails = serviceKeywords.some(kw => messageLower.includes(kw));
    
    // 🆕 Detectar si usuario pregunta por IMPACTO EMPRESARIAL (Nivel 4)
    const businessImpactKeywords = [
      'cómo ayuda', 'cómo contribuye', 'beneficio', 'impacto', 'objetivos', 
      'negocio', 'empresa', 'roi', 'retorno', 'resultados', 'lograr',
      'por qué', 'ventaja', 'valor', 'aporte', 'solución', 'problema'
    ];
    const askingForBusinessImpact = businessImpactKeywords.some(kw => messageLower.includes(kw));
    
    // 🆕 Detectar si usuario QUIERE SER CONTACTADO (Nivel 5)
    const contactIntentKeywords = [
      'cotización', 'cotizar', 'presupuesto', 'precio exacto',
      'agendar', 'reunión', 'llamada', 'contacto', 'llamarme',
      'quiero contratar', 'me interesa contratar', 'solicitar',
      'enviar propuesta', 'más información', 'hablar con un asesor',
      'demo', 'prueba', 'reunión gratis', 'contactarme',
      'envíame', 'mándame', 'necesito', 'requiero'
    ];
    const wantsContact = contactIntentKeywords.some(kw => messageLower.includes(kw));
    
    // Detectar si el mensaje contiene datos de contacto (email, teléfono)
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(currentMessage);
    const hasPhone = /(\+51\s?)?9\d{2}\s?\d{3}\s?\d{3}|\d{9}/.test(currentMessage);
    
    // 🚫 NO detectar nombres automáticamente - solo cuando estamos en el formulario
    // y el usuario ya fue preguntado explícitamente por su nombre
    const hasName = false; // Deshabilitado - se manejará por contexto del formulario
    
    // 🔒 Detectar si estamos en medio del proceso de formulario
    // isInFormProcess = true si:
    // - Ya tenemos el flag activo (session.isCollectingContactInfo), O
    // - Ya tenemos datos guardados en session.contactFormData, O
    // - El usuario acaba de solicitar contacto (wantsContact)
    const hasStoredData = session.contactFormData && 
                         (session.contactFormData.nombre || session.contactFormData.celular || session.contactFormData.correo);
    
    const isInFormProcess = session.isCollectingContactInfo || hasStoredData || wantsContact;
    
    // providingContactInfo = true si:
    // - El usuario acaba de solicitar contacto (primer paso), O
    // - Ya estamos en proceso de recolección activa (flag activado) Y el mensaje no es un rechazo
    // ✅ SIMPLIFICADO: Si el flag está activo, estamos proveyendo info (a menos que sea rechazo)
    const isRejection = messageLower.includes('no gracias') || messageLower.includes('no quiero') || 
                       messageLower.includes('cancelar') || messageLower.includes('mejor no');
    
    const providingContactInfo = (session.isCollectingContactInfo && !isRejection) || wantsContact;
    
    // 🔍 DEBUG: Log detection
    logger.info(`🔍 [LEVEL DETECTION] hasEmail=${hasEmail}, hasPhone=${hasPhone}, hasName=${hasName}, isInFormProcess=${isInFormProcess}, isCollectingFlag=${session.isCollectingContactInfo}, wantsContact=${wantsContact}, providingContactInfo=${providingContactInfo}`);
    
    // 🎯 Determinar nivel de conversación
    let level = 1; // Por defecto, primera interacción
    
    if (messageCount === 0 || messageLower.includes('qué servicios') || messageLower.includes('qué ofrecen')) {
      level = 1; // Primera vez, mostrar categorías
    } else if (providingContactInfo && messageCount >= 2) {
      level = 5; // Usuario está proporcionando datos de contacto
    } else if (wantsContact && (serviceMentioned || messageCount >= 3)) {
      level = 5; // Usuario solicita ser contactado
    } else if (serviceMentioned && askingForBusinessImpact && messageCount >= 2) {
      level = 4; // Usuario quiere saber impacto empresarial del servicio
    } else if (serviceMentioned || (messageCount >= 2 && askingForDetails)) {
      level = 3; // Usuario mencionó servicio específico o pide detalles
    } else if (categoryMentioned) {
      level = 2; // Usuario mencionó categoría, mostrar servicios
    }
    
    const serviceId = serviceMentioned ? (serviceMentioned._id || serviceMentioned.id) : null;
    
    if (serviceId) {
      logger.info(`🎯 [SERVICE DETECTED] ${serviceMentioned.titulo} (ID: ${serviceId})`);
    }
    
    return {
      level,
      messageCount,
      categoryMentioned,
      serviceMentioned: serviceMentioned ? serviceMentioned.titulo : null,
      serviceId,
      askingForDetails,
      askingForBusinessImpact,
      wantsContact,
      providingContactInfo
    };
  }

  /**
   * 📧 Extraer información de contacto del mensaje del usuario
   * Detecta: nombre, teléfono, email
   */
  extractContactInfo(message) {
    const data = {
      nombre: null,
      celular: null,
      correo: null,
      isComplete: false
    };

    // 1️⃣ Regex para email
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = message.match(emailRegex);
    if (emails && emails.length > 0) {
      data.correo = emails[0].toLowerCase();
      logger.info(`📧 [CONTACT INFO] Email detected: ${data.correo}`);
    }

    // 2️⃣ Regex para teléfono (Perú: +51 9XX XXX XXX o 9XX XXX XXX o XXXXXXXXX)
    const phoneRegex = /(\+51\s?)?9\d{2}\s?\d{3}\s?\d{3}|\b\d{9}\b/g;
    const phones = message.match(phoneRegex);
    if (phones && phones.length > 0) {
      // Limpiar espacios y normalizar
      data.celular = phones[0].replace(/\s/g, '');
      // Si no tiene +51, agregarlo
      if (!data.celular.startsWith('+51')) {
        data.celular = `+51${data.celular}`;
      }
      logger.info(`📱 [CONTACT INFO] Phone detected: ${data.celular}`);
    }

    // 3️⃣ Nombre: buscar texto que NO sea email ni teléfono
    const lines = message.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    for (const line of lines) {
      // Skip si la línea contiene email o teléfono
      if (line.match(emailRegex) || line.match(phoneRegex)) {
        continue;
      }
      
      // Buscar línea que parezca un nombre (1-4 palabras, cada una con letras)
      const words = line.split(/\s+/);
      
      if (words.length >= 1 && words.length <= 4) {
        // Verificar que no sean palabras comunes ni verbos/keywords (filtro robusto)
        const commonWords = [
          'hola', 'gracias', 'por', 'favor', 'buenos', 'dias', 'tardes', 'noches', 'soy', 'me', 'llamo',
          'quiero', 'necesito', 'deseo', 'solicito', 'busco', 'estoy', 'tengo', 'puedo',
          'cotización', 'cotizacion', 'presupuesto', 'informacion', 'información', 'servicios',
          'una', 'un', 'el', 'la', 'los', 'las', 'del', 'de', 'para', 'con', 'sin',
          'si', 'no', 'ok', 'vale', 'claro', 'perfecto', 'bien'
        ];
        
        // Verificar que al menos una palabra tenga 3+ letras y no sea común
        const hasValidWord = words.some(w => w.length >= 3 && !commonWords.includes(w.toLowerCase()));
        const isLikelyName = hasValidWord && !words.some(w => commonWords.includes(w.toLowerCase()));
        
        if (isLikelyName && line.length >= 3 && line.length <= 50) {
          data.nombre = line;
          logger.info(`👤 [CONTACT INFO] Name detected: ${data.nombre}`);
          break;
        }
      }
    }

    // Si no encontramos nombre en líneas separadas, buscar después de patrones comunes
    if (!data.nombre) {
      const namePatterns = [
        /(?:me llamo|soy|mi nombre es)\s+([a-záéíóúñ\s]{3,50})/i,
        /^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3})/,
        /^([a-záéíóúñ]{3,}(?:\s+[a-záéíóúñ]+){0,3})$/i // Nombre simple o compuesto (lowercase permitido)
      ];
      
      for (const pattern of namePatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
          const potentialName = match[1].trim();
          
          // Filtrar palabras comunes
          const commonWords = ['hola', 'gracias', 'buenos', 'dias', 'tardes', 'si', 'no', 'ok'];
          const isCommon = commonWords.some(word => potentialName.toLowerCase() === word);
          
          if (!isCommon && potentialName.length >= 3) {
            data.nombre = potentialName;
            logger.info(`👤 [CONTACT INFO] Name detected via pattern: ${data.nombre}`);
            break;
          }
        }
      }
    }

    // 4️⃣ Verificar si tenemos información completa
    data.isComplete = !!(data.nombre && (data.correo || data.celular));
    
    if (data.isComplete) {
      logger.success(`✅ [CONTACT INFO] Complete contact info extracted`);
    } else if (data.correo || data.celular) {
      logger.info(`⚠️ [CONTACT INFO] Partial contact info (missing: ${!data.nombre ? 'nombre' : ''})`);
    }

    return data;
  }

  /**
   * 📝 Crear Lead en el CRM desde la conversación del chat
   */
  async createLeadFromChat(contactData, conversationContext, session) {
    try {

      // Extraer servicio de interés desde el contexto
      const servicioInteres = conversationContext.serviceMentioned || 'Servicio de interés no especificado';
      const categoriaInteres = conversationContext.categoryMentioned || 'General';

      // Construir resumen de la conversación (últimos 10 mensajes máximo)
      const conversationSummary = session.messages
        .slice(-10)
        .map(m => `[${m.role === 'user' ? 'Cliente' : 'Bot'}]: ${m.content.substring(0, 200)}`)
        .join('\n\n');

      // Mapear categoría a tipoServicio del Lead
      const tipoServicioMap = {
        'desarrollo': 'web',
        'diseño': 'diseño',
        'marketing': 'marketing',
        'consultoría': 'consultoria',
        'mantenimiento': 'sistemas',
        'otro': 'otro'
      };
      
      const tipoServicio = tipoServicioMap[categoriaInteres.toLowerCase()] || 'otro';

      // Obtener detalles del servicio si existe
      let servicioDetails = null;
      if (conversationContext.serviceId) {
        try {
          servicioDetails = await Servicio.findById(conversationContext.serviceId)
            .select('titulo precio categoria')
            .lean();
        } catch (error) {
          logger.warn('⚠️ Could not fetch service details:', error.message);
        }
      }

      // Construir descripción enriquecida
      let descripcionProyecto = `🤖 LEAD CAPTURADO DESDE CHAT CONVERSACIONAL\n\n`;
      descripcionProyecto += `📋 Servicio de interés: ${servicioInteres}\n`;
      descripcionProyecto += `📂 Categoría: ${categoriaInteres}\n`;
      
      if (servicioDetails && servicioDetails.precio) {
        descripcionProyecto += `💰 Precio del servicio: S/ ${servicioDetails.precio}\n`;
      }
      
      descripcionProyecto += `\n📊 Nivel de conversación alcanzado: ${conversationContext.level}\n`;
      descripcionProyecto += `💬 Número de mensajes: ${conversationContext.messageCount}\n\n`;
      descripcionProyecto += `📝 RESUMEN DE CONVERSACIÓN:\n${conversationSummary}`;

      const nuevoLead = new Lead({
        nombre: contactData.nombre,
        celular: contactData.celular || 'No proporcionado',
        correo: contactData.correo || 'No proporcionado',
        tipoServicio: tipoServicio,
        descripcionProyecto: descripcionProyecto,
        estado: 'nuevo',
        prioridad: 'alta', // 🔥 Alta prioridad porque vino del chat con interés confirmado
        origen: 'chat',
        tags: [
          'chat-lead',
          'contacto-directo',
          `servicio-${servicioInteres.toLowerCase().replace(/\s+/g, '-')}`,
          `nivel-${conversationContext.level}`,
          'alta-prioridad'
        ],
        creadoPor: {
          userId: 'sales-chatbot',
          nombre: 'Asesor de Ventas SCUTI',
          email: 'chatbot@webscuti.com'
        },
        metadata: {
          conversationId: session.id,
          lastConversationLevel: conversationContext.level,
          serviceMentioned: servicioInteres,
          categoryMentioned: categoriaInteres,
          serviceId: conversationContext.serviceId || null,
          capturedAt: new Date(),
          source: 'floating-chat-widget',
          messageCount: conversationContext.messageCount
        },
        actividades: [{
          fecha: new Date(),
          tipo: 'nota',
          descripcion: `✅ Lead capturado automáticamente desde chat conversacional.\n\n` +
                      `📊 Detalles:\n` +
                      `- Nivel de conversación: ${conversationContext.level}\n` +
                      `- Servicio de interés: ${servicioInteres}\n` +
                      `- Categoría: ${categoriaInteres}\n` +
                      `- Mensajes intercambiados: ${conversationContext.messageCount}\n\n` +
                      `🎯 Acción recomendada: Contactar en las próximas 2 horas por WhatsApp o email.`,
          usuarioId: 'sales-chatbot',
          usuarioNombre: 'Asesor de Ventas SCUTI',
          esPrivado: false,
          direccion: 'interno'
        }]
      });

      await nuevoLead.save();

      logger.success(`✅ [LEAD CREATED] ${contactData.nombre} - ${contactData.correo || contactData.celular}`);
      logger.info(`📊 [LEAD INFO] Service: ${servicioInteres}, Level: ${conversationContext.level}`);

      return {
        success: true,
        leadId: nuevoLead._id,
        lead: nuevoLead
      };

    } catch (error) {
      logger.error('❌ [ERROR] Creating lead from chat:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 🎯 Construir prompt para ASESOR DE VENTAS (páginas públicas)
   */
  buildSalesPrompt(servicesContext, servicesListText, conversationLevel = {}) {
    // Generar lista COMPACTA de servicios destacados (máximo 6)
    const featuredList = servicesContext.featuredServices && servicesContext.featuredServices.length > 0
      ? servicesContext.featuredServices.map((s, i) => 
          `${i + 1}. **${s.titulo}** (${s.categoria}) - ${s.precio}${s.duracion ? ` - ${s.duracion}` : ''}`
        ).join('\n')
      : 'Consulta nuestro catálogo completo';

    // 🔧 Anti-cache: Agregar timestamp invisible para evitar respuestas cacheadas
    const cacheBuster = `<!-- Context-ID: ${Date.now()}-${Math.random().toString(36).substr(2, 9)} -->`;
    
    // 🧠 Contexto del nivel de conversación
    let categoryServicesContext = '';
    let serviceDetailsContext = '';
    
    // 🔧 NIVEL 2: Si hay categoría mencionada, filtrar servicios de esa categoría
    if (conversationLevel.level === 2 && conversationLevel.categoryMentioned) {
      logger.info(`🔍 [LEVEL 2] Filtering services for category: "${conversationLevel.categoryMentioned}"`);
      
      const categoryServices = servicesContext.availableServices.filter(s => {
        const categoryMatch = s.categoria.toLowerCase().includes(conversationLevel.categoryMentioned.toLowerCase()) ||
                             conversationLevel.categoryMentioned.toLowerCase().includes(s.categoria.toLowerCase());
        
        logger.info(`🔍 Service "${s.titulo}" in category "${s.categoria}" - Match: ${categoryMatch}`);
        return categoryMatch;
      }).slice(0, 10); // 🔧 Límite máximo de 10 servicios
      
      logger.info(`🔍 [LEVEL 2] Found ${categoryServices.length} services for "${conversationLevel.categoryMentioned}"`);
      
      if (categoryServices.length > 0) {
        categoryServicesContext = `\n📋 SERVICIOS REALES DE LA CATEGORÍA "${conversationLevel.categoryMentioned.toUpperCase()}" (${categoryServices.length} servicios encontrados en la BD):

${categoryServices.map((s, i) => `${i + 1}. ${s.titulo} - ${s.precio || 'Precio a consultar'}${s.duracion ? ` - ${s.duracion}` : ''}${s.descripcionCorta ? `\n   ${s.descripcionCorta}` : ''}`).join('\n\n')}

🚨 INSTRUCCIÓN INMEDIATA PARA NIVEL 2: 
- DEBES listar EXACTAMENTE estos ${categoryServices.length} servicios mostrados arriba
- IGNORA cualquier otra lista de servicios que aparezca en este prompt
- NO inventes servicios adicionales como "Consultoría Estratégica" o "Transformación Digital"
- Responde: "¡Perfecto! Para ${conversationLevel.categoryMentioned} tenemos:" seguido de ESTA lista exacta
- Termina preguntando: "¿Cuál te gustaría conocer más a fondo?"

SERVICIOS A LISTAR:
${categoryServices.map((s, i) => `${i + 1}. ${s.titulo}`).join('\n')}\n`;
      } else {
        categoryServicesContext = `\n⚠️ CATEGORÍA "${conversationLevel.categoryMentioned.toUpperCase()}": No se encontraron servicios activos en esta categoría en la base de datos.\n\nInforma al usuario que esta categoría está en desarrollo y ofrece categorías alternativas.\n`;
      }
    }
    
    // 🔧 NIVEL 3: Si hay detalles del servicio en el contexto (pasados desde getServicesContext)
    if (conversationLevel.level === 3 && servicesContext.serviceDetails) {
      const sd = servicesContext.serviceDetails;
      serviceDetailsContext = `\n📄 DETALLES DEL SERVICIO "${sd.titulo.toUpperCase()}":

**Categoría:** ${sd.categoria || 'Sin categoría'}
**Precio:** ${sd.precio || 'Consultar precio'}
**Duración:** ${sd.duracion || 'A consultar'}

**Descripción:**
${sd.descripcion || 'Servicio profesional de alta calidad'}

${sd.caracteristicas && sd.caracteristicas.length > 0 ? `**Características principales:**
${sd.caracteristicas.slice(0, 5).map(c => `• ${c}`).join('\n')}` : ''}

${sd.beneficios && sd.beneficios.length > 0 ? `**Beneficios:**
${sd.beneficios.slice(0, 4).map(b => `• ${b}`).join('\n')}` : ''}

🚨 USA ESTA INFORMACIÓN para dar un resumen profesional del servicio. Menciona precio, duración, y destaca 3-4 beneficios clave. Termina con CTA (solicitar cotización personalizada o agendar reunión).\n`;
    }
    
    const levelContext = conversationLevel.level 
      ? `\n🎯 CONTEXTO DE CONVERSACIÓN: Estás en nivel ${conversationLevel.level} de la conversación.
${conversationLevel.level === 1 ? '→ Usuario pregunta genérico: Presenta CATEGORÍAS principales' : ''}
${conversationLevel.level === 2 ? `→ Usuario interesado en: ${conversationLevel.categoryMentioned || 'categoría específica'} - Lista TODOS los servicios` : ''}
${conversationLevel.level === 3 ? '→ Usuario quiere profundizar: Da DETALLES del servicio y CTA' : ''}
${conversationLevel.level === 4 ? '→ Usuario pregunta IMPACTO EMPRESARIAL: Explica cómo el servicio resuelve problemas y contribuye a objetivos de negocio' : ''}
${conversationLevel.level === 5 ? '→ 🚨 NIVEL 5 ACTIVO: Usuario quiere cotización/contacto. SOLICITA datos (nombre, celular, email) DIRECTAMENTE en el chat. NO pidas formularios externos.' : ''}
${categoryServicesContext}
${serviceDetailsContext}\n`
      : '';

    return `${cacheBuster}
${levelContext}
Eres el Asesor de Ventas de SCUTI Company, empresa líder en desarrollo de software en Perú.

🎯 TU IDENTIDAD:
- Nombre: "Asesor de Ventas SCUTI"
- Rol: Consultor de ventas especializado
- Objetivo: Ayudar clientes a encontrar la solución perfecta

🏢 SCUTI COMPANY:
Expertos en desarrollo de software con 50+ proyectos exitosos. Transformamos ideas en soluciones digitales.

**Especialidades:** Desarrollo Web/Móvil, CRM/ERP, E-commerce, IA/Automatización, Diseño UX/UI, Cloud.

⭐ SERVICIOS DESTACADOS (${servicesContext.featuredServices?.length || 0} principales):

${featuredList}

📊 CATÁLOGO COMPLETO: ${servicesContext.totalServices} servicios en ${servicesContext.categories.length} categorías.

💼 CATEGORÍAS: ${servicesContext.categories.map(c => c.nombre).join(', ')}

${servicesContext.stats.pricing ? `💰 INVERSIÓN: Desde S/ ${Math.round(servicesContext.stats.pricing.minPrice)} hasta S/ ${Math.round(servicesContext.stats.pricing.maxPrice)}` : ''}

✅ REGLAS DE ORO:

1. **SÉ CONCISO**: Respuestas de 3-5 líneas máximo en primera interacción
2. **SOLO SERVICIOS REALES**: NUNCA inventes servicios. Solo menciona servicios que existen en la base de datos
3. **NO LISTES TODO**: Muestra SOLO servicios relevantes según necesidad
4. **PREGUNTA PRIMERO**: Entiende qué necesita antes de recomendar
5. **BENEFICIOS, NO FEATURES**: Habla de valor, no de características técnicas
6. **GUÍA LA CONVERSACIÓN**: Haz preguntas específicas para personalizar

🔥 **REGLA CRÍTICA SOBRE SERVICIOS POR CATEGORÍA:**
- Cuando el usuario pregunte por una categoría específica (ej: "Consultoría"), SOLO lista los servicios REALES de esa categoría que aparecen en el contexto
- PROHIBIDO INVENTAR servicios como "Consultoría Estratégica Empresarial", "Consultoría de Transformación Digital", etc.
- USA EXACTAMENTE los títulos de servicios proporcionados en el contexto
- Si no hay servicios en esa categoría, informa que está en desarrollo
- NUNCA uses nombres genéricos o inventados de servicios

🚫 RESTRICCIONES ABSOLUTAS - TEMAS PROHIBIDOS:

❌ **NO RESPONDAS PREGUNTAS SOBRE:**
- Tareas escolares, universitarias o de investigación académica
- Temas generales (historia, ciencia, geografía, matemáticas, etc.)
- Programación/código que NO esté relacionado con nuestros servicios
- Consejos personales, salud, finanzas personales, legales
- Entretenimiento (chistes, historias, juegos, adivinanzas)
- Traducciones, correcciones ortográficas, redacción de textos
- Cualquier tema que NO sea sobre servicios de SCUTI Company

✅ **SOLO PUEDES HABLAR DE:**
- Servicios ofrecidos por SCUTI Company (desarrollo, diseño, marketing, consultoría)
- Cotizaciones, precios, paquetes de servicios
- Procesos de trabajo, metodologías, tiempos de entrega
- Casos de éxito, portafolio de proyectos
- Cómo nuestros servicios resuelven problemas empresariales
- Agendamiento de reuniones, captura de información de contacto

🛡️ **SI TE PREGUNTAN ALGO FUERA DEL TEMA:**

Responde EXACTAMENTE:
"Soy el Asesor de Ventas de SCUTI Company y estoy especializado únicamente en ayudarte con nuestros servicios de desarrollo de software, diseño, marketing y consultoría.

No puedo ayudarte con [tema solicitado]. ¿Te puedo mostrar cómo nuestros servicios pueden ayudar a tu negocio o proyecto? 🚀"

🚨 EJEMPLOS DE RECHAZO:

Usuario: "¿Quién descubrió América?"
Tú: "Soy el Asesor de Ventas de SCUTI Company y estoy especializado únicamente en ayudarte con nuestros servicios de desarrollo de software. No puedo ayudarte con historia. ¿Te interesa conocer nuestros servicios para tu empresa? 🚀"

Usuario: "Ayúdame con mi tarea de matemáticas"
Tú: "Soy el Asesor de Ventas de SCUTI Company y estoy especializado únicamente en ayudarte con servicios de desarrollo y diseño. No puedo ayudarte con tareas académicas. ¿Tienes algún proyecto empresarial en mente? 💼"

Usuario: "Cuéntame un chiste"
Tú: "Soy el Asesor de Ventas de SCUTI Company y estoy enfocado en ayudarte con soluciones digitales para tu negocio. No puedo entretener, pero sí puedo mostrarte servicios increíbles. ¿Qué tipo de solución necesitas? 🌐"

⚖️ IMPORTANTE: Sé cortés pero FIRME. No entres en conversaciones fuera de tema. Redirige SIEMPRE a servicios.

🚫 RESTRICCIONES ABSOLUTAS - TEMAS PROHIBIDOS:

❌ **NO RESPONDAS PREGUNTAS SOBRE:**
- Tareas escolares, universitarias o de investigación académica
- Temas generales (historia, ciencia, geografía, matemáticas, etc.)
- Programación/código que NO esté relacionado con nuestros servicios
- Consejos personales, salud, finanzas personales, legales
- Entretenimiento (chistes, historias, juegos, adivinanzas)
- Traducciones, correcciones ortográficas, redacción de textos
- Cualquier tema que NO sea sobre servicios de SCUTI Company

✅ **SOLO PUEDES HABLAR DE:**
- Servicios ofrecidos por SCUTI Company (desarrollo, diseño, marketing, consultoría)
- Cotizaciones, precios, paquetes de servicios
- Procesos de trabajo, metodologías, tiempos de entrega
- Casos de éxito, portafolio de proyectos
- Cómo nuestros servicios resuelven problemas empresariales
- Agendamiento de reuniones, captura de información de contacto

🛡️ **SI TE PREGUNTAN ALGO FUERA DEL TEMA:**

Responde EXACTAMENTE:
"Soy el Asesor de Ventas de SCUTI Company y estoy especializado únicamente en ayudarte con nuestros servicios de desarrollo de software, diseño, marketing y consultoría.

No puedo ayudarte con [tema solicitado]. ¿Te puedo mostrar cómo nuestros servicios pueden ayudar a tu negocio o proyecto? 🚀"

🚨 EJEMPLOS DE RECHAZO:

Usuario: "¿Quién descubrió América?"
Tú: "Soy el Asesor de Ventas de SCUTI Company y estoy especializado únicamente en ayudarte con nuestros servicios de desarrollo de software. No puedo ayudarte con historia. ¿Te interesa conocer nuestros servicios para tu empresa? 🚀"

Usuario: "Ayúdame con mi tarea de matemáticas"
Tú: "Soy el Asesor de Ventas de SCUTI Company y estoy especializado únicamente en ayudarte con servicios de desarrollo y diseño. No puedo ayudarte con tareas académicas. ¿Tienes algún proyecto empresarial en mente? 💼"

Usuario: "Cuéntame un chiste"
Tú: "Soy el Asesor de Ventas de SCUTI Company y estoy enfocado en ayudarte con soluciones digitales para tu negocio. No puedo entretener, pero sí puedo mostrarte servicios increíbles. ¿Qué tipo de solución necesitas? 🌐"

⚖️ IMPORTANTE: Sé cortés pero FIRME. No entres en conversaciones fuera de tema. Redirige SIEMPRE a servicios.

💡 ESTRATEGIA DE CONVERSACIÓN PROGRESIVA:

**NIVEL 1 - Primera interacción (usuario pregunta genérico):**
- Saludo breve y profesional
- Listar SOLO las CATEGORÍAS de la base de datos (usar las categorías reales del contexto)
- Usar emoji apropiado para cada categoría
- Terminar con pregunta abierta: "¿Qué tipo de proyecto/solución necesitas?"

**CATEGORÍAS DISPONIBLES EN BASE DE DATOS:**
${servicesContext.categories.map(c => `• ${c.nombre}${c.descripcion ? ` - ${c.descripcion}` : ''}`).join('\n')}

**IMPORTANTE:** Usa SOLO estas categorías reales, NO inventes ni agregues otras.

Ejemplo de respuesta NIVEL 1:
"¡Hola! 👋 Soy tu asesor de SCUTI Company.

Ofrecemos servicios en las siguientes categorías:
${servicesContext.categories.map(c => {
  const emoji = c.nombre.toLowerCase().includes('desarrollo') ? '🌐' :
                c.nombre.toLowerCase().includes('diseño') ? '🎨' :
                c.nombre.toLowerCase().includes('marketing') ? '📢' :
                c.nombre.toLowerCase().includes('consultoría') ? '💼' :
                c.nombre.toLowerCase().includes('mantenimiento') ? '🔧' :
                c.nombre.toLowerCase().includes('otro') ? '📦' : '🔹';
  return `${emoji} ${c.nombre}`;
}).join('\n')}

¿En qué categoría te puedo ayudar?"

🚨 CRÍTICO: Debes mostrar LAS ${servicesContext.categories.length} CATEGORÍAS completas, NO omitas ninguna (incluye "Otro", "test", etc.)

**NIVEL 2 - Usuario menciona categoría o necesidad específica:**
- Confirmar entendimiento: "¡Perfecto! Para [categoría] tenemos:"
- **Listar servicios en formato SIMPLE** (máximo 6-8)
- Formato: "número. Nombre del Servicio" (SOLO nombre, sin precio)
- **NO agregar precios, descripciones ni emojis**
- Terminar con pregunta: "¿Cuál te gustaría conocer más a fondo?"

🚨 FORMATO OBLIGATORIO para NIVEL 2:

"¡Perfecto! Para [Categoría] tenemos:

1. Nombre del Servicio 1
2. Nombre del Servicio 2
3. Nombre del Servicio 3
4. Nombre del Servicio 4
...

¿Cuál te gustaría conocer más a fondo?"

Ejemplo CORRECTO:
"¡Perfecto! Para Desarrollo tenemos:

1. Desarrollo Web Empresarial
2. E-commerce Completo
3. Sistema CRM Personalizado
4. Aplicación Móvil iOS/Android

¿Cuál te gustaría conocer más a fondo?"

❌ NO HAGAS (en nivel 2):
- NO agregues precios (se muestran en nivel 3)
- NO agregues descripciones
- NO uses emojis en cada servicio
- NO menciones duración
- NO listes más de 8 servicios

**NIVEL 3 - Usuario muestra interés en servicio específico:**
- Confirmar elección positivamente
- Detallar 3-4 beneficios/características clave
- Mencionar tiempo de entrega
- Call to action claro (cotización, reunión, más info)

Ejemplo:
"Excelente elección. El Desarrollo Web Empresarial incluye:
• Diseño responsivo profesional
• Panel de administración intuitivo
• Optimización SEO incluida
• Hosting gratis 3 meses

Listo en 4 semanas. ¿Te envío una cotización personalizada?"

**NIVEL 4 - Usuario pregunta por impacto empresarial o cómo ayuda al negocio:**
- Explicar brevemente el PROBLEMA que resuelve
- Mencionar 2-3 OBJETIVOS empresariales que se logran
- Dar un CASO DE USO concreto
- Mencionar MÉTRICAS o resultados esperados
- Call to action para profundizar (demo, caso de éxito, reunión)

Ejemplo:
"La Consultoría SEO Avanzada resuelve un problema crítico: empresas con sitios web que no generan tráfico orgánico.

Con este servicio logras:
✅ Aumentar visibilidad en Google (objetivo: Top 10 en keywords clave)
✅ Generar tráfico cualificado sin pagar publicidad
✅ Construir autoridad de marca a largo plazo

Caso real: Cliente del sector retail aumentó 240% su tráfico orgánico en 4 meses, generando S/18,000 adicionales en ventas mensuales.

¿Te gustaría ver más casos de éxito o agendar una auditoría gratuita?"

🚨 FORMATO para NIVEL 4:
- Máximo 8 líneas
- Enfoque en ROI y resultados medibles
- Usar números/porcentajes cuando sea posible
- Terminar con CTA específico (demo, caso de éxito, auditoría, reunión)

**NIVEL 5 - Usuario solicita cotización/contacto/reunión (CRÍTICO - CAPTURA DE LEAD):**
🎯 OBJETIVO: Capturar información de contacto del cliente de forma natural

SITUACIÓN: Usuario dice cosas como:
- "Quiero una cotización"
- "Envíame más información"
- "Agendar reunión"
- "Contáctenme"
- "Me interesa contratar"

🚨 FORMULARIO SECUENCIAL - PIDE UN DATO A LA VEZ:

📝 PASO 1 - Pedir NOMBRE:
"¡Perfecto! [nombre del servicio] es ideal para [beneficio clave].

Para enviarte una cotización personalizada, primero necesito tu **nombre completo**. ¿Cómo te llamas? 😊"

📝 PASO 2 - Pedir TELÉFONO (cuando ya tienes nombre):
"¡Gracias, [nombre]! 👍

Ahora, ¿cuál es tu **número de celular**? (Ejemplo: 987654321)"

📝 PASO 3 - Pedir EMAIL (cuando ya tienes nombre y teléfono):
"Perfecto, [nombre]! 📱

Por último, ¿cuál es tu **correo electrónico**? (Ejemplo: tu@empresa.com)"

📝 PASO 4 - CONFIRMACIÓN FINAL (cuando tienes los 3 datos):
"✅ ¡Listo, [nombre]! Tu información ha sido registrada exitosamente.

Uno de nuestros asesores especializados te contactará en las **próximas 2 horas** por WhatsApp o email para coordinar detalles sobre **[servicio]**.

Mientras tanto, ¿hay algo más que quieras saber? 🚀"

🚨 REGLAS CRÍTICAS NIVEL 5:
- ❌ NO pidas los 3 datos a la vez
- ❌ NO digas "llena el formulario en /contacto"
- ❌ NO pidas que visiten otra página
- ✅ Pide UN SOLO dato por mensaje
- ✅ Orden: NOMBRE → TELÉFONO → EMAIL
- ✅ Usa el nombre del usuario cuando ya lo tengas
- ✅ Máximo 3-4 líneas por mensaje
- ✅ Tono conversacional y amigable

❌ ERRORES A EVITAR:
- ❌ Listar 8+ servicios de golpe
- ❌ Respuestas de más de 10 líneas
- ❌ Describir features técnicos complejos
- ❌ Inventar servicios no listados
- ❌ Prometer sin confirmar
- ❌ Pedir formulario externo en Nivel 5

✅ SIEMPRE:
- Sé humano, cálido y profesional
- Pregunta para entender necesidad
- Recomienda máximo 3-4 opciones
- Cierra con pregunta/call to action
- Menciona precios cuando estén disponibles
- EN NIVEL 5: Captura datos directamente en chat

🎯 TU META: Convertir consulta en lead calificado mediante conversación natural y personalizada.

🚨 INSTRUCCIÓN FINAL CRÍTICA:
- Si un usuario pregunta por una categoría específica (ej: "Consultoría"), MIRA ARRIBA en este prompt
- Busca la sección "SERVICIOS REALES DE LA CATEGORÍA [NOMBRE]" 
- USA EXACTAMENTE esos nombres de servicios listados
- PROHIBIDO inventar servicios como "Consultoría Estratégica", "Transformación Digital", etc.
- Si no ves esa sección, significa que no hay servicios disponibles en esa categoría`;
  }

  /**
   * 👨‍💼 Construir prompt para ADMINISTRADOR DE SERVICIOS (panel admin)
   */
  buildAdminPrompt(servicesContext, servicesListText) {
    return `Eres el Asistente Administrativo de Servicios para SCUTI Company.

🎯 TU IDENTIDAD:
- Nombre: "Asistente de Gestión de Servicios"
- Rol: Especialista en administración y optimización de portafolio de servicios
- Objetivo: Ayudar al equipo interno a crear, editar y mejorar servicios

🎯 TU MISIÓN:
Asistir en la gestión operativa de servicios: creación, edición, análisis de calidad, optimización de descripciones, estrategias de pricing y mejoras del catálogo.

📊 PORTAFOLIO ACTUAL (${servicesContext.totalServices} servicios):

${servicesListText}

💼 CATEGORÍAS:
${servicesContext.categories.map(c => `• ${c.nombre}${c.descripcion ? ` - ${c.descripcion}` : ''}`).join('\n')}

${servicesContext.stats.pricing ? `💰 ESTADÍSTICAS DE PRECIOS:
- Mínimo: S/ ${Math.round(servicesContext.stats.pricing.minPrice)}
- Máximo: S/ ${Math.round(servicesContext.stats.pricing.maxPrice)}
- Promedio: S/ ${Math.round(servicesContext.stats.pricing.avgPrice)}` : ''}

🔧 TUS CAPACIDADES:

1. **Crear servicios**: Ayudar a definir títulos, descripciones, características, beneficios, pricing

2. **Editar servicios**: Optimizar contenido existente, mejorar SEO, ajustar precios

3. **Analizar calidad**: Evaluar servicios y sugerir mejoras

4. **Estrategia de pricing**: Recomendar precios competitivos según el mercado

5. **Optimización SEO**: Mejorar títulos y descripciones para buscadores

6. **Generación de contenido**: FAQs, características, beneficios, casos de uso

✅ CÓMO DEBES RESPONDER:

- **Tono**: Profesional, técnico, orientado a resultados
- **Enfoque**: Ayudar en tareas administrativas concretas
- **Sugerencias**: Basadas en mejores prácticas y datos del portafolio
- **Ejemplos**: Proporciona templates y estructuras cuando sea útil

💡 EJEMPLO DE RESPUESTA:

Usuario: "Ayúdame a crear un servicio de desarrollo móvil"

Tú: "Te ayudo a estructurar el servicio de Desarrollo Móvil:

**TÍTULO SUGERIDO:**
Desarrollo de Aplicación Móvil Nativa (iOS/Android)

**DESCRIPCIÓN CORTA (150 caracteres):**
Creamos apps móviles nativas personalizadas para iOS y Android con diseño moderno y alto rendimiento.

**CARACTERÍSTICAS PRINCIPALES:**
✅ Desarrollo nativo (Swift/Kotlin)
✅ Diseño UX/UI profesional
✅ Integración de APIs
✅ Panel de administración web
✅ Publicación en stores
✅ 3 meses de soporte post-lanzamiento

**PRECIO SUGERIDO:**
S/ 8,000 - S/ 15,000 (según complejidad)
Justificación: Está en línea con tu rango de S/${Math.round(servicesContext.stats.pricing.minPrice)} - S/${Math.round(servicesContext.stats.pricing.maxPrice)}

**DURACIÓN:**
8-12 semanas

¿Quieres que genere las FAQs o los beneficios también?"

🌟 RECUERDA:
Tu rol es OPERATIVO y ADMINISTRATIVO, no de ventas. Enfócate en la gestión eficiente del portafolio de servicios.`;
  }

  /**
   * Construir prompt para chat
   */
  buildChatPrompt(message, session, servicesContext, intent, context = {}) {
    // 🎯 Detectar si es contexto público (ventas) o admin (gestión)
    const isPublicContext = context.isPublic === true;
    
    logger.info(`🎭 [PROMPT BUILDER] isPublicContext = ${isPublicContext}, context.isPublic = ${context.isPublic}`);
    
    // 🆕 ANALIZAR NIVEL DE CONVERSACIÓN (para contexto de ventas)
    const conversationLevel = this.analyzeConversationLevel(session, message, servicesContext);
    logger.info(`📊 [CONVERSATION] Level: ${conversationLevel.level}, Category mentioned: ${conversationLevel.categoryMentioned || 'none'}`);
    
    // 🆕 Construir lista de servicios para el contexto
    const servicesListText = servicesContext.availableServices && servicesContext.availableServices.length > 0
      ? servicesContext.availableServices
          .map((s, i) => `${i + 1}. ${s.titulo} (${s.categoria}) - ${s.precio}${s.duracion ? ` - ${s.duracion}` : ''}`)
          .join('\n')
      : 'Cargando catálogo de servicios...';

    logger.info(`📋 [SERVICES LIST] availableServices count: ${servicesContext.availableServices?.length || 0}`);
    logger.info(`📋 [SERVICES LIST] servicesListText length: ${servicesListText.length} chars`);
    logger.info(`📋 [SERVICES LIST] First 200 chars: ${servicesListText.substring(0, 200)}`);

    // 🎭 Elegir el prompt según el contexto
    const systemPrompt = isPublicContext 
      ? this.buildSalesPrompt(servicesContext, servicesListText, conversationLevel)
      : this.buildAdminPrompt(servicesContext, servicesListText);
    
    logger.info(`📏 [PROMPT BUILDER] Using ${isPublicContext ? 'SALES' : 'ADMIN'} prompt, length: ${systemPrompt.length} chars`);

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
      // 🔧 Construir mensajes para OpenAI con SYSTEM PROMPT COMPLETO
      const messages = [
        { role: 'system', content: prompt.system } // ✅ Este es el prompt completo con servicios
      ];

      // Agregar historial de conversación (contexto)
      if (prompt.history && prompt.history.length > 0) {
        messages.push(...prompt.history);
      }

      // Agregar mensaje actual del usuario
      messages.push({ role: 'user', content: prompt.current });

      logger.info(`📦 [AI REQUEST] System prompt length: ${prompt.system.length} chars`);
      logger.info(`📦 [AI REQUEST] User message: "${prompt.current.substring(0, 100)}..."`);
      logger.info(`📦 [AI REQUEST] Total messages: ${messages.length}`);

      // ✅ Llamar a OpenAI con los mensajes completos (incluyendo system prompt)
      const response = await openaiService.generateIntelligentResponse(
        sessionId,
        'Asesor de Ventas SCUTI', // 🆕 Nombre correcto del agente
        prompt.current,
        {
          messages: messages, // ✅ Array completo con system + history + user
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens,
          contextData: { intent: prompt.intent },
          disableCache: true // 🔧 CRÍTICO: Desactivar caché para forzar respuestas frescas
        }
      );

      logger.info(`✅ [AI RESPONSE] Received: ${response.content?.substring(0, 100) || response.message?.substring(0, 100)}...`);

      return response.content || response.message || response;

    } catch (error) {
      logger.error('❌ [AI ERROR] Error generating AI response:', error);
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

      // 🆕 CREAR SERVICIO USANDO GENERATOR (con enriquecimiento IA)
      logger.info('💾 [DB_CREATE] Creating service with ServicesGenerator...');
      
      // Usar categoría normalizada (ya validada)
      const categoriaParaServicio = categoriaObj || await Categoria.findOne({ nombre: /desarrollo/i });

      // Importar y usar el ServicesGenerator
      const ServicesGenerator = (await import('./ServicesGenerator.js')).default;
      const generator = new ServicesGenerator(this.config);

      // Preparar datos para el generator (usa categoría como string/ObjectId)
      const serviceDataForGenerator = {
        titulo: extractedData.titulo,
        categoria: categoriaParaServicio._id.toString(), // ObjectId como string
        descripcionCorta: extractedData.descripcionCorta,
        descripcion: extractedData.descripcion,
        userId: context.userId
      };

      logger.info('🔧 [DB_CREATE] Calling generator with data:', {
        titulo: serviceDataForGenerator.titulo,
        categoria: serviceDataForGenerator.categoria,
        hasDescripcion: !!serviceDataForGenerator.descripcion
      });

      // Crear con enriquecimiento automático
      const result = await generator.createServiceWithAI(serviceDataForGenerator, context);

      if (!result.success) {
        throw new Error(result.error || 'Error al crear servicio con generator');
      }

      const servicioGuardado = result.data.service;
      logger.success(`✅ [DB_CREATE] Service created with ID: ${servicioGuardado._id}`);

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
      // 🔧 FIX: Buscar categorías activas O sin campo activo/activa
      const categorias = await Categoria.find({ 
        $or: [
          { activo: true },
          { activa: true },
          { activo: { $exists: false } },
          { activa: { $exists: false } }
        ]
      }).select('nombre slug').limit(10);
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
