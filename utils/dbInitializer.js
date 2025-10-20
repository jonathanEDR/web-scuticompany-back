import Page from '../models/Page.js';
import logger from './logger.js';

/**
 * Datos por defecto para la página Home
 */
const defaultHomePageData = {
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
          borderWidth: '1px',
          shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          hoverBackground: 'rgba(255, 255, 255, 1)',
          hoverBorder: '#8B5CF6',
          hoverShadow: '0 20px 25px -5px rgba(139, 92, 246, 0.2)',
          iconGradient: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
          iconBackground: '#FFFFFF',
          iconColor: '#8B5CF6',
          titleColor: '#1F2937',
          descriptionColor: '#6B7280',
          linkColor: '#8B5CF6',
          cardMinWidth: '280px',
          cardMaxWidth: '100%',
          cardMinHeight: 'auto',
          cardPadding: '2rem',
          cardsAlignment: 'left',
          iconBorderEnabled: true,
          iconAlignment: 'center'
        },
        dark: {
          background: 'rgba(31, 41, 55, 0.8)',
          border: '#374151',
          borderWidth: '1px',
          shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          hoverBackground: 'rgba(55, 65, 81, 1)',
          hoverBorder: '#A78BFA',
          hoverShadow: '0 20px 25px -5px rgba(167, 139, 250, 0.3)',
          iconGradient: 'linear-gradient(135deg, #A78BFA 0%, #22D3EE 100%)',
          iconBackground: '#1F2937',
          iconColor: '#A78BFA',
          titleColor: '#F9FAFB',
          descriptionColor: '#D1D5DB',
          linkColor: '#A78BFA',
          cardMinWidth: '280px',
          cardMaxWidth: '100%',
          cardMinHeight: 'auto',
          cardPadding: '2rem',
          cardsAlignment: 'left',
          iconBorderEnabled: true,
          iconAlignment: 'center'
        }
      },
      items: [
        {
          icon: '💻',
          iconLight: '',
          iconDark: '',
          title: 'Soluciones Digitales',
          description: 'Transformamos tu negocio con estrategias digitales innovadoras y plataformas web de alto rendimiento.',
          gradient: 'from-purple-500 to-purple-700'
        },
        {
          icon: '⚙️',
          iconLight: '',
          iconDark: '',
          title: 'Proyectos de Software',
          description: 'Desarrollamos software a medida con las últimas tecnologías para optimizar tus procesos empresariales.',
          gradient: 'from-cyan-500 to-cyan-700'
        },
        {
          icon: '🤖',
          iconLight: '',
          iconDark: '',
          title: 'Modelos de IA',
          description: 'Implementamos inteligencia artificial personalizada para automatizar y potenciar tu empresa.',
          gradient: 'from-amber-500 to-amber-700'
        }
      ]
    },
    contact: {
      phone: '+51 973 397 306',
      email: 'corpocomunicados@gmail.com',
      socialLinks: [
        {
          name: 'facebook',
          url: '#',
          icon: '',
          enabled: true
        },
        {
          name: 'twitter',
          url: '#',
          icon: '',
          enabled: true
        },
        {
          name: 'pinterest',
          url: '#',
          icon: '',
          enabled: true
        },
        {
          name: 'whatsapp',
          url: '#',
          icon: '',
          enabled: true
        }
      ]
    }
  },
  seo: {
    metaTitle: 'Scuti Company - Transformación Digital Empresarial',
    metaDescription: 'Transformamos empresas con tecnología inteligente. Soluciones digitales, desarrollo de software y modelos de IA personalizados.',
    keywords: ['tecnología', 'software', 'IA', 'inteligencia artificial', 'soluciones digitales', 'desarrollo web', 'transformación digital'],
    ogTitle: 'Scuti Company - Tecnología Inteligente para tu Empresa',
    ogDescription: 'Transformamos procesos con soluciones digitales innovadoras',
    ogImage: '',
    twitterCard: 'summary_large_image'
  },
  theme: {
    default: 'light',
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
          background: 'linear-gradient(90deg, #8B5CF6, #06B6D4, #8B5CF6)',
          textColor: '#FFFFFF',
          borderColor: 'transparent'
        },
        contact: {
          background: 'transparent',
          textColor: '#8B5CF6',
          borderColor: 'linear-gradient(90deg, #8B5CF6, #06B6D4)'
        },
        dashboard: {
          background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)',
          textColor: '#FFFFFF',
          borderColor: 'transparent'
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
          background: 'linear-gradient(90deg, #A78BFA, #22D3EE, #A78BFA)',
          textColor: '#111827',
          borderColor: 'transparent'
        },
        contact: {
          background: 'transparent',
          textColor: '#A78BFA',
          borderColor: 'linear-gradient(90deg, #A78BFA, #22D3EE)'
        },
        dashboard: {
          background: 'linear-gradient(90deg, #A78BFA, #22D3EE)',
          textColor: '#111827',
          borderColor: 'transparent'
        }
      }
    }
  },
  isPublished: true,
  updatedBy: 'system-init'
};

