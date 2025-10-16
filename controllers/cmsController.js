import Page from '../models/Page.js';

// Helper: Convertir estructura de botones simplificada (nuevo formato)
const convertButtonsToBackend = (buttons) => {
  if (!buttons) return buttons;
  
  const converted = {};
  for (const [key, button] of Object.entries(buttons)) {
    // Nuevo formato simplificado: background, textColor, borderColor
    converted[key] = {
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
    
    // Convertir estructura de botones para el frontend
    const pagesWithConvertedButtons = pages.map(page => {
      const pageObj = page.toObject();
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
    
    res.json({
      success: true,
      count: pagesWithConvertedButtons.length,
      data: pagesWithConvertedButtons
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
      data: pageObj
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
    
    const page = await Page.findOneAndUpdate(
      { pageSlug: slug },
      updateData,
      {
        new: true, // Retornar documento actualizado
        runValidators: true // Validar datos
      }
    );
    
    if (!page) {
      return res.status(404).json({
        success: false,
        message: `Página '${slug}' no encontrada`
      });
    }
    
    console.log('💾 Página guardada en base de datos');
    
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
