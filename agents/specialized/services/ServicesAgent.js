/**
 * ServicesAgent - Agente especializado en gestión inteligente de servicios
 * 
 * Capacidades:
 * - Crear y editar servicios completos con IA
 * - Analizar portafolio de servicios
 * - Optimizar descripciones y metadata
 * - Generar paquetes inteligentes
 * - Asesorar en estrategias de pricing
 * - Chat interactivo sobre servicios
 */

import BaseAgent from '../../core/BaseAgent.js';
import ServicesChatHandler from './handlers/ServicesChatHandler.js';
import ServicesAnalyzer from './handlers/ServicesAnalyzer.js';
import ServicesOptimizer from './handlers/ServicesOptimizer.js';
import ServicesGenerator from './handlers/ServicesGenerator.js';
import ServicesPricingAdvisor from './handlers/ServicesPricingAdvisor.js';
import AgentConfig from '../../../models/AgentConfig.js';
import Servicio from '../../../models/Servicio.js';
import PaqueteServicio from '../../../models/PaqueteServicio.js';
import logger from '../../../utils/logger.js';

export class ServicesAgent extends BaseAgent {
  constructor(skipDBConnection = false) {
    super(
      'ServicesAgent',
      'Agente especializado en gestión inteligente de servicios: crear, editar, analizar y optimizar',
      [
        // Interacción
        'natural_language_command',
        'chat_interaction',
        
        // Creación y edición
        'service_creation',
        'service_editing',
        'package_creation',
        'package_editing',
        
        // Análisis
        'service_analysis',
        'portfolio_analysis',
        'pricing_analysis',
        'competitive_analysis',
        'gap_analysis',
        
        // Generación
        'service_generation',
        'package_generation',
        'description_generation',
        'content_creation',
        
        // Optimización
        'seo_optimization',
        'description_optimization',
        'price_optimization',
        'package_optimization',
        
        // Estrategia
        'pricing_strategy',
        'bundling_strategy',
        'market_positioning',
        'upsell_recommendations',
        'cross_sell_suggestions'
      ]
    );

    // Configuración específica del ServicesAgent
    this.config = {
      // Análisis
      minDescriptionLength: 100,
      optimalDescriptionLength: 300,
      maxDescriptionLength: 1000,
      seoScoreThreshold: 70,
      
      // Generación
      temperature: 0.7,
      maxTokens: 2000,
      creativityLevel: 'balanced',
      
      // Pricing
      considerMarketRates: true,
      includeValueAnalysis: true,
      suggestDiscounts: true,
      
      // Optimización
      autoSuggestImprovements: true,
      includeSEORecommendations: true,
      includeConversionTips: true,
      
      // Permisos
      canCreateServices: true,
      canEditServices: true,
      canDeleteServices: false, // Por seguridad
      canManagePricing: true
    };

    // Handlers (se inicializan en activate)
    this.chatHandler = null;
    this.analyzer = null;
    this.optimizer = null;
    this.generator = null;
    this.pricingAdvisor = null;

    // Configuración avanzada (se carga desde DB)
    this.advancedConfig = null;

    // Cargar configuración desde base de datos
    if (!skipDBConnection) {
      this.loadConfiguration();
    } else {
      this.advancedConfig = this.getDefaultConfiguration();
    }

    logger.info('🤖 ServicesAgent initialized with full service management capabilities');
  }

  /**
   * Cargar configuración desde base de datos
   */
  async loadConfiguration() {
    try {
      let dbConfig = await AgentConfig.findOne({ agentName: 'services' });

      if (!dbConfig) {
        logger.info('📊 ServicesAgent config not found, creating default configuration...');
        
        dbConfig = new AgentConfig({
          agentId: 'ServicesAgent',
          agentName: 'services',
          personality: this.getDefaultPersonality(),
          contextConfig: this.getDefaultContext(),
          responseConfig: this.getDefaultResponse(),
          promptConfig: this.getDefaultPrompts(),
          trainingConfig: this.getDefaultTraining()
        });

        await dbConfig.save();
        logger.success('✅ ServicesAgent default configuration created');
      }

      // Aplicar configuración
      this.advancedConfig = {
        personality: dbConfig.personality,
        contextConfig: dbConfig.contextConfig,
        responseConfig: dbConfig.responseConfig,
        promptConfig: dbConfig.promptConfig,
        trainingConfig: dbConfig.trainingConfig
      };

      // Sobrescribir config básica si existe en DB
      if (dbConfig.config) {
        this.config = { ...this.config, ...dbConfig.config };
      }

      logger.success('✅ ServicesAgent configuration loaded from database');

    } catch (error) {
      logger.error('❌ Error loading ServicesAgent configuration:', error);
      this.advancedConfig = this.getDefaultConfiguration();
    }
  }

