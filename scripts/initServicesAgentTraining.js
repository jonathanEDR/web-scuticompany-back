/**
 * Script de Inicialización de Contexto de Entrenamiento para ServicesAgent
 * 
 * Crea los prompts y datos de entrenamiento por defecto para el ServicesAgent
 * que pueden ser personalizados luego desde el panel de configuración del frontend
 */

import mongoose from 'mongoose';
import AgentConfig from '../models/AgentConfig.js';
import logger from '../utils/logger.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/webscuti';

/**
 * Configuración de entrenamiento por defecto para ServicesAgent
 */
const defaultTrainingData = {
  agentName: 'services',
  
  // Task Prompts - Ejemplos para cada tipo de tarea
  taskPrompts: [
    {
      id: 'create_landing_page',
      type: 'create_service',
      category: 'Desarrollo Web',
      prompt: `Crea un servicio profesional de Landing Page con las siguientes características:
        - Sitio responsive diseñado con React/Next.js
        - Optimizado para conversión y SEO
        - Incluye formulario de contacto integrado
        - Hosting incluido por 1 año
        - Soporte técnico 24/7`,
      expectedOutput: {
        titulo: 'Desarrollo de Landing Page Profesional',
        descripcion: 'Sitio web profesional optimizado para conversión con tecnologías modernas',
        caracteristicas: ['Responsive', 'Optimizado SEO', 'Formulario contacto', 'Hosting 1 año']
      }
    },
    {
      id: 'create_ecommerce',
      type: 'create_service',
      category: 'Desarrollo Web',
      prompt: `Crea un servicio de Tienda Online E-commerce completa con:
        - Integración con pasarela de pagos (Stripe, Paypal)
        - Catálogo de productos con búsqueda avanzada
        - Carrito de compras y checkout optimizado
        - Panel administrativo para gestionar productos
        - Reportes de ventas y análisis`,
      expectedOutput: {
        titulo: 'Desarrollo de Tienda Online E-commerce',
        descripcion: 'Plataforma completa de e-commerce con todas las características para vender online',
        caracteristicas: ['Pasarela de pagos', 'Catálogo productos', 'Panel admin', 'Reportes']
      }
    },
    {
      id: 'optimize_seo_service',
      type: 'edit_service',
      optimizationType: 'seo',
      prompt: `Optimiza la siguiente descripción de servicio para SEO:
        - Agrega palabras clave relevantes
        - Estructura con títulos H2/H3
        - Máximo 300 caracteres para meta description
        - Incluye beneficios principales`,
      instructions: 'Mejorar posicionamiento en buscadores'
    },
    {
      id: 'analyze_portfolio_startup',
      type: 'analyze_portfolio',
      prompt: `Analiza el portfolio de servicios de una startup tech:
        - Evalúa competitividad de precios
        - Identifica gaps en la oferta
        - Sugiere servicios complementarios
        - Propone estrategia de crecimiento`,
      expectedAnalysis: {
        totalServices: '5-10',
        mainGaps: ['Servicios premium', 'Packages bundle', 'Soporte técnico'],
        recommendations: ['Agregar plan empresa', 'Bundling de servicios']
      }
    }
  ],

  // Behavior Rules - Reglas de comportamiento para el agente
  behaviorRules: [
    'Siempre validar que los datos del servicio sean completos antes de crear',
    'Sugerir siempre optimizaciones SEO en servicios nuevos',
    'Considerar márgenes de rentabilidad del 40-50% en pricing',
    'Priorizar descripciones claras y orientadas a beneficios del cliente',
    'Usar datos de mercado para benchmarking de precios',
    'Incluir características diferenciadores en cada servicio',
    'Validar que los títulos sean descriptivos (30-60 caracteres ideales)',
    'Asegurar que las descripciones tengan CTA (llamada a acción) clara',
    'Recomendar empacar servicios relacionados en bundles',
    'Considerar el nivel de expertise del cliente en tecnología'
  ],

  // Training Examples - Ejemplos reales de entrenamiento
  trainingExamples: [
    {
      input: 'Quiero vender desarrollo de landing pages',
      output: {
        action: 'create_service',
        suggestion: 'Crear servicio "Landing Page Profesional" con precio competitivo S/ 1,500-2,000',
        reasoning: 'Demanda alta, margen de 45% recomendado'
      }
    },
    {
      input: 'Mi servicio de web design no se vende bien',
      output: {
        action: 'edit_service',
        suggestion: 'Optimizar SEO, agregar CTA, incluir portafolio visual',
        reasoning: 'Falta claridad en propuesta de valor'
      }
    },
    {
      input: 'Necesito pricing para apps móviles',
      output: {
        action: 'suggest_pricing',
        suggestion: 'Rango: S/ 5,000 - 15,000 según complejidad',
        factors: ['Plataforma (iOS/Android)', 'Integraciones', 'Hosting', 'Soporte 6 meses']
      }
    },
    {
      input: 'Cómo mejorar mi catálogo de servicios',
      output: {
        action: 'analyze_portfolio',
        suggestion: 'Agregar 3-5 servicios premium, bundlear paquetes, mejorar SEO en 60%',
        metrics: ['Completeness: 65%', 'Competitiveness: 72%', 'SEO: 58%']
      }
    }
  ],

  // Context Knowledge - Base de conocimiento del agente
  contextKnowledge: {
    industryStandards: {
      webDevelopment: {
        minPrice: 1000,
        avgPrice: 3000,
        maxPrice: 15000,
        avgMargin: 45
      },
      webDesign: {
        minPrice: 500,
        avgPrice: 2000,
        maxPrice: 8000,
        avgMargin: 50
      },
      consulting: {
        minPrice: 100,
        avgPrice: 200,
        maxPrice: 500,
        avgMargin: 70,
        unit: 'por hora'
      },
      seoOptimization: {
        minPrice: 2000,
        avgPrice: 5000,
        maxPrice: 20000,
        avgMargin: 40,
        unit: 'por proyecto'
      }
    },
    
    bestPractices: {
      titleLength: {
        min: 30,
        ideal: 40,
        max: 60,
        note: 'Caracteres para SEO óptimo'
      },
      descriptionLength: {
        min: 100,
        ideal: 250,
        max: 500,
        note: 'Caracteres para descripción completa'
      },
      minFeatures: 4,
      optimalFeatures: 6,
      maxFeatures: 10,
      recommendedPackages: 3
    },

    keywordExamples: {
      webDevelopment: ['desarrollo web', 'sitio web', 'aplicación web', 'React', 'Next.js'],
      ecommerce: ['tienda online', 'e-commerce', 'plataforma venta', 'pasarela pagos'],
      seo: ['posicionamiento SEO', 'optimización buscadores', 'palabras clave', 'ranking Google'],
      design: ['diseño web', 'UI/UX', 'prototipado', 'diseño gráfico']
    }
  },

  // Personality Profile - Perfil de personalidad del agente
  personalityProfile: {
    tone: 'profesional pero accesible',
    style: 'consultivo y recomendador',
    expertise: 'servicios digitales y estrategia comercial',
    communication: 'clara, estructurada, orientada a resultados'
  },

  // Customization Instructions - Instrucciones para personalización
  customizationInstructions: `
    Los usuarios pueden personalizar este contexto desde el panel de configuración:
    
    1. TASK PROMPTS: Agregar ejemplos específicos del negocio
    2. BEHAVIOR RULES: Agregar reglas personalizadas según industria
    3. CONTEXT KNOWLEDGE: Actualizar precios y estándares de mercado
    4. PERSONALITY: Ajustar tono según marca del cliente
    
    Cambios aplicados automáticamente en próximas ejecuciones del agente.
  `,

  // Version and Metadata
  version: '1.0.0',
  lastUpdated: new Date(),
  status: 'active'
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
 * Inicializar datos de entrenamiento
 */
async function initializeTrainingData() {
  try {
    console.log('\n🔧 Inicializando datos de entrenamiento para ServicesAgent...\n');

    // Buscar configuración existente
    let config = await AgentConfig.findOne({ agentName: 'services' });

    if (!config) {
      console.log('❌ ServicesAgent config no encontrada');
      console.log('💡 Ejecuta primero: node scripts/initServicesAgentConfig.js');
      return false;
    }

    // Actualizar con datos de entrenamiento
    console.log('📝 Agregando datos de entrenamiento...');
    
    config.taskPrompts = defaultTrainingData.taskPrompts;
    config.behaviorRules = defaultTrainingData.behaviorRules;
    config.trainingExamples = defaultTrainingData.trainingExamples;
    config.contextKnowledge = defaultTrainingData.contextKnowledge;
    config.personalityProfile = defaultTrainingData.personalityProfile;
    config.customizationInstructions = defaultTrainingData.customizationInstructions;
    config.trainingVersion = defaultTrainingData.version;
    config.lastTrainingUpdate = new Date();

    await config.save();

    console.log('✅ Datos de entrenamiento agregados exitosamente\n');

    // Mostrar resumen
    console.log('📊 RESUMEN DE DATOS DE ENTRENAMIENTO:');
    console.log(`   • Task Prompts: ${config.taskPrompts?.length || 0}`);
    console.log(`   • Behavior Rules: ${config.behaviorRules?.length || 0}`);
    console.log(`   • Training Examples: ${config.trainingExamples?.length || 0}`);
    console.log(`   • Industry Standards: ${Object.keys(config.contextKnowledge?.industryStandards || {}).length}`);
    console.log(`   • Best Practices: Configuradas`);
    console.log(`   • Personality: ${config.personalityProfile?.tone || 'N/A'}`);

    return true;

  } catch (error) {
    console.error('❌ Error inicializando datos de entrenamiento:', error.message);
    return false;
  }
}

/**
 * Mostrar ejemplo de customización
 */
function showCustomizationExample() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 EJEMPLO: Cómo Personalizar desde el Frontend');
  console.log('='.repeat(60) + '\n');

  console.log('El usuario puede cambiar estos parámetros en Panel > Configuración > ServicesAgent:\n');

  console.log('1️⃣  AGREGAR RULE PERSONALIZADA:');
  console.log('   Regla: "Priorizar servicios con margen > 50%"');
  console.log('   Efecto: El agente solo recomendará servicios rentables\n');

  console.log('2️⃣  ACTUALIZAR PRICING POR INDUSTRIA:');
  console.log('   webDevelopment.avgPrice: 3000 → 4000');
  console.log('   Efecto: Cambio inmediato en sugerencias de pricing\n');

  console.log('3️⃣  AGREGAR TASK PROMPT PERSONALIZADO:');
  console.log('   input: "Servicio para boutique de moda"');
  console.log('   output: "Crea tienda online especializada en moda..."');
  console.log('   Efecto: El agente aprende nuevo caso de uso\n');

  console.log('4️⃣  CAMBIAR PERSONALIDAD DEL AGENTE:');
  console.log('   tone: "profesional" → "casual y amigable"');
  console.log('   Efecto: Cambios en comunicación del agente\n');

  console.log('✅ Todos los cambios se sincronizan automáticamente\n');
}

/**
 * Main
 */
async function main() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║   INICIALIZACIÓN DE CONTEXTO DE ENTRENAMIENTO         ║');
    console.log('║                   ServicesAgent                       ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    await connectDB();
    const success = await initializeTrainingData();

    if (success) {
      showCustomizationExample();
      console.log('✅ Proceso completado exitosamente\n');
    } else {
      console.log('⚠️  Algunos pasos fallaron, revisa los logs\n');
    }

  } catch (error) {
    console.error('❌ Error en el proceso:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB\n');
  }
}

// Ejecutar
main();
