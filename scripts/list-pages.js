import mongoose from 'mongoose';
import Page from '../models/Page.js';
import dotenv from 'dotenv';

dotenv.config();

async function listPages() {
  try {
    console.log('🔍 Listando páginas en la base de datos...');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Buscar todas las páginas
    const pages = await Page.find({}, 'slug title seo.metaTitle');
    
    console.log(`\n📋 Páginas encontradas (${pages.length}):`);
    pages.forEach((page, index) => {
      console.log(`${index + 1}. Slug: "${page.slug}" - Título: "${page.title || page.seo?.metaTitle || 'Sin título'}"`);
    });
    
    if (pages.length === 0) {
      console.log('⚠️  No hay páginas en la base de datos');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar directamente
listPages();