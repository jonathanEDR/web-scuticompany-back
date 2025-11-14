/**
 * Script para limpiar sesiones vacías (solo con interacciones de tipo status)
 */

import mongoose from 'mongoose';

const GerenteSessionSchema = new mongoose.Schema({}, { strict: false });
const GerenteSession = mongoose.model('GerenteSession', GerenteSessionSchema, 'gerente_sessions');

async function cleanEmptySessions() {
  try {
    await mongoose.connect('mongodb://localhost:27017/web-scuti');
    console.log('✅ Conectado a MongoDB\n');

    // Buscar todas las sesiones
    const allSessions = await GerenteSession.find().lean();
    console.log(`📊 Total de sesiones en BD: ${allSessions.length}`);

    // Identificar sesiones vacías (solo status o sin interacciones)
    const emptySessions = allSessions.filter(session => {
      if (!session.interactions || session.interactions.length === 0) {
        return true; // Sin interacciones
      }
      
      // Ver si TODAS las interacciones son de tipo "status"
      const allStatus = session.interactions.every(i => i.action === 'status');
      return allStatus;
    });

    console.log(`🗑️  Sesiones vacías encontradas: ${emptySessions.length}`);

    if (emptySessions.length > 0) {
      const sessionIds = emptySessions.map(s => s.sessionId);
      
      console.log('\\n❓ ¿Deseas eliminar estas sesiones vacías? (y/n)');
      console.log('   (Presiona Ctrl+C para cancelar)\\n');
      
      // Eliminar las sesiones vacías
      const result = await GerenteSession.deleteMany({
        sessionId: { $in: sessionIds }
      });

      console.log(`\\n✅ ${result.deletedCount} sesiones vacías eliminadas`);
      
      // Verificar sesiones restantes
      const remaining = await GerenteSession.countDocuments();
      console.log(`📊 Sesiones restantes: ${remaining}`);
    } else {
      console.log('\\n✅ No hay sesiones vacías para eliminar');
    }

    await mongoose.disconnect();
    console.log('\\n✅ Desconectado de MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

cleanEmptySessions();
