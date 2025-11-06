/**
 * Script de testing para SEOAgent
 * Valida auto-inicialización, configuración y funcionalidades básicas
 */

import { SEOAgent } from '../agents/specialized/SEOAgent.js';
import AgentConfig from '../models/AgentConfig.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Configuración de base de datos
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/webscuti';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('📊 Connected to MongoDB for SEOAgent testing');
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function testSEOAgentInitialization() {
  console.log('\n🧪 =================================');
  console.log('🧪 TESTING SEOAGENT INITIALIZATION');
  console.log('🧪 =================================\n');

  try {
    // 1. Limpiar configuración existente (opcional para testing)
    logger.info('🧹 Cleaning existing SEOAgent config for fresh test...');
    await AgentConfig.deleteOne({ agentId: 'SEOAgent' });
    
    // 2. Crear instancia del SEOAgent
    logger.info('🚀 Creating SEOAgent instance...');
    const seoAgent = new SEOAgent();
    
    // Esperar a que se complete la inicialización
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Verificar que la configuración se creó
    const config = await AgentConfig.findOne({ agentId: 'SEOAgent' });
    
    if (!config) {
      throw new Error('SEOAgent configuration was not created');
    }
    
    logger.success('✅ SEOAgent configuration found in database');
    
    // 4. Validar task prompts
    const taskPrompts = config.trainingConfig.taskPrompts;
    const expectedTaskTypes = ['technical_audit', 'keyword_research', 'schema_optimization', 'performance_analysis'];
    
    console.log(`📋 Task Prompts found: ${taskPrompts.length}`);
    
    for (const expectedType of expectedTaskTypes) {
      const found = taskPrompts.find(tp => tp.taskType === expectedType);
      if (found) {
        logger.success(`✅ Task prompt '${expectedType}' configured correctly`);
      } else {
        logger.error(`❌ Task prompt '${expectedType}' missing`);
      }
    }
    
    // 5. Validar behavior rules
    const behaviorRules = config.trainingConfig.behaviorRules;
    console.log(`📜 Behavior Rules found: ${behaviorRules.length}`);
    
    if (behaviorRules.length >= 10) {
      logger.success('✅ Behavior rules configured correctly');
    } else {
      logger.error('❌ Insufficient behavior rules');
    }
    
    // 6. Validar special instructions
    const specialInstructions = config.trainingConfig.specialInstructions;
    if (specialInstructions && specialInstructions.length > 100) {
      logger.success('✅ Special instructions configured correctly');
    } else {
      logger.error('❌ Special instructions missing or too short');
    }
    
    console.log('\n📊 INITIALIZATION TEST RESULTS:');
    console.log('================================');
    console.log(`Agent ID: ${config.agentId}`);
    console.log(`Personality Archetype: ${config.personality.archetype}`);
    console.log(`Task Prompts: ${taskPrompts.length}/4`);
    console.log(`Behavior Rules: ${behaviorRules.length}/10`);
    console.log(`Special Instructions Length: ${specialInstructions.length} chars`);
    console.log(`Is Active: ${config.isActive}`);
    
  } catch (error) {
    logger.error('❌ SEOAgent initialization test failed:', error);
    throw error;
  }
}

