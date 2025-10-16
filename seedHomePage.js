import dotenv from 'dotenv';
import connectDB from './config/database.js';
import Page from './models/Page.js';

dotenv.config();

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
      backgroundImage: '',
      backgroundImageAlt: 'Hero background'
    },
    solutions: {
      title: 'Soluciones',
      description: 'En el dinámico entorno empresarial de hoy, la tecnología es la columna vertebral del éxito. Impulsa la innovación, seguridad y el crecimiento de tu negocio.',
      backgroundImage: '',
      backgroundImageAlt: 'Solutions background',
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
      border: '#E5E7EB'
    },
    darkMode: {
      primary: '#A78BFA',
      secondary: '#22D3EE',
      background: '#111827',
      text: '#F9FAFB',
      textSecondary: '#D1D5DB',
      cardBg: '#1F2937',
      border: '#374151'
    }
  },
  isPublished: true
};

const seedHomePage = async () => {
  try {
    await connectDB();
    
    // Verificar si ya existe la página
    const existingPage = await Page.findOne({ pageSlug: 'home' });
    
    if (existingPage) {
      // Actualizar la página existente
      await Page.findOneAndUpdate(
        { pageSlug: 'home' },
        homePageData,
        { new: true, runValidators: true }
      );
      console.log('Home page updated successfully');
    } else {
      // Crear nueva página
      await Page.create(homePageData);
      console.log('Home page created successfully');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error creating/updating home page:', error);
    process.exit(1);
  }
};

seedHomePage();
