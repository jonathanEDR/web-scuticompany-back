/**
 * Script de migración: Actualizar configuración del chatbot en producción
 * 
 * Este script actualiza la página home en la base de datos de producción
 * con las preguntas sugeridas y configuración completa del chatbot.
 * 
 * Uso:
 *   node scripts/update-chatbot-config.js
 * 
 * O desde package.json:
 *   npm run update:chatbot-config
 */

import mongoose from 'mongoose';
import Page from '../models/Page.js';
import 'dotenv/config';

const CHATBOT_CONFIG = {
  enabled: true,
  botName: 'Asesor de Ventas',
  statusText: 'En línea • Respuesta inmediata',
  logo: {
    light: '',
    dark: ''
  },
  logoAlt: 'Asesor Virtual',
  welcomeMessage: {
    title: '¡Hola! Soy tu Asesor Virtual 👋',
    description: 'Estoy aquí para ayudarte con información sobre nuestros servicios, precios y cotizaciones.'
  },
  suggestedQuestions: [
    {
      icon: '💼',
      text: '¿Qué servicios ofrecen?',
      message: '¿Qué servicios ofrecen?'
    },
    {
      icon: '💰',
      text: 'Solicitar cotización',
      message: 'Quiero solicitar una cotización'
    },
    {
      icon: '📋',
      text: 'Ver precios y planes',
      message: '¿Cuáles son sus precios y planes?'
    },
    {
      icon: '📞',
      text: 'Información de contacto',
      message: '¿Cómo puedo contactarlos?'
    }
  ],
  headerStyles: {
    light: {
      background: 'linear-gradient(to right, #EFF6FF, #F5F3FF)',
      titleColor: '#111827',
      subtitleColor: '#6B7280',
      logoBackground: 'linear-gradient(to bottom right, #3B82F6, #8B5CF6)'
    },
    dark: {
      background: 'linear-gradient(to right, #1F2937, #1F2937)',
      titleColor: '#FFFFFF',
      subtitleColor: '#9CA3AF',
      logoBackground: 'linear-gradient(to bottom right, #3B82F6, #8B5CF6)'
    }
  },
  buttonStyles: {
    size: 'medium',
    position: {
      bottom: '24px',
      right: '24px'
    },
    gradient: {
      from: '#3B82F6',
      to: '#8B5CF6'
    },
    shape: 'circle',
    icon: {
      light: '',
      dark: ''
    }
  },
  behavior: {
    autoOpen: false,
    autoOpenDelay: 5000,
    showUnreadBadge: true,
    showPoweredBy: true
  }
};

async function updateChatbotConfig() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti';
    await mongoose.connect(mongoURI);
    
    console.log('✅ Conectado a MongoDB');
    console.log(`📊 Base de datos: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}\n`);

    // Buscar la página home
    console.log('🔍 Buscando página home...');
    const homePage = await Page.findOne({ pageSlug: 'home' });

    if (!homePage) {
      console.error('❌ No se encontró la página home');
      console.error('   Asegúrate de que la base de datos esté inicializada');
      process.exit(1);
    }

    console.log('✅ Página home encontrada');
    console.log(`   ID: ${homePage._id}`);
    console.log(`   Última actualización: ${homePage.lastUpdated || 'N/A'}\n`);

    // Verificar estado actual
    const hasCurrentConfig = !!homePage.chatbotConfig;
    const hasQuestions = homePage.chatbotConfig?.suggestedQuestions?.length > 0;

    console.log('📋 Estado actual:');
    console.log(`   - Tiene configuración de chatbot: ${hasCurrentConfig ? '✅' : '❌'}`);
    console.log(`   - Tiene preguntas sugeridas: ${hasQuestions ? `✅ (${homePage.chatbotConfig.suggestedQuestions.length})` : '❌'}\n`);

    // Actualizar configuración
    console.log('🚀 Actualizando configuración del chatbot...');
    
    homePage.chatbotConfig = CHATBOT_CONFIG;
    homePage.lastUpdated = new Date();
    homePage.updatedBy = 'migration-script';

    await homePage.save();

    console.log('✅ Configuración actualizada exitosamente\n');

    // Verificar actualización
    const updatedPage = await Page.findOne({ pageSlug: 'home' });
    const newQuestionsCount = updatedPage.chatbotConfig?.suggestedQuestions?.length || 0;

    console.log('📊 Verificación post-actualización:');
    console.log(`   - Preguntas sugeridas: ${newQuestionsCount}`);
    console.log(`   - Chatbot habilitado: ${updatedPage.chatbotConfig?.enabled ? '✅' : '❌'}`);
    console.log(`   - Nombre del bot: ${updatedPage.chatbotConfig?.botName}`);
    
    if (newQuestionsCount > 0) {
      console.log('\n📝 Preguntas configuradas:');
      updatedPage.chatbotConfig.suggestedQuestions.forEach((q, i) => {
        console.log(`   ${i + 1}. ${q.icon} ${q.text}`);
      });
    }

    console.log('\n✅ Migración completada exitosamente');
    console.log('🎉 El chatbot ahora mostrará las preguntas sugeridas en producción\n');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    console.error('\nDetalles del error:');
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar script
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  🤖 ACTUALIZACIÓN DE CONFIGURACIÓN DEL CHATBOT         ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

updateChatbotConfig().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
