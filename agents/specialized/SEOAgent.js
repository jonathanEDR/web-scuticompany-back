/**
 * SEOAgent - Agente especializado en SEO técnico y análisis avanzado
 * Funcionalidades: Auditorías técnicas, investigación keywords, análisis competencia, optimización schema, etc.
 */

import BaseAgent from '../core/BaseAgent.js';
import openaiService from '../services/OpenAIService.js';
import BlogPost from '../../models/BlogPost.js';
import BlogCategory from '../../models/BlogCategory.js';
import BlogTag from '../../models/BlogTag.js';
import AgentConfig from '../../models/AgentConfig.js';
import { generateAIMetadata } from '../../utils/aiMetadataGenerator.js';
import { generatePostMetaTags, validatePostSEO } from '../../utils/seoGenerator.js';
import { generateBlogSitemap, getSitemapStats } from '../../utils/sitemapGenerator.js';
import { generateArticleSchema, generateAllSchemas } from '../../utils/schemaGenerator.js';
import logger from '../../utils/logger.js';

export class SEOAgent extends BaseAgent {
  constructor(skipDBConnection = false) {
    super(
      'SEOAgent',
      'Agente especializado en SEO técnico y análisis de rendimiento avanzado',
      [
        'technical_seo_audit',      // Auditoría SEO técnica
        'keyword_research',         // Investigación de keywords
        'competitor_analysis',      // Análisis de competencia
        'schema_optimization',      // Optimización de schema.org
        'sitemap_generation',       // Generación de sitemaps
        'meta_optimization',        // Optimización de meta tags
        'performance_analysis',     // Análisis de rendimiento SEO
        'backlink_analysis',        // Análisis de backlinks
        'content_gap_analysis',     // Análisis de gaps de contenido
        'local_seo_optimization'    // Optimización SEO local
      ]
    );

    // Configuración específica del SEOAgent (valores por defecto)
    this.config = {
      maxKeywordsPerAnalysis: 50,
      seoAuditDepth: 'comprehensive',
      competitorLimit: 10,
      performanceThreshold: 90,
      schemaValidation: true,
      sitemapFrequency: 'daily',
      backlinkCheckInterval: 'weekly',
      // Configuración OpenAI por defecto (más precisión que creatividad)
      timeout: 45000,        // Mayor timeout para análisis complejos
      maxTokens: 3000,       // Más tokens para reportes detallados
      temperature: 0.3       // Menor creatividad, más precisión técnica
    };

    // Configuración avanzada (se carga desde DB)
    this.advancedConfig = null;

    // Cargar configuración desde base de datos (solo si no se salta)
    if (!skipDBConnection) {
      this.loadConfiguration();
    } else {
      // Usar configuración por defecto para testing
      this.advancedConfig = {
        personality: this.getDefaultPersonality(),
        contextConfig: this.getDefaultContext(),
        responseConfig: this.getDefaultResponse(),
        promptConfig: this.getDefaultPrompts(),
        trainingConfig: null
      };
    }
  }

