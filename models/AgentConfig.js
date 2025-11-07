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
    enum: ['blog', 'seo', 'analytics', 'content']
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
