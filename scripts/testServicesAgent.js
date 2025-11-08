/**
 * Script de testing para ServicesAgent
 * 
 * Tests incluidos:
 * 1. Inicialización del agente
 * 2. Chat interactivo
 * 3. Generación de servicios
 * 4. Optimización de servicios
 * 5. Análisis de servicios
 * 6. Sugerencias de pricing
 * 7. Métricas y estadísticas
 */

import mongoose from 'mongoose';
import ServicesAgent from '../agents/specialized/services/ServicesAgent.js';
import Servicio from '../models/Servicio.js';
import Categoria from '../models/Categoria.js';
import logger from '../utils/logger.js';

// Configuración de conexión a BD
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/webscuti';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.magenta}🧪 ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}\n${colors.bright}${msg}${colors.reset}\n${colors.blue}${'='.repeat(60)}${colors.reset}\n`)
};

// Instancia del agente
let agent = null;
let testCategoria = null;

/**
 * Conectar a la base de datos
 */
async function connectDB() {
  try {
    log.info('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    log.success('Conectado a MongoDB exitosamente');
    return true;
  } catch (error) {
    log.error(`Error conectando a MongoDB: ${error.message}`);
    return false;
  }
}

/**
 * Desconectar de la base de datos
 */
async function disconnectDB() {
  try {
    await mongoose.disconnect();
    log.success('Desconectado de MongoDB');
  } catch (error) {
    log.error(`Error desconectando: ${error.message}`);
  }
}

/**
 * Setup: Crear datos de prueba
 */
async function setupTestData() {
  log.header('SETUP: Creando datos de prueba');
  
  try {
    // Obtener o crear categoría de prueba
    testCategoria = await Categoria.findOne({ nombre: 'Desarrollo Web' });
    
    if (!testCategoria) {
      log.warning('Categoría no encontrada, creando una de prueba...');
      testCategoria = await Categoria.create({
        nombre: 'Desarrollo Web',
        descripcion: 'Servicios de desarrollo web profesional',
        icono: 'code',
        orden: 1,
        estado: 'activo'
      });
      log.success('Categoría de prueba creada');
    } else {
      log.success('Categoría de prueba encontrada');
    }
    
    return true;
  } catch (error) {
    log.error(`Error en setup: ${error.message}`);
    return false;
  }
}

/**
 * Test 1: Inicialización del agente
 */
async function testAgentInitialization() {
  log.header('TEST 1: Inicialización del ServicesAgent');
  
  try {
    log.test('Creando instancia de ServicesAgent...');
    agent = new ServicesAgent({
      enabled: true,
      name: 'ServicesAgent-Test'
    });
    
    log.test('Activando agente...');
    await agent.activate();
    
    log.success('Agente inicializado y activado correctamente');
    log.info(`Nombre: ${agent.name}`);
    log.info(`Capacidades: ${agent.capabilities?.length || 0}`);
    log.info(`Estado: ${agent.enabled ? 'Activo' : 'Inactivo'}`);
    
    return true;
  } catch (error) {
    log.error(`Error en inicialización: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Chat básico
 */
async function testChat() {
  log.header('TEST 2: Chat Interactivo');
  
  const testMessages = [
    '¿Qué servicios puedes ayudarme a crear?',
    'Quiero información sobre desarrollo web',
    'Dame recomendaciones para mejorar mis servicios'
  ];
  
  let passedTests = 0;
  
  for (const message of testMessages) {
    try {
      log.test(`Mensaje: "${message}"`);
      
      const result = await agent.chat(message, {
        userId: 'test-user-001'
      });
      
      if (result.success) {
        log.success(`Respuesta recibida (${result.data?.response?.length || 0} chars)`);
        passedTests++;
      } else {
        log.error(`Chat falló: ${result.error}`);
      }
      
    } catch (error) {
      log.error(`Error en chat: ${error.message}`);
    }
  }
  
  log.info(`Tests pasados: ${passedTests}/${testMessages.length}`);
  return passedTests === testMessages.length;
}

/**
 * Test 3: Crear servicio con IA
 */
async function testServiceCreation() {
  log.header('TEST 3: Creación de Servicio con IA');
  
  try {
    const servicePrompt = 'Crea un servicio de desarrollo de landing pages profesionales con React y Next.js';
    
    log.test(`Prompt: "${servicePrompt}"`);
    
    const result = await agent.createService(servicePrompt, {
      userId: 'test-user-001',
      categoria: testCategoria._id
    });
    
    if (result.success && result.data?.serviceId) {
      log.success('Servicio creado exitosamente');
      log.info(`Service ID: ${result.data.serviceId}`);
      
      // Verificar que existe en la BD
      const service = await Servicio.findById(result.data.serviceId);
      if (service) {
        log.success('Servicio verificado en BD');
        log.info(`Título: ${service.titulo}`);
        log.info(`Precio: S/ ${service.precio || 'No definido'}`);
        return { success: true, serviceId: result.data.serviceId };
      }
    } else {
      log.error(`Creación falló: ${result.error || 'Unknown error'}`);
      log.warning('Esto puede ser normal si OpenAI no está configurado');
    }
    
    return { success: false };
  } catch (error) {
    log.error(`Error creando servicio: ${error.message}`);
    return { success: false };
  }
}

/**
 * Test 4: Editar servicio con IA
 */
async function testServiceEditing(serviceId) {
  log.header('TEST 4: Edición de Servicio con IA');
  
  if (!serviceId) {
    log.warning('No hay serviceId, saltando test de edición');
    return false;
  }
  
  try {
    const instructions = 'Optimiza el SEO del servicio y mejora la descripción para conversión';
    
    log.test(`Instrucciones: "${instructions}"`);
    
    const result = await agent.editService(serviceId, instructions, {
      userId: 'test-user-001'
    });
    
    if (result.success) {
      log.success('Servicio editado exitosamente');
      log.info(`Cambios aplicados: ${result.data?.changes?.length || 0}`);
      return true;
    } else {
      log.error(`Edición falló: ${result.error}`);
      log.warning('Esto puede ser normal si OpenAI no está configurado');
    }
    
    return false;
  } catch (error) {
    log.error(`Error editando servicio: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Analizar servicio
 */
async function testServiceAnalysis(serviceId) {
  log.header('TEST 5: Análisis de Servicio');
  
  if (!serviceId) {
    log.warning('No hay serviceId, usando uno existente de la BD...');
    const existingService = await Servicio.findOne({ estado: 'activo' });
    if (existingService) {
      serviceId = existingService._id;
      log.info(`Usando servicio: ${existingService.titulo}`);
    } else {
      log.warning('No hay servicios en la BD, saltando test');
      return false;
    }
  }
  
  try {
    log.test(`Analizando servicio ID: ${serviceId}`);
    
    const result = await agent.analyzeService(serviceId, {
      userId: 'test-user-001'
    });
    
    if (result.success && result.data) {
      log.success('Análisis completado');
      
      // Mostrar métricas
      const scores = result.data.scores || {};
      log.info(`Score SEO: ${scores.seo || 'N/A'}/100`);
      log.info(`Score Calidad: ${scores.quality || 'N/A'}/100`);
      log.info(`Score Completitud: ${scores.completeness || 'N/A'}/100`);
      log.info(`Score Conversión: ${scores.conversion || 'N/A'}/100`);
      
      return true;
    } else {
      log.error(`Análisis falló: ${result.error}`);
    }
    
    return false;
  } catch (error) {
    log.error(`Error analizando servicio: ${error.message}`);
    return false;
  }
}

/**
 * Test 6: Sugerir pricing
 */
async function testPricingSuggestion() {
  log.header('TEST 6: Sugerencia de Pricing');
  
  try {
    const serviceData = {
      titulo: 'Desarrollo de E-commerce con Shopify',
      descripcion: 'Tienda online completa con integración de pagos',
      categoria: testCategoria._id,
      caracteristicas: [
        'Diseño responsive',
        'Integración de pagos',
        'Panel de administración',
        'SEO optimizado'
      ],
      duracion: { valor: 4, unidad: 'semanas' }
    };
    
    log.test('Solicitando sugerencia de pricing...');
    
    // Usar directamente el método del handler
    const result = await agent.pricingAdvisor.suggestPricing(serviceData);
    
    if (result.success && result.data) {
      log.success('Pricing sugerido exitosamente');
      log.info(`Precio recomendado: S/ ${result.data.recommended || 'N/A'}`);
      log.info(`Rango: S/ ${result.data.range?.min || 0} - S/ ${result.data.range?.max || 0}`);
      log.info(`Estrategias disponibles: ${result.data.strategies?.length || 0}`);
      return true;
    } else {
      log.error(`Pricing falló: ${result.error}`);
      log.warning('Esto puede ser normal si OpenAI no está configurado');
    }
    
    return false;
  } catch (error) {
    log.error(`Error sugiriendo pricing: ${error.message}`);
    return false;
  }
}

/**
 * Test 7: Métricas del agente
 */
async function testMetrics() {
  log.header('TEST 7: Métricas del Agente');
  
  try {
    log.test('Obteniendo métricas...');
    
    // Obtener métricas de los handlers
    const chatMetrics = agent.chatHandler?.getMetrics?.() || {};
    const analyzerMetrics = agent.analyzer?.getMetrics?.() || {};
    const generatorMetrics = agent.generator?.getMetrics?.() || {};
    const optimizerMetrics = agent.optimizer?.getMetrics?.() || {};
    const pricingMetrics = agent.pricingAdvisor?.getMetrics?.() || {};
    
    log.success('Métricas obtenidas');
    log.info(`Chat Handler - Total: ${chatMetrics.totalChats || 0}, Promedio: ${chatMetrics.averageTime || 0}ms`);
    log.info(`Analyzer - Total: ${analyzerMetrics.totalAnalysis || 0}, Promedio: ${analyzerMetrics.averageTime || 0}ms`);
    log.info(`Generator - Total: ${generatorMetrics.totalGenerated || 0}, Promedio: ${generatorMetrics.averageTime || 0}ms`);
    log.info(`Optimizer - Total: ${optimizerMetrics.totalOptimizations || 0}, Promedio: ${optimizerMetrics.averageTime || 0}ms`);
    log.info(`PricingAdvisor - Total: ${pricingMetrics.totalSuggestions || 0}, Promedio: ${pricingMetrics.averageTime || 0}ms`);
    
    return true;
  } catch (error) {
    log.error(`Error obteniendo métricas: ${error.message}`);
    return false;
  }
}

/**
 * Cleanup: Limpiar datos de prueba
 */
async function cleanup() {
  log.header('CLEANUP: Limpiando datos de prueba');
  
  try {
    // Opcional: eliminar servicios de prueba creados
    // const deleted = await Servicio.deleteMany({ titulo: /Test/i });
    // log.info(`Servicios eliminados: ${deleted.deletedCount}`);
    
    log.success('Cleanup completado');
  } catch (error) {
    log.error(`Error en cleanup: ${error.message}`);
  }
}

/**
 * Ejecutar todos los tests
 */
async function runAllTests() {
  log.header('🚀 INICIANDO SUITE DE TESTS DE SERVICESAGENT');
  
  const results = {
    total: 7,
    passed: 0,
    failed: 0,
    skipped: 0
  };
  
  // Conectar a BD
  const connected = await connectDB();
  if (!connected) {
    log.error('No se pudo conectar a la BD, abortando tests');
    return;
  }
  
  // Setup
  const setupOk = await setupTestData();
  if (!setupOk) {
    log.error('Setup falló, abortando tests');
    await disconnectDB();
    return;
  }
  
  // Test 1: Inicialización
  if (await testAgentInitialization()) results.passed++;
  else results.failed++;
  
  // Test 2: Chat
  if (await testChat()) results.passed++;
  else results.failed++;
  
  // Test 3: Crear servicio
  const creationResult = await testServiceCreation();
  if (creationResult.success) results.passed++;
  else results.failed++;
  
  // Test 4: Editar servicio
  if (creationResult.success) {
    if (await testServiceEditing(creationResult.serviceId)) results.passed++;
    else results.failed++;
  } else {
    log.warning('Saltando test de edición (no se creó servicio)');
    results.skipped++;
  }
  
  // Test 5: Analizar servicio
  if (await testServiceAnalysis(creationResult.serviceId)) results.passed++;
  else results.failed++;
  
  // Test 6: Pricing
  if (await testPricingSuggestion()) results.passed++;
  else results.failed++;
  
  // Test 7: Métricas
  if (await testMetrics()) results.passed++;
  else results.failed++;
  
  // Cleanup
  await cleanup();
  
  // Resultados finales
  log.header('📊 RESULTADOS DE TESTS');
  console.log(`
${colors.bright}Total de tests:${colors.reset}     ${results.total}
${colors.green}✅ Tests pasados:${colors.reset}    ${results.passed}
${colors.red}❌ Tests fallidos:${colors.reset}   ${results.failed}
${colors.yellow}⏭️  Tests saltados:${colors.reset}   ${results.skipped}

${colors.bright}Tasa de éxito:${colors.reset}      ${Math.round((results.passed / results.total) * 100)}%
  `);
  
  if (results.passed === results.total) {
    log.success('🎉 TODOS LOS TESTS PASARON EXITOSAMENTE');
  } else if (results.passed > results.failed) {
    log.warning('⚠️  ALGUNOS TESTS FALLARON, REVISAR LOGS');
  } else {
    log.error('❌ LA MAYORÍA DE TESTS FALLARON');
  }
  
  // Desconectar
  await disconnectDB();
}

// Ejecutar tests
runAllTests().catch(error => {
  log.error(`Error fatal: ${error.message}`);
  console.error(error);
  process.exit(1);
});