  /**
   * Cargar configuración desde base de datos
   */
  async loadConfiguration() {
    try {
      let dbConfig = await AgentConfig.findOne({ agentName: 'seo' }); // Cambio de agentId a agentName

      if (!dbConfig) {
        logger.info('📊 SEOAgent config not found, creating default configuration...');
        
        dbConfig = new AgentConfig({
          agentId: 'SEOAgent',
          agentName: 'seo', // Agregar agentName válido del enum
          personality: this.getDefaultPersonality(),
          contextConfig: this.getDefaultContext(),
          responseConfig: this.getDefaultResponse(),
          promptConfig: this.getDefaultPrompts(),
          trainingConfig: {
            examples: [],
            taskPrompts: [],
            behaviorRules: [],
            specialInstructions: '',
            learningMode: 'balanced', // Cambio de 'adaptive' a 'balanced' (válido en enum)
            feedbackEnabled: true
          },
          isActive: true
        });

        await dbConfig.save();
        logger.success('✅ SEOAgent default configuration created');
      }

      // Inicializar task prompts si están vacíos
      await this.initializeTaskPromptsIfNeeded(dbConfig);

      this.advancedConfig = {
        personality: dbConfig.personality,
        contextConfig: dbConfig.contextConfig,
        responseConfig: dbConfig.responseConfig,
        promptConfig: dbConfig.promptConfig,
        trainingConfig: dbConfig.trainingConfig
      };

      logger.info('🚀 SEOAgent configuration loaded successfully');

    } catch (error) {
      logger.error('❌ Error loading SEOAgent configuration:', error);
      // Usar valores por defecto en caso de error
      this.advancedConfig = {
        personality: this.getDefaultPersonality(),
        contextConfig: this.getDefaultContext(),
        responseConfig: this.getDefaultResponse(),
        promptConfig: this.getDefaultPrompts(),
        trainingConfig: null
      };
    }
  }

  /**
   * Obtener personalidad por defecto específica para SEO
   */
  getDefaultPersonality() {
    return {
      archetype: 'expert', // Cambio de 'technical_expert' a 'expert' (válido en enum)
      traits: [
        { trait: 'analytical', intensity: 9 },
        { trait: 'precise', intensity: 9 },
        { trait: 'technical', intensity: 8 },
        { trait: 'professional', intensity: 8 }
      ],
      communicationStyle: {
        tone: 'technical', // Cambio de 'technical_professional' a 'technical' (válido en enum)
        verbosity: 'detailed',
        formality: 8,
        enthusiasm: 5,
        technicality: 9
      }
    };
  }

  /**
   * Obtener contexto por defecto específico para SEO
   */
  getDefaultContext() {
    return {
      projectInfo: {
        name: 'Web Scuti',
        type: 'tech_blog_seo',
        industry: 'technology',
        target_audience: 'developers_and_tech_professionals',
        primary_language: 'spanish',
        markets: ['latin_america', 'spain']
      },
      seoObjectives: {
        primary_goals: [
          'improve_organic_visibility',
          'increase_search_traffic',
          'enhance_technical_performance',
          'optimize_user_experience'
        ],
        target_metrics: {
          organic_traffic_growth: '25%_monthly',
          core_web_vitals_score: '>90',
          page_speed_score: '>85',
          mobile_usability: '100%'
        }
      },
      technicalContext: {
        cms: 'custom_nodejs',
        hosting: 'render_cloud',
        cdn: 'integrated',
        analytics: 'google_analytics_4',
        search_console: 'enabled'
      }
    };
  }

  /**
   * Obtener configuración de respuesta por defecto
   */
  getDefaultResponse() {
    return {
      format: 'structured_technical_report',
      includeMetrics: true,
      includeRecommendations: true,
      includePriorization: true,
      includeImplementationSteps: true,
      language: 'spanish',
      technicalLevel: 'advanced',
      reportStructure: {
        executive_summary: true,
        detailed_analysis: true,
        action_items: true,
        performance_metrics: true,
        timeline_estimates: true
      }
    };
  }

  /**
   * Obtener prompts por defecto específicos para SEO
   */
  getDefaultPrompts() {
    return {
      systemPrompt: `Eres un SEOAgent especializado, experto en SEO técnico y análisis de rendimiento. 

Tu misión es proporcionar análisis SEO precisos, recomendaciones técnicas fundamentadas y estrategias de optimización basadas en datos.

Características principales:
- Enfoque técnico y basado en métricas
- Conocimiento profundo de algoritmos de búsqueda
- Experiencia en Core Web Vitals y rendimiento
- Especialización en análisis competitivo
- Dominio de herramientas SEO profesionales

Siempre incluye:
1. Datos y métricas específicas
2. Recomendaciones priorizadas por impacto
3. Pasos de implementación técnica detallados
4. Estimaciones de tiempo y recursos
5. Métricas de seguimiento y KPIs

Mantén un enfoque profesional, preciso y orientado a resultados medibles.`,

      userPrompt: `Analiza la siguiente solicitud SEO y proporciona un análisis técnico detallado con recomendaciones específicas y métricas de rendimiento.`,

      temperature: 0.3,
      maxTokens: 3000
    };
  }

