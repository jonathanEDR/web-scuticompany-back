/**
 * Script para limpiar caché del sistema de memoria inteligente
 * Ejecutar después de cambiar prompts para forzar regeneración
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './dev-config.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti';

async function clearCache() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Limpiar patrones de interacción cacheados
    const InteractionPattern = mongoose.model('InteractionPattern', new mongoose.Schema({}, { strict: false }), 'interaction_patterns');
    
    const deletedPatterns = await InteractionPattern.deleteMany({
      'context.agentType': { $in: ['ServicesAgent', 'Asesor de Ventas SCUTI'] }
    });
    
    console.log(`🗑️  Patrones eliminados: ${deletedPatterns.deletedCount}`);

    // Limpiar preferencias de usuario relacionadas con ventas
    const UserPreference = mongoose.model('UserPreference', new mongoose.Schema({}, { strict: false }), 'user_preferences');
    
    const deletedPrefs = await UserPreference.deleteMany({
      agent_type: { $in: ['ServicesAgent', 'Asesor de Ventas SCUTI'] }
    });
    
    console.log(`🗑️  Preferencias eliminadas: ${deletedPrefs.deletedCount}`);

    // Limpiar interacciones AI cacheadas
    const AIInteraction = mongoose.model('AIInteraction', new mongoose.Schema({}, { strict: false }), 'ai_interactions');
    
    const deletedInteractions = await AIInteraction.deleteMany({
      agent_id: { $regex: /asesor.*ventas|servicesagent/i }
    });
    
    console.log(`🗑️  Interacciones AI eliminadas: ${deletedInteractions.deletedCount}`);

    console.log('\n✅ Caché limpiado exitosamente');
    console.log('🔄 Por favor reinicia el servidor backend');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Desconectado');
  }
}

clearCache();
