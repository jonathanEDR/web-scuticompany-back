import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Page from './models/Page.js';

dotenv.config();

const checkPageData = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar la página home
    const homePage = await Page.findOne({ pageSlug: 'home' });
    
    if (!homePage) {
      console.log('❌ No se encontró la página home');
      process.exit(1);
    }

    console.log('\n📄 DATOS DE LA PÁGINA HOME:');
    console.log('=====================================');
    console.log('\n🚀 HERO SECTION:');
    console.log('  Título:', homePage.content.hero.title);
    console.log('  Imagen de fondo:', homePage.content.hero.backgroundImage || 'No configurada');
    console.log('  Alt de imagen:', homePage.content.hero.backgroundImageAlt || 'No configurado');
    
    console.log('\n💼 SOLUTIONS SECTION:');
    console.log('  Título:', homePage.content.solutions.title);
    console.log('  Imagen de fondo:', homePage.content.solutions.backgroundImage || 'No configurada');
    console.log('  Alt de imagen:', homePage.content.solutions.backgroundImageAlt || 'No configurado');

    console.log('\n📊 OBJETO COMPLETO:');
    console.log(JSON.stringify(homePage.content, null, 2));

    await mongoose.connection.close();
    console.log('\n✅ Conexión cerrada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkPageData();
