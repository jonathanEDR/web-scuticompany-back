import mongoose from 'mongoose';
import Page from '../models/Page.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixHomePageAndAddBackground() {
  try {
    console.log('🔧 Reparando página home y agregando imagen de fondo...');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Buscar la página sin slug o con slug undefined
    let homePage = await Page.findOne({ 
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: 'undefined' },
        { slug: '' }
      ]
    });
    
    if (!homePage) {
      // Si no existe ninguna página, buscar cualquier página
      homePage = await Page.findOne({});
    }
    
    if (!homePage) {
      console.log('❌ No se encontró ninguna página');
      return;
    }
    
    console.log(`📄 Página encontrada: ${homePage.seo?.metaTitle || 'Sin título'}`);
    
    // Actualizar slug a 'home'
    homePage.slug = 'home';
    
    // Inicializar contactForm si no existe
    if (!homePage.content) {
      homePage.content = {};
    }
    
    if (!homePage.content.contactForm) {
      homePage.content.contactForm = {};
    }
    
    // Agregar configuración completa del formulario de contacto
    homePage.content.contactForm = {
      ...homePage.content.contactForm,
      title: 'Contáctanos',
      subtitle: 'Estamos aquí para ayudarte',
      description: '¿Tienes un proyecto en mente? Cuéntanos sobre él y te responderemos pronto.',
      
      // Campos del formulario
      fields: {
        nombreLabel: 'Nombre completo',
        nombrePlaceholder: 'Ingresa tu nombre completo',
        nombreRequired: true,
        
        celularLabel: 'Número de celular',
        celularPlaceholder: 'Ingresa tu número de celular',
        celularRequired: true,
        
        correoLabel: 'Correo electrónico',
        correoPlaceholder: 'Ingresa tu correo electrónico',
        correoRequired: true,
        
        mensajeLabel: 'Mensaje',
        mensajePlaceholder: 'Escribe tu mensaje aquí...',
        mensajeRequired: true,
        mensajeRows: 5,
        
        termsText: 'Al enviar este formulario, acepto los términos y condiciones de privacidad.',
        termsLink: '/terminos',
        termsRequired: true
      },
      
      // Botón
      button: {
        text: 'Enviar mensaje',
        loadingText: 'Enviando...'
      },
      
      // Mensajes
      messages: {
        success: '¡Mensaje enviado exitosamente! Nos pondremos en contacto contigo pronto.',
        error: 'Error al enviar el mensaje. Por favor, inténtalo nuevamente.'
      },
      
      // IMAGEN DE FONDO - NUEVA CARACTERÍSTICA
      backgroundImage: {
        light: '/12.webp',
        dark: '/4.webp'
      },
      backgroundImageAlt: 'Fondo de contacto Scuti Company',
      
      // Estilos
      styles: {
        light: {
          titleColor: '#1f2937',
          subtitleColor: '#6b7280',
          descriptionColor: '#4b5563',
          formBackground: 'rgba(255, 255, 255, 0.95)',
          formBorder: 'rgba(0, 0, 0, 0.1)',
          formShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          inputBackground: '#ffffff',
          inputBorder: '#e5e7eb',
          inputText: '#1f2937',
          inputPlaceholder: '#9ca3af',
          inputFocusBorder: '#8B5CF6',
          labelColor: '#374151',
          buttonBackground: 'linear-gradient(90deg, #8B5CF6, #06B6D4)',
          buttonText: '#ffffff',
          buttonHoverBackground: 'linear-gradient(90deg, #7C3AED, #0891B2)',
          successColor: '#10b981',
          errorColor: '#ef4444'
        },
        dark: {
          titleColor: '#f9fafb',
          subtitleColor: '#d1d5db',
          descriptionColor: '#9ca3af',
          formBackground: 'rgba(31, 41, 55, 0.95)',
          formBorder: 'rgba(255, 255, 255, 0.1)',
          formShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          inputBackground: '#374151',
          inputBorder: '#4b5563',
          inputText: '#f9fafb',
          inputPlaceholder: '#6b7280',
          inputFocusBorder: '#8B5CF6',
          labelColor: '#e5e7eb',
          buttonBackground: 'linear-gradient(90deg, #8B5CF6, #06B6D4)',
          buttonText: '#ffffff',
          buttonHoverBackground: 'linear-gradient(90deg, #7C3AED, #0891B2)',
          successColor: '#10b981',
          errorColor: '#ef4444'
        }
      },
      
      // Layout
      layout: {
        maxWidth: '600px',
        padding: '2rem',
        borderRadius: '1rem',
        gap: '1.5rem'
      },
      
      enabled: true
    };
    
    await homePage.save();
    console.log('✅ Página home reparada y formulario actualizado');
    
    console.log('\n📋 Configuración del formulario:');
    console.log(`Slug: ${homePage.slug}`);
    console.log(`Título: ${homePage.content.contactForm.title}`);
    console.log(`Subtítulo: ${homePage.content.contactForm.subtitle}`);
    console.log(`Imagen fondo claro: ${homePage.content.contactForm.backgroundImage.light}`);
    console.log(`Imagen fondo oscuro: ${homePage.content.contactForm.backgroundImage.dark}`);
    console.log(`Alt text: ${homePage.content.contactForm.backgroundImageAlt}`);
    
    console.log('\n🎯 Prueba ahora:');
    console.log('   👉 http://localhost:5173 (página principal con fondo)');
    console.log('   👉 http://localhost:5173/dashboard/cms/contact (editor CMS)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar directamente
fixHomePageAndAddBackground();