  /**
   * Activar el agente e inicializar handlers
   */
  async activate() {
    try {
      logger.info('🔄 Activating ServicesAgent...');

      // Inicializar handlers
      this.chatHandler = new ServicesChatHandler(this.config);
      this.analyzer = new ServicesAnalyzer(this.config);
      this.optimizer = new ServicesOptimizer(this.config);
      this.generator = new ServicesGenerator(this.config);
      this.pricingAdvisor = new ServicesPricingAdvisor(this.config);

      // Activar agente base
      const result = await super.activate();

      if (result.success) {
        logger.success('✅ ServicesAgent activated with all handlers initialized');
      }

      return result;

    } catch (error) {
      logger.error('❌ Error activating ServicesAgent:', error);
      this.status = 'error';
      return { success: false, error: error.message };
    }
  }

  /**
   * Ejecutar tarea (router principal)
   */
  async executeTask(task, context = {}) {
    const { type, data } = task;

    try {
      logger.info(`🔄 ServicesAgent executing task: ${type}`);

      switch (type) {
        // Chat
        case 'chat':
        case 'chat_interaction':
          return await this.chat(data.message, data.sessionId, context);

        // Creación
        case 'create_service':
        case 'service_creation':
          return await this.createService(data, context);

        case 'create_package':
        case 'package_creation':
          return await this.createPackage(data, context);

        // Edición
        case 'edit_service':
        case 'service_editing':
          return await this.editService(data.serviceId, data.updates, context);

        // Análisis
        case 'analyze_service':
        case 'service_analysis':
          return await this.analyzeService(data.serviceId, data.options);

        case 'analyze_portfolio':
        case 'portfolio_analysis':
          return await this.analyzePortfolio(data.criteria);

        // Optimización
        case 'optimize_service':
        case 'service_optimization':
          return await this.optimizeService(data.serviceId, data.optimizationType);

        // Generación
        case 'generate_service':
        case 'service_generation':
          return await this.generateService(data.requirements);

        case 'generate_package':
        case 'package_generation':
          return await this.generatePackage(data.serviceId, data.strategy);

        // Pricing
        case 'suggest_pricing':
        case 'pricing_strategy':
          return await this.suggestPricing(data.serviceData, data.marketData);

        default:
          throw new Error(`Unknown task type: ${type}`);
      }

    } catch (error) {
      logger.error(`❌ ServicesAgent task execution failed:`, error);
      throw error;
    }
  }

  /**
   * Verificar si el agente puede manejar una tarea
   */
  canHandle(task) {
    const validTypes = [
      'chat', 'chat_interaction',
      'create_service', 'service_creation',
      'create_package', 'package_creation',
      'edit_service', 'service_editing',
      'analyze_service', 'service_analysis',
      'analyze_portfolio', 'portfolio_analysis',
      'optimize_service', 'service_optimization',
      'generate_service', 'service_generation',
      'generate_package', 'package_generation',
      'suggest_pricing', 'pricing_strategy'
    ];

    return validTypes.includes(task.type);
  }

  // ============================================
  // MÉTODOS PRINCIPALES DELEGADOS A HANDLERS
  // ============================================

  /**
   * Chat interactivo con el agente
   */
  async chat(message, sessionId, context = {}) {
    if (!this.chatHandler) {
      throw new Error('ChatHandler not initialized. Agent must be activated first.');
    }
    return await this.chatHandler.handleChatMessage(message, sessionId, context);
  }

  /**
   * Crear servicio completo con IA
   */
  async createService(serviceData, context = {}) {
    if (!this.config.canCreateServices) {
      throw new Error('Service creation is disabled for this agent');
    }

    if (!this.generator) {
      throw new Error('Generator not initialized. Agent must be activated first.');
    }

    logger.info('🆕 Creating new service with AI assistance...');
    
    // Si serviceData es string, lo tratamos como prompt de generación
    let data = serviceData;
    if (typeof serviceData === 'string') {
      logger.info('📝 Parsing service prompt...');
      data = {
        requirements: serviceData,
        ...context
      };
    }
    
    return await this.generator.createServiceWithAI(data, context);
  }

  /**
   * Editar servicio existente con IA
   */
  async editService(serviceId, updates, context = {}) {
    if (!this.config.canEditServices) {
      throw new Error('Service editing is disabled for this agent');
    }

    if (!this.optimizer) {
      throw new Error('Optimizer not initialized. Agent must be activated first.');
    }

    logger.info(`✏️ Editing service ${serviceId} with AI assistance...`);
    return await this.optimizer.editServiceWithAI(serviceId, updates, context);
  }

