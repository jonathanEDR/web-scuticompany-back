/**
 * 🔧 Script para crear el documento 'services' en MongoDB
 * Este script crea la página de servicios con la estructura CORRECTA
 * (Solo hero, sin solutions, valueAdded ni clientLogos)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const servicesPage = {
  pageSlug: 'services',
  pageName: 'Servicios',
  content: {
    hero: {
      title: 'Nuestros Servicios',
      subtitle: 'Soluciones digitales de vanguardia diseñadas para impulsar tu negocio hacia el éxito',
      description: 'Descubre nuestras soluciones tecnológicas diseñadas para transformar tu empresa y potenciar su crecimiento.',
      ctaText: 'Ver Servicios',
      ctaLink: '/servicios',
      backgroundImage: {
        light: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200',
        dark: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200'
      },
      backgroundImageAlt: 'Servicios profesionales de tecnología',
      styles: {
        light: {
          titleColor: '#1e293b',
          subtitleColor: '#64748b',
          descriptionColor: '#475569'
        },
        dark: {
          titleColor: '#f8fafc',
          subtitleColor: '#cbd5e1',
          descriptionColor: '#94a3b8'
        }
      }
    }
    // ✅ NO incluye solutions, valueAdded, clientLogos
  },
  seo: {
    metaTitle: 'Nuestros Servicios - SCUTI Company',
    metaDescription: 'Consultoría IT, Proyectos Tecnológicos e Inteligencia Artificial para impulsar tu negocio',
    keywords: ['servicios', 'consultoría', 'tecnología', 'software', 'inteligencia artificial'],
    ogTitle: 'Servicios - SCUTI Company',
    ogDescription: 'Descubre nuestras soluciones tecnológicas diseñadas para transformar tu empresa',
    ogImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200',
    twitterCard: 'summary_large_image'
  },
  theme: {
    default: 'dark',
    lightMode: {
      primary: '#8b5cf6',
      secondary: '#06b6d4',
      background: '#ffffff',
      text: '#1e293b',
      textSecondary: '#64748b',
      cardBg: '#f8fafc',
      border: '#e2e8f0',
      buttons: {
        ctaPrimary: { text: 'Comenzar Ahora', background: 'linear-gradient(90deg, #8B5CF6, #06B6D4, #8B5CF6)', textColor: '#FFFFFF', borderColor: 'transparent' },
        contact: { text: 'Contactar', background: 'transparent', textColor: '#8B5CF6', borderColor: 'linear-gradient(90deg, #8B5CF6, #06B6D4)' },
        dashboard: { text: 'Dashboard', background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)', textColor: '#FFFFFF', borderColor: 'transparent' }
      }
    },
    darkMode: {
      primary: '#a78bfa',
      secondary: '#22d3ee',
      background: '#0f172a',
      text: '#f8fafc',
      textSecondary: '#cbd5e1',
      cardBg: '#1e293b',
      border: '#334155',
      buttons: {
        ctaPrimary: { text: 'Comenzar Ahora', background: 'linear-gradient(90deg, #A78BFA, #22D3EE, #A78BFA)', textColor: '#111827', borderColor: 'transparent' },
        contact: { text: 'Contactar', background: 'transparent', textColor: '#A78BFA', borderColor: 'linear-gradient(90deg, #A78BFA, #22D3EE)' },
        dashboard: { text: 'Dashboard', background: 'linear-gradient(90deg, #A78BFA, #22D3EE)', textColor: '#111827', borderColor: 'transparent' }
      }
    }
  },
  isPublished: true,
  lastUpdated: new Date(),
  updatedBy: 'admin'
};

async function createServicesPage() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scuti_company');
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    
    // Verificar si ya existe
    const existing = await db.collection('pages').findOne({ pageSlug: 'services' });
    
    if (existing) {
      console.log('⚠️ Documento services ya existe, actualizando...');
      await db.collection('pages').updateOne(
        { pageSlug: 'services' },
        { $set: servicesPage }
      );
      console.log('✅ Documento services actualizado');
    } else {
      await db.collection('pages').insertOne(servicesPage);
      console.log('✅ Documento services creado exitosamente');
    }
    
    // Verificar resultado
    const doc = await db.collection('pages').findOne({ pageSlug: 'services' });
    console.log('');
    console.log('=== VERIFICACIÓN DE ESTRUCTURA ===');
    console.log('pageSlug:', doc.pageSlug);
    console.log('pageName:', doc.pageName);
    console.log('content keys:', Object.keys(doc.content));
    console.log('');
    console.log('Tiene solutions?', doc.content.solutions ? '❌ SÍ (ERROR)' : '✅ NO (CORRECTO)');
    console.log('Tiene valueAdded?', doc.content.valueAdded ? '❌ SÍ (ERROR)' : '✅ NO (CORRECTO)');
    console.log('Tiene clientLogos?', doc.content.clientLogos ? '❌ SÍ (ERROR)' : '✅ NO (CORRECTO)');
    console.log('Tiene hero?', doc.content.hero ? '✅ SÍ (CORRECTO)' : '❌ NO (ERROR)');
    console.log('');
    console.log('🎉 Script completado exitosamente');
    
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createServicesPage();
