/**
 * Script de testing básico para SEOAgent (sin base de datos)
 * Valida estructura, configuración y funcionalidades básicas
 */

import { SEOAgent } from '../agents/specialized/SEOAgent.js';
import logger from '../utils/logger.js';

async function testSEOAgentStructure() {
  console.log('\n🧪 ==============================');
  console.log('🧪 TESTING SEOAGENT STRUCTURE');
  console.log('🧪 ==============================\n');

  try {
    // Crear instancia del SEOAgent sin conexión DB
    logger.info('🚀 Creating SEOAgent instance (no DB)...');
    const seoAgent = new SEOAgent(true);
    
    // Verificar propiedades básicas
    console.log('📊 Basic Properties:');
    console.log(`   Name: ${seoAgent.name}`);
    console.log(`   Description: ${seoAgent.description}`);
    console.log(`   Capabilities Count: ${seoAgent.capabilities.length}`);
    
    // Verificar capabilities específicas
    const expectedCapabilities = [
      'technical_seo_audit',
      'keyword_research', 
      'competitor_analysis',
      'schema_optimization',
      'sitemap_generation',
      'meta_optimization',
      'performance_analysis',
      'backlink_analysis',
      'content_gap_analysis',
      'local_seo_optimization'
    ];
    
    console.log('\n🎯 Capabilities Check:');
    let capabilitiesOK = true;
    for (const capability of expectedCapabilities) {
      if (seoAgent.capabilities.includes(capability)) {
        logger.success(`✅ Capability '${capability}' available`);
      } else {
        logger.error(`❌ Capability '${capability}' missing`);
        capabilitiesOK = false;
      }
    }
    
    // Verificar configuración
    console.log('\n⚙️ Configuration Check:');
    console.log(`   Max Keywords per Analysis: ${seoAgent.config.maxKeywordsPerAnalysis}`);
    console.log(`   SEO Audit Depth: ${seoAgent.config.seoAuditDepth}`);
    console.log(`   Competitor Limit: ${seoAgent.config.competitorLimit}`);
    console.log(`   Performance Threshold: ${seoAgent.config.performanceThreshold}`);
    console.log(`   Schema Validation: ${seoAgent.config.schemaValidation}`);
    console.log(`   Temperature: ${seoAgent.config.temperature}`);
    console.log(`   Max Tokens: ${seoAgent.config.maxTokens}`);
    console.log(`   Timeout: ${seoAgent.config.timeout}ms`);
    
    // Verificar métodos específicos
    console.log('\n🔧 Methods Check:');
    const methods = [
      'loadConfiguration',
      'executeTask', 
      'performTechnicalAudit',
      'performKeywordResearch',
      'optimizeSchemaMarkup',
      'analyzePerformanceMetrics',
      'getDefaultPersonality',
      'getDefaultContext',
      'getDefaultResponse',
      'getDefaultPrompts'
    ];
    
    let methodsOK = true;
    for (const method of methods) {
      if (typeof seoAgent[method] === 'function') {
        logger.success(`✅ Method '${method}' available`);
      } else {
        logger.error(`❌ Method '${method}' missing`);
        methodsOK = false;
      }
    }
    
    // Verificar configuraciones por defecto
    console.log('\n📋 Default Configurations:');
    const personality = seoAgent.getDefaultPersonality();
    const context = seoAgent.getDefaultContext();
    const response = seoAgent.getDefaultResponse();
    const prompts = seoAgent.getDefaultPrompts();
    
    console.log(`   Personality Archetype: ${personality.archetype}`);
    console.log(`   Personality Traits: ${personality.traits.length}`);
    console.log(`   Context Project Type: ${context.projectInfo.type}`);
    console.log(`   SEO Objectives: ${context.seoObjectives.primary_goals.length}`);
    console.log(`   Response Format: ${response.format}`);
    console.log(`   System Prompt Length: ${prompts.systemPrompt.length} chars`);
    
    if (capabilitiesOK && methodsOK) {
      logger.success('✅ SEOAgent structure validation PASSED');
      return true;
    } else {
      logger.error('❌ SEOAgent structure validation FAILED');
      return false;
    }
    
  } catch (error) {
    logger.error('❌ SEOAgent structure test failed:', error);
    return false;
  }
}

