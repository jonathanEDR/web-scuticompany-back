import Page from '../models/Page.js';
import { transformImageUrls } from '../utils/urlTransformer.js';
import { updateImageReferences } from '../utils/imageTracker.js';

// Helper: Convertir estructura de botones simplificada (nuevo formato)
const convertButtonsToBackend = (buttons) => {
  if (!buttons) return buttons;
  
  const converted = {};
  for (const [key, button] of Object.entries(buttons)) {
    // Nuevo formato simplificado: text, background, textColor, borderColor
    converted[key] = {
      text: button.text || '',
      background: button.background || button.bg || 'transparent',
      textColor: button.textColor || button.text || '#8B5CF6',
      borderColor: button.borderColor || button.border || 'transparent'
    };
  }
  return converted;
};

// Helper: Convertir estructura de botones de backend a frontend
const convertButtonsToFrontend = (buttons) => {
  if (!buttons) return buttons;
  
  const converted = {};
  for (const [key, button] of Object.entries(buttons)) {
    // Nuevo formato simplificado
    converted[key] = {
      text: button.text || '',
      background: button.background || 'transparent',
      textColor: button.textColor || '#8B5CF6',
      borderColor: button.borderColor || 'transparent'
    };
  }
  return converted;
};

// @desc    Obtener todas las páginas
// @route   GET /api/cms/pages
// @access  Public (para mostrar en el frontend)
export const getAllPages = async (req, res) => {
  try {
    const pages = await Page.find({ isPublished: true })
      .select('-__v')
      .sort({ pageSlug: 1 });
    
    // Convertir estructura de botones para el frontend y asegurar estilos
    const pagesWithConvertedButtons = pages.map(page => {
      const pageObj = page.toObject();
      
      // Migrar backgroundImage de string a objeto si es necesario para hero
      if (pageObj.content?.hero?.backgroundImage && typeof pageObj.content.hero.backgroundImage === 'string') {
        const oldValue = pageObj.content.hero.backgroundImage;
        pageObj.content.hero.backgroundImage = {
          light: '',
          dark: oldValue || ''
        };
      }
      
      // Migrar backgroundImage de string a objeto si es necesario para solutions
      if (pageObj.content?.solutions?.backgroundImage && typeof pageObj.content.solutions.backgroundImage === 'string') {
        const oldValue = pageObj.content.solutions.backgroundImage;
        pageObj.content.solutions.backgroundImage = {
          light: '',
          dark: oldValue || ''
        };
      }
      
      // Asegurar que los estilos existen para hero
      if (pageObj.content?.hero && !pageObj.content.hero.styles) {
        pageObj.content.hero.styles = {
          light: { titleColor: '', subtitleColor: '', descriptionColor: '' },
          dark: { titleColor: '', subtitleColor: '', descriptionColor: '' }
        };
      }
      
      // Asegurar que los estilos existen para solutions
      if (pageObj.content?.solutions && !pageObj.content.solutions.styles) {
        pageObj.content.solutions.styles = {
          light: { titleColor: '', descriptionColor: '' },
          dark: { titleColor: '', descriptionColor: '' }
        };
      }
      
    // Asegurar que los estilos existen para valueAdded
    if (pageObj.content?.valueAdded && !pageObj.content.valueAdded.styles) {
      pageObj.content.valueAdded.styles = {
        light: { titleColor: '', descriptionColor: '' },
        dark: { titleColor: '', descriptionColor: '' }
      };
    }

    // 🔧 CORRECCIÓN: Asegurar que cardsDesign existe para solutions
    if (pageObj.content?.solutions && !pageObj.content.solutions.cardsDesign) {
      console.log('⚠️ [Backend] Migrando cardsDesign para solutions');
      pageObj.content.solutions.cardsDesign = {
        light: {
          background: 'rgba(255, 255, 255, 0.1)',
          border: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
          borderWidth: '1px',
          shadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          hoverBackground: 'rgba(255, 255, 255, 0.15)',
          hoverBorder: 'linear-gradient(135deg, #a78bfa, #22d3ee)',
          hoverShadow: '0 20px 40px rgba(139, 92, 246, 0.2)',
          iconGradient: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
          iconBackground: 'rgba(255, 255, 255, 0.9)',
          iconColor: '#7528ee',
          titleColor: '#333333',
          descriptionColor: '#6B7280',
          linkColor: '#7528ee',
          cardMinWidth: '200px',
          cardMaxWidth: '100%',
          cardMinHeight: 'auto',
          cardPadding: '2rem',
          cardsAlignment: 'left',
          iconBorderEnabled: false,
          iconAlignment: 'center'
        },
        dark: {
          background: 'rgba(0, 0, 0, 0.3)',
          border: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
          borderWidth: '2px',
          shadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          hoverBackground: 'rgba(0, 0, 0, 0.4)',
          hoverBorder: 'linear-gradient(135deg, #a78bfa, #22d3ee)',
          hoverShadow: '0 20px 40px rgba(139, 92, 246, 0.3)',
          iconGradient: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
          iconBackground: 'rgba(17, 24, 39, 0.8)',
          iconColor: '#ffffff',
          titleColor: '#ffffff',
          descriptionColor: '#d1d5db',
          linkColor: '#a78bfa',
          cardMinWidth: '280px',
          cardMaxWidth: '100%',
          cardMinHeight: 'auto',
          cardPadding: '2rem',
          cardsAlignment: 'left',
          iconBorderEnabled: false,
          iconAlignment: 'center'
        }
      };
    }

    // 🔧 CORRECCIÓN: Asegurar que cardsDesign existe para valueAdded
    if (pageObj.content?.valueAdded && !pageObj.content.valueAdded.cardsDesign) {
      console.log('⚠️ [Backend] Migrando cardsDesign para valueAdded');
      pageObj.content.valueAdded.cardsDesign = {
        light: {
          background: 'rgba(255, 255, 255, 0.9)',
          border: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
          borderWidth: '2px',
          shadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          hoverBackground: 'rgba(255, 255, 255, 0.95)',
          hoverBorder: 'linear-gradient(135deg, #a78bfa, #22d3ee)',
          hoverShadow: '0 20px 40px rgba(139, 92, 246, 0.2)',
          iconGradient: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
          iconBackground: 'rgba(255, 255, 255, 0.9)',
          iconColor: '#7528ee',
          titleColor: '#FFFFFF',
          descriptionColor: '#E5E7EB',
          linkColor: '#22d3ee',
          cardMinWidth: '280px',
          cardMaxWidth: '350px',
          cardMinHeight: '200px',
          cardPadding: '2rem',
          cardsAlignment: 'center',
          iconBorderEnabled: false,
          iconAlignment: 'center'
        },
        dark: {
          background: 'rgba(255, 255, 255, 0.9)',
          border: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
          borderWidth: '2px',
          shadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          hoverBackground: 'rgba(255, 255, 255, 0.95)',
          hoverBorder: 'linear-gradient(135deg, #a78bfa, #22d3ee)',
          hoverShadow: '0 20px 40px rgba(139, 92, 246, 0.3)',
          iconGradient: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
          iconBackground: 'rgba(17, 24, 39, 0.8)',
          iconColor: '#ffffff',
          titleColor: '#FFFFFF',
          descriptionColor: '#E5E7EB',
          linkColor: '#a78bfa',
          cardMinWidth: '280px',
          cardMaxWidth: '350px',
          cardMinHeight: '200px',
          cardPadding: '2rem',
          cardsAlignment: 'center',
          iconBorderEnabled: false,
          iconAlignment: 'center'
        }
      };
    }

    // Logs de depuración para verificar la corrección
    console.log('🔍 [Backend] Verificando cardsDesign en respuesta pública:');
    console.log('   Solutions cardsDesign:', pageObj.content?.solutions?.cardsDesign ? 'EXISTE' : 'NO EXISTE');
    console.log('   ValueAdded cardsDesign:', pageObj.content?.valueAdded?.cardsDesign ? 'EXISTE' : 'NO EXISTE');      // Convertir botones
      if (pageObj.theme) {
        if (pageObj.theme.lightMode?.buttons) {
          pageObj.theme.lightMode.buttons = convertButtonsToFrontend(pageObj.theme.lightMode.buttons);
        }
        if (pageObj.theme.darkMode?.buttons) {
          pageObj.theme.darkMode.buttons = convertButtonsToFrontend(pageObj.theme.darkMode.buttons);
        }
      }
      return pageObj;
    });
    
    // Transformar URLs relativas a absolutas
    const pagesWithAbsoluteUrls = transformImageUrls(pagesWithConvertedButtons);
    
    res.json({
      success: true,
      count: pagesWithAbsoluteUrls.length,
      data: pagesWithAbsoluteUrls
    });
  } catch (error) {
    console.error('Error al obtener páginas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener páginas',
      error: error.message
    });
  }
};