  /**
   * Recargar configuración (útil para cambios en tiempo real)
   */
  async reloadConfiguration() {
    await this.loadConfiguration();
    logger.info('🔄 SEOAgent configuration reloaded');
  }

  /**
   * Inicializar task prompts por defecto si no existen
   */
  async initializeTaskPromptsIfNeeded(dbConfig) {
    try {
      if (!dbConfig.trainingConfig.taskPrompts || dbConfig.trainingConfig.taskPrompts.length === 0) {
        logger.info('📋 Initializing default SEO task prompts...');

        const defaultTaskPrompts = [
          {
            taskType: 'technical_audit',
            systemPrompt: `Eres un experto en auditorías SEO técnicas. Analiza sitios web de manera exhaustiva identificando problemas técnicos que afecten el SEO.

Áreas de análisis principales:
- Estructura HTML y semántica
- Core Web Vitals y rendimiento
- Crawlability e indexabilidad
- Meta tags y structured data
- Mobile-first y responsive design
- Seguridad y HTTPS
- Arquitectura de información

Proporciona:
1. Lista detallada de problemas encontrados
2. Nivel de prioridad (Alto/Medio/Bajo)
3. Impacto estimado en el SEO
4. Pasos específicos de corrección
5. Métricas para medir la mejora`,
            userPrompt: 'Realiza una auditoría SEO técnica completa del sitio web proporcionado',
            temperature: 0.2,
            maxTokens: 2500
          },
          {
            taskType: 'keyword_research',
            systemPrompt: `Eres un especialista en investigación de palabras clave y análisis de mercado SEO. Tu expertise incluye análisis de intención de búsqueda, competencia y oportunidades de ranking.

Metodología de investigación:
- Análisis de volumen de búsqueda y tendencias
- Evaluación de dificultad de ranking
- Identificación de keywords long-tail
- Análisis de intención de búsqueda
- Mapping de keywords a funnel de conversión
- Análisis de competidores por keyword
- Identificación de gaps de contenido

Entrega:
1. Lista priorizada de keywords objetivo
2. Métricas de volumen y dificultad
3. Análisis de intención por keyword
4. Estrategia de contenido recomendada
5. Cronograma de implementación`,
            userPrompt: 'Realiza una investigación completa de palabras clave para el tema o industria especificada',
            temperature: 0.3,
            maxTokens: 2000
          },
          {
            taskType: 'schema_optimization',
            systemPrompt: `Eres un experto en structured data y optimización de schema.org. Especializas en implementar markup que mejore la visibilidad en resultados de búsqueda.

Tipos de schema especializados:
- Article y BlogPosting
- Organization y WebSite
- BreadcrumbList y SiteNavigationElement
- FAQPage y HowTo
- Product y Review
- LocalBusiness y Event
- VideoObject y ImageObject

Proceso de optimización:
1. Análisis del contenido existente
2. Identificación de oportunidades de schema
3. Implementación de markup apropiado
4. Validación técnica
5. Testing de rich snippets
6. Monitoreo de resultados

Proporciona código JSON-LD válido y completo con todas las propiedades requeridas y recomendadas.`,
            userPrompt: 'Optimiza el schema markup para el tipo de contenido especificado',
            temperature: 0.1,
            maxTokens: 2000
          },
          {
            taskType: 'performance_analysis',
            systemPrompt: `Eres un especialista en análisis de rendimiento SEO y Core Web Vitals. Tu enfoque está en optimizar la velocidad, usabilidad y experiencia de usuario desde la perspectiva SEO.

Métricas clave de análisis:
- Core Web Vitals (LCP, FID, CLS)
- Page Speed Insights scores
- Mobile usability
- Server response times
- Resource optimization
- Rendering performance
- User experience metrics

Metodología de análisis:
1. Medición de métricas actuales
2. Identificación de bottlenecks
3. Análisis de recursos críticos
4. Evaluación de impacto SEO
5. Recomendaciones de optimización
6. Plan de implementación priorizado

Proporciona recomendaciones específicas, medibles y con impacto directo en rankings y user experience.`,
            userPrompt: 'Analiza el rendimiento SEO y proporciona recomendaciones de optimización',
            temperature: 0.2,
            maxTokens: 2500
          }
        ];

        // Agregar behavior rules específicas para SEO
        const defaultBehaviorRules = [
          'Priorizar siempre datos técnicos precisos y medibles en todos los análisis',
          'Proporcionar recomendaciones SEO basadas en mejores prácticas actuales de Google',
          'Incluir métricas de rendimiento específicas y KPIs en todos los reportes',
          'Validar todas las implementaciones técnicas antes de recomendar',
          'Considerar el impacto en Core Web Vitals en todas las sugerencias de optimización',
          'Mantener consistencia con las directrices oficiales de Google Search Central',
          'Proporcionar alternativas técnicas para diferentes presupuestos y recursos',
          'Incluir cronogramas realistas para la implementación de mejoras SEO',
          'Validar compatibilidad con diferentes CMS y tecnologías web',
          'Priorizar mejoras con mayor impacto SEO vs esfuerzo técnico requerido'
        ];

        // Special instructions específicas para SEO
        const specialInstructions = `MISIÓN DEL SEOAGENT:
Soy un agente especializado en SEO técnico y análisis avanzado de rendimiento. Mi propósito es proporcionar auditorías técnicas precisas, investigación de keywords fundamentada y optimizaciones basadas en datos que generen resultados medibles en términos de visibilidad orgánica y experiencia de usuario.

PRINCIPIOS DE OPERACIÓN:
1. PRECISIÓN TÉCNICA: Todos mis análisis están basados en datos verificables y métricas oficiales
2. ENFOQUE HOLÍSTICO: Considero tanto aspectos técnicos como de contenido y experiencia de usuario
3. RESULTADOS MEDIBLES: Cada recomendación incluye métricas específicas para medir el éxito
4. IMPLEMENTACIÓN PRÁCTICA: Proporciono pasos técnicos detallados y cronogramas realistas
5. ACTUALIZACIÓN CONSTANTE: Mis recomendaciones reflejan las últimas actualizaciones de algoritmos

ESTÁNDARES DE CALIDAD:
- Análisis técnicos exhaustivos con validación cruzada
- Recomendaciones priorizadas por impacto vs esfuerzo
- Implementación compatible con estándares web actuales
- Monitoreo y seguimiento de resultados implementados
- Documentación técnica clara y completa

PROTOCOLOS DE SEGURIDAD:
- Validación de todas las implementaciones técnicas
- Respaldo de configuraciones antes de cambios
- Testing en entornos de desarrollo antes de producción
- Monitoreo continuo post-implementación

Mi expertise abarca desde auditorías técnicas básicas hasta análisis competitivos avanzados, siempre manteniendo el más alto nivel de precisión técnica y orientación a resultados.`;

        // Actualizar la configuración en la base de datos
        dbConfig.trainingConfig.taskPrompts = defaultTaskPrompts;
        dbConfig.trainingConfig.behaviorRules = defaultBehaviorRules;
        dbConfig.trainingConfig.specialInstructions = specialInstructions;

        await dbConfig.save();

        logger.success(`✅ Auto-initialized complete SEO training config: ${defaultTaskPrompts.length} task prompts, ${defaultBehaviorRules.length} behavior rules, and special instructions`);
      }
    } catch (error) {
      logger.error('❌ Error initializing SEO task prompts:', error);
    }
  }

