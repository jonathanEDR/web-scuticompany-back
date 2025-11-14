/**
 * Script para inspeccionar sesiones en MongoDB
 */

import mongoose from 'mongoose';

// Schema flexible
const GerenteSessionSchema = new mongoose.Schema({}, { strict: false });
const GerenteSession = mongoose.model('GerenteSession', GerenteSessionSchema, 'gerente_sessions');

async function checkSessions() {
  try {
    await mongoose.connect('mongodb://localhost:27017/web-scuti');
    console.log('✅ Conectado a MongoDB');

    const count = await GerenteSession.countDocuments();
    console.log(`\n📊 Total de sesiones: ${count}`);

    const sessions = await GerenteSession.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    console.log('\n=== ÚLTIMAS 3 SESIONES ===\n');

    sessions.forEach((session, index) => {
      console.log(`--- Sesión ${index + 1} ---`);
      console.log('SessionId:', session.sessionId);
      console.log('UserId:', session.userId);
      console.log('CreatedAt:', session.createdAt);
      console.log('Status:', session.status);
      console.log('Interactions:', session.interactions?.length || 0);
      
      if (session.interactions && session.interactions.length > 0) {
        console.log('\n📝 Primera interacción:');
        const interaction = session.interactions[0];
        console.log('  - Agent:', interaction.agent);
        console.log('  - Action:', interaction.action);
        console.log('  - Timestamp:', interaction.timestamp);
        console.log('  - Input keys:', Object.keys(interaction.input || {}));
        console.log('  - Result keys:', Object.keys(interaction.result || {}));
        console.log('\n  Input completo:', JSON.stringify(interaction.input, null, 2));
        console.log('\n  Result completo:', JSON.stringify(interaction.result, null, 2));
      }
      console.log('\n');
    });

    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSessions();
