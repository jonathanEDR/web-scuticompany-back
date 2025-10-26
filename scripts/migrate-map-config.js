#!/usr/bin/env node

/**
 * Script de migración para actualizar la configuración del mapa
 * Este script agrega los campos faltantes de customLogo y otras configuraciones del mapa
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Page from '../models/Page.js';

// Cargar variables de entorno
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti';

async function migrateMapConfiguration() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar la página de contacto
    let contactPage = await Page.findOne({ pageSlug: 'contacto' });
    
    if (!contactPage) {
      console.log('❌ No se encontró la página de contacto, creándola...');
      
      // Crear página de contacto con configuración básica
      contactPage = new Page({
        pageSlug: 'contacto',
        pageName: 'Contacto',
        content: {
          contactForm: {
            title: 'Contáctanos',
            subtitle: 'Estamos aquí para ayudarte',
            description: 'Completa el formulario y nos pondremos en contacto contigo lo antes posible.',
            fields: {
              name: {
                enabled: true,
                required: true,
                placeholder: 'Ingresa tu nombre completo'
              },
              phone: {
                enabled: true,
                required: true,
                placeholder: 'Ingresa tu número de celular'
              },
              email: {
                enabled: true,
                required: true,
                placeholder: 'Ingresa tu correo electrónico'
              },
              message: {
                enabled: true,
                required: true,
                placeholder: 'Escribe tu mensaje aquí...'
              }
            },
            button: {
              text: 'Enviar mensaje',
              loadingText: 'Enviando...'
            },
            messages: {
              success: 'Mensaje enviado exitosamente. Te contactaremos pronto.',
              error: 'Error al enviar el mensaje. Inténtalo de nuevo.',
              validation: 'Por favor completa todos los campos requeridos.'
            },
            styles: {
              light: {
                titleColor: '#1f2937',
                subtitleColor: '#4b5563',
                descriptionColor: '#6b7280',
                formBackground: 'rgba(255, 255, 255, 0.95)',
                formBorder: 'rgba(0, 0, 0, 0.1)',
                formShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
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
                formShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                inputBackground: '#1f2937',
                inputBorder: '#374151',
                inputText: '#f9fafb',
                inputPlaceholder: '#6b7280',
                inputFocusBorder: '#A78BFA',
                labelColor: '#e5e7eb',
                buttonBackground: 'linear-gradient(90deg, #A78BFA, #22D3EE)',
                buttonText: '#111827',
                buttonHoverBackground: 'linear-gradient(90deg, #8B5CF6, #06B6D4)',
                successColor: '#34d399',
                errorColor: '#f87171'
              }
            },
            layout: {
              maxWidth: '600px',
              padding: '3rem',
              borderRadius: '1rem',
              gap: '1.5rem'
            },
            backgroundImage: {
              light: '',
              dark: ''
            },
            map: {
              enabled: false,
              googleMapsUrl: '',
              latitude: -12.0464,
              longitude: -77.0428,
              zoom: 15,
              height: '400px',
              companyName: 'Scuti Company S.A.C',
              address: 'calles los molles It-02',
              markerColor: '#ef4444',
              pulseColor: '#ef4444'
            },
            enabled: true
          }
        },
        seo: {
          metaTitle: 'Contacto - Scuti Company',
          metaDescription: 'Contáctanos para conocer más sobre nuestros servicios de desarrollo web y tecnología.',
          keywords: ['contacto', 'desarrollo web', 'scuti company'],
          ogTitle: 'Contacto - Scuti Company',
          ogDescription: 'Contáctanos para conocer más sobre nuestros servicios.',
          ogImage: '',
          twitterCard: 'summary_large_image'
        }
      });
      
      await contactPage.save();
      console.log('✅ Página de contacto creada exitosamente');
    }

    console.log('📋 Página de contacto encontrada');
    console.log('📍 Configuración actual del mapa:', JSON.stringify(contactPage.content.contactForm?.map, null, 2));

    // Verificar si ya tiene la nueva estructura
    if (contactPage.content.contactForm?.map?.customLogo !== undefined) {
      console.log('✅ La configuración del mapa ya está actualizada');
      return;
    }

    // Actualizar la configuración del mapa con los valores por defecto
    const updatedMap = {
      ...contactPage.content.contactForm?.map,
      // Diseño del contenedor
      containerSize: contactPage.content.contactForm?.map?.containerSize || 'medium',
      aspectRatio: contactPage.content.contactForm?.map?.aspectRatio || 'landscape',
      alignment: contactPage.content.contactForm?.map?.alignment || 'center',
      borderRadius: contactPage.content.contactForm?.map?.borderRadius || '8px',
      shadow: contactPage.content.contactForm?.map?.shadow || 'medium',
      
      // Configuración del marcador
      customLogo: contactPage.content.contactForm?.map?.customLogo || '',
      logoSize: contactPage.content.contactForm?.map?.logoSize || 'medium',
      showCompanyName: contactPage.content.contactForm?.map?.showCompanyName !== false,
      
      // Configuración avanzada del marcador
      markerStyle: contactPage.content.contactForm?.map?.markerStyle || 'solid',
      markerBorderWidth: contactPage.content.contactForm?.map?.markerBorderWidth || '2px',
      markerBackground: contactPage.content.contactForm?.map?.markerBackground || '#ffffff',
      markerBorderColor: contactPage.content.contactForm?.map?.markerBorderColor || '#000000',
      
      // Efectos y animaciones
      animationEnabled: contactPage.content.contactForm?.map?.animationEnabled !== false,
      pulseIntensity: contactPage.content.contactForm?.map?.pulseIntensity || 'medium',
      pulseSpeed: contactPage.content.contactForm?.map?.pulseSpeed || 'normal',
      hoverEffect: contactPage.content.contactForm?.map?.hoverEffect || 'glow'
    };

    // Actualizar la página
    await Page.updateOne(
      { pageSlug: 'contacto' },
      { 
        $set: { 
          'content.contactForm.map': updatedMap,
          lastUpdated: new Date(),
          updatedBy: 'migration-script'
        } 
      }
    );

    console.log('✅ Configuración del mapa actualizada exitosamente');
    console.log('📍 Nueva configuración:', JSON.stringify(updatedMap, null, 2));

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar migración
migrateMapConfiguration();