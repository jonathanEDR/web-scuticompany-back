/**
 * Modelo de configuración de agentes AI
 * Almacena configuraciones personalizadas por agente
 */

import mongoose from 'mongoose';

const agentConfigSchema = new mongoose.Schema({
  agentName: {
    type: String,
    required: true,
    unique: true,
    enum: ['blog', 'seo', 'analytics', 'content', 'services', 'gerente']
  },
  enabled: {
    type: Boolean,
    default: true
  },
  
  // ========== CONFIGURACIÓN BÁSICA ==========
  config: {
    // Configuración de OpenAI
    timeout: {
      type: Number,
      default: 30,
      min: 5,
      max: 120
    },
    maxTokens: {
      type: Number,
      default: 2000,
      min: 500,
      max: 4000
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 1
    },
    
    // Configuración específica del agente
    maxTagsPerPost: {
      type: Number,
      default: 10,
      min: 3,
      max: 20
    },
    minContentLength: {
      type: Number,
      default: 300
    },
    seoScoreThreshold: {
      type: Number,
      default: 70,
      min: 0,
      max: 100
    },
    autoOptimization: {
      type: Boolean,
      default: true
    },
    
    // Control de sugerencias automáticas en el editor
    autoSuggestions: {
      type: Boolean,
      default: true
    },
    suggestionDebounceMs: {
      type: Number,
      default: 800,
      min: 300,
      max: 3000
    },
    suggestionMinLength: {
      type: Number,
      default: 10,
      min: 5,
      max: 50
    },
    suggestionContextLength: {
      type: Number,
      default: 200,
      min: 100,
      max: 500
    }
  },
  
  // ========== CONFIGURACIÓN DE PERSONALIDAD ==========
  personality: {
    archetype: {
      type: String,
      enum: ['analyst', 'coach', 'expert', 'assistant', 'guardian', 'innovator'],
      default: 'expert'
    },
    traits: [{
      trait: {
        type: String,
        enum: ['analytical', 'friendly', 'precise', 'creative', 'professional', 'enthusiastic', 'technical', 'supportive']
      },
      intensity: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
      }
    }],
    communicationStyle: {
      tone: {
        type: String,
        enum: ['formal', 'casual', 'friendly', 'professional', 'technical', 'motivational'],
        default: 'professional'
      },
      verbosity: {
        type: String,
        enum: ['concise', 'moderate', 'detailed', 'comprehensive'],
        default: 'moderate'
      },
      formality: {
        type: Number,
        min: 1,
        max: 10,
        default: 7
      },
      enthusiasm: {
        type: Number,
        min: 1,
        max: 10,
        default: 6
      },
      technicality: {
        type: Number,
        min: 1,
        max: 10,
        default: 7
      }
    }
  },
  
  // ========== CONFIGURACIÓN DE CONTEXTO ==========
  contextConfig: {
    projectInfo: {
      name: {
        type: String,
        default: 'Web Scuti'
      },
      type: {
        type: String,
        default: 'tech_blog'
      },
      domain: {
        type: String,
        default: 'technology'
      },
      language: {
        type: String,
        default: 'es-ES'
      },
      tone: {
        type: String,
        default: 'professional_friendly'
      }
    },
    userExpertise: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    }
  },
  
  // ========== CONFIGURACIÓN DE RESPUESTAS ==========
  responseConfig: {
    defaultLanguage: {
      type: String,
      default: 'es-ES'
    },
    supportedLanguages: [{
      type: String,
      default: ['es-ES', 'en-US']
    }],
    includeExamples: {
      type: Boolean,
      default: true
    },
    includeSteps: {
      type: Boolean,
      default: true
    },
    includeMetrics: {
      type: Boolean,
      default: true
    },
    includeRecommendations: {
      type: Boolean,
      default: true
    },
    responseFormat: {
      type: String,
      enum: ['text', 'structured', 'markdown', 'detailed'],
      default: 'structured'
    }
  },
  
  // ========== CONFIGURACIÓN DE PROMPTS ==========
  promptConfig: {
    useCustomPrompts: {
      type: Boolean,
      default: false
    },
    customSystemPrompt: {
      type: String,
      default: ''
    },
    promptVariables: {
      type: Map,
      of: String,
      default: {}
    },
    contextWindow: {
      type: Number,
      default: 10,
      min: 5,
      max: 50
    }
  },
  
  // ========== CONFIGURACIÓN DE ENTRENAMIENTO (Training Config) ==========
  trainingConfig: {
    examples: [{
      id: String,
      input: String,
      expectedOutput: String,
      category: {
        type: String,
        enum: ['seo', 'tags', 'analysis', 'improvement', 'general']
      },
      notes: String
    }],
    taskPrompts: [{
      taskType: String,
      systemPrompt: String,
      userPromptTemplate: String,
      temperature: Number,
      examples: [String]
    }],
    behaviorRules: [String],
    specialInstructions: String,
    learningMode: {
      type: String,
      enum: ['conservative', 'balanced', 'aggressive'],
      default: 'balanced'
    }
  },
  
  statistics: {
    totalRequests: {
      type: Number,
      default: 0
    },
    successfulRequests: {
      type: Number,
      default: 0
    },
    failedRequests: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    },
    lastUsed: {
      type: Date
    }
  },
  
  // ========== ROUTING CONFIGURATION (GERENTE GENERAL) ==========
  routingConfig: {
    coordinationPhase: {
      enabled: {
        type: Boolean,
        default: true
      },
      keywords: {
        type: [String],
        default: []
      },
      requireMultipleAgents: {
        type: Boolean,
        default: true
      },
      minAgentsForCoordination: {
        type: Number,
        default: 2,
        min: 2,
        max: 5
      }
    },
    individualPhase: {
      defaultAgent: {
        type: String,
        default: 'ServicesAgent'
      },
      rules: [{
        agent: {
          type: String,
          required: true
        },
        keywords: {
          type: [String],
          default: []
        },
        priority: {
          type: Number,
          default: 1,
          min: 1,
          max: 10
        },
        enabled: {
          type: Boolean,
          default: true
        }
      }]
    }
  },
  
  updatedBy: {
    type: String, // Clerk user ID
    required: false
  }
}, {
  timestamps: true
});

