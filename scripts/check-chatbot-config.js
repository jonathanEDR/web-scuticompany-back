/**
 * Script de diagnóstico: Verificar configuración del chatbot en MongoDB
 * Uso: node scripts/check-chatbot-config.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../.env') });

// Conectar a MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti';
    await mongoose.connect(mongoURI);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

// Verificar configuración del chatbot
const checkChatbotConfig = async () => {
  try {
    // Buscar la página home sin usar modelo (raw query)
    const db = mongoose.connection.db;
    const pagesCollection = db.collection('pages');
    
    console.log('\n🔍 Buscando página Home...');
    const homePage = await pagesCollection.findOne({ pageSlug: 'home' });
    
    if (!homePage) {
      console.log('❌ Página Home no encontrada');
      return;
    }
    
    console.log('✅ Página Home encontrada');
    console.log('📋 ID:', homePage._id);
    console.log('📅 Última actualización:', homePage.lastUpdated);
    console.log('👤 Actualizado por:', homePage.updatedBy);
    
    console.log('\n🤖 CONFIGURACIÓN DEL CHATBOT:');
    console.log('=====================================');
    
    if (!homePage.content) {
      console.log('❌ No existe campo "content"');
      return;
    }
    
    if (!homePage.content.chatbotConfig) {
      console.log('❌ No existe campo "content.chatbotConfig"');
      console.log('📦 Campos disponibles en content:', Object.keys(homePage.content));
      return;
    }
    
    const chatbotConfig = homePage.content.chatbotConfig;
    
    console.log('✅ chatbotConfig existe');
    console.log('📦 Campos:', Object.keys(chatbotConfig));
    console.log('\n📝 PREGUNTAS SUGERIDAS:');
    console.log('=====================================');
    
    if (!chatbotConfig.suggestedQuestions) {
      console.log('❌ No existe campo "suggestedQuestions"');
    } else if (!Array.isArray(chatbotConfig.suggestedQuestions)) {
      console.log('❌ "suggestedQuestions" no es un array');
      console.log('Tipo:', typeof chatbotConfig.suggestedQuestions);
      console.log('Valor:', chatbotConfig.suggestedQuestions);
    } else {
      console.log(`✅ suggestedQuestions es un array con ${chatbotConfig.suggestedQuestions.length} elementos`);
      
      if (chatbotConfig.suggestedQuestions.length === 0) {
        console.log('⚠️  El array está VACÍO');
      } else {
        console.log('\n📋 Preguntas:');
        chatbotConfig.suggestedQuestions.forEach((q, index) => {
          console.log(`\n${index + 1}. ${q.icon || '❓'} ${q.text || 'Sin texto'}`);
          console.log(`   Mensaje: ${q.message || 'Sin mensaje'}`);
          console.log(`   Campos: ${Object.keys(q).join(', ')}`);
        });
      }
    }
    
    console.log('\n📊 DATOS COMPLETOS DEL CHATBOT CONFIG:');
    console.log('=====================================');
    console.log(JSON.stringify(chatbotConfig, null, 2));
    
  } catch (error) {
    console.error('❌ Error verificando configuración:', error);
  }
};

// Ejecutar
(async () => {
  await connectDB();
  await checkChatbotConfig();
  await mongoose.connection.close();
  console.log('\n✅ Conexión cerrada');
  process.exit(0);
})();
