import Page from '../models/Page.js';
import { ensureSuperAdminExists } from './roleHelper.js';
import { inicializarCategorias } from './categoriaInitializer.js';
import logger from './logger.js';
import INIT_CONFIG from '../config/initConfig.js';

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
  // 🆕 CONFIGURACIÓN DEL CHATBOT
  chatbotConfig: {
    enabled: true,
    botName: 'Asesor de Ventas',
    statusText: 'En línea • Respuesta inmediata',
    logo: {
      light: '',
      dark: ''
    },
    logoAlt: 'Asesor Virtual',
    welcomeMessage: {
      title: '¡Hola! Soy tu Asesor Virtual 👋',
      description: 'Estoy aquí para ayudarte con información sobre nuestros servicios, precios y cotizaciones.'
    },
    // 🎯 PREGUNTAS SUGERIDAS (las que aparecen al abrir el chat)
    suggestedQuestions: [
      {
        icon: '💼',
        text: '¿Qué servicios ofrecen?',
        message: '¿Qué servicios ofrecen?'
      },
      {
        icon: '💰',
        text: 'Solicitar cotización',
        message: 'Quiero solicitar una cotización'
      },
      {
        icon: '📋',
        text: 'Ver precios y planes',
        message: '¿Cuáles son sus precios y planes?'
      },
      {
        icon: '📞',
        text: 'Información de contacto',
        message: '¿Cómo puedo contactarlos?'
      }
    ],
    headerStyles: {
      light: {
        background: 'linear-gradient(to right, #EFF6FF, #F5F3FF)',
        titleColor: '#111827',
        subtitleColor: '#6B7280',
        logoBackground: 'linear-gradient(to bottom right, #3B82F6, #8B5CF6)'
      },
      dark: {
        background: 'linear-gradient(to right, #1F2937, #1F2937)',
        titleColor: '#FFFFFF',
        subtitleColor: '#9CA3AF',
        logoBackground: 'linear-gradient(to bottom right, #3B82F6, #8B5CF6)'
      }
    },
    buttonStyles: {
      size: 'medium',
      position: {
        bottom: '24px',
        right: '24px'
      },
      gradient: {
        from: '#3B82F6',
        to: '#8B5CF6'
      },
      shape: 'circle',
      icon: {
        light: '',
        dark: ''
      }
    },
    behavior: {
      autoOpen: false,
      autoOpenDelay: 5000,
      showUnreadBadge: true,
      showPoweredBy: true
    }
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
 * Datos por defecto para la página Services
 */
const defaultServicesPageData = {
  pageSlug: 'services',
  pageName: 'Servicios Profesionales',
  metaTitle: 'Servicios Profesionales - Scuti Company',
  metaDescription: 'Descubre nuestra amplia gama de servicios profesionales de tecnología, desarrollo web, marketing digital y más.',
  metaKeywords: ['servicios', 'tecnología', 'desarrollo web', 'marketing digital', 'consultoría', 'diseño'],
  ogTitle: 'Servicios Profesionales - Scuti Company',
  ogDescription: 'Servicios profesionales de tecnología y desarrollo web',
  ogImage: '',
  content: {
    hero: {
      title: 'Nuestros Servicios',
      subtitle: 'Soluciones profesionales para tu negocio',
      description: 'Ofrecemos una amplia gama de servicios tecnológicos diseñados para impulsar el crecimiento de tu empresa.',
      backgroundImage: {
        light: '',
        dark: ''
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

    // ========================================
    // 📄 PÁGINA HOME
    // ========================================
    const homePage = await Page.findOne({ pageSlug: 'home' });

    if (!homePage && INIT_CONFIG.CREATE_HOME_PAGE) {
      logger.init('Página Home no encontrada, creando configuración por defecto');
      await Page.create(defaultHomePageData);
      logger.success('Página Home creada exitosamente');
      logger.startup('Puedes editar el contenido desde el CMS Manager');
      logger.database('CREATE', 'pages', { slug: 'home' });
    } else if (!homePage) {
      logger.warn('⚠️  Página Home no encontrada (CREATE_HOME_PAGE = false)');
    } else {
      logger.success('✅ Página Home encontrada');
      
      // 🆕 VERIFICACIÓN DEL CHATBOT
      if (INIT_CONFIG.AUTO_UPDATE_CHATBOT) {
        logger.init('⚠️  Configuración del chatbot incompleta o desactualizada, actualizando...');
        logger.info(`📊 Estado actual: ${JSON.stringify({
          hasConfig: !!homePage.content?.chatbotConfig,
          hasQuestions: !!homePage.content?.chatbotConfig?.suggestedQuestions,
          questionsCount: homePage.content?.chatbotConfig?.suggestedQuestions?.length || 0,
          hasEmptyIcons: hasEmptyIcons,
          lastUpdatedBy: homePage.updatedBy
        })}`);
        
        // Preguntas sugeridas con iconos explícitos
        const suggestedQuestionsData = [
          {
            icon: '💼',
            text: '¿Qué servicios ofrecen?',
            message: '¿Qué servicios ofrecen?'
          },
          {
            icon: '💰',
            text: 'Solicitar cotización',
            message: 'Quiero solicitar una cotización'
          },
          {
            icon: '📋',
            text: 'Ver precios y planes',
            message: '¿Cuáles son sus precios y planes?'
          },
          {
            icon: '📞',
            text: 'Información de contacto',
            message: '¿Cómo puedo contactarlos?'
          }
        ];
        
        // Crear o actualizar la configuración del chatbot
        if (!homePage.content.chatbotConfig) {
          homePage.content.chatbotConfig = {};
        }
        
        // Actualizar campos uno por uno para asegurar que se guardan
        homePage.content.chatbotConfig.enabled = true;
        homePage.content.chatbotConfig.botName = 'Asesor de Ventas';
        homePage.content.chatbotConfig.statusText = 'En línea • Respuesta inmediata';
        homePage.content.chatbotConfig.logoAlt = 'Asesor Virtual';
        
        if (!homePage.content.chatbotConfig.logo) {
          homePage.content.chatbotConfig.logo = { light: '', dark: '' };
        }
        
        if (!homePage.content.chatbotConfig.welcomeMessage) {
          homePage.content.chatbotConfig.welcomeMessage = {};
        }
        homePage.content.chatbotConfig.welcomeMessage.title = '¡Hola! Soy tu Asesor Virtual 👋';
        homePage.content.chatbotConfig.welcomeMessage.description = 'Estoy aquí para ayudarte con información sobre nuestros servicios, precios y cotizaciones.';
        
        // 🔥 CRÍTICO: Reemplazar completamente el array de preguntas
        homePage.content.chatbotConfig.suggestedQuestions = suggestedQuestionsData;
        
        // Mantener los estilos existentes si ya existen
        if (!homePage.content.chatbotConfig.headerStyles) {
          homePage.content.chatbotConfig.headerStyles = defaultHomePageData.chatbotConfig.headerStyles;
        }
        if (!homePage.content.chatbotConfig.buttonStyles) {
          homePage.content.chatbotConfig.buttonStyles = defaultHomePageData.chatbotConfig.buttonStyles;
        }
        if (!homePage.content.chatbotConfig.behavior) {
          homePage.content.chatbotConfig.behavior = defaultHomePageData.chatbotConfig.behavior;
        }
        
        // 🔥 IMPORTANTE: Marcar explícitamente todos los campos como modificados
        homePage.markModified('content');
        homePage.markModified('content.chatbotConfig');
        homePage.markModified('content.chatbotConfig.suggestedQuestions');
        
        homePage.lastUpdated = new Date();
        homePage.updatedBy = 'system-auto-update';
        
        logger.info(`💾 Guardando configuración completa del chatbot...`);
        logger.info(`📝 Preguntas a guardar: ${suggestedQuestionsData.length}`);
        logger.info(`🎨 Iconos: ${suggestedQuestionsData.map(q => q.icon).join(' ')}`);
        
        await homePage.save();
        
        // Verificar que se guardó correctamente
        const updatedPage = await Page.findOne({ pageSlug: 'home' }).lean();
        const savedQuestionsCount = updatedPage?.content?.chatbotConfig?.suggestedQuestions?.length || 0;
        const savedIcons = updatedPage?.content?.chatbotConfig?.suggestedQuestions?.map(q => q.icon || '❌') || [];
        
        logger.success('✅ Configuración del chatbot actualizada');
        logger.success(`📝 Preguntas sugeridas guardadas: ${savedQuestionsCount}`);
        logger.success(`🎨 Iconos guardados: ${savedIcons.join(' ')}`);
        logger.database('UPDATE', 'pages', { slug: 'home', field: 'chatbotConfig' });
        
        if (savedQuestionsCount === 0) {
          logger.error('❌ ERROR: Las preguntas NO se guardaron en la base de datos');
        }
        if (savedIcons.some(icon => !icon || icon === '❌')) {
          logger.error('❌ ERROR: Los iconos NO se guardaron correctamente');
        }
      } else {
        logger.success('✅ Configuración del chatbot completa');
      }
      
      logger.database('FOUND', 'pages', { slug: 'home' });
    }

    // ========================================
    // 📄 PÁGINA SERVICES
    // ========================================
    const servicesPage = await Page.findOne({ pageSlug: 'services' });

    if (!servicesPage && INIT_CONFIG.CREATE_SERVICES_PAGE) {
      logger.init('Página Services no encontrada, creando configuración por defecto');

      await Page.create(defaultServicesPageData);
      
      logger.success('Página Services creada exitosamente');
      logger.database('CREATE', 'pages', { slug: 'services' });
    } else if (!servicesPage) {
      logger.warn('⚠️  Página Services no encontrada (CREATE_SERVICES_PAGE = false)');
    } else {
      logger.success('✅ Página Services encontrada');
      logger.database('FOUND', 'pages', { slug: 'services' });
    }

    // ========================================
    // 📄 PÁGINA ABOUT
    // ========================================
    const aboutPage = await Page.findOne({ pageSlug: 'about' });

    if (!aboutPage && INIT_CONFIG.CREATE_ABOUT_PAGE) {
      logger.init('Página About no encontrada, creando configuración por defecto');

      await Page.create({
        pageSlug: 'about',
        pageName: 'Sobre Nosotros',
        content: {
          hero: {
            title: 'Sobre Nosotros',
            subtitle: 'Conoce nuestra historia y misión',
            description: 'SCUTI Company es una empresa líder en desarrollo de software y soluciones tecnológicas innovadoras en Perú.',
            backgroundImage: { light: '', dark: '' },
            backgroundImageAlt: 'About background',
            styles: {
              light: { titleColor: '', subtitleColor: '', descriptionColor: '' },
              dark: { titleColor: '', subtitleColor: '', descriptionColor: '' }
            }
          },
          mission: {
            title: 'Nuestra Misión',
            description: 'Transformar empresas a través de la tecnología inteligente, creando soluciones digitales personalizadas que impulsen el crecimiento y la eficiencia.'
          },
          vision: {
            title: 'Nuestra Visión',
            description: 'Ser la empresa de referencia en desarrollo de software en Latinoamérica, reconocida por la calidad, innovación y impacto de nuestras soluciones.'
          },
          values: {
            title: 'Nuestros Valores',
            items: [
              { title: 'Innovación', description: 'Buscamos constantemente nuevas formas de resolver problemas' },
              { title: 'Calidad', description: 'Entregamos soluciones robustas y bien construidas' },
              { title: 'Compromiso', description: 'Nos dedicamos al éxito de nuestros clientes' },
              { title: 'Transparencia', description: 'Mantenemos comunicación clara y honesta' }
            ]
          }
        },
        seo: {
          metaTitle: 'Nosotros - SCUTI Company',
          metaDescription: 'Conoce más sobre SCUTI Company, nuestra historia, misión y el equipo de expertos en desarrollo de software.',
          keywords: ['SCUTI', 'nosotros', 'equipo', 'empresa', 'software', 'perú'],
          ogTitle: 'Nosotros - SCUTI Company',
          ogDescription: 'Somos una empresa líder en desarrollo de software en Perú',
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
        isPublished: true,
        updatedBy: 'system-init'
      });
      
      logger.success('Página About creada exitosamente');
      logger.database('CREATE', 'pages', { slug: 'about' });
    } else if (!aboutPage) {
      logger.warn('⚠️  Página About no encontrada (CREATE_ABOUT_PAGE = false)');
    } else {
      logger.success('✅ Página About encontrada');
      logger.database('FOUND', 'pages', { slug: 'about' });
    }

    // ========================================
    // 👤 SUPER ADMINISTRADOR
    // ========================================
    if (INIT_CONFIG.ENSURE_SUPER_ADMIN) {
      logger.init('Verificando Super Administrador del sistema');
      const superAdmin = await ensureSuperAdminExists();
      
      if (superAdmin) {
        logger.success('✅ Super Administrador verificado');
      } else {
        logger.warn('⚠️  No se pudo verificar/crear Super Administrador');
      }
    }

    // ========================================
    // 🏷️  CATEGORÍAS
    // ========================================
    if (INIT_CONFIG.INIT_CATEGORIES) {
      logger.init('Verificando categorías del sistema');
      await inicializarCategorias();
    }

    // ========================================
    // 📊 RESUMEN
    // ========================================
    const totalPages = await Page.countDocuments();
    
    if (INIT_CONFIG.SHOW_HEALTH_CHECK) {
      logger.database('COUNT', 'pages', { total: totalPages });
    }

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