/**
 * Inicializa las páginas requeridas en la base de datos
 * Se ejecuta al iniciar el servidor
 */
export const initializeDatabase = async () => {
  const startTime = Date.now();
  
  try {
    logger.init('Verificando estado de la base de datos', 'progress');

    // Verificar si existe la página Home
    const homePage = await Page.findOne({ pageSlug: 'home' });

    if (!homePage) {
      logger.init('Página Home no encontrada, creando configuración por defecto');

      await Page.create(defaultHomePageData);
      
      logger.success('Página Home creada exitosamente');
      logger.startup('Puedes editar el contenido desde el CMS Manager');
      logger.database('CREATE', 'pages', { slug: 'home' });
    } else {
      logger.success('Página Home encontrada', {
        id: homePage._id,
        lastUpdate: homePage.lastUpdated,
        updatedBy: homePage.updatedBy
      });
      
      // Verificar integridad de datos
      const hasHeroImages = !!(homePage.content?.hero?.backgroundImage?.light || 
                                homePage.content?.hero?.backgroundImage?.dark);
      const hasSolutionsImages = !!(homePage.content?.solutions?.backgroundImage?.light || 
                                     homePage.content?.solutions?.backgroundImage?.dark);
      const itemsCount = homePage.content?.solutions?.items?.length || 0;
      const itemsWithIcons = homePage.content?.solutions?.items?.filter(
        i => i.iconLight || i.iconDark
      ).length || 0;

      logger.debug('Estado de la página Home', {
        heroImages: hasHeroImages ? 'Configuradas' : 'Sin configurar',
        solutionsImages: hasSolutionsImages ? 'Configuradas' : 'Sin configurar',
        itemsCount,
        itemsWithIcons
      });
      
      logger.database('FOUND', 'pages', { slug: 'home' });
    }

    // Verificar estado general de la BD
    const totalPages = await Page.countDocuments();
    logger.database('COUNT', 'pages', { total: totalPages });

    logger.performance('Inicialización de base de datos', startTime);

    console.log('✅ Base de datos inicializada correctamente\n');

  } catch (error) {
    logger.error('Error al inicializar base de datos', error);
    logger.warn('El servidor continuará, pero puede haber problemas con el CMS');
    logger.performance('Inicialización de base de datos (FAILED)', startTime);
    // No lanzar error para que el servidor pueda iniciar
  }
};

/**
 * Verifica la salud de la base de datos
 * Útil para health checks
 */
export const checkDatabaseHealth = async () => {
  try {
    const homePage = await Page.findOne({ pageSlug: 'home' });
    const totalPages = await Page.countDocuments();
    
    const healthStatus = {
      healthy: !!homePage,
      pages: {
        home: !!homePage,
        total: totalPages
      },
      timestamp: new Date().toISOString()
    };
    
    logger.debug('Health check completado', healthStatus);
    
    return healthStatus;
  } catch (error) {
    logger.error('Error en health check de la base de datos', error);
    
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

export default {
  initializeDatabase,
  checkDatabaseHealth,
  defaultHomePageData
};