// Índices
// agentName: índice creado automáticamente por unique: true
agentConfigSchema.index({ enabled: 1 });

// Métodos del modelo
agentConfigSchema.methods.incrementRequests = function(success = true, responseTime = 0) {
  this.statistics.totalRequests += 1;
  if (success) {
    this.statistics.successfulRequests += 1;
  } else {
    this.statistics.failedRequests += 1;
  }
  
  // Actualizar promedio de tiempo de respuesta
  const totalRequests = this.statistics.totalRequests;
  const currentAvg = this.statistics.averageResponseTime;
  this.statistics.averageResponseTime = 
    ((currentAvg * (totalRequests - 1)) + responseTime) / totalRequests;
  
  this.statistics.lastUsed = new Date();
  
  return this.save();
};

// Statics para inicializar configuraciones por defecto
agentConfigSchema.statics.initializeDefaults = async function() {
  const defaultConfigs = [
    {
      agentName: 'blog',
      enabled: true,
      config: {
        timeout: 30,
        maxTokens: 2000,
        temperature: 0.7,
        maxTagsPerPost: 10,
        minContentLength: 300,
        seoScoreThreshold: 70,
        autoOptimization: true
      },
      personality: {
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
      },
      contextConfig: {
        projectInfo: {
          name: 'Web Scuti',
          type: 'tech_blog',
          domain: 'technology',
          language: 'es-ES',
          tone: 'professional_friendly'
        },
        userExpertise: 'intermediate'
      },
      responseConfig: {
        defaultLanguage: 'es-ES',
        supportedLanguages: ['es-ES', 'en-US'],
        includeExamples: true,
        includeSteps: true,
        includeMetrics: true,
        includeRecommendations: true,
        responseFormat: 'structured'
      },
      promptConfig: {
        useCustomPrompts: false,
        customSystemPrompt: '',
        promptVariables: {},
        contextWindow: 10
      }
    },
    {
      agentName: 'services',
      enabled: true,
      config: {
        timeout: 30,
        maxTokens: 2000,
        temperature: 0.7
      },
      personality: {
        archetype: 'expert',
        traits: [
          { trait: 'professional', intensity: 9 },
          { trait: 'analytical', intensity: 8 },
          { trait: 'technical', intensity: 7 }
        ],
        communicationStyle: {
          tone: 'professional',
          verbosity: 'detailed',
          formality: 8,
          enthusiasm: 6,
          technicality: 7
        }
      },
      contextConfig: {
        projectInfo: {
          name: 'Web Scuti Services',
          type: 'service_portfolio',
          domain: 'professional_services',
          language: 'es-ES',
          tone: 'professional_consultative'
        },
        userExpertise: 'advanced'
      },
      responseConfig: {
        defaultLanguage: 'es-ES',
        supportedLanguages: ['es-ES', 'en-US'],
        includeExamples: true,
        includeSteps: true,
        includeMetrics: true,
        includeRecommendations: true,
        responseFormat: 'structured'
      },
      promptConfig: {
        useCustomPrompts: false,
        customSystemPrompt: '',
        promptVariables: {},
        contextWindow: 4000
      },
      trainingConfig: {
        examples: [
          {
            id: 'pricing_example_1',
            input: 'Analiza este servicio de desarrollo web y sugiere una estrategia de pricing competitiva',
            expectedOutput: 'He analizado el servicio de desarrollo web. Aquí está mi análisis de pricing:\n\n1. **Precio Base Recomendado**: $5,000 - $8,000 MXN\n2. **Factores Clave**:\n   - Complejidad técnica: Media-Alta\n   - Valor de mercado: Alto\n   - ROI estimado para el cliente: 300%\n\n3. **Estrategias de Pricing**:\n   - Pricing por valor: Enfocado en el ROI del cliente\n   - Paquetes escalonados: Básico, Premium, Enterprise\n   - Descuentos por volumen: 10-15% para múltiples proyectos',
            category: 'pricing',
            notes: 'Ejemplo de análisis de pricing con recomendaciones estructuradas'
          },
          {
            id: 'analysis_example_1',
            input: 'Revisa la descripción de nuestro servicio de consultoría digital y sugiere mejoras',
            expectedOutput: 'He revisado la descripción del servicio de consultoría digital. Aquí están mis recomendaciones:\n\n**Fortalezas Detectadas**:\n- Propuesta de valor clara\n- Mención de resultados medibles\n\n**Áreas de Mejora**:\n1. **SEO**: Agregar palabras clave como "transformación digital", "estrategia digital"\n2. **Beneficios Tangibles**: Incluir métricas específicas (ej: "aumento del 40% en conversiones")\n3. **Diferenciadores**: Destacar metodología única o casos de éxito\n4. **Call-to-Action**: Agregar CTA más fuerte al final',
            category: 'analysis',
            notes: 'Ejemplo de análisis de descripción de servicio con mejoras SEO'
          },
          {
            id: 'generation_example_1',
            input: 'Genera una descripción profesional para un servicio de diseño UX/UI',
            expectedOutput: '**Diseño UX/UI Centrado en el Usuario**\n\nTransformamos ideas en experiencias digitales excepcionales. Nuestro servicio de diseño UX/UI combina investigación de usuarios, prototipado iterativo y diseño visual de alto impacto para crear interfaces que los usuarios aman.\n\n**Qué Incluye**:\n- Investigación y análisis de usuarios\n- Arquitectura de información\n- Wireframes y prototipos interactivos\n- Diseño visual responsive\n- Testing de usabilidad\n- Design system documentado\n\n**Resultados Garantizados**:\n✓ Mayor satisfacción del usuario\n✓ Reducción de tasas de abandono\n✓ Incremento en conversiones\n\n**Ideal Para**: Startups, empresas establecidas y productos digitales que buscan diferenciarse.',
            category: 'generation',
            notes: 'Ejemplo de generación de descripción de servicio profesional'
          },
          {
            id: 'optimization_example_1',
            input: 'Optimiza este paquete de servicios web para mejor conversión',
            expectedOutput: 'He optimizado tu paquete de servicios web. Aquí están los cambios clave:\n\n**Optimizaciones Implementadas**:\n\n1. **Estructura de Paquetes** (antes: 1 opción → ahora: 3 opciones)\n   - **Básico**: Para startups ($3,500 MXN)\n   - **Profesional**: Para PyMEs ($6,500 MXN) ⭐ Más Popular\n   - **Enterprise**: Para empresas ($12,000 MXN)\n\n2. **Mejoras en Presentación**:\n   - Agregado badge "Más Popular" al paquete medio\n   - Incluidas comparativas claras de features\n   - Destacados beneficios únicos por paquete\n\n3. **Psicología de Pricing**:\n   - Precio ancla establecido (Enterprise)\n   - Paquete medio posicionado como mejor valor\n   - Descuento por pago anual incluido\n\n**Impacto Esperado**: +35% en tasa de conversión',
            category: 'optimization',
            notes: 'Ejemplo de optimización de paquetes con psicología de pricing'
          },
          {
            id: 'portfolio_example_1',
            input: 'Analiza nuestro portafolio completo de servicios digitales y sugiere mejoras estratégicas',
            expectedOutput: '**Análisis del Portafolio de Servicios Digitales**\n\n**Resumen Ejecutivo**:\nPortafolio sólido con 8 servicios activos. Oportunidades de crecimiento en packaging y upselling.\n\n**Servicios Analizados**:\n1. Desarrollo Web (3 variantes)\n2. Diseño UX/UI (2 paquetes)\n3. Consultoría Digital (1 servicio)\n4. Marketing Digital (2 opciones)\n\n**Recomendaciones Estratégicas**:\n\n1. **Bundling Inteligente**:\n   - Crear paquete "Transformación Digital Completa"\n   - Combinar: Desarrollo + Diseño + Marketing\n   - Descuento: 20% vs compra individual\n\n2. **Gaps Identificados**:\n   - Falta servicio de mantenimiento recurrente\n   - Sin opción de soporte 24/7\n   - No hay servicio de analítica avanzada\n\n3. **Optimización de Pricing**:\n   - Servicio de consultoría 15% bajo el mercado\n   - Desarrollo web competitivo\n   - UX/UI premium bien posicionado\n\n**Proyección**: Implementar cambios = +40% revenue en 6 meses',
            category: 'portfolio',
            notes: 'Ejemplo de análisis completo de portafolio con estrategia'
          }
        ],
        taskPrompts: [
          {
            taskType: 'pricing_analysis',
            systemPrompt: 'Eres un experto en estrategias de pricing para servicios profesionales. Tu objetivo es analizar servicios y sugerir estrategias de pricing competitivas basadas en valor, considerando el mercado local (México), ROI del cliente, y psicología de pricing. Siempre incluye rangos de precios en MXN, justificación de costos, y estrategias de descuentos.',
            userPromptTemplate: 'Analiza este servicio y sugiere pricing: {serviceDescription}\n\nFactores a considerar:\n- Complejidad: {complexity}\n- Mercado objetivo: {targetMarket}\n- Competencia: {competition}',
            temperature: 0.7,
            examples: ['Siempre incluir 3 opciones de pricing: conservador, competitivo, premium']
          },
          {
            taskType: 'service_generation',
            systemPrompt: 'Eres un copywriter especializado en servicios profesionales. Generas descripciones persuasivas, claras y orientadas a resultados. Utilizas un tono profesional pero accesible, incluyes beneficios tangibles, y siempre agregas elementos de prueba social cuando sea apropiado.',
            userPromptTemplate: 'Genera una descripción profesional para: {serviceType}\n\nCaracterísticas clave: {features}\nAudiencia objetivo: {targetAudience}\nTono deseado: {tone}',
            temperature: 0.8,
            examples: ['Incluir siempre: qué incluye, resultados esperados, ideal para...']
          },
          {
            taskType: 'portfolio_optimization',
            systemPrompt: 'Eres un consultor estratégico de portafolio de servicios. Analizas conjuntos de servicios para identificar gaps, oportunidades de bundling, y optimizaciones de pricing. Siempre proporcionas recomendaciones accionables con impacto estimado.',
            userPromptTemplate: 'Analiza este portafolio de servicios y sugiere optimizaciones:\n\n{portfolioData}\n\nFocus areas: {focusAreas}',
            temperature: 0.7,
            examples: ['Siempre incluir: análisis FODA, gaps identificados, recomendaciones priorizadas']
          }
        ],
        behaviorRules: [
          'Siempre incluir precios en MXN (Pesos Mexicanos) para el mercado local',
          'Al sugerir pricing, considerar 3 niveles: conservador, competitivo, premium',
          'Incluir análisis de ROI cuando sea relevante para justificar precios',
          'Usar lenguaje profesional pero accesible, evitar jerga excesiva',
          'Siempre mencionar beneficios tangibles y medibles en descripciones de servicios',
          'Al analizar portafolios, priorizar recomendaciones por impacto potencial',
          'Incluir elementos de psicología de pricing (anclaje, contraste, escasez)',
          'Sugerir descuentos estratégicos (volumen, pago anticipado, contratos anuales)',
          'Considerar la competencia local al hacer recomendaciones de pricing',
          'Optimizar todas las descripciones para SEO con palabras clave relevantes'
        ],
        specialInstructions: 'El ServicesAgent debe actuar como un consultor estratégico experto en servicios profesionales, con énfasis en pricing basado en valor, optimización de conversión, y gestión de portafolio. Siempre proporciona análisis estructurados con recomendaciones accionables y métricas de impacto estimado.',
        learningMode: 'balanced'
      }
    },
    // ========== GERENTE GENERAL CONFIGURATION ==========
    {
      agentName: 'gerente',
      enabled: true,
      config: {
        timeout: 30,
        maxTokens: 1500,
        temperature: 0.6,
        maxSessionsPerUser: 10,
        sessionTTLHours: 24,
        autoRouting: true,
        contextSharing: true
      },
      personality: {
        archetype: 'coordinator',
        traits: [
          { trait: 'organized', intensity: 9 },
          { trait: 'diplomatic', intensity: 8 },
          { trait: 'efficient', intensity: 9 },
          { trait: 'analytical', intensity: 7 },
          { trait: 'strategic', intensity: 8 }
        ],
        communicationStyle: {
          tone: 'professional',
          verbosity: 'concise',
          formality: 8,
          enthusiasm: 7,
          technicality: 6
        }
      },
      contextConfig: {
        projectInfo: {
          name: 'Web Scuti - Sistema de Agentes',
          type: 'agent_orchestration',
          domain: 'multi_agent_coordination',
          language: 'es-ES',
          tone: 'professional_coordinator'
        },
        userExpertise: 'varied' // El Gerente maneja usuarios de todos los niveles
      },
      responseConfig: {
        defaultLanguage: 'es-ES',
        supportedLanguages: ['es-ES', 'en-US'],
        includeExamples: false, // Más directo y conciso
        includeSteps: true,
        includeMetrics: false, // Se enfoca en coordinación, no métricas detalladas
        includeRecommendations: true,
        responseFormat: 'structured'
      },
      promptConfig: {
        useCustomPrompts: true,
        customSystemPrompt: 'Eres el Gerente General del sistema de agentes de Web Scuti. Tu rol es coordinar y dirigir eficientemente las tareas entre los agentes especializados (BlogAgent, SEOAgent, ServicesAgent). Actúas como un director de proyecto experimentado que: 1) Analiza solicitudes complejas, 2) Identifica el agente más adecuado, 3) Mantiene contexto centralizado, 4) Asegura coherencia entre agentes, 5) Proporciona reportes de estado claros. Eres diplomático, eficiente y siempre mantienes el foco en los objetivos del usuario.',
        promptVariables: {
          role: 'Gerente General de Agentes',
          mission: 'Coordinar eficientemente el trabajo entre agentes especializados',
          approach: 'Análisis -> Enrutamiento -> Supervisión -> Reporte'
        },
        contextWindow: 50 // Más contexto para coordinación
      },
      trainingConfig: {
        examples: [
          {
            id: 'coordination_example_1',
            input: 'Necesito crear un blog sobre IA y luego optimizar el SEO',
            expectedOutput: 'Entendido. Esta tarea requiere coordinación entre 2 agentes especializados:\n\n**Plan de Ejecución**:\n1. **BlogAgent**: Creará el contenido del blog sobre IA\n2. **SEOAgent**: Optimizará el contenido para motores de búsqueda\n\n**Delegando a BlogAgent**...\n✅ Contenido creado exitosamente\n\n**Delegando a SEOAgent**...\n✅ SEO optimizado\n\n**Resultado**: Blog sobre IA completado y optimizado para SEO. Sesión guardada para referencia futura.',
            category: 'multi_agent_coordination',
            notes: 'Ejemplo de coordinación secuencial entre múltiples agentes'
          },
          {
            id: 'routing_example_1',
            input: 'Analiza mi sitio web completo',
            expectedOutput: 'Su solicitud es muy general. Para brindar el mejor servicio, necesito más especificidad:\n\n**Opciones Disponibles**:\n1. **Análisis de contenido de blog** → BlogAgent\n2. **Auditoria técnica de SEO** → SEOAgent\n3. **Evaluación de servicios/productos** → ServicesAgent\n\n¿Podría especificar qué aspecto le interesa más? También puedo realizar un análisis completo coordinando los 3 agentes si así lo desea.',
            category: 'intelligent_routing',
            notes: 'Ejemplo de manejo de solicitudes ambiguas con opciones claras'
          },
          {
            id: 'session_management_example_1',
            input: 'Continúa con la optimización que empezamos ayer',
            expectedOutput: 'He recuperado su sesión anterior (ID: session_123).\n\n**Contexto Recuperado**:\n- **Última actividad**: BlogAgent optimizó artículo "Marketing Digital 2024"\n- **Pendiente**: SEO audit del sitio completo\n- **Datos compartidos**: Keywords target, estructura actual\n\n**Continuando trabajo**...\n🔄 Delegando a SEOAgent para completar el audit SEO\n\n**Estado**: En progreso. Mantendré el contexto actualizado.',
            category: 'session_continuity',
            notes: 'Ejemplo de continuidad de sesión con contexto recuperado'
          },
          {
            id: 'status_reporting_example_1',
            input: 'Dame el estado actual del sistema',
            expectedOutput: '**📊 Estado del Sistema de Agentes**\n\n**Agentes Activos**: 4/4\n- ✅ BlogAgent: Saludable (última tarea hace 5 min)\n- ✅ SEOAgent: Saludable (última tarea hace 12 min) \n- ✅ ServicesAgent: Saludable (última tarea hace 2 min)\n- ✅ GerenteGeneral: Activo\n\n**Sesiones Activas**: 3\n**Tareas Completadas Hoy**: 24\n**Tiempo Promedio de Respuesta**: 1.2s\n\n**Sistema**: 🟢 Operativo Normal',
            category: 'system_monitoring',
            notes: 'Ejemplo de reporte de estado sistemático y claro'
          },
          {
            id: 'error_handling_example_1',
            input: 'El agente de blog no está respondiendo bien',
            expectedOutput: '🔍 **Diagnóstico de BlogAgent**\n\n**Estado Detectado**: Posible sobrecarga o error temporal\n\n**Acciones Tomadas**:\n1. ✅ Health check realizado\n2. ✅ Verificación de conexiones\n3. 🔄 Reintento automático activado\n\n**Resultado**: BlogAgent está respondiendo normalmente ahora\n\n**Recomendación**: Si el problema persiste, puedo re-enrutar sus tareas de blog temporalmente a otros agentes con capacidades similares.',
            category: 'error_recovery',
            notes: 'Ejemplo de manejo proactivo de problemas con agentes'
          }
        ],
        taskPrompts: [
          {
            taskType: 'coordinate',
            systemPrompt: 'Actúa como un Gerente General experto. Analiza la solicitud del usuario, identifica qué agentes necesitas coordinar, y ejecuta un plan estructurado. Mantén comunicación clara sobre el progreso y asegura que el contexto se preserve para futuras interacciones.',
            userPromptTemplate: 'Solicitud del usuario: {command}\n\nContexto de sesión: {sessionContext}\n\nAgentes disponibles: {availableAgents}\n\nGenera un plan de coordinación y ejecútalo.',
            temperature: 0.6,
            examples: ['Siempre explicar el plan antes de ejecutar', 'Mantener al usuario informado del progreso']
          },
          {
            taskType: 'route',
            systemPrompt: 'Eres un experto en enrutamiento inteligente de tareas. Analiza la solicitud y determina el agente más apropiado considerando: capacidades específicas, carga actual, historial de rendimiento, y contexto del usuario.',
            userPromptTemplate: 'Tarea a enrutar: {task}\n\nAgente objetivo sugerido: {targetAgent}\n\nContexto adicional: {context}',
            temperature: 0.5,
            examples: ['Explicar brevemente por qué elegiste ese agente', 'Ofrecer alternativas si es necesario']
          },
          {
            taskType: 'monitor',
            systemPrompt: 'Proporciona reportes de estado claros y accionables del sistema de agentes. Incluye métricas clave, estado de salud, y recomendaciones para optimización.',
            userPromptTemplate: 'Tipo de reporte: {reportType}\n\nNivel de detalle: {detail}\n\nAudiencia: {audience}',
            temperature: 0.3,
            examples: ['Usar emojis para estado visual', 'Priorizar información más relevante']
          }
        ],
        behaviorRules: [
          'Siempre mantener contexto de sesión actualizado entre interacciones',
          'Explicar brevemente qué agente usarás y por qué antes de delegar',
          'Si una tarea es ambigua, pedir clarificación con opciones específicas',
          'Proporcionar reportes de progreso en tareas multi-agente',
          'Usar lenguaje directo y profesional, evitar jerga técnica innecesaria',
          'Ofrecer alternativas cuando un agente no esté disponible',
          'Priorizar eficiencia: una delegación = una respuesta completa',
          'Mantener tono diplomático pero autoritativo en coordinación',
          'Registrar todas las interacciones importantes en el contexto compartido',
          'Al finalizar tareas complejas, ofrecer resumen de lo logrado'
        ],
        specialInstructions: 'El GerenteGeneral debe funcionar como un director de proyecto senior que coordina un equipo de especialistas. Su principal valor es la eficiencia en la coordinación, mantenimiento de contexto, y asegurar que las tareas complejas se ejecuten de manera coherente entre múltiples agentes. Debe ser proactivo en identificar cuando se necesita coordinación multi-agente y gestionar estas interacciones de manera fluida.',
        learningMode: 'adaptive' // Se adapta al estilo de trabajo del usuario
      },
      routingConfig: {
        coordinationPhase: {
          enabled: true,
          keywords: ['coordinar', 'múltiples', 'varios agentes', 'en conjunto', 'combinar'],
          requireMultipleAgents: true,
          minAgentsForCoordination: 2
        },
        individualPhase: {
          defaultAgent: 'ServicesAgent',
          rules: [
            {
              agent: 'BlogAgent',
              keywords: ['blog', 'artículo', 'post', 'contenido', 'escribir', 'redactar'],
              priority: 1,
              enabled: true
            },
            {
              agent: 'SEOAgent',
              keywords: ['seo', 'optimización', 'keywords', 'meta', 'ranking', 'posicionamiento'],
              priority: 2,
              enabled: true
            },
            {
              agent: 'ServicesAgent',
              keywords: ['servicio', 'producto', 'paquete', 'precio', 'cotizar'],
              priority: 3,
              enabled: true
            }
          ]
        }
      }
    }
  ];

  for (const config of defaultConfigs) {
    await this.findOneAndUpdate(
      { agentName: config.agentName },
      config,
      { upsert: true, new: true }
    );
  }
};

const AgentConfig = mongoose.model('AgentConfig', agentConfigSchema);

export default AgentConfig;