  /**
   * Crear paquete inteligente
   */
  async createPackage(packageData, context = {}) {
    if (!this.config.canCreateServices) {
      throw new Error('Package creation is disabled for this agent');
    }

    if (!this.generator) {
      throw new Error('Generator not initialized. Agent must be activated first.');
    }

    logger.info('📦 Creating new package with AI assistance...');
    return await this.generator.createPackageWithAI(packageData, context);
  }

  /**
   * Analizar servicio
   */
  async analyzeService(serviceId, options = {}) {
    if (!this.analyzer) {
      throw new Error('Analyzer not initialized. Agent must be activated first.');
    }
    return await this.analyzer.analyzeService(serviceId, options);
  }

  /**
   * Analizar portafolio completo
   */
  async analyzePortfolio(criteria = {}) {
    if (!this.analyzer) {
      throw new Error('Analyzer not initialized. Agent must be activated first.');
    }
    return await this.analyzer.analyzePortfolio(criteria);
  }

  /**
   * Optimizar servicio
   */
  async optimizeService(serviceId, optimizationType = 'complete') {
    if (!this.optimizer) {
      throw new Error('Optimizer not initialized. Agent must be activated first.');
    }
    return await this.optimizer.optimizeService(serviceId, optimizationType);
  }

  /**
   * Generar servicio desde requisitos
   */
  async generateService(requirements) {
    if (!this.generator) {
      throw new Error('Generator not initialized. Agent must be activated first.');
    }
    return await this.generator.generateService(requirements);
  }

  /**
   * Generar paquete
   */
  async generatePackage(serviceId, strategy = 'balanced') {
    if (!this.generator) {
      throw new Error('Generator not initialized. Agent must be activated first.');
    }
    return await this.generator.generatePackages(serviceId, strategy);
  }

  /**
   * Sugerir pricing
   */
  async suggestPricing(serviceData, marketData = {}) {
    if (!this.pricingAdvisor) {
      throw new Error('PricingAdvisor not initialized. Agent must be activated first.');
    }
    return await this.pricingAdvisor.suggestPricing(serviceData, marketData);
  }

  // ============================================
  // CONFIGURACIONES POR DEFECTO
  // ============================================

  getDefaultConfiguration() {
    return {
      personality: this.getDefaultPersonality(),
      contextConfig: this.getDefaultContext(),
      responseConfig: this.getDefaultResponse(),
      promptConfig: this.getDefaultPrompts(),
      trainingConfig: this.getDefaultTraining()
    };
  }

  getDefaultPersonality() {
    return {
      archetype: 'expert',
      traits: [
        { trait: 'analytical', intensity: 8 },
        { trait: 'professional', intensity: 9 },
        { trait: 'creative', intensity: 7 },
        { trait: 'supportive', intensity: 8 }
      ],
      communicationStyle: {
        tone: 'professional',
        verbosity: 'moderate',
        formality: 8,
        enthusiasm: 7,
        technicality: 7
      }
    };
  }

  getDefaultContext() {
    return {
      projectInfo: {
        name: 'Web Scuti',
        type: 'business_services',
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
      systemPrompt: `Eres un experto en gestión de servicios empresariales y estrategia de negocios. 
      Ayudas a crear, optimizar y gestionar servicios de tecnología de manera profesional y efectiva.`,
      
      analysisPrompt: `Analiza el servicio considerando: calidad de descripción, posicionamiento SEO, 
      estrategia de pricing, completitud de información y oportunidades de mejora.`,
      
      generationPrompt: `Genera servicios profesionales y atractivos, con descripciones claras, 
      características detalladas y pricing estratégico.`,
      
      optimizationPrompt: `Optimiza para mejorar conversión, SEO, claridad y valor percibido.`
    };
  }

  getDefaultTraining() {
    return {
      examples: [],
      taskPrompts: [],
      behaviorRules: [
        'Siempre validar datos antes de crear o editar servicios',
        'Sugerir mejoras basadas en mejores prácticas',
        'Considerar SEO en todas las generaciones',
        'Pricing debe ser competitivo y justificado'
      ],
      specialInstructions: 'Enfocarse en crear servicios de alta calidad que conviertan',
      learningMode: 'balanced',
      feedbackEnabled: true
    };
  }

  /**
   * Obtener métricas consolidadas de todos los handlers
   */
  getMetrics() {
    return {
      chatHandler: this.chatHandler?.getMetrics?.() || {},
      analyzer: this.analyzer?.getMetrics?.() || {},
      optimizer: this.optimizer?.getMetrics?.() || {},
      generator: this.generator?.getMetrics?.() || {},
      pricingAdvisor: this.pricingAdvisor?.getMetrics?.() || {},
      agentStatus: {
        enabled: this.enabled,
        status: this.status,
        capabilities: this.capabilities?.length || 0
      }
    };
  }
}

// Exportar la clase (no como singleton para permitir múltiples instancias)
export default ServicesAgent;