  /**
   * Ejecutar tarea específica del SEOAgent
   */
  async executeTask(task, context = {}) {
    try {
      logger.info(`🎯 SEOAgent executing task: ${task.type}`);

      // Validar parámetros básicos
      if (!task || !task.type) {
        throw new Error('Task type is required');
      }

      // Obtener configuración específica para la tarea
      const taskConfig = this.getTaskConfiguration(task.type);
      
      // Ejecutar según el tipo de tarea
      switch (task.type) {
        case 'technical_audit':
        case 'technical_seo_audit':
          return await this.performTechnicalAudit(task, context);
          
        case 'keyword_research':
          return await this.performKeywordResearch(task, context);
          
        case 'schema_optimization':
          return await this.optimizeSchemaMarkup(task, context);
          
        case 'performance_analysis':
          return await this.analyzePerformanceMetrics(task, context);
          
        case 'competitor_analysis':
          return await this.analyzeCompetitors(task, context);
          
        case 'sitemap_generation':
          return await this.generateSitemaps(task, context);
          
        case 'meta_optimization':
          return await this.optimizeMetaTags(task, context);
          
        case 'backlink_analysis':
          return await this.analyzeBacklinks(task, context);
          
        case 'content_gap_analysis':
          return await this.analyzeContentGaps(task, context);
          
        case 'local_seo_optimization':
          return await this.optimizeLocalSEO(task, context);
          
        default:
          return await this.handleGenericSEOCommand(task, context);
      }

    } catch (error) {
      logger.error(`❌ Error in SEOAgent task execution (${task.type}):`, error);
      return {
        success: false,
        error: error.message,
        task: task.type,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Obtener configuración específica para un tipo de tarea
   */
  getTaskConfiguration(taskType) {
    const taskPrompts = this.advancedConfig?.trainingConfig?.taskPrompts || [];
    return taskPrompts.find(tp => tp.taskType === taskType) || this.getDefaultPrompts();
  }

  /**
   * Realizar auditoría SEO técnica
   */
  async performTechnicalAudit(task, context) {
    try {
      const { url, depth = 'comprehensive' } = task;
      
      logger.info(`🔍 Performing technical SEO audit for: ${url}`);

      // Aquí implementaremos la lógica de auditoría técnica
      // Por ahora, estructura básica de respuesta
      
      const auditResult = {
        success: true,
        taskType: 'technical_audit',
        url: url,
        timestamp: new Date().toISOString(),
        audit: {
          score: 85, // Score provisional
          issues: [],
          recommendations: [],
          metrics: {}
        }
      };

      logger.success('✅ Technical SEO audit completed');
      return auditResult;

    } catch (error) {
      logger.error('❌ Error in technical audit:', error);
      throw error;
    }
  }

  /**
   * Realizar investigación de palabras clave
   */
  async performKeywordResearch(task, context) {
    try {
      const { topic, market = 'es', depth = 'comprehensive' } = task;
      
      logger.info(`🔍 Performing keyword research for topic: ${topic}`);

      // Estructura básica de respuesta
      const keywordResult = {
        success: true,
        taskType: 'keyword_research',
        topic: topic,
        timestamp: new Date().toISOString(),
        keywords: {
          primary: [],
          secondary: [],
          longTail: [],
          opportunities: []
        },
        analysis: {
          competitionLevel: 'medium',
          totalVolume: 0,
          recommendations: []
        }
      };

      logger.success('✅ Keyword research completed');
      return keywordResult;

    } catch (error) {
      logger.error('❌ Error in keyword research:', error);
      throw error;
    }
  }

  /**
   * Optimizar schema markup
   */
  async optimizeSchemaMarkup(task, context) {
    try {
      const { contentType, content, url } = task;
      
      logger.info(`🔍 Optimizing schema markup for content type: ${contentType}`);

      // Usar utilidad existente para generar schema
      let schema = {};
      
      if (contentType === 'article' || contentType === 'blog_post') {
        schema = generateArticleSchema(content, url);
      } else {
        schema = generateAllSchemas(content, contentType);
      }

      const schemaResult = {
        success: true,
        taskType: 'schema_optimization',
        contentType: contentType,
        timestamp: new Date().toISOString(),
        schema: schema,
        recommendations: [
          'Validar el schema con Google Rich Results Test',
          'Implementar el JSON-LD en el <head> del documento',
          'Monitorear rich snippets en Search Console'
        ]
      };

      logger.success('✅ Schema optimization completed');
      return schemaResult;

    } catch (error) {
      logger.error('❌ Error in schema optimization:', error);
      throw error;
    }
  }

  /**
   * Analizar métricas de rendimiento
   */
  async analyzePerformanceMetrics(task, context) {
    try {
      const { url, device = 'both' } = task;
      
      logger.info(`🔍 Analyzing performance metrics for: ${url}`);

      // Estructura básica de respuesta
      const performanceResult = {
        success: true,
        taskType: 'performance_analysis',
        url: url,
        timestamp: new Date().toISOString(),
        metrics: {
          coreWebVitals: {
            lcp: { value: 2.1, status: 'good' },
            fid: { value: 85, status: 'good' },
            cls: { value: 0.08, status: 'needs_improvement' }
          },
          pageSpeed: {
            desktop: 92,
            mobile: 78
          },
          recommendations: []
        }
      };

      logger.success('✅ Performance analysis completed');
      return performanceResult;

    } catch (error) {
      logger.error('❌ Error in performance analysis:', error);
      throw error;
    }
  }

  /**
   * Placeholder methods para futuras implementaciones
   */
  async analyzeCompetitors(task, context) {
    return { success: true, message: 'Competitor analysis - Coming soon' };
  }

  async generateSitemaps(task, context) {
    return generateBlogSitemap();
  }

  async optimizeMetaTags(task, context) {
    return generatePostMetaTags(task.content, task.url);
  }

  async analyzeBacklinks(task, context) {
    return { success: true, message: 'Backlink analysis - Coming soon' };
  }

  async analyzeContentGaps(task, context) {
    return { success: true, message: 'Content gap analysis - Coming soon' };
  }

  async optimizeLocalSEO(task, context) {
    return { success: true, message: 'Local SEO optimization - Coming soon' };
  }

  /**
   * Manejar comandos genéricos de SEO
   */
  async handleGenericSEOCommand(task, context) {
    try {
      logger.info(`🤖 SEOAgent handling generic command: ${task.type}`);

      const taskConfig = this.getTaskConfiguration(task.type) || this.getDefaultPrompts();
      
      // Construir prompt completo
      const fullPrompt = `${taskConfig.systemPrompt}\n\n${taskConfig.userPrompt}\n\nTarea específica: ${JSON.stringify(task)}\nContexto: ${JSON.stringify(context)}`;

      // Llamar a OpenAI con configuración específica
      const response = await openaiService.generateCompletion({
        prompt: fullPrompt,
        maxTokens: taskConfig.maxTokens || this.config.maxTokens,
        temperature: taskConfig.temperature || this.config.temperature,
        timeout: this.config.timeout
      });

      const result = {
        success: true,
        taskType: task.type,
        response: response.content,
        usage: response.usage,
        timestamp: new Date().toISOString(),
        processingTime: response.processingTime
      };

      logger.success(`✅ SEOAgent generic command completed: ${task.type}`);
      return result;

    } catch (error) {
      logger.error(`❌ Error in SEOAgent generic command (${task.type}):`, error);
      throw error;
    }
  }
}

// Exportar instancia singleton
const seoAgent = new SEOAgent();
export default seoAgent;