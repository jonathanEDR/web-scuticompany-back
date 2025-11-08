/**
 * Script para inicializar configuración del ServicesAgent en la BD
 * 
 * Crea la configuración por defecto para ServicesAgent si no existe
 */

import mongoose from 'mongoose';
import AgentConfig from '../models/AgentConfig.js';
import logger from '../utils/logger.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/webscuti';

/**
 * Configuración por defecto para ServicesAgent
 */
const defaultServicesConfig = {
  agentName: 'services',
  enabled: true,
  
  config: {
    // OpenAI
    timeout: 30,
    maxTokens: 2000,
    temperature: 0.7,
    
    // Generación
    minDescriptionLength: 150,
    maxDescriptionLength: 500,
    defaultFeatureCount: 5,
    
    // Análisis
    minSEOScore: 60,
    minQualityScore: 70,
    
    // Pricing
    defaultMargin: 40,
    minPrice: 500,
    maxPrice: 50000
  },
  
  prompts: {
    system: `Eres un experto en servicios tecnológicos y estrategia de negocio.
Tu especialidad incluye:
- Crear y optimizar servicios profesionales
- Análisis de mercado y competencia
- Estrategias de pricing efectivas
- Optimización SEO para servicios
- Mejora de conversión y ventas

Siempre proporcionas respuestas precisas, prácticas y orientadas a resultados de negocio.`,
    
    generation: `Genera un servicio profesional con la siguiente información:
- Título atractivo y SEO-friendly
- Descripción persuasiva (150-300 palabras)
- Lista de características clave
- Beneficios claros para el cliente
- Propuesta de valor única`,
    
    optimization: `Optimiza el servicio considerando:
- SEO: palabras clave, meta tags, estructura
- Conversión: llamadas a la acción, beneficios, prueba social
- Calidad: claridad, profesionalismo, completitud
- Competitividad: diferenciación, valor agregado`,
    
    pricing: `Analiza y sugiere pricing considerando:
- Valor entregado al cliente
- Posicionamiento en el mercado
- Márgenes de rentabilidad
- Estrategias de penetración o premium
- Paquetización y bundling`
  },
  
  capabilities: [
    'create_service',
    'edit_service',
    'analyze_service',
    'suggest_pricing',
    'optimize_seo',
    'analyze_portfolio',
    'generate_description',
    'suggest_features',
    'competitive_analysis',
    'market_research'
  ],
  
  limits: {
    maxServicesPerDay: 50,
    maxAnalysisPerHour: 30,
    maxChatMessagesPerSession: 100
  },
  
  features: {
    autoSEO: true,
    priceOptimization: true,
    competitiveAnalysis: true,
    portfolioInsights: true,
    aiGeneration: true
  }
};

/**
 * Conectar a MongoDB
 */
async function connectDB() {
  try {
    console.log('📡 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado exitosamente');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    throw error;
  }
}

/**
 * Inicializar configuración
 */
async function initializeServicesConfig() {
  try {
    console.log('\n🔧 Inicializando configuración de ServicesAgent...\n');
    
    // Verificar si ya existe
    const existing = await AgentConfig.findOne({ agentName: 'services' });
    
    if (existing) {
      console.log('⚠️  La configuración de ServicesAgent ya existe');
      console.log(`   ID: ${existing._id}`);
      console.log(`   Habilitado: ${existing.enabled ? 'Sí' : 'No'}`);
      console.log(`   Capacidades: ${existing.capabilities?.length || 0}`);
      
      // Preguntar si actualizar
      console.log('\n💡 Para actualizar la configuración, elimínala primero o modifica el script');
      return existing;
    }
    
    // Crear nueva configuración
    console.log('📝 Creando configuración por defecto...');
    const config = await AgentConfig.create(defaultServicesConfig);
    
    console.log('✅ Configuración creada exitosamente');
    console.log(`   ID: ${config._id}`);
    console.log(`   Agente: ${config.agentName}`);
    console.log(`   Habilitado: ${config.enabled ? 'Sí' : 'No'}`);
    console.log(`   Capacidades: ${config.capabilities?.length || 0}`);
    if (config.features) {
      console.log(`   Features habilitados:`);
      Object.entries(config.features).forEach(([key, value]) => {
        console.log(`     - ${key}: ${value ? '✅' : '❌'}`);
      });
    }
    
    return config;
    
  } catch (error) {
    console.error('❌ Error inicializando configuración:', error.message);
    throw error;
  }
}

/**
 * Verificar que todos los agentes tengan configuración
 */
async function verifyAllAgents() {
  try {
    console.log('\n🔍 Verificando configuraciones de todos los agentes...\n');
    
    const configs = await AgentConfig.find({});
    const agentNames = ['blog', 'seo', 'analytics', 'content', 'services'];
    
    console.log(`Configuraciones existentes: ${configs.length}`);
    
    for (const name of agentNames) {
      const exists = configs.find(c => c.agentName === name);
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${name.padEnd(12)} ${exists ? `(ID: ${exists._id})` : '(No configurado)'}`);
    }
    
    const missing = agentNames.filter(name => !configs.find(c => c.agentName === name));
    
    if (missing.length > 0) {
      console.log(`\n⚠️  Agentes sin configuración: ${missing.join(', ')}`);
      console.log('💡 Ejecuta AgentConfig.initializeDefaults() o crea las configuraciones manualmente');
    } else {
      console.log('\n✅ Todos los agentes tienen configuración');
    }
    
  } catch (error) {
    console.error('❌ Error verificando agentes:', error.message);
  }
}

/**
 * Main
 */
async function main() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║   INICIALIZACIÓN DE SERVICESAGENT CONFIG              ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    await connectDB();
    await initializeServicesConfig();
    await verifyAllAgents();
    
    console.log('\n✅ Proceso completado exitosamente\n');
    
  } catch (error) {
    console.error('\n❌ Error en el proceso:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB\n');
  }
}

// Ejecutar
main();
