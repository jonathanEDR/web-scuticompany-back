import mongoose from 'mongoose';
import Page from '../models/Page.js';
import dotenv from 'dotenv';

dotenv.config();

async function initializeContactForm() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar o crear la página home
    let homePage = await Page.findOne({ slug: 'home' });
    
    if (!homePage) {
      console.log('📄 Creando página home...');
      homePage = new Page({
        title: 'Página Principal',
        slug: 'home',
        content: {}
      });
    }

    // Inicializar sección contactForm si no existe
    if (!homePage.content.contactForm) {
      console.log('📝 Inicializando configuración del formulario de contacto...');
      
      homePage.content.contactForm = {
        // Textos principales
        title: 'Contáctanos',
        subtitle: 'Escríbenos',
        description: 'Déjanos tus datos y nos pondremos en contacto contigo para brindarte la mejor asesoría.',
        
        // Configuración de campos del formulario
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
        
        // Configuración del botón
        button: {
          text: 'Enviar mensaje',
          loadingText: 'Enviando...'
        },
        
        // Mensajes de respuesta
        messages: {
          success: '¡Mensaje enviado exitosamente! Nos pondremos en contacto contigo pronto.',
          error: 'Error al enviar el mensaje. Por favor, inténtalo nuevamente.'
        },
        
        // Imagen de fondo por tema
        backgroundImage: {
          light: '/12.webp',
          dark: '/4.webp'
        },
        backgroundImageAlt: 'Fondo de contacto Scuti Company',
        
        // Configuración de estilos
        styles: {
          light: {
            titleColor: '#1f2937',
            subtitleColor: '#6b7280',
            descriptionColor: '#4b5563',
            formBackground: '#ffffff',
            formBorder: '#e5e7eb',
            formShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
            inputBackground: '#ffffff',
            inputBorder: '#d1d5db',
            inputFocus: '#8b5cf6',
            labelColor: '#374151',
            buttonBackground: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            buttonText: '#ffffff',
            buttonHover: 'linear-gradient(135deg, #7c3aed, #0891b2)'
          },
          dark: {
            titleColor: '#f9fafb',
            subtitleColor: '#d1d5db',
            descriptionColor: '#9ca3af',
            formBackground: '#1f2937',
            formBorder: '#374151',
            formShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.25)',
            inputBackground: '#374151',
            inputBorder: '#4b5563',
            inputFocus: '#8b5cf6',
            labelColor: '#e5e7eb',
            buttonBackground: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            buttonText: '#ffffff',
            buttonHover: 'linear-gradient(135deg, #7c3aed, #0891b2)'
          }
        }
      };
      
      await homePage.save();
      console.log('✅ Formulario de contacto inicializado en página home');
    } else {
      console.log('ℹ️ La configuración del formulario de contacto ya existe');
    }

    // Mostrar configuración actual
    console.log('\n📋 Configuración actual del formulario:');
    console.log(`Título: ${homePage.content.contactForm.title}`);
    console.log(`Subtítulo: ${homePage.content.contactForm.subtitle}`);
    console.log(`Descripción: ${homePage.content.contactForm.description}`);
    console.log(`Botón: ${homePage.content.contactForm.button.text}`);
    console.log(`Campos configurados: ${Object.keys(homePage.content.contactForm.fields).length}`);

    console.log('\n🎯 Puedes personalizar el formulario desde el CMS:');
    console.log('   👉 http://localhost:5173/dashboard/cms/contact');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar directamente
initializeContactForm();