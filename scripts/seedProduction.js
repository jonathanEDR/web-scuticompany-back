import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Page from '../models/Page.js';

// Cargar variables de entorno
dotenv.config();

// Usar la URI de producción o la proporcionada como argumento
const MONGODB_URI = process.env.MONGODB_URI_PRODUCTION || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI no está definida');
  console.log('💡 Uso: MONGODB_URI="tu_connection_string" node seedProduction.js');
  process.exit(1);
}

const homePageData = {
  pageSlug: 'home',
  pageName: 'Página Principal',
  content: {
    hero: {
      title: 'Transformamos tu empresa con tecnología inteligente',
      subtitle: 'Innovamos para que tu empresa avance al ritmo de la tecnología.',
      description: 'Transformamos procesos con soluciones digitales, proyectos de software y modelos de IA personalizados.',
      ctaText: 'Conoce nuestros servicios',
      ctaLink: '#servicios',
      backgroundImage: {
        light: '',
        dark: ''
      },
      backgroundImageAlt: 'Hero background',
      styles: {
        light: {
          titleColor: '',
          subtitleColor: '',
          descriptionColor: ''
        },
        dark: {
          titleColor: '',
          subtitleColor: '',
          descriptionColor: ''
        }
      }
    },
    solutions: {
      title: 'Soluciones',
      description: 'En el dinámico entorno empresarial de hoy, la tecnología es la columna vertebral del éxito. Impulsa la innovación, seguridad y el crecimiento de tu negocio.',
      backgroundImage: {
        light: '',
        dark: ''
      },
      backgroundImageAlt: 'Solutions background',
      styles: {
        light: {
          titleColor: '',
          descriptionColor: ''
        },
        dark: {
          titleColor: '',
          descriptionColor: ''
        }
      },
      cardsDesign: {
        light: {
          background: 'rgba(249, 250, 251, 0.8)',
          border: '#E5E7EB',
          shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          hoverBackground: 'rgba(255, 255, 255, 1)',
          hoverBorder: '#8B5CF6',
          hoverShadow: '0 20px 25px -5px rgba(139, 92, 246, 0.2)',
          iconGradientBorder: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
          iconBackground: '#FFFFFF',
          iconColor: '#8B5CF6',
          titleColor: '#1F2937',
          descriptionColor: '#6B7280',
          linkColor: '#8B5CF6'
        },
        dark: {
          background: 'rgba(31, 41, 55, 0.8)',
          border: '#374151',
          shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          hoverBackground: 'rgba(55, 65, 81, 1)',
          hoverBorder: '#A78BFA',
          hoverShadow: '0 20px 25px -5px rgba(167, 139, 250, 0.3)',
          iconGradientBorder: 'linear-gradient(135deg, #A78BFA 0%, #22D3EE 100%)',
          iconBackground: '#1F2937',
          iconColor: '#A78BFA',
          titleColor: '#F9FAFB',
          descriptionColor: '#D1D5DB',
          linkColor: '#A78BFA'
        }
      },
      items: [
        {
          icon: '💻',
          title: 'Soluciones Digitales',
          description: 'Transformamos tu negocio con estrategias digitales innovadoras y plataformas web de alto rendimiento.',
          gradient: 'from-purple-500 to-purple-700'
        },
        {
          icon: '⚙️',
          title: 'Proyectos de Software',
          description: 'Desarrollamos software a medida con las últimas tecnologías para optimizar tus procesos empresariales.',
          gradient: 'from-cyan-500 to-cyan-700'
        },
        {
          icon: '🤖',
          title: 'Modelos de IA',
          description: 'Implementamos inteligencia artificial personalizada para automatizar y potenciar tu empresa.',
          gradient: 'from-amber-500 to-amber-700'
        }
      ]
    },
    sections: []
  },
  seo: {
    metaTitle: 'Scuti Company - Transformación Digital Empresarial',
    metaDescription: 'Transformamos empresas con tecnología inteligente. Soluciones digitales, desarrollo de software y modelos de IA personalizados.',
    keywords: ['tecnología', 'software', 'IA', 'transformación digital', 'desarrollo web', 'consultoría'],
    ogTitle: 'Scuti Company - Innovación Tecnológica',
    ogDescription: 'Innovamos para que tu empresa avance al ritmo de la tecnología.',
    ogImage: '',
    twitterCard: 'summary_large_image'
  },
  theme: {
    default: 'dark',
    lightMode: {
      primary: '#8B5CF6',
      secondary: '#06B6D4',
      background: '#FFFFFF',
      text: '#1F2937',
      textSecondary: '#6B7280',
      cardBg: '#F9FAFB',
      border: '#E5E7EB',
      buttons: {
        ctaPrimary: {
          background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
          text: '#FFFFFF',
          border: 'transparent',
          hoverBackground: 'linear-gradient(135deg, #7C3AED 0%, #0891B2 100%)',
          hoverText: '#FFFFFF',
          hoverBorder: 'transparent'
        },
        contact: {
          background: 'transparent',
          text: '#8B5CF6',
          border: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
          hoverBackground: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
          hoverText: '#FFFFFF',
          hoverBorder: 'transparent'
        },
        dashboard: {
          background: '#8B5CF6',
          text: '#FFFFFF',
          border: 'transparent',
          hoverBackground: '#7C3AED',
          hoverText: '#FFFFFF',
          hoverBorder: 'transparent'
        }
      }
    },
    darkMode: {
      primary: '#A78BFA',
      secondary: '#22D3EE',
      background: '#111827',
      text: '#F9FAFB',
      textSecondary: '#D1D5DB',
      cardBg: '#1F2937',
      border: '#374151',
      buttons: {
        ctaPrimary: {
          background: 'linear-gradient(135deg, #A78BFA 0%, #22D3EE 100%)',
          text: '#111827',
          border: 'transparent',
          hoverBackground: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
          hoverText: '#111827',
          hoverBorder: 'transparent'
        },
        contact: {
          background: 'transparent',
          text: '#A78BFA',
          border: 'linear-gradient(135deg, #A78BFA 0%, #22D3EE 100%)',
          hoverBackground: 'linear-gradient(135deg, #A78BFA 0%, #22D3EE 100%)',
          hoverText: '#111827',
          hoverBorder: 'transparent'
        },
        dashboard: {
          background: '#A78BFA',
          text: '#111827',
          border: 'transparent',
          hoverBackground: '#8B5CF6',
          hoverText: '#111827',
          hoverBorder: 'transparent'
        }
      }
    }
  },
  isPublished: true
};

const seedProduction = async () => {
  try {
    console.log('🔌 Conectando a MongoDB...');
    console.log(`📡 URI: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe la página
    const existingPage = await Page.findOne({ pageSlug: 'home' });

    if (existingPage) {
      console.log('⚠️  La página "home" ya existe en la base de datos.');
      console.log('❓ ¿Deseas sobrescribirla? (Ctrl+C para cancelar)');

      // Esperar 5 segundos antes de continuar
      await new Promise(resolve => setTimeout(resolve, 5000));

      await Page.deleteOne({ pageSlug: 'home' });
      console.log('🗑️  Página existente eliminada');
    }

    // Crear nueva página
    const page = await Page.create(homePageData);
    console.log('✅ Página "home" creada exitosamente en producción');
    console.log(`📄 ID: ${page._id}`);

    await mongoose.connection.close();
    console.log('👋 Desconectado de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedProduction();