// @desc    Obtener una página por slug
// @route   GET /api/cms/pages/:slug
// @access  Public
export const getPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const page = await Page.findOne({ 
      pageSlug: slug,
      isPublished: true 
    }).select('-__v');
    
    if (!page) {
      return res.status(404).json({
        success: false,
        message: `Página '${slug}' no encontrada`
      });
    }
    
    // Convertir estructura de botones para el frontend
    const pageObj = page.toObject();
    
    // Migrar backgroundImage de string a objeto si es necesario
    if (pageObj.content?.hero?.backgroundImage && typeof pageObj.content.hero.backgroundImage === 'string') {
      const oldValue = pageObj.content.hero.backgroundImage;
      pageObj.content.hero.backgroundImage = {
        light: '',
        dark: oldValue || ''
      };
    }
    
    if (pageObj.content?.solutions?.backgroundImage && typeof pageObj.content.solutions.backgroundImage === 'string') {
      const oldValue = pageObj.content.solutions.backgroundImage;
      pageObj.content.solutions.backgroundImage = {
        light: '',
        dark: oldValue || ''
      };
    }
    
    // Asegurar que los estilos existen
    if (pageObj.content?.hero && !pageObj.content.hero.styles) {
      pageObj.content.hero.styles = {
        light: { titleColor: '', subtitleColor: '', descriptionColor: '' },
        dark: { titleColor: '', subtitleColor: '', descriptionColor: '' }
      };
    }
    
    if (pageObj.content?.solutions && !pageObj.content.solutions.styles) {
      pageObj.content.solutions.styles = {
        light: { titleColor: '', descriptionColor: '' },
        dark: { titleColor: '', descriptionColor: '' }
      };
    }
    
    if (pageObj.content?.valueAdded && !pageObj.content.valueAdded.styles) {
      pageObj.content.valueAdded.styles = {
        light: { titleColor: '', descriptionColor: '' },
        dark: { titleColor: '', descriptionColor: '' }
      };
    }
    
    if (pageObj.theme) {
      if (pageObj.theme.lightMode?.buttons) {
        pageObj.theme.lightMode.buttons = convertButtonsToFrontend(pageObj.theme.lightMode.buttons);
      }
      if (pageObj.theme.darkMode?.buttons) {
        pageObj.theme.darkMode.buttons = convertButtonsToFrontend(pageObj.theme.darkMode.buttons);
      }
    }
    
    // Transformar URLs relativas a absolutas
    const pageWithAbsoluteUrls = transformImageUrls(pageObj);
    
    res.json({
      success: true,
      data: pageWithAbsoluteUrls
    });
  } catch (error) {
    console.error('Error al obtener página:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener página',
      error: error.message
    });
  }
};

