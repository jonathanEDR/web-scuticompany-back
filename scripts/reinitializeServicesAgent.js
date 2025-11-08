/**
 * Script para reinicializar la configuración de ServicesAgent
 * Ejecutar con: node backend/scripts/reinitializeServicesAgent.js
 */

import mongoose from 'mongoose';
import AgentConfig from '../models/AgentConfig.js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/webscuti';

async function reinitializeServicesAgent() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    console.log('\n🗑️  Eliminando configuración anterior de ServicesAgent...');
    await AgentConfig.deleteOne({ agentName: 'services' });
    console.log('✅ Configuración anterior eliminada');

    console.log('\n🚀 Reinicializando ServicesAgent con datos de entrenamiento...');
    await AgentConfig.initializeDefaults();
    console.log('✅ ServicesAgent reinicializado');

    console.log('\n📊 Verificando configuración...');
    const config = await AgentConfig.findOne({ agentName: 'services' });
    
    if (config) {
      console.log('✅ Configuración de ServicesAgent encontrada:');
      console.log(`   - Habilitado: ${config.enabled}`);
      console.log(`   - Ejemplos de entrenamiento: ${config.trainingConfig?.examples?.length || 0}`);
      console.log(`   - Prompts de tareas: ${config.trainingConfig?.taskPrompts?.length || 0}`);
      console.log(`   - Reglas de comportamiento: ${config.trainingConfig?.behaviorRules?.length || 0}`);
      console.log(`   - Modo de aprendizaje: ${config.trainingConfig?.learningMode || 'N/A'}`);
      
      if (config.trainingConfig?.examples?.length > 0) {
        console.log('\n📚 Ejemplos de entrenamiento cargados:');
        config.trainingConfig.examples.forEach((ex, idx) => {
          console.log(`   ${idx + 1}. [${ex.category}] ${ex.id}`);
        });
      }
      
      if (config.trainingConfig?.taskPrompts?.length > 0) {
        console.log('\n🎯 Prompts de tareas cargados:');
        config.trainingConfig.taskPrompts.forEach((prompt, idx) => {
          console.log(`   ${idx + 1}. ${prompt.taskType}`);
        });
      }
      
      console.log('\n✨ ServicesAgent está listo para usar!');
    } else {
      console.log('❌ No se pudo encontrar la configuración de ServicesAgent');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

reinitializeServicesAgent();