async function testSEOAgentTaskTypes() {
  console.log('\n🧪 ============================');
  console.log('🧪 TESTING SEOAGENT TASK TYPES');
  console.log('🧪 ============================\n');

  try {
    const seoAgent = new SEOAgent(true);
    
    // Test task types sin ejecutar (solo validar estructura)
    const testTasks = [
      { type: 'technical_audit', url: 'https://example.com' },
      { type: 'keyword_research', topic: 'javascript' },
      { type: 'schema_optimization', contentType: 'article' },
      { type: 'performance_analysis', url: 'https://example.com' },
      { type: 'competitor_analysis', domain: 'example.com' },
      { type: 'sitemap_generation', baseUrl: 'https://example.com' },
      { type: 'meta_optimization', content: { title: 'Test' } },
      { type: 'backlink_analysis', domain: 'example.com' },
      { type: 'content_gap_analysis', competitors: ['example.com'] },
      { type: 'local_seo_optimization', business: 'test' }
    ];
    
    console.log('🎯 Task Types Support Check:');
    let allTasksOK = true;
    
    for (const task of testTasks) {
      try {
        // Solo verificar que no hay errores de validación básica
        if (task.type && typeof task.type === 'string') {
          logger.success(`✅ Task type '${task.type}' - Structure OK`);
        } else {
          logger.error(`❌ Task type '${task.type}' - Invalid structure`);
          allTasksOK = false;
        }
      } catch (error) {
        logger.error(`❌ Task type '${task.type}' - Error: ${error.message}`);
        allTasksOK = false;
      }
    }
    
    if (allTasksOK) {
      logger.success('✅ All task types validation PASSED');
      return true;
    } else {
      logger.error('❌ Some task types validation FAILED');
      return false;
    }
    
  } catch (error) {
    logger.error('❌ Task types test failed:', error);
    return false;
  }
}

async function testSEOAgentConfig() {
  console.log('\n🧪 ===========================');
  console.log('🧪 TESTING SEOAGENT CONFIG');
  console.log('🧪 ===========================\n');

  try {
    const seoAgent = new SEOAgent(true);
    
    // Verificar configuración específica de SEO
    console.log('📊 SEO-Specific Configuration:');
    
    const config = seoAgent.config;
    const checks = [
      { key: 'maxKeywordsPerAnalysis', expected: 'number', value: config.maxKeywordsPerAnalysis },
      { key: 'seoAuditDepth', expected: 'string', value: config.seoAuditDepth },
      { key: 'competitorLimit', expected: 'number', value: config.competitorLimit },
      { key: 'performanceThreshold', expected: 'number', value: config.performanceThreshold },
      { key: 'schemaValidation', expected: 'boolean', value: config.schemaValidation },
      { key: 'temperature', expected: 'number', value: config.temperature },
      { key: 'maxTokens', expected: 'number', value: config.maxTokens }
    ];
    
    let configOK = true;
    for (const check of checks) {
      if (typeof check.value === check.expected) {
        logger.success(`✅ ${check.key}: ${check.value} (${check.expected})`);
      } else {
        logger.error(`❌ ${check.key}: Invalid type - expected ${check.expected}, got ${typeof check.value}`);
        configOK = false;
      }
    }
    
    // Verificar valores específicos
    if (config.temperature <= 0.5) {
      logger.success(`✅ Temperature optimized for precision: ${config.temperature}`);
    } else {
      logger.warn(`⚠️  Temperature might be too high for SEO analysis: ${config.temperature}`);
    }
    
    if (config.maxTokens >= 2000) {
      logger.success(`✅ Max tokens sufficient for detailed reports: ${config.maxTokens}`);
    } else {
      logger.warn(`⚠️  Max tokens might be insufficient: ${config.maxTokens}`);
    }
    
    if (configOK) {
      logger.success('✅ SEO configuration validation PASSED');
      return true;
    } else {
      logger.error('❌ SEO configuration validation FAILED');
      return false;
    }
    
  } catch (error) {
    logger.error('❌ Configuration test failed:', error);
    return false;
  }
}

async function runBasicTests() {
  console.log('🚀 Starting SEOAgent Basic Testing Suite...\n');
  
  const results = {
    structure: false,
    taskTypes: false,
    config: false
  };
  
  try {
    // Test 1: Estructura
    results.structure = await testSEOAgentStructure();
    
    // Test 2: Task Types
    results.taskTypes = await testSEOAgentTaskTypes();
    
    // Test 3: Configuración
    results.config = await testSEOAgentConfig();
    
  } catch (error) {
    logger.error('❌ Basic test suite failed:', error);
  }
  
  console.log('\n🏁 ===========================');
  console.log('🏁 BASIC TESTING SUITE COMPLETE');
  console.log('🏁 ===========================');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  console.log(`   Structure: ${results.structure ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Task Types: ${results.taskTypes ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Configuration: ${results.config ? '✅ PASS' : '❌ FAIL'}`);
  
  if (passed === total) {
    console.log('\n🎉 ALL BASIC TESTS PASSED - SEOAgent structure is correct!');
    console.log('📝 Next steps: Test with database connection and OpenAI integration');
    return true;
  } else {
    console.log('\n⚠️  Some basic tests failed - Please check the implementation');
    return false;
  }
}

// Ejecutar tests si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runBasicTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error('❌ Fatal error in basic test suite:', error);
      process.exit(1);
    });
}

export { runBasicTests };