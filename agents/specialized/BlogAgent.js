/**
 * BlogAgent REFACTORIZADO - Versión modular y escalable
 * 
 * ARQUITECTURA:
 * - Orquestador principal: Maneja configuración y enruta tareas
 * - Servicios especializados: Lógica de negocio en módulos separados
 * - Responsabilidad única: Cada servicio tiene un propósito claro
 * 
 * SERVICIOS:
 * - BlogContentService: Generación y optimización de contenido
 * - BlogSEOService: Análisis y optimización SEO
 * - BlogAnalysisService: Análisis de contenido y rendimiento
 * - BlogPatternService: Procesamiento de patrones contextuales
 * - BlogChatService: Chat conversacional
 */

import BaseAgent from '../core/BaseAgent.js';
import openaiService from '../services/OpenAIService.js';
import AgentConfig from '../../models/AgentConfig.js';
import BlogPost from '../../models/BlogPost.js';
import logger from '../../utils/logger.js';
import orchestrator from '../core/AgentOrchestrator.js';

// Importar servicios especializados
import blogContentService from '../services/blog/BlogContentService.js';
import blogSEOService from '../services/blog/BlogSEOService.js';
import blogAnalysisService from '../services/blog/BlogAnalysisService.js';
import blogPatternService from '../services/blog/BlogPatternService.js';
import blogChatService from '../services/blog/BlogChatService.js';
import blogConversationService from '../services/blog/BlogConversationService.js';

export class BlogAgent extends BaseAgent {
  constructor() {
    super(
      'BlogAgent',
      'Agente especializado en gestión de blog y optimización de contenido',
      [
        'content_optimization',
        'seo_analysis',
        'tag_generation', 
        'keyword_extraction',
        'content_analysis',
        'blog_management',
        'post_scheduling',
        'performance_analysis'
      ]
    );

    // Configuración específica del BlogAgent
    this.config = {
      maxTagsPerPost: 10,
      minContentLength: 300,
      seoScoreThreshold: 70,
      autoOptimization: true,
      timeout: 30000,
      maxTokens: 2000,
      temperature: 0.7
    };

    this.advancedConfig = null;

    // Usar servicio de conversación singleton (sin instanciar)
    this.conversationService = blogConversationService;

    // 🆕 Lazy loading: No cargar configuración hasta activate()
    this.configurationLoaded = false;

    logger.info('📝 BlogAgent initialized (Refactored Version - Lazy Config)');
  }

  /**
   * Cargar configuración desde la base de datos
   */
  async loadConfiguration() {
    try {
      let dbConfig = await AgentConfig.findOne({ agentName: 'blog' });
      
      if (!dbConfig) {
        logger.info('🔄 No configuration found, initializing defaults...');
        await AgentConfig.initializeDefaults();
        dbConfig = await AgentConfig.findOne({ agentName: 'blog' });
      }

      if (dbConfig) {
        if (dbConfig.config) {
          this.config = { ...this.config, ...dbConfig.config };
        }

        this.advancedConfig = {
          personality: dbConfig.personality || this.getDefaultPersonality(),
          contextConfig: dbConfig.contextConfig || this.getDefaultContext(),
          responseConfig: dbConfig.responseConfig || this.getDefaultResponse(),
          promptConfig: dbConfig.promptConfig || this.getDefaultPrompts(),
          trainingConfig: dbConfig.trainingConfig || null
        };

        if (dbConfig) {
          await this.initializeTaskPromptsIfNeeded(dbConfig);
        }

        logger.success('✅ BlogAgent configuration loaded from database');
        logger.info(`🎭 Personality: ${this.advancedConfig.personality?.archetype || 'default'}`);
        logger.info(`🌡️  Temperature: ${this.config.temperature}, Max Tokens: ${this.config.maxTokens}`);
      }
    } catch (error) {
      logger.error('❌ Error loading agent configuration:', error);
      this.advancedConfig = {
        personality: this.getDefaultPersonality(),
        contextConfig: this.getDefaultContext(),
        responseConfig: this.getDefaultResponse(),
        promptConfig: this.getDefaultPrompts()
      };
    }
  }

