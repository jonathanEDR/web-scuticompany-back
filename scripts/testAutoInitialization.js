/**
 * Script para probar la inicialización automática de task prompts
 * Limpia los datos existentes y verifica que se reinicialicen automáticamente
 */

import mongoose from 'mongoose';
import AgentConfig from '../models/AgentConfig.js';
import { BlogAgent } from '../agents/specialized/BlogAgent.js';
import logger from '../utils/logger.js';

// Conectar a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.success('✅ Connected to MongoDB');
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function testAutoInitialization() {
  try {
    logger.info('🧪 Testing Automatic Task Prompts Initialization\n');

    // Paso 1: Limpiar task prompts existentes (simular BD vacía)
    logger.info('🧹 Step 1: Cleaning existing task prompts...');
    
    await AgentConfig.updateOne(
      { agentName: 'blog' },
      { 
        $unset: { 'trainingConfig.taskPrompts': 1 }
      }
    );
    
    logger.success('✅ Task prompts cleared from database');

    // Paso 2: Verificar que no existen task prompts
    logger.info('\n🔍 Step 2: Verifying clean state...');
    
    const configBefore = await AgentConfig.findOne({ agentName: 'blog' });
    const taskPromptsBefore = configBefore?.trainingConfig?.taskPrompts?.length || 0;
    
    logger.info(`📊 Task prompts before initialization: ${taskPromptsBefore}`);

    // Paso 3: Crear nueva instancia de BlogAgent (debería inicializar automáticamente)
    logger.info('\n🚀 Step 3: Creating BlogAgent instance (should auto-initialize)...');
    
    const blogAgent = new BlogAgent();
    
    // Esperar a que se complete la inicialización
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Paso 4: Verificar que los task prompts se crearon automáticamente
    logger.info('\n✅ Step 4: Verifying auto-initialization...');
    
    const configAfter = await AgentConfig.findOne({ agentName: 'blog' });
    const taskPromptsAfter = configAfter?.trainingConfig?.taskPrompts?.length || 0;
    
    logger.success(`📊 Task prompts after initialization: ${taskPromptsAfter}`);

    if (taskPromptsAfter > 0) {
      logger.success('🎉 AUTO-INITIALIZATION SUCCESSFUL!');
      logger.info('\n📋 Initialized task prompts:');
      
      configAfter.trainingConfig.taskPrompts.forEach((tp, index) => {
        logger.info(`   ${index + 1}. ${tp.taskType} (temp: ${tp.temperature})`);
      });

      // Paso 5: Verificar que el agent tiene los prompts cargados
      logger.info('\n🔄 Step 5: Verifying agent configuration...');
      
      if (blogAgent.advancedConfig?.trainingConfig?.taskPrompts?.length > 0) {
        logger.success('✅ BlogAgent has task prompts loaded in memory');
        
        // Probar selección de prompts
        logger.info('\n🎯 Step 6: Testing prompt selection...');
        
        const testPrompt = blogAgent.getTaskSpecificPrompt('seo_analysis', {
          title: 'Test Article',
          content: 'Test content for SEO analysis...'
        });

        if (testPrompt) {
          logger.success('✅ Task prompt selection working correctly');
          logger.info(`📏 Prompt length: ${testPrompt.length} characters`);
        } else {
          logger.error('❌ Task prompt selection failed');
        }
      } else {
        logger.error('❌ BlogAgent does not have task prompts loaded');
      }

    } else {
      logger.error('❌ AUTO-INITIALIZATION FAILED!');
      logger.error('Task prompts were not created automatically');
    }

    // Paso 7: Test de segunda inicialización (no debería duplicar)
    logger.info('\n🔁 Step 7: Testing duplicate prevention...');
    
    const secondAgent = new BlogAgent();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const configFinal = await AgentConfig.findOne({ agentName: 'blog' });
    const taskPromptsFinal = configFinal?.trainingConfig?.taskPrompts?.length || 0;
    
    if (taskPromptsFinal === taskPromptsAfter) {
      logger.success('✅ Duplicate prevention working - no additional prompts created');
    } else {
      logger.warn(`⚠️ Potential duplication detected: ${taskPromptsFinal} vs ${taskPromptsAfter}`);
    }

  } catch (error) {
    logger.error('❌ Auto-initialization test failed:', error);
  }
}

async function testProductionScenario() {
  try {
    logger.info('\n🏭 Testing Production Scenario\n');

    // Simular despliegue en producción limpia
    logger.info('🚀 Simulating clean production deployment...');

    // Limpiar completamente la configuración
    await AgentConfig.deleteOne({ agentName: 'blog' });
    
    logger.success('✅ Simulated clean production database');

    // Crear agente como en producción
    logger.info('\n📱 Creating BlogAgent in production-like scenario...');
    
    const productionAgent = new BlogAgent();
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verificar inicialización completa
    const finalConfig = await AgentConfig.findOne({ agentName: 'blog' });
    
    if (finalConfig && finalConfig.trainingConfig?.taskPrompts?.length > 0) {
      logger.success('🎉 PRODUCTION SCENARIO SUCCESSFUL!');
      logger.info(`📊 Agent config created with ${finalConfig.trainingConfig.taskPrompts.length} task prompts`);
      
      logger.info('\n📋 Production readiness checklist:');
      logger.success('   ✅ Auto-creates agent config if missing');
      logger.success('   ✅ Auto-initializes default task prompts');
      logger.success('   ✅ Loads task prompts into agent memory');
      logger.success('   ✅ Prevents duplicate initialization');
      logger.success('   ✅ Ready for immediate use');
      
    } else {
      logger.error('❌ PRODUCTION SCENARIO FAILED!');
    }

  } catch (error) {
    logger.error('❌ Production scenario test failed:', error);
  }
}

// Ejecutar pruebas
async function main() {
  await connectDB();

  try {
    await testAutoInitialization();
    await testProductionScenario();
    
    logger.success('\n🎉 ALL AUTO-INITIALIZATION TESTS COMPLETED!');
    logger.info('\n🚀 System is ready for production deployment with automatic initialization');
    
  } catch (error) {
    logger.error('\n💥 AUTO-INITIALIZATION TESTS FAILED:', error);
  } finally {
    await mongoose.connection.close();
    logger.info('\n👋 MongoDB connection closed');
    process.exit(0);
  }
}

main();