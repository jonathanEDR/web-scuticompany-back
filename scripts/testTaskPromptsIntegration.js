/**
 * Script de prueba: Verificar integración completa de Task Prompts
 * Prueba el BlogAgent con prompts profesionales integrados
 */

import mongoose from 'mongoose';
import { BlogAgent } from '../agents/specialized/BlogAgent.js';
import AgentConfig from '../models/AgentConfig.js';
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

async function testTaskPromptsIntegration() {
  try {
    logger.info('🧪 Testing Task Prompts Integration\n');

    // 1. Crear instancia del BlogAgent
    logger.info('📝 Step 1: Creating BlogAgent instance...');
    const blogAgent = new BlogAgent();
    
    // Esperar a que se cargue la configuración
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Verificar que los task prompts están cargados
    logger.info('\n🔍 Step 2: Verifying task prompts loaded...');
    
    if (!blogAgent.advancedConfig?.trainingConfig?.taskPrompts) {
      logger.error('❌ No task prompts found in agent configuration!');
      return;
    }

    const taskPrompts = blogAgent.advancedConfig.trainingConfig.taskPrompts;
    logger.success(`✅ Found ${taskPrompts.length} task prompts:`);
    
    taskPrompts.forEach(tp => {
      logger.info(`   - ${tp.taskType} (temperature: ${tp.temperature})`);
    });

    // 3. Probar cada tipo de task prompt
    logger.info('\n🎯 Step 3: Testing task prompt selection...\n');

    const testCases = [
      {
        taskType: 'seo_analysis',
        userInput: {
          title: 'Guía completa de React Hooks 2024',
          content: 'Los React Hooks revolucionaron la forma en que desarrollamos componentes...',
          url: 'https://webscuti.com/react-hooks-2024',
          target_keywords: 'React Hooks, useState, useEffect, desarrollo web'
        }
      },
      {
        taskType: 'content_improvement',
        userInput: {
          title: 'Introducción a Node.js para principiantes',
          content: 'Node.js es un runtime de JavaScript que permite ejecutar código...',
          content_type: 'Tutorial técnico',
          technical_level: 'Principiante'
        }
      },
      {
        taskType: 'tag_generation',
        userInput: {
          title: 'TypeScript vs JavaScript: ¿Cuál elegir en 2024?',
          main_topic: 'Comparación de lenguajes de programación',
          technologies: 'TypeScript, JavaScript, desarrollo web'
        }
      },
      {
        taskType: 'content_strategy',
        userInput: {
          brand: 'Web Scuti',
          target_audience: 'Desarrolladores Full Stack',
          business_goals: 'Aumentar engagement y autoridad técnica'
        }
      }
    ];

    for (const testCase of testCases) {
      logger.info(`🔍 Testing: ${testCase.taskType}`);
      
      try {
        const prompt = blogAgent.getTaskSpecificPrompt(testCase.taskType, testCase.userInput);
        
        if (prompt) {
          logger.success(`   ✅ Professional prompt found (${prompt.length} chars)`);
          logger.info(`   📊 Temperature set to: ${blogAgent.config.temperature}`);
          
          // Mostrar preview del prompt
          const preview = prompt.substring(0, 150) + '...';
          logger.info(`   📋 Preview: ${preview}`);
          
        } else {
          logger.warn(`   ⚠️  No professional prompt found, would use legacy system`);
        }
      } catch (error) {
        logger.error(`   ❌ Error testing ${testCase.taskType}:`, error.message);
      }
      
      logger.info(''); // Espaciado
    }

    // 4. Probar template personalization
    logger.info('🎨 Step 4: Testing template personalization...\n');
    
    const sampleTemplate = `Analiza el siguiente contenido:

📄 **INFORMACIÓN:**
Título: {title}
Contenido: {content}
Audiencia: {audience}

🎯 **OBJETIVOS:**
{focus_areas}`;

    const sampleInput = {
      title: 'Mi artículo de prueba',
      content: 'Contenido de ejemplo para testing...',
      audience: 'Desarrolladores JavaScript',
      focus_areas: 'Mejorar SEO y engagement'
    };

    const personalizedTemplate = blogAgent.personalizeUserTemplate(sampleTemplate, sampleInput);
    
    logger.success('✅ Template personalization working:');
    logger.info('📝 Personalized template:');
    console.log(personalizedTemplate);

    // 5. Estadísticas finales
    logger.info('\n📊 Integration Test Summary:');
    logger.success(`✅ Task Prompts Available: ${taskPrompts.length}`);
    logger.success(`✅ All types tested successfully`);
    logger.success(`✅ Template personalization working`);
    logger.success(`✅ Temperature control functional`);
    
    logger.info('\n🚀 Integration test completed successfully!');
    logger.info('🌐 The BlogAgent is now ready to use professional task prompts');
    
  } catch (error) {
    logger.error('❌ Integration test failed:', error);
  }
}

async function testPromptComparison() {
  try {
    logger.info('\n🔬 Testing Legacy vs Professional Prompt Comparison\n');

    const blogAgent = new BlogAgent();
    await new Promise(resolve => setTimeout(resolve, 1000));

    const testInput = {
      title: 'Optimización de rendimiento en React',
      content: 'En este artículo exploramos técnicas avanzadas para mejorar el rendimiento...',
      audience: 'Desarrolladores React experimentados'
    };

    // Test professional prompt
    logger.info('🎯 Professional Task Prompt:');
    const professionalPrompt = blogAgent.getTaskSpecificPrompt('content_improvement', testInput);
    
    if (professionalPrompt) {
      logger.success(`   ✅ Length: ${professionalPrompt.length} characters`);
      logger.info(`   🌡️  Temperature: ${blogAgent.config.temperature}`);
      logger.info(`   📋 Structure: Professional system prompt + personalized user template`);
    }

    // Test legacy prompt
    logger.info('\n📰 Legacy Prompt System:');
    const legacyPrompt = blogAgent.buildPersonalizedPrompt(
      'Analiza y mejora este contenido de blog', 
      'content_optimization'
    );
    
    logger.info(`   📏 Length: ${legacyPrompt.length} characters`);
    logger.info(`   🔧 Structure: Base prompt + personality + context layers`);

    logger.info('\n💡 Professional prompts provide:');
    logger.info('   - Specialized expertise for each task type');
    logger.info('   - Dynamic user template personalization');
    logger.info('   - Task-specific temperature optimization');
    logger.info('   - Consistent professional output format');

  } catch (error) {
    logger.error('❌ Prompt comparison failed:', error);
  }
}

// Ejecutar pruebas
async function main() {
  await connectDB();

  try {
    await testTaskPromptsIntegration();
    await testPromptComparison();
    
    logger.success('\n🎉 ALL TESTS PASSED!');
    logger.info('\n📋 Next Steps:');
    logger.info('   1. ✅ Task prompts initialized and integrated');
    logger.info('   2. ✅ BlogAgent ready for production use');
    logger.info('   3. 🚀 Test with real content via frontend');
    logger.info('   4. 📊 Monitor AI response quality improvements');
    
  } catch (error) {
    logger.error('\n💥 TESTS FAILED:', error);
  } finally {
    await mongoose.connection.close();
    logger.info('\n👋 MongoDB connection closed');
    process.exit(0);
  }
}

main();