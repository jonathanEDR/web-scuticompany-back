import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function dropIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    const collection = mongoose.connection.collection('blogcreationsessions');
    
    try {
      await collection.dropIndex('expiresAt_1');
      console.log('✅ Índice expiresAt_1 eliminado correctamente');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  El índice no existe, no hay nada que eliminar');
      } else {
        console.log('⚠️  Error al eliminar índice:', error.message);
      }
    }
    
    await mongoose.connection.close();
    console.log('✅ Conexión cerrada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

dropIndex();
