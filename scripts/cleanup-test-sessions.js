import dotenv from 'dotenv';
import mongoose from 'mongoose';
import BlogCreationSession from '../models/BlogCreationSession.js';

dotenv.config();

async function cleanupTestSessions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    // Eliminar sesiones de prueba (las que tienen metadata.startedFrom = 'test')
    const result = await BlogCreationSession.deleteMany({
      'metadata.startedFrom': 'test'
    });
    
    console.log(`🧹 ${result.deletedCount} sesiones de prueba eliminadas\n`);
    
    // Contar sesiones restantes
    const remaining = await BlogCreationSession.countDocuments();
    console.log(`📊 Sesiones restantes: ${remaining}\n`);
    
    await mongoose.connection.close();
    console.log('✅ Limpieza completada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupTestSessions();
