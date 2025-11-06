/**
 * Script de prueba para verificar que el BlogAgent usa la configuración personalizada
 */

import AgentOrchestrator from '../agents/core/AgentOrchestrator.js';
import logger from '../utils/logger.js';

async function testBlogAgentConfiguration() {
  try {
    logger.info('🧪 Testing BlogAgent with personalized configuration...');
    
    // Obtener el BlogAgent del orquestador
    const blogAgent = AgentOrchestrator.agents.get('BlogAgent');
    
    if (!blogAgent) {
      logger.error('❌ BlogAgent not found in orchestrator');
      return;
    }
    
    // Verificar configuración
    logger.info('📋 Current BlogAgent configuration:');
    logger.info(`- Temperature: ${blogAgent.config.temperature}`);
    logger.info(`- Max Tokens: ${blogAgent.config.maxTokens}`);
    logger.info(`- Max Tags: ${blogAgent.config.maxTagsPerPost}`);
    logger.info(`- SEO Threshold: ${blogAgent.config.seoScoreThreshold}`);
    
    if (blogAgent.advancedConfig) {
      logger.info('🎭 Advanced Configuration:');
      logger.info(`- Archetype: ${blogAgent.advancedConfig.personality?.archetype}`);
      logger.info(`- User Expertise: ${blogAgent.advancedConfig.contextConfig?.userExpertise}`);
      logger.info(`- Response Format: ${blogAgent.advancedConfig.responseConfig?.responseFormat}`);
    }
    
    // Probar generación de prompt personalizado
    const testPrompt = 'Analiza este contenido de blog sobre tecnología';
    const personalizedPrompt = blogAgent.buildPersonalizedPrompt(testPrompt, 'content_analysis');
    
    logger.info('🎨 Personalized prompt preview:');
    logger.info('─'.repeat(50));
    logger.info(personalizedPrompt.substring(0, 300) + '...');
    logger.info('─'.repeat(50));
    
    // Probar configuración de OpenAI
    const openaiConfig = blogAgent.getOpenAIConfig();
    logger.info('⚙️ OpenAI Configuration:');
    logger.info(JSON.stringify(openaiConfig, null, 2));
    
    logger.success('✅ BlogAgent configuration test completed successfully!');
    
  } catch (error) {
    logger.error('❌ Error testing BlogAgent configuration:', error);
  }
}

// Ejecutar test
testBlogAgentConfiguration();