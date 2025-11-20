import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './dev-config.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti';

async function listCategories() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const Categoria = mongoose.model('Categoria', new mongoose.Schema({}, { strict: false }), 'categorias');
    
    const categorias = await Categoria.find({}).lean();
    
    console.log(`📊 Total categorías en BD: ${categorias.length}\n`);
    
    categorias.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.nombre}`);
      console.log(`   slug: ${cat.slug || 'N/A'}`);
      console.log(`   descripcion: ${cat.descripcion || 'N/A'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Desconectado');
  }
}

listCategories();