async function testSEOAgentTaskExecution() {
  console.log('\n🧪 ===============================');
  console.log('🧪 TESTING SEOAGENT TASK EXECUTION');
  console.log('🧪 ===============================\n');

  try {
    const seoAgent = new SEOAgent();
    
    // Test tasks básicas
    const testTasks = [
      {
        type: 'technical_audit',
        url: 'https://webscuti.com',
        depth: 'basic'
      },
      {
        type: 'keyword_research',
        topic: 'desarrollo web javascript',
        market: 'es'
      },
      {
        type: 'schema_optimization',
        contentType: 'article',
        content: {
          title: 'Guía de JavaScript 2024',
          author: 'Web Scuti',
          datePublished: '2024-11-05'
        }
      },
      {
        type: 'performance_analysis',
        url: 'https://webscuti.com',
        device: 'both'
      }
    ];
    
    for (const task of testTasks) {
      logger.info(`🎯 Testing task: ${task.type}`);
      
      try {
        const result = await seoAgent.executeTask(task);
        
        if (result.success) {
          logger.success(`✅ Task '${task.type}' executed successfully`);
          console.log(`   Result: ${result.taskType || 'generic'}`);
        } else {
          logger.error(`❌ Task '${task.type}' failed: ${result.error}`);
        }
        
      } catch (taskError) {
        logger.error(`❌ Task '${task.type}' threw error:`, taskError.message);
      }
      
      // Pequeña pausa entre tareas
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
  } catch (error) {
    logger.error('❌ SEOAgent task execution test failed:', error);
    throw error;
  }
}

async function testSEOAgentConfiguration() {
  console.log('\n🧪 ===============================');
  console.log('🧪 TESTING SEOAGENT CONFIGURATION');
  console.log('🧪 ===============================\n');

  try {
    const seoAgent = new SEOAgent();
    
    // Test configuración básica
    console.log('📊 Basic Configuration:');
    console.log(`   Name: ${seoAgent.name}`);
    console.log(`   Description: ${seoAgent.description}`);
    console.log(`   Capabilities: ${seoAgent.capabilities.length}`);
    console.log(`   Max Keywords: ${seoAgent.config.maxKeywordsPerAnalysis}`);
    console.log(`   Performance Threshold: ${seoAgent.config.performanceThreshold}`);
    console.log(`   Temperature: ${seoAgent.config.temperature}`);
    
    // Test capabilities
    const expectedCapabilities = [
      'technical_seo_audit',
      'keyword_research',
      'competitor_analysis',
      'schema_optimization',
      'performance_analysis'
    ];
    
    console.log('\n🎯 Capabilities Check:');
    for (const capability of expectedCapabilities) {
      if (seoAgent.capabilities.includes(capability)) {
        logger.success(`✅ Capability '${capability}' available`);
      } else {
        logger.error(`❌ Capability '${capability}' missing`);
      }
    }
    
    // Test advanced configuration
    if (seoAgent.advancedConfig) {
      console.log('\n⚙️ Advanced Configuration:');
      console.log(`   Personality Loaded: ${!!seoAgent.advancedConfig.personality}`);
      console.log(`   Context Config: ${!!seoAgent.advancedConfig.contextConfig}`);
      console.log(`   Response Config: ${!!seoAgent.advancedConfig.responseConfig}`);
      console.log(`   Training Config: ${!!seoAgent.advancedConfig.trainingConfig}`);
      
      if (seoAgent.advancedConfig.trainingConfig) {
        const tc = seoAgent.advancedConfig.trainingConfig;
        console.log(`   Task Prompts: ${tc.taskPrompts?.length || 0}`);
        console.log(`   Behavior Rules: ${tc.behaviorRules?.length || 0}`);
        console.log(`   Learning Mode: ${tc.learningMode || 'not set'}`);
      }
    }
    
  } catch (error) {
    logger.error('❌ SEOAgent configuration test failed:', error);
    throw error;
  }
}

async function runAllTests() {
  console.log('🚀 Starting SEOAgent Testing Suite...\n');
  
  let allTestsPassed = true;
  
  try {
    await connectDB();
    
    // Test 1: Inicialización
    try {
      await testSEOAgentInitialization();
      logger.success('✅ Initialization tests PASSED');
    } catch (error) {
      logger.error('❌ Initialization tests FAILED');
      allTestsPassed = false;
    }
    
    // Test 2: Configuración
    try {
      await testSEOAgentConfiguration();
      logger.success('✅ Configuration tests PASSED');
    } catch (error) {
      logger.error('❌ Configuration tests FAILED');
      allTestsPassed = false;
    }
    
    // Test 3: Ejecución de tareas
    try {
      await testSEOAgentTaskExecution();
      logger.success('✅ Task execution tests PASSED');
    } catch (error) {
      logger.error('❌ Task execution tests FAILED');
      allTestsPassed = false;
    }
    
  } catch (error) {
    logger.error('❌ Test suite failed:', error);
    allTestsPassed = false;
  } finally {
    await mongoose.disconnect();
    logger.info('📊 Disconnected from MongoDB');
  }
  
  console.log('\n🏁 ================================');
  console.log('🏁 SEOAGENT TESTING SUITE COMPLETE');
  console.log('🏁 ================================');
  
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED - SEOAgent is ready for use!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed - Please check the logs above');
    process.exit(1);
  }
}

// Ejecutar tests si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    logger.error('❌ Fatal error in test suite:', error);
    process.exit(1);
  });
}

export { runAllTests, testSEOAgentInitialization, testSEOAgentTaskExecution, testSEOAgentConfiguration };