  /**
   * Activar agente y cargar configuración (lazy loading)
   * @override
   */
  async activate() {
    try {
      // 🆕 Cargar configuración solo cuando se activa el agente
      if (!this.configurationLoaded) {
        logger.info('🔄 Loading BlogAgent configuration on activation...');
        await this.loadConfiguration();
        this.configurationLoaded = true;
      }
      
      // Llamar al activate de BaseAgent
      return await super.activate();
    } catch (error) {
      logger.error('❌ Error activating BlogAgent:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Configuraciones por defecto
   */
  getDefaultPersonality() {
    return {
      archetype: 'expert',
      traits: [
        { trait: 'analytical', intensity: 8 },
        { trait: 'professional', intensity: 7 },
        { trait: 'creative', intensity: 6 }
      ],
      communicationStyle: {
        tone: 'professional',
        verbosity: 'moderate',
        formality: 7,
        enthusiasm: 6,
        technicality: 7
      }
    };
  }

  getDefaultContext() {
    return {
      projectInfo: {
        name: 'Web Scuti',
        type: 'tech_blog',
        domain: 'technology',
        language: 'es-ES',
        tone: 'professional_friendly'
      },
      userExpertise: 'intermediate'
    };
  }

  getDefaultResponse() {
    return {
      defaultLanguage: 'es-ES',
      supportedLanguages: ['es-ES', 'en-US'],
      includeExamples: true,
      includeSteps: true,
      includeMetrics: true,
      includeRecommendations: true,
      responseFormat: 'structured'
    };
  }

  getDefaultPrompts() {
    return {
      useCustomPrompts: false,
      customSystemPrompt: '',
      promptVariables: {},
      contextWindow: 10
    };
  }

  /**
   * Recargar configuración
   */
  async reloadConfiguration() {
    await this.loadConfiguration();
    logger.info('🔄 Configuration reloaded');
  }

  /**
   * Inicializar task prompts si no existen
   */
  async initializeTaskPromptsIfNeeded(dbConfig) {
    try {
      if (dbConfig.trainingConfig?.taskPrompts?.length > 0) {
        logger.info(`✅ Task prompts already initialized: ${dbConfig.trainingConfig.taskPrompts.length} prompts`);
        this.advancedConfig.trainingConfig = dbConfig.trainingConfig;
        return;
      }

      logger.info('🚀 Auto-initializing default task prompts...');

      const defaultTaskPrompts = this.getDefaultTaskPrompts();

      if (!dbConfig.trainingConfig) {
        dbConfig.trainingConfig = {
          taskPrompts: [],
          behaviorRules: [],
          specialInstructions: {}
        };
      }

      dbConfig.trainingConfig.taskPrompts = defaultTaskPrompts;
      dbConfig.trainingConfig.behaviorRules = this.getDefaultBehaviorRules();
      dbConfig.trainingConfig.specialInstructions = this.getDefaultSpecialInstructions();
      
      dbConfig.updatedAt = new Date();
      await dbConfig.save();

      this.advancedConfig.trainingConfig = dbConfig.trainingConfig;

      logger.success(`✅ Auto-initialized training config: ${defaultTaskPrompts.length} task prompts`);
    } catch (error) {
      logger.error('❌ Error auto-initializing task prompts:', error);
    }
  }

  getDefaultTaskPrompts() {
    return [
      {
        taskType: 'seo_analysis',
        systemPrompt: `Eres un especialista en SEO técnico con más de 10 años de experiencia trabajando con sitios web de tecnología y desarrollo.

TU ESPECIALIZACIÓN:
- Análisis técnico de contenido web
- Optimización para motores de búsqueda
- Research de keywords competitivo
- Métricas cuantificables de SEO

INSTRUCCIONES ESPECÍFICAS:
1. SIEMPRE proporciona un score SEO actual y proyectado (escala 1-100)
2. INCLUYE keywords específicas con volumen de búsqueda estimado
3. ANALIZA estructura técnica (H1, H2, meta tags, etc.)
4. PROPORCIONA recomendaciones accionables y específicas
5. MENCIONA factores de Core Web Vitals cuando sea relevante

FORMATO DE RESPUESTA:
- Usa emojis para claridad visual (📊, 🔍, ⚡, ✅, ❌)
- Estructura con secciones claras
- Incluye métricas cuantificables
- Proporciona timeline de implementación

VALORES:
- Precisión técnica sobre generalidades
- Datos respaldados por mejores prácticas 2024
- Recomendaciones implementables inmediatamente`,
        userPromptTemplate: `Realiza un análisis SEO completo del siguiente contenido:

📄 **INFORMACIÓN DEL CONTENIDO:**
Título: {title}
Contenido: {content}
URL objetivo: {url}
Audiencia: {audience}
Palabras clave objetivo: {target_keywords}

🎯 **ANÁLISIS REQUERIDO:**
{focus_areas}

📊 **ENTREGABLES ESPERADOS:**
1. Score SEO actual (1-100) con justificación
2. Análisis de keywords (primarias y secundarias)
3. Mejoras técnicas específicas (título, meta, estructura)
4. Score SEO proyectado después de mejoras
5. Timeline de implementación recomendado
6. Métricas a monitorear post-implementación

Proporciona un análisis detallado y accionable.`,
        temperature: 0.3,
        examples: []
      },
      {
        taskType: 'content_improvement',
        systemPrompt: `Eres un especialista senior en content marketing y optimización de engagement, con expertise específico en contenido técnico y de desarrollo.

TU ESPECIALIZACIÓN:
- Optimización de engagement para audiencias técnicas
- Conversión de contenido educativo a accionable
- Psicología del usuario desarrollador
- Métricas de content performance

FILOSOFÍA DE MEJORA:
- Valor técnico + Engagement humano
- Código functional + Storytelling
- Teoría + Aplicación práctica inmediata
- Educación + Entretenimiento (Edutainment)`,
        userPromptTemplate: `Optimiza este contenido técnico para máximo engagement:

📝 **CONTENIDO ACTUAL:**
Título: {title}
Contenido: {content}
Tipo: {content_type}

👥 **AUDIENCIA OBJETIVO:**
Nivel técnico: {technical_level}
Rol: {audience_role}
Objetivos: {audience_goals}

🎯 **OBJETIVOS DE MEJORA:**
{improvement_goals}

Enfócate en balance: valor técnico + engagement humano.`,
        temperature: 0.7,
        examples: []
      },
      {
        taskType: 'tag_generation',
        systemPrompt: `Eres un especialista en taxonomía de contenido y SEO técnico, con experiencia específica en ecosistemas de desarrollo y tecnología.

TU ESPECIALIZACIÓN:
- Estrategia de keywords para contenido técnico
- Balancing entre popularidad y especificidad
- Long-tail SEO para nichos técnicos
- Taxonomías que conectan conceptos relacionados`,
        userPromptTemplate: `Genera una estrategia completa de tags para este contenido técnico:

📄 **CONTENIDO A TAGGEAR:**
Título: {title}
Tema principal: {main_topic}
Contenido: {content}
Tecnologías mencionadas: {technologies}

Balanceo óptimo: popularidad + especificidad técnica.`,
        temperature: 0.5,
        examples: []
      }
    ];
  }

  getDefaultBehaviorRules() {
    return [
      {
        rule: 'technical_accuracy',
        description: 'Siempre priorizar precisión técnica sobre generalidades'
      },
      {
        rule: 'actionable_advice',
        description: 'Proporcionar recomendaciones implementables inmediatamente'
      }
    ];
  }

  getDefaultSpecialInstructions() {
    return {
      languagePreference: 'es-ES',
      codeExamples: true,
      technicalDepth: 'intermediate'
    };
  }

  /**
   * Obtener task prompt específico
   */
  getTaskSpecificPrompt(taskType, userInput = {}) {
    try {
      if (!this.advancedConfig?.trainingConfig?.taskPrompts) {
        return null;
      }

      const taskPrompt = this.advancedConfig.trainingConfig.taskPrompts.find(
        tp => tp.taskType === taskType
      );

      if (!taskPrompt) {
        return null;
      }

      let fullPrompt = taskPrompt.systemPrompt;

      if (taskPrompt.userPromptTemplate && userInput) {
        fullPrompt += '\n\n' + this.personalizeUserTemplate(taskPrompt.userPromptTemplate, userInput);
      }

      this.config.temperature = taskPrompt.temperature;

      return fullPrompt;
    } catch (error) {
      logger.error(`❌ Error getting task specific prompt for ${taskType}:`, error);
      return null;
    }
  }

  /**
   * Personalizar user prompt template
   */
  personalizeUserTemplate(template, userInput) {
    let personalizedTemplate = template;

    const replacements = {
      '{title}': userInput.title || 'Sin título especificado',
      '{content}': userInput.content || 'Sin contenido especificado',
      '{url}': userInput.url || 'URL no especificada',
      '{audience}': userInput.audience || 'Desarrolladores y profesionales técnicos',
      '{target_keywords}': userInput.target_keywords || 'No especificadas',
      '{focus_areas}': userInput.focus_areas || 'Optimización general',
      '{content_type}': userInput.content_type || 'Artículo técnico',
      '{technical_level}': userInput.technical_level || 'Intermedio',
      '{audience_role}': userInput.audience_role || 'Desarrollador Full Stack',
      '{audience_goals}': userInput.audience_goals || 'Aprender y aplicar nuevas tecnologías',
      '{improvement_goals}': userInput.improvement_goals || 'Mejorar engagement y valor técnico',
      '{main_topic}': userInput.main_topic || userInput.title || 'Tema no especificado',
      '{technologies}': userInput.technologies || 'Tecnologías web modernas'
    };

    Object.keys(replacements).forEach(variable => {
      personalizedTemplate = personalizedTemplate.replace(
        new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), 
        replacements[variable]
      );
    });

    return personalizedTemplate;
  }

  /**
   * ==========================================
   * MÉTODOS PRINCIPALES - DELEGACIÓN A SERVICIOS
   * ==========================================
   */

  /**
   * Ejecutar tarea específica del blog
   */
  async executeTask(task, context = {}) {
    const { command, type } = task;
    
    try {
      const action = this.determineAction(command);
      
      logger.info(`🔀 BlogAgent routing action: ${action} para comando: "${command?.substring(0, 50)}..."`);
      
      switch (action) {
        case 'create_blog':
          // Caso específico para creación de blog
          logger.info('🎨 Ejecutando creación de blog...');
          return await this.handleGenericCommand(task, context);
        case 'optimize_content':
          return await this.optimizeContent(task, context);
        case 'analyze_content':
          return await this.analyzeContent(task, context);
        case 'generate_tags':
          return await this.generateTags(task, context);
        case 'optimize_seo':
          return await this.optimizeSEO(task, context);
        case 'analyze_performance':
          return await this.analyzePerformance(task, context);
        case 'schedule_posts':
          return await this.schedulePosts(task, context);
        case 'moderate_content':
          return await this.moderateContent(task, context);
        case 'generate_summary':
          return await this.generateContentSummary(task, context);
        case 'generic_command':
        default:
          return await this.handleGenericCommand(task, context);
      }
    } catch (error) {
      logger.error(`❌ BlogAgent task execution failed:`, error);
      throw error;
    }
  }

  /**
   * Optimizar contenido de un post
   */
  async optimizeContent(task, context) {
    const params = this.extractParameters(task, context);
    const taskPrompt = this.getTaskSpecificPrompt('content_improvement', params);
    
    const result = await blogSEOService.optimizeContent({
      ...params,
      taskPrompt,
      config: this.config
    });

    if (result.success && params.postId && this.config.autoOptimization) {
      await this.updateAIMetadata(params.postId, result.data);
    }

    return this.formatResponse(result.data, result.message);
  }

  /**
   * Analizar contenido existente
   */
  async analyzeContent(task, context) {
    const params = this.extractParameters(task, context);
    const result = await blogAnalysisService.analyzeContent(params);
    return this.formatResponse(result.data, result.message);
  }

  /**
   * Generar tags automáticamente
   */
  async generateTags(task, context) {
    const params = this.extractParameters(task, context);
    const taskPrompt = this.getTaskSpecificPrompt('tag_generation', params);
    
    const result = await blogSEOService.generateTags({
      ...params,
      taskPrompt,
      config: this.config
    });

    return this.formatResponse(result.data, result.message);
  }

  /**
   * Optimización SEO específica
   */
  async optimizeSEO(task, context) {
    const params = this.extractParameters(task, context);
    const taskPrompt = this.getTaskSpecificPrompt('seo_analysis', params);
    
    const result = await blogSEOService.optimizeSEO({
      ...params,
      taskPrompt,
      config: this.config
    });

    return this.formatResponse(result.data, result.message);
  }

  /**
   * Analizar rendimiento del blog
   */
  async analyzePerformance(task, context) {
    const params = this.extractParameters(task, context);
    const result = await blogAnalysisService.analyzePerformance(params);
    return this.formatResponse(result.data, result.message);
  }

  /**
   * Chat conversacional con el agente
   */
  async chat(context) {
    const result = await blogChatService.chat(context);
    return result;
  }

  /**
   * Generar post completo desde cero
   */
  async generateFullPost(params) {
    const result = await blogContentService.generateFullPost(params);
    return result;
  }

  /**
   * Generar una sección específica de contenido
   */
  async generateContentSection(params) {
    const result = await blogContentService.generateContentSection(params);
    return result;
  }

  /**
   * Extender contenido existente
   */
  async extendContent(params) {
    const result = await blogContentService.extendContent(params);
    return result;
  }

  /**
   * Mejorar contenido existente
   */
  async improveContent(params) {
    const result = await blogContentService.improveContent(params);
    return result;
  }

  /**
   * Sugerir siguiente párrafo
   */
  async suggestNextParagraph(params) {
    const result = await blogContentService.suggestNextParagraph(params);
    return result;
  }

  /**
   * Procesar patrón contextual
   */
  async processContextPattern(patternData) {
    const result = await blogPatternService.processContextPattern(patternData);
    return result;
  }

  /**
   * ==========================================
   * MÉTODOS AUXILIARES
   * ==========================================
   */

  determineAction(command) {
    const commandLower = command.toLowerCase();
    
    // Detectar comandos de creación PRIMERO (antes que analyze)
    // Comandos de creación van a 'create_blog' para manejarse específicamente
    if (commandLower.includes('crear blog') || 
        commandLower.includes('nuevo blog') ||
        commandLower.includes('crear post') ||
        commandLower.includes('nuevo post') ||
        commandLower.includes('crear articulo') ||
        commandLower.includes('nuevo articulo') ||
        commandLower.includes('escribir blog') ||
        commandLower.includes('generar blog')) {
      logger.info('🎨 Comando de creación de blog detectado en determineAction');
      return 'create_blog'; // Acción específica para crear blog
    }
    
    // Detectar comandos canvas (análisis SEO, ver blog, listar) - PRIORIDAD ALTA
    if (commandLower.includes('analizar seo del blog') ||
        commandLower.includes('ver blog') ||
        commandLower.includes('mostrar blog') ||
        commandLower.includes('listar blog') ||
        commandLower.includes('abrir blog') ||
        (commandLower.includes('id:') && commandLower.includes('blog'))) {
      return 'generic_command'; // Estos van a handleGenericCommand que tiene canvas_data
    }
    
    // Otros comandos de generación/creación genéricos
    if (commandLower.includes('crear') || 
        commandLower.includes('nuevo') || 
        commandLower.includes('escribir') ||
        commandLower.includes('generar')) {
      return 'generic_command';
    }
    
    if (commandLower.includes('optimiz')) return 'optimize_content';
    if (commandLower.includes('analiz') || commandLower.includes('revis')) return 'analyze_content';
    if (commandLower.includes('tag') || commandLower.includes('etiqueta')) return 'generate_tags';
    if (commandLower.includes('seo')) return 'optimize_seo';
    if (commandLower.includes('rendimiento') || commandLower.includes('performance')) return 'analyze_performance';
    if (commandLower.includes('program') || commandLower.includes('schedul')) return 'schedule_posts';
    if (commandLower.includes('moder')) return 'moderate_content';
    if (commandLower.includes('resumen') || commandLower.includes('summary')) return 'generate_summary';
    
    // Default a generic_command en lugar de analyze_content
    return 'generic_command';
  }

  extractParameters(task, context) {
    const params = {};
    
    if (task.command) {
      const idMatch = task.command.match(/id[:\s]+([a-f0-9]{24})/i);
      if (idMatch) params.postId = idMatch[1];
      
      const slugMatch = task.command.match(/slug[:\s]+([a-z0-9-]+)/i);
      if (slugMatch) params.slug = slugMatch[1];
    }
    
    Object.assign(params, context);
    
    return params;
  }

  async updateAIMetadata(postId, optimizationResults) {
    try {
      await BlogPost.findByIdAndUpdate(postId, {
        'aiOptimization.lastOptimized': new Date(),
        'aiOptimization.score': optimizationResults.improvements?.score?.total,
        'aiOptimization.suggestions': optimizationResults.recommendations
      });
      
      logger.info(`✅ AI metadata updated for post ${postId}`);
    } catch (error) {
      logger.warn('⚠️  Failed to update AI metadata:', error);
    }
  }

  async handleGenericCommand(task, context) {
    const { command } = task;
    const commandLower = command.toLowerCase();

    logger.info('🎯 BlogAgent.handleGenericCommand iniciado', {
      command: command?.substring(0, 50),
      commandLower: commandLower?.substring(0, 50),
      contextKeys: Object.keys(context || {}),
      taskKeys: Object.keys(task || {}),
      hasSessionIdInTask: !!task.sessionId,
      hasSessionIdInContext: !!context.sessionId,
      conversationModeInTask: task.conversationMode,
      conversationModeInContext: context.conversationMode,
      hasUserId: !!(task.userId || context.userId || context.user?._id || context.user?.id)
    });

    // 🎨 COMANDO CANVAS: Continuar conversación de blog
    // IMPORTANTE: Verificar PRIMERO si es continuación (sessionId puede estar en task o context)
    const sessionId = task.sessionId || context.sessionId;
    const conversationMode = task.conversationMode || context.conversationMode;
    
    if (sessionId && conversationMode === 'blog_creation') {
      logger.info(`🎨 Continuando conversación de blog: ${sessionId}`, {
        command: command?.substring(0, 50),
        hasUserId: !!(task.userId || context.userId),
        conversationMode: conversationMode,
        sessionIdSource: task.sessionId ? 'task' : 'context'
      });
      
      try {
        // Procesar mensaje en la sesión
        const result = await this.conversationService.processMessage(
          sessionId,
          command
        );

        if (!result.success) {
          logger.error('❌ Error procesando mensaje en conversación:', result.error);
          return {
            success: false,
            message: result.error || 'Error procesando el mensaje',
            error: result.code
          };
        }

        // 🔍 LOG: Verificar si shouldGenerate está presente
        logger.info('🔍 Resultado de processMessage:', {
          hasShouldGenerate: !!result.shouldGenerate,
          shouldGenerate: result.shouldGenerate,
          stage: result.context?.stage,
          resultKeys: Object.keys(result)
        });

        // 🎨 Si shouldGenerate es true, iniciar generación del blog
        if (result.shouldGenerate) {
          logger.info('🚀 shouldGenerate detectado, iniciando generación de contenido...');
          
          try {
            // Disparar generación de contenido
            const generatedContent = await this.conversationService.generateBlogContent(sessionId);
            
            logger.info('✅ Contenido generado exitosamente:', {
              hasTitle: !!generatedContent.title,
              hasContent: !!generatedContent.content,
              contentLength: generatedContent.content?.length || 0
            });
            
            // Actualizar resultado con contenido generado
            result.generatedContent = generatedContent;
            result.context.stage = 'generation_completed';
            result.message = '✨ ¡Contenido generado exitosamente! Aquí está tu artículo:';
            
          } catch (genError) {
            logger.error('❌ Error generando contenido:', genError);
            return {
              success: false,
              message: `Error al generar contenido: ${genError.message}`,
              canvas_data: {
                type: 'blog_creation',
                mode: 'conversation',
                title: 'Error en Generación',
                data: {
                  sessionId: result.sessionId || sessionId,
                  stage: 'error',
                  progress: result.progress || 0,
                  error: genError.message
                }
              }
            };
          }
        }

        // Si la generación está completa, incluir el contenido generado
        const canvasData = {
          type: 'blog_creation',
          mode: result.context.stage === 'generation_completed' ? 'preview' : 'conversation',
          title: 'Crear Nuevo Blog',
          data: {
            sessionId: result.sessionId || sessionId,
            stage: result.context.stage,
            progress: result.context.progress,
            conversationHistory: result.conversationHistory || [],
            generatedContent: result.generatedContent || null,
            // IMPORTANTE: Incluir questions si existen para renderizar opciones
            questions: result.questions || null,
            currentQuestion: result.questions?.[0] || null, // Pregunta actual si hay múltiples
            // IMPORTANTE: Incluir actions si existen para botones de confirmación
            actions: result.actions || null
          },
          metadata: {
            agent: 'BlogAgent',
            action: 'continue_blog_creation',
            sessionId: result.sessionId || sessionId,
            stage: result.context.stage,
            progress: result.context.progress,
            hasOptions: !!(result.questions && result.questions.length > 0),
            hasActions: !!(result.actions && result.actions.length > 0)
          }
        };

        // Si hay contenido generado, agregarlo
        if (result.generatedContent) {
          canvasData.data.blogPreview = {
            title: result.generatedContent.title,
            excerpt: result.generatedContent.excerpt || result.generatedContent.content?.substring(0, 200) + '...',
            content: result.generatedContent.content,
            categories: result.generatedContent.categories || [],
            tags: result.generatedContent.tags || [],
            seo: result.generatedContent.seo || {},
            metadata: result.generatedContent.metadata || {}
          };
          
          // Cambiar modo a preview cuando hay contenido
          canvasData.mode = 'preview';
          
          logger.info('📝 Blog preview construido:', {
            hasTitle: !!canvasData.data.blogPreview.title,
            hasContent: !!canvasData.data.blogPreview.content,
            contentLength: canvasData.data.blogPreview.content?.length || 0,
            tagsCount: canvasData.data.blogPreview.tags?.length || 0,
            categoriesCount: canvasData.data.blogPreview.categories?.length || 0
          });
        }

        logger.info('✅ Conversación continuada exitosamente:', {
          stage: result.context.stage,
          progress: result.context.progress,
          hasGeneratedContent: !!result.generatedContent,
          shouldGenerate: result.shouldGenerate
        });

        return {
          success: true,
          message: result.message,
          canvas_data: canvasData
        };
        
      } catch (error) {
        logger.error('❌ Error en continuación de blog:', error);
        return {
          success: false,
          message: `Error al procesar mensaje: ${error.message}`,
          error: error.message
        };
      }
    }

    // 🎨 COMANDO CANVAS: Crear nuevo blog (iniciar conversación)
    if (commandLower.includes('crear blog') || 
        commandLower.includes('nuevo blog') ||
        commandLower.includes('escribir blog') ||
        commandLower.includes('generar blog') ||
        commandLower.includes('crear post') ||
        commandLower.includes('nuevo post') ||
        commandLower.includes('crear articulo') ||
        commandLower.includes('nuevo articulo')) {
      
      logger.info('🎨 Comando canvas detectado: crear blog');
      
      try {
        // Obtener userId del contexto (puede venir de diferentes fuentes)
        const userId = context.userId || task.userId || context.user?._id || context.user?.id;
        
        logger.info('🔍 Verificando userId:', {
          'context.userId': context.userId,
          'task.userId': task.userId,
          'context.user._id': context.user?._id,
          'context.user.id': context.user?.id,
          'userId final': userId
        });
        
        if (!userId) {
          logger.error('❌ No se encontró userId en el contexto');
          return {
            success: false,
            message: 'Se requiere autenticación para crear un blog. Por favor, inicia sesión.',
            error: 'USER_NOT_AUTHENTICATED'
          };
        }
        
        logger.info(`✅ Iniciando sesión conversacional para usuario: ${userId}`);
        
        // Iniciar sesión conversacional
        const result = await this.conversationService.startSession(userId, {
          startedFrom: 'scuti-ai',
          userAgent: context.userAgent || 'unknown'
        });

        logger.info('📥 Resultado de startSession:', {
          success: result.success,
          hasSessionId: !!result.sessionId,
          hasMessage: !!result.message,
          hasContext: !!result.context,
          error: result.error
        });

        if (!result.success) {
          logger.error('❌ Error al iniciar sesión conversacional:', result.error);
          return {
            success: false,
            message: 'No pude iniciar la sesión de creación. Por favor, intenta de nuevo.',
            error: result.error
          };
        }

        // Construir canvas_data
        const canvasData = {
          type: 'blog_creation',
          mode: 'conversation',
          title: 'Crear Nuevo Blog',
          data: {
            sessionId: result.sessionId,
            stage: result.context.stage,
            progress: result.context.progress,
            conversationHistory: [
              {
                role: 'agent',
                message: result.message,
                timestamp: new Date()
              }
            ],
            userId
          },
          metadata: {
            agent: 'BlogAgent',
            action: 'start_blog_creation',
            sessionId: result.sessionId,
            stage: result.context.stage,
            progress: result.context.progress
          }
        };

        logger.info('✅ Canvas data construido correctamente:', {
          type: canvasData.type,
          mode: canvasData.mode,
          hasData: !!canvasData.data,
          sessionId: canvasData.data.sessionId
        });

        // Retornar con canvas_data para mostrar en el panel
        const response = {
          success: true,
          message: result.message,
          canvas_data: canvasData
        };

        logger.info('✅ Retornando respuesta con canvas_data:', {
          success: response.success,
          hasMessage: !!response.message,
          hasCanvasData: !!response.canvas_data,
          canvasType: response.canvas_data?.type
        });

        return response;

      } catch (error) {
        logger.error('❌ Error al iniciar creación de blog:', error);
        return {
          success: false,
          message: 'Hubo un error al iniciar la creación del blog. Por favor, intenta de nuevo.',
          error: error.message
        };
      }
    }

    // Comando canvas: Analizar SEO de blog
    if (commandLower.includes('analizar seo') || 
        commandLower.includes('análisis seo') ||
        commandLower.includes('optimizar seo')) {
      
      logger.info('🎨 Comando canvas detectado: analizar SEO de blog');
      
      try {
        // Extraer ID del blog
        const idMatch = command.match(/id:\s*([a-f0-9]{24})/i);
        
        if (!idMatch) {
          return {
            success: false,
            message: 'Por favor especifica el ID del blog a analizar. Formato: "analizar seo del blog (id: BLOG_ID)"'
          };
        }

        const postId = idMatch[1];
        
        // Obtener el post completo
        const post = await BlogPost.findById(postId)
          .select('title content excerpt slug category tags author featuredImage seo aiOptimization readingTime wordCount')
          .populate('category', 'name')
          .populate('tags', 'name')
          .populate('author', 'firstName lastName')
          .lean();

        if (!post) {
          return {
            success: false,
            message: `No se encontró ningún blog con ID: ${postId}`
          };
        }

        // Delegar análisis al SEOAgent
        const seoAgent = orchestrator.agents.get('SEOAgent');
        
        if (!seoAgent) {
          return {
            success: false,
            message: 'SEOAgent no disponible para análisis'
          };
        }

        logger.info(`🔍 Analizando SEO del blog: ${post.title}`);

        // Ejecutar análisis SEO
        const seoAnalysisTask = {
          type: 'content_analysis',
          content: post.content,
          title: post.title,
          description: post.excerpt || post.seo?.metaDescription || '',
          keywords: post.tags?.map(t => t.name) || []
        };

        const seoResult = await seoAgent.processTask(seoAnalysisTask);

        // Extraer analysis desde la estructura envuelta por BaseAgent
        const analysisData = seoResult.result?.analysis || seoResult.analysis || {};

        logger.info('📊 SEO Analysis Data:', {
          hasSeoScore: !!analysisData.seo_score,
          hasRecommendations: !!analysisData.recommendations,
          analysisKeys: Object.keys(analysisData)
        });

        // Formatear resultado para canvas
        return {
          success: true,
          message: `Análisis SEO completado para: ${post.title}`,
          canvas_data: {
            type: 'seo_analysis',
            mode: 'preview',
            title: `Análisis SEO: ${post.title}`,
            data: {
              postId: post._id,
              postTitle: post.title,
              postSlug: post.slug,
              analysis: analysisData,
              currentSEO: {
                metaTitle: post.seo?.metaTitle || post.title,
                metaDescription: post.seo?.metaDescription || post.excerpt,
                keywords: post.seo?.keywords || [],
                focusKeywords: post.seo?.focusKeywords || []
              },
              stats: {
                wordCount: post.wordCount || 0,
                readingTime: post.readingTime || 0,
                category: post.category?.name,
                tags: post.tags?.map(t => t.name) || []
              },
              aiOptimization: post.aiOptimization || {}
            },
            metadata: {
              agent: 'BlogAgent',
              seoAgent: 'SEOAgent',
              action: 'analyze_seo',
              blogId: post._id,
              analyzedAt: new Date().toISOString()
            }
          }
        };

      } catch (error) {
        logger.error('❌ Error analyzing blog SEO:', error);
        return {
          success: false,
          message: 'Error al analizar SEO del blog',
          error: error.message
        };
      }
    }

    // Comando canvas: Ver blog específico (PRIMERO - más específico con ID)
    if (commandLower.includes('id:') && 
        (commandLower.includes('ver blog') || 
         commandLower.includes('mostrar blog') ||
         commandLower.includes('abrir blog'))) {
      
      logger.info('🎨 Comando canvas detectado: ver blog específico');
      
      try {
        const idMatch = command.match(/id:\s*([a-f0-9]{24})/i);
        if (!idMatch) {
          return {
            success: false,
            message: 'ID de blog no válido o no encontrado en el comando'
          };
        }

        const postId = idMatch[1];
        const post = await BlogPost.findById(postId)
          .select('title excerpt content slug category tags author featuredImage publishedAt views likes readingTime')
          .populate('category', 'name slug')
          .populate('tags', 'name slug')
          .populate('author', 'firstName lastName')
          .lean();

        if (!post) {
          return {
            success: false,
            message: `No se encontró ningún blog con ID: ${postId}`
          };
        }

        return {
          success: true,
          message: `Blog encontrado: ${post.title}`,
          canvas_data: {
            type: 'blog',  // Cambio de 'blog_detail' a 'blog'
            mode: 'preview',
            title: post.title,
            data: {
              id: post._id,
              title: post.title,
              excerpt: post.excerpt || '',
              content: post.content,
              slug: post.slug,
              imageUrl: post.featuredImage || '',
              categories: post.category ? [post.category.name] : [],
              tags: post.tags ? post.tags.map(tag => tag.name) : [],
              publishedAt: post.publishedAt,
              views: post.views || 0,
              likes: post.likes || 0,
              metadata: {
                author: post.author ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() : '',
                readingTime: post.readingTime || '',
                date: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }) : ''
              }
            },
            metadata: {
              agent: 'BlogAgent',
              action: 'view_blog',
              blogId: post._id
            }
          }
        };
      } catch (error) {
        logger.error('❌ Error fetching blog:', error);
        return {
          success: false,
          message: 'Error al cargar el blog',
          error: error.message
        };
      }
    }

    // Comando canvas: Listar blogs (SEGUNDO - menos específico)
    if (commandLower.includes('listar blog') || 
        commandLower.includes('lista de blog') ||
        commandLower.includes('todos los blog') ||
        commandLower.includes('blogs disponibles') ||
        commandLower.includes('mostrar blog') ||
        commandLower.includes('ver blog')) {
      
      logger.info('🎨 Comando canvas detectado: listar blogs');
      
      try {
        const posts = await BlogPost.find({ 
          status: 'published'
        })
          .select('title slug excerpt content category tags author featuredImage publishedAt views status readingTime')
          .populate('category', 'name')
          .populate('tags', 'name')
          .populate('author', 'firstName lastName')
          .sort({ publishedAt: -1 })
          .limit(20)
          .lean();

        logger.info(`📝 ${posts.length} blogs encontrados`);

        return {
          success: true,
          message: `Se encontraron ${posts.length} posts publicados`,
          canvas_data: {
            type: 'blog_list',
            mode: 'list',
            title: 'Blogs Publicados',
            data: {
              total: posts.length,
              posts: posts.map(post => ({
                id: post._id,
                title: post.title,
                slug: post.slug,
                description: post.excerpt,
                imageUrl: post.featuredImage || '',
                category: post.category?.name,
                publishedAt: post.publishedAt,
                views: post.views || 0,
                metadata: {
                  date: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  }) : '',
                  author: post.author ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() : '',
                  category: post.category?.name || '',
                  readingTime: post.readingTime || '',
                  views: post.views || 0,
                  tags: post.tags?.map(tag => tag.name).join(', ') || ''
                }
              }))
            },
            metadata: {
              agent: 'BlogAgent',
              action: 'list_blogs',
              totalCount: posts.length
            }
          }
        };
      } catch (error) {
        logger.error('❌ Error listing blogs:', error);
        return {
          success: false,
          message: 'Error al listar blogs',
          error: error.message
        };
      }
    }
    
    // Fallback
    return {
      success: true,
      message: `Comando recibido: "${command}". Para mejores resultados, intenta comandos específicos.`,
      type: 'generic_response',
      availableCommands: [
        'crear blog - inicia creación de blog conversacional',
        'listar blogs - muestra todos los blogs publicados',
        'ver blog id:XXX - muestra un blog específico',
        'optimizar contenido',
        'analizar blog',
        'generar tags'
      ]
    };
  }

  async schedulePosts(task, context) {
    return this.formatResponse({ message: 'Programación de posts - Funcionalidad en desarrollo' }, 'Función en desarrollo');
  }

  async moderateContent(task, context) {
    return this.formatResponse({ message: 'Moderación de contenido - Funcionalidad en desarrollo' }, 'Función en desarrollo');
  }

  async generateContentSummary(task, context) {
    const { postId, slug, content } = this.extractParameters(task, context);
    
    let post;
    if (postId) {
      post = await BlogPost.findById(postId).select('content title').lean();
    } else if (slug) {
      post = await BlogPost.findOne({ slug }).select('content title').lean();
    }

    if (!post?.content) {
      throw new Error('No se encontró contenido para resumir');
    }

    const { generateSummary } = await import('../../utils/aiMetadataGenerator.js');
    const summary = generateSummary(post);
    
    return this.formatResponse({
      summary,
      wordCount: post.content.length,
      originalLength: post.content.length,
      summaryLength: summary.length
    }, 'Resumen generado exitosamente');
  }

  getOpenAIConfig() {
    return {
      temperature: this.config.temperature || 0.7,
      max_tokens: this.config.maxTokens || 2000
    };
  }
}

export default BlogAgent;
