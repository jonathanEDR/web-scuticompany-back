import mongoose from 'mongoose';
import Page from '../models/Page.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixSlug() {
  try {
    console.log('🔧 Arreglando slug de la página...');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Buscar la página con slug undefined y actualizarla
    const result = await Page.updateOne(
      { 
        $or: [
          { slug: { $exists: false } },
          { slug: null },
          { slug: 'undefined' },
          { slug: '' }
        ]
      },
      { slug: 'home' }
    );
    
    console.log(`📄 Páginas actualizadas: ${result.modifiedCount}`);
    
    // Verificar
    const homePage = await Page.findOne({ slug: 'home' });
    if (homePage) {
      console.log('✅ Página home encontrada correctamente');
      console.log(`Título: ${homePage.seo?.metaTitle || 'Sin título'}`);
      console.log(`Tiene contactForm: ${!!homePage.content?.contactForm}`);
    } else {
      console.log('❌ Aún no se encuentra la página home');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar directamente
fixSlug();