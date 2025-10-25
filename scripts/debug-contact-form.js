import mongoose from 'mongoose';
import Page from '../models/Page.js';
import dotenv from 'dotenv';

dotenv.config();

async function debugContactForm() {
  try {
    console.log('🔍 Debugging contactForm data...');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Buscar todas las páginas primero
    const allPages = await Page.find({}, 'slug title');
    console.log('\n📋 Todas las páginas:');
    allPages.forEach((page, index) => {
      console.log(`${index + 1}. Slug: "${page.slug}" - Título: "${page.title}"`);
    });
    
    // Buscar página home
    let homePage = await Page.findOne({ slug: 'home' });
    
    if (!homePage) {
      console.log('\n❌ No se encontró página con slug "home", buscando la primera página...');
      homePage = await Page.findOne({});
      if (homePage) {
        console.log(`📄 Usando página: "${homePage.slug}" - "${homePage.title}"`);
      } else {
        console.log('❌ No se encontró ninguna página');
        return;
      }
    }
    
    console.log('\n📄 Datos de la página home:');
    console.log(`Slug: ${homePage.slug}`);
    console.log(`Tiene contenido: ${!!homePage.content}`);
    console.log(`Tiene contactForm: ${!!homePage.content?.contactForm}`);
    
    if (homePage.content?.contactForm) {
      const cf = homePage.content.contactForm;
      console.log('\n📋 ContactForm encontrado:');
      console.log(`Title: ${cf.title}`);
      console.log(`Subtitle: ${cf.subtitle}`);
      console.log(`Tiene backgroundImage: ${!!cf.backgroundImage}`);
      
      if (cf.backgroundImage) {
        console.log(`Background light: ${cf.backgroundImage.light}`);
        console.log(`Background dark: ${cf.backgroundImage.dark}`);
        console.log(`Background alt: ${cf.backgroundImageAlt}`);
      }
    } else {
      console.log('❌ No se encontró contactForm en la página');
    }
    
    // Test de API endpoint
    console.log('\n🌐 Testing API endpoint...');
    const API_URL = process.env.API_URL || 'http://localhost:5000/api';
    
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${API_URL}/cms/pages/home`);
      const apiData = await response.json();
      
      console.log(`API Response status: ${response.status}`);
      console.log(`API Success: ${apiData.success}`);
      
      if (apiData.success && apiData.data) {
        console.log(`API tiene content: ${!!apiData.data.content}`);
        console.log(`API tiene contactForm: ${!!apiData.data.content?.contactForm}`);
        
        if (apiData.data.content?.contactForm?.backgroundImage) {
          console.log(`API Background light: ${apiData.data.content.contactForm.backgroundImage.light}`);
          console.log(`API Background dark: ${apiData.data.content.contactForm.backgroundImage.dark}`);
        }
      }
    } catch (apiError) {
      console.log(`❌ Error testing API: ${apiError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar directamente
debugContactForm();