// @desc    Actualizar contenido de una página
// @route   PUT /api/cms/pages/:slug
// @access  Private (requiere autenticación)
export const updatePage = async (req, res) => {
  try {
    const { slug } = req.params;
    const updateData = req.body;
    
    // 🔍 [DEBUG] Log completo del body recibido
    console.log('📥 [RECIBIDO BACKEND] Body completo:', JSON.stringify({
      contentSolutions: updateData.content?.solutions?.cardsDesign?.light,
      contentValueAdded: updateData.content?.valueAdded?.cardsDesign?.light,
      contentContactForm: updateData.content?.contactForm?.cardsDesign?.light
    }, null, 2));
    
    // 🔍 [DEBUG] Log específico para contactForm
    if (updateData.content?.contactForm?.cardsDesign) {
      console.log('📧 [CONTACTFORM] cardsDesign recibido:', JSON.stringify(updateData.content.contactForm.cardsDesign, null, 2));
    } else {
      console.log('❌ [CONTACTFORM] No se recibió cardsDesign en contactForm');
    }
    
    // Obtener datos anteriores para comparar imágenes
    const oldPage = await Page.findOne({ pageSlug: slug });
    
    // Convertir estructura de botones de frontend a backend antes de guardar
    if (updateData.theme) {
      if (updateData.theme.lightMode?.buttons) {
        updateData.theme.lightMode.buttons = convertButtonsToBackend(updateData.theme.lightMode.buttons);
      }
      if (updateData.theme.darkMode?.buttons) {
        updateData.theme.darkMode.buttons = convertButtonsToBackend(updateData.theme.darkMode.buttons);
      }
    }
    
    // Agregar información de actualización
    updateData.lastUpdated = Date.now();
    updateData.updatedBy = req.user?.email || 'admin';
    
    // 🔧 SOLUCIÓN: Usar findOne + save() en lugar de findOneAndUpdate
    // porque findOneAndUpdate puede ignorar strict: false en algunos casos
    const page = await Page.findOne({ pageSlug: slug });
    
    if (!page) {
      return res.status(404).json({
        success: false,
        message: `Página '${slug}' no encontrada`
      });
    }
    
    // Actualizar campos manualmente
    if (updateData.content) {
      console.log('🔄 [UPDATE] Actualizando content...');
      console.log('🔍 [UPDATE] borderWidth ANTES de asignar:', page.content?.solutions?.cardsDesign?.light?.borderWidth);
      console.log('🔍 [UPDATE] borderWidth en updateData:', updateData.content?.solutions?.cardsDesign?.light?.borderWidth);
      page.content = updateData.content;
      page.markModified('content'); // ⚠️ CRÍTICO: Marcar como modificado para forzar guardado
      console.log('🔍 [UPDATE] borderWidth DESPUÉS de asignar:', page.content?.solutions?.cardsDesign?.light?.borderWidth);
      console.log('✅ [UPDATE] Content marcado como modificado');
    }
    if (updateData.seo) {
      console.log('🔄 [UPDATE] Actualizando SEO...');
      page.seo = updateData.seo;
      page.markModified('seo');
    }
    if (updateData.theme) {
      console.log('🔄 [UPDATE] Actualizando theme...');
      page.theme = updateData.theme;
      page.markModified('theme');
    }
    if (updateData.isPublished !== undefined) {
      console.log('🔄 [UPDATE] Actualizando isPublished...');
      page.isPublished = updateData.isPublished;
    }
    page.lastUpdated = updateData.lastUpdated;
    page.updatedBy = updateData.updatedBy;
    
    // 🔍 [DEBUG] Logging antes del guardado
    console.log('🔍 [ANTES SAVE] Verificando datos a guardar...');
    if (page.content?.solutions?.cardsDesign?.light?.borderWidth) {
      console.log('🔍 [ANTES SAVE] borderWidth:', page.content.solutions.cardsDesign.light.borderWidth);
    }
    
    // Guardar cambios
    console.log('💾 [SAVE] Iniciando save() a MongoDB...');
    await page.save();
    console.log('✅ [SAVE] save() completado');
    
    // 🔍 [DEBUG] Logging después del guardado
    console.log('🔍 [DESPUÉS SAVE] Verificando datos guardados...');
    const verifyPage = await Page.findOne({ pageSlug: slug });
    if (verifyPage.content?.solutions?.cardsDesign?.light?.borderWidth) {
      console.log('🔍 [DESPUÉS SAVE] borderWidth en BD:', verifyPage.content.solutions.cardsDesign.light.borderWidth);
    }
    
    console.log('✅ Guardado en DB');
    
    // Actualizar referencias de imágenes
    if (oldPage) {
      await updateImageReferences(
        oldPage.toObject(), 
        page.toObject(), 
        'Page', 
        page._id
      ).catch(error => {
        console.error('Error actualizando referencias de imágenes:', error);
      });
    }
    
    // Convertir de vuelta a formato frontend antes de enviar respuesta
    const pageObj = page.toObject();
    if (pageObj.theme) {
      if (pageObj.theme.lightMode?.buttons) {
        pageObj.theme.lightMode.buttons = convertButtonsToFrontend(pageObj.theme.lightMode.buttons);
      }
      if (pageObj.theme.darkMode?.buttons) {
        pageObj.theme.darkMode.buttons = convertButtonsToFrontend(pageObj.theme.darkMode.buttons);
      }
    }
    
    res.json({
      success: true,
      message: 'Página actualizada correctamente',
      data: pageObj
    });
  } catch (error) {
    console.error('Error al actualizar página:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar página',
      error: error.message
    });
  }
};

// @desc    Crear o inicializar una página
// @route   POST /api/cms/pages
// @access  Private
export const createPage = async (req, res) => {
  try {
    const { pageSlug, pageName, content, seo } = req.body;
    
    // Verificar si ya existe
    const existingPage = await Page.findOne({ pageSlug });
    if (existingPage) {
      return res.status(400).json({
        success: false,
        message: `La página '${pageSlug}' ya existe`
      });
    }
    
    const page = await Page.create({
      pageSlug,
      pageName,
      content: content || {},
      seo: seo || {},
      updatedBy: req.user?.email || 'admin'
    });
    
    res.status(201).json({
      success: true,
      message: 'Página creada correctamente',
      data: page
    });
  } catch (error) {
    console.error('Error al crear página:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear página',
      error: error.message
    });
  }
};

// @desc    Inicializar página Home con datos por defecto
// @route   POST /api/cms/pages/init-home
// @access  Private
export const initHomePage = async (req, res) => {
  try {
    // Verificar si ya existe
    const existingPage = await Page.findOne({ pageSlug: 'home' });
    if (existingPage) {
      return res.status(400).json({
        success: false,
        message: 'La página Home ya está inicializada',
        data: existingPage
      });
    }
    
    // Crear página Home con contenido por defecto
    const homePage = await Page.create({
      pageSlug: 'home',
      pageName: 'Página Principal',
      content: {
        hero: {
          title: 'Transformamos tu empresa con tecnología inteligente',
          subtitle: 'Innovamos para que tu empresa avance al ritmo de la tecnología.',
          description: 'Transformamos procesos con soluciones digitales, proyectos de software y modelos de IA personalizados.',
          ctaText: 'Conoce nuestros servicios',
          ctaLink: '#servicios'
        },
        solutions: {
          title: 'Soluciones',
          description: 'En el dinámico entorno empresarial de hoy, la tecnología es la columna vertebral del éxito. Impulsa la innovación, seguridad y el crecimiento de tu negocio.',
          items: [
            {
              icon: '💻',
              title: 'Soluciones Digitales',
              description: 'Transformamos tu negocio con estrategias digitales innovadoras',
              gradient: 'from-purple-600 to-purple-400'
            },
            {
              icon: '👨‍💻',
              title: 'Proyectos de Software',
              description: 'Desarrollamos software a medida que impulsa tu crecimiento',
              gradient: 'from-cyan-600 to-cyan-400'
            },
            {
              icon: '🤖',
              title: 'Modelos de IA',
              description: 'Implementamos inteligencia artificial personalizada para tu empresa',
              gradient: 'from-amber-600 to-amber-400'
            }
          ]
        }
      },
      seo: {
        metaTitle: 'Scuti Company - Transformamos tu empresa con tecnología inteligente',
        metaDescription: 'Soluciones digitales, proyectos de software y modelos de IA personalizados. Innovamos para que tu empresa avance al ritmo de la tecnología.',
        keywords: ['tecnología', 'software', 'IA', 'inteligencia artificial', 'soluciones digitales', 'desarrollo web', 'transformación digital'],
        ogTitle: 'Scuti Company - Tecnología Inteligente para tu Empresa',
        ogDescription: 'Transformamos procesos con soluciones digitales innovadoras',
        ogImage: '/images/og-home.jpg',
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
      updatedBy: 'system'
    });
    
    res.status(201).json({
      success: true,
      message: 'Página Home inicializada correctamente',
      data: homePage
    });
  } catch (error) {
    console.error('Error al inicializar página Home:', error);
    res.status(500).json({
      success: false,
      message: 'Error al inicializar página Home',
      error: error.message
    });
  }
};
