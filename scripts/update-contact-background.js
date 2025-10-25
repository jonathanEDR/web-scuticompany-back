import mongoose from 'mongoose';
import Page from '../models/Page.js';
import dotenv from 'dotenv';

dotenv.config();

async function updateContactBackground() {
  try {
    console.log('🔍 Actualizando imagen de fondo del formulario de contacto...');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Buscar página home
    const homePage = await Page.findOne({ slug: 'home' });
    
    if (!homePage) {
      console.log('❌ No se encontró la página home');
      return;
    }
    
    // Actualizar solo la imagen de fondo
    homePage.content.contactForm.backgroundImage = {
      light: '/12.webp',
      dark: '/4.webp'
    };
    homePage.content.contactForm.backgroundImageAlt = 'Fondo de contacto Scuti Company';
    
    await homePage.save();
    console.log('✅ Imagen de fondo actualizada');
    
    console.log('\n📋 Nueva configuración de imagen:');
    console.log(`Imagen tema claro: ${homePage.content.contactForm.backgroundImage.light}`);
    console.log(`Imagen tema oscuro: ${homePage.content.contactForm.backgroundImage.dark}`);
    console.log(`Alt text: ${homePage.content.contactForm.backgroundImageAlt}`);
    
    console.log('\n🎯 Prueba el formulario en:');
    console.log('   👉 http://localhost:5173 (página principal)');
    console.log('   👉 http://localhost:5173/dashboard/cms/contact (editor CMS)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar directamente
updateContactBackground();