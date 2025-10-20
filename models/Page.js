import mongoose from 'mongoose';

const PageSchema = new mongoose.Schema({
  pageSlug: {
    type: String,
    required: true,
    unique: true,
    enum: ['home', 'nosotros', 'servicios', 'contacto']
  },
  pageName: {
    type: String,
    required: true
  },
  content: {
    hero: {
      title: { type: String, default: '' },
      subtitle: { type: String, default: '' },
      description: { type: String, default: '' },
      ctaText: { type: String, default: 'Conoce nuestros servicios' },
      ctaLink: { type: String, default: '#servicios' },
      // Imágenes por tema
      backgroundImage: {
        light: { type: String, default: '' }, // Imagen para tema claro
        dark: { type: String, default: '' }   // Imagen para tema oscuro
      },
      backgroundImageAlt: { type: String, default: 'Hero background' },
      // Estilos de texto por tema
      styles: {
        light: {
          titleColor: { type: String, default: '' },
          subtitleColor: { type: String, default: '' },
          descriptionColor: { type: String, default: '' }
        },
        dark: {
          titleColor: { type: String, default: '' },
          subtitleColor: { type: String, default: '' },
          descriptionColor: { type: String, default: '' }
        }
      }
    },
    solutions: {
      title: { type: String, default: 'Soluciones' },
      description: { type: String, default: '' },
      // Imágenes por tema
      backgroundImage: {
        light: { type: String, default: '' }, // Imagen para tema claro
        dark: { type: String, default: '' }   // Imagen para tema oscuro
      },
      backgroundImageAlt: { type: String, default: 'Solutions background' },
      // Estilos de texto por tema
      styles: {
        light: {
          titleColor: { type: String, default: '' },
          descriptionColor: { type: String, default: '' }
        },
        dark: {
          titleColor: { type: String, default: '' },
          descriptionColor: { type: String, default: '' }
        }
      },
      items: [{
        iconLight: String,  // URL del icono para tema claro (PNG)
        iconDark: String,   // URL del icono para tema oscuro (PNG)
        title: String,
        description: String,
        gradient: String    // Mantener para compatibilidad
      }],
      // Diseño de tarjetas por tema
      cardsDesign: {
        light: {
          background: { type: String, default: 'rgba(0, 0, 0, 0.08)' },
          border: { type: String, default: 'rgba(0, 0, 0, 0.15)' },
          borderWidth: { type: String, default: '1px' },
          shadow: { type: String, default: '0 8px 32px rgba(0, 0, 0, 0.1)' },
          hoverBackground: { type: String, default: 'rgba(255, 255, 255, 0.25)' },
          hoverBorder: { type: String, default: 'rgba(139, 92, 246, 0.4)' },
          hoverShadow: { type: String, default: '0 20px 40px rgba(139, 92, 246, 0.15)' },
          iconGradient: { type: String, default: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' },
          iconBackground: { type: String, default: 'rgba(255, 255, 255, 0.9)' },
          iconColor: { type: String, default: '#1f2937' },
          titleColor: { type: String, default: '#1f2937' },
          descriptionColor: { type: String, default: '#4b5563' },
          linkColor: { type: String, default: '#a78bfa' },
          // Tamaño de tarjetas
          cardMinWidth: { type: String, default: '280px' },
          cardMaxWidth: { type: String, default: '100%' },
          cardMinHeight: { type: String, default: 'auto' },
          cardPadding: { type: String, default: '2rem' },
          // Alineación de tarjetas
          cardsAlignment: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
          // Configuración de iconos
          iconBorderEnabled: { type: Boolean, default: true },
          iconAlignment: { type: String, enum: ['left', 'center', 'right'], default: 'left' }
        },
        dark: {
          background: { type: String, default: 'rgba(255, 255, 255, 0.05)' },
          border: { type: String, default: 'rgba(255, 255, 255, 0.2)' },
          borderWidth: { type: String, default: '1px' },
          shadow: { type: String, default: '0 8px 32px rgba(0, 0, 0, 0.3)' },
          hoverBackground: { type: String, default: 'rgba(255, 255, 255, 0.08)' },
          hoverBorder: { type: String, default: 'rgba(139, 92, 246, 0.5)' },
          hoverShadow: { type: String, default: '0 20px 40px rgba(139, 92, 246, 0.2)' },
          iconGradient: { type: String, default: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' },
          iconBackground: { type: String, default: 'rgba(17, 24, 39, 0.8)' },
          iconColor: { type: String, default: '#ffffff' },
          titleColor: { type: String, default: '#ffffff' },
          descriptionColor: { type: String, default: '#d1d5db' },
          linkColor: { type: String, default: '#a78bfa' },
          // Tamaño de tarjetas
          cardMinWidth: { type: String, default: '280px' },
          cardMaxWidth: { type: String, default: '100%' },
          cardMinHeight: { type: String, default: 'auto' },
          cardPadding: { type: String, default: '2rem' },
          // Alineación de tarjetas
          cardsAlignment: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
          // Configuración de iconos
          iconBorderEnabled: { type: Boolean, default: true },
          iconAlignment: { type: String, enum: ['left', 'center', 'right'], default: 'left' }
        }
      }
    },
    valueAdded: {
      title: { type: String, default: 'Valor agregado' },
      description: { type: String, default: '' },
      showIcons: { type: Boolean, default: true }, // Controla si se muestran los iconos
      // Imágenes por tema
      backgroundImage: {
        light: { type: String, default: '' }, // Imagen para tema claro
        dark: { type: String, default: '' }   // Imagen para tema oscuro
      },
      backgroundImageAlt: { type: String, default: 'Value Added background' },
      // Estilos de texto por tema
      styles: {
        light: {
          titleColor: { type: String, default: '' },
          descriptionColor: { type: String, default: '' }
        },
        dark: {
          titleColor: { type: String, default: '' },
          descriptionColor: { type: String, default: '' }
        }
      },
      items: [{
        iconLight: String,  // URL del icono para tema claro (PNG)
        iconDark: String,   // URL del icono para tema oscuro (PNG)
        title: String,
        description: String,
        gradient: String
      }],
      // Logos de tecnologías/empresas que se muestran arriba de las tarjetas
      logos: [{
        name: String,       // Nombre del logo (ej: "SQL", "Python", "Java")
        imageUrl: String,   // URL de la imagen del logo
        alt: String,        // Texto alternativo
        link: String,       // URL opcional para hacer clickeable el logo
        order: { type: Number, default: 0 } // Orden de aparición
      }],
      // Configuración de la barra de logos
      logosBarDesign: {
        light: {
          background: { type: String, default: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)' },
          borderColor: { type: String, default: 'rgba(139, 92, 246, 0.15)' },
          borderWidth: { type: String, default: '1px' },
          borderRadius: { type: String, default: '1rem' }, // 16px
          shadow: { type: String, default: '0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.05)' },
          backdropBlur: { type: Boolean, default: true },
          disperseEffect: { type: Boolean, default: false } // Efecto de dispersión en los bordes
        },
        dark: {
          background: { type: String, default: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(31, 41, 55, 0.8) 100%)' },
          borderColor: { type: String, default: 'rgba(139, 92, 246, 0.25)' },
          borderWidth: { type: String, default: '1px' },
          borderRadius: { type: String, default: '1rem' }, // 16px
          shadow: { type: String, default: '0 8px 32px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(255, 255, 255, 0.05)' },
          backdropBlur: { type: Boolean, default: true },
          disperseEffect: { type: Boolean, default: false } // Efecto de dispersión en los bordes
        }
      },
      // Diseño de tarjetas por tema (similar a solutions)
      cardsDesign: {
        light: {
          background: { type: String, default: 'rgba(255, 255, 255, 0.9)' },
          border: { type: String, default: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' },
          borderWidth: { type: String, default: '2px' },
          shadow: { type: String, default: '0 8px 32px rgba(0, 0, 0, 0.1)' },
          hoverBackground: { type: String, default: 'rgba(255, 255, 255, 0.95)' },
          hoverBorder: { type: String, default: 'linear-gradient(135deg, #a78bfa, #22d3ee)' },
          hoverShadow: { type: String, default: '0 20px 40px rgba(139, 92, 246, 0.2)' },
          iconGradient: { type: String, default: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' },
          iconBackground: { type: String, default: 'rgba(255, 255, 255, 0.9)' },
          iconColor: { type: String, default: '#7528ee' },
          titleColor: { type: String, default: '#1F2937' },
          descriptionColor: { type: String, default: '#4B5563' },
          linkColor: { type: String, default: '#06B6D4' },
          // Tamaño de tarjetas
          cardMinWidth: { type: String, default: '280px' },
          cardMaxWidth: { type: String, default: '350px' },
          cardMinHeight: { type: String, default: '200px' },
          cardPadding: { type: String, default: '2rem' },
          // Alineación de tarjetas
          cardsAlignment: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
          // Configuración de iconos
          iconBorderEnabled: { type: Boolean, default: false },
          iconAlignment: { type: String, enum: ['left', 'center', 'right'], default: 'center' }
        },
        dark: {
          background: { type: String, default: 'rgba(17, 24, 39, 0.9)' },
          border: { type: String, default: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' },
          borderWidth: { type: String, default: '2px' },
          shadow: { type: String, default: '0 8px 32px rgba(0, 0, 0, 0.5)' },
          hoverBackground: { type: String, default: 'rgba(31, 41, 55, 0.95)' },
          hoverBorder: { type: String, default: 'linear-gradient(135deg, #a78bfa, #22d3ee)' },
          hoverShadow: { type: String, default: '0 20px 40px rgba(139, 92, 246, 0.3)' },
          iconGradient: { type: String, default: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' },
          iconBackground: { type: String, default: 'rgba(17, 24, 39, 0.8)' },
          iconColor: { type: String, default: '#ffffff' },
          titleColor: { type: String, default: '#FFFFFF' },
          descriptionColor: { type: String, default: '#D1D5DB' },
          linkColor: { type: String, default: '#a78bfa' },
          // Tamaño de tarjetas
          cardMinWidth: { type: String, default: '280px' },
          cardMaxWidth: { type: String, default: '350px' },
          cardMinHeight: { type: String, default: '200px' },
          cardPadding: { type: String, default: '2rem' },
          // Alineación de tarjetas
          cardsAlignment: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
          // Configuración de iconos
          iconBorderEnabled: { type: Boolean, default: false },
          iconAlignment: { type: String, enum: ['left', 'center', 'right'], default: 'center' }
        }
      }
    },
    contact: {
      phone: { type: String, default: '+51 973 397 306' },
      email: { type: String, default: 'corpocomunicados@gmail.com' },
      socialLinks: [{
        name: { type: String, required: true }, // facebook, twitter, instagram, whatsapp, etc.
        url: { type: String, required: true },
        icon: { type: String, default: '' }, // URL del icono personalizado
        enabled: { type: Boolean, default: true }
      }]
    },
    sections: [
      {
        type: {
          type: String,
          enum: ['text', 'image', 'grid', 'cta']
        },
        title: String,
        content: mongoose.Schema.Types.Mixed,
        order: Number
      }
    ]
  },
  seo: {
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    keywords: { type: [String], default: [] },
    ogTitle: { type: String, default: '' },
    ogDescription: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    twitterCard: { type: String, default: 'summary_large_image' }
  },
  theme: {
    default: { 
      type: String, 
      enum: ['light', 'dark'], 
      default: 'light' 
    },
    lightMode: {
      // Colores base
      primary: { type: String, default: '#8B5CF6' },
      secondary: { type: String, default: '#06B6D4' },
      background: { type: String, default: '#FFFFFF' },
      text: { type: String, default: '#1F2937' },
      textSecondary: { type: String, default: '#6B7280' },
      cardBg: { type: String, default: '#F9FAFB' },
      border: { type: String, default: '#E5E7EB' },
      
      // Botones específicos - Formato simplificado (background, textColor, borderColor)
      buttons: {
        // Botón "Conoce nuestros servicios"
        ctaPrimary: {
          text: { type: String, default: 'Conoce nuestros servicios' },
          background: { type: String, default: 'linear-gradient(90deg, #8B5CF6, #06B6D4, #8B5CF6)' },
          textColor: { type: String, default: '#FFFFFF' },
          borderColor: { type: String, default: 'transparent' }
        },
        // Botón "CONTÁCTANOS"
        contact: {
          text: { type: String, default: 'CONTÁCTANOS' },
          background: { type: String, default: 'transparent' },
          textColor: { type: String, default: '#8B5CF6' },
          borderColor: { type: String, default: 'linear-gradient(90deg, #8B5CF6, #06B6D4)' }
        },
        // Botón "Ir al Dashboard"
        dashboard: {
          text: { type: String, default: 'Ir al Dashboard' },
          background: { type: String, default: 'linear-gradient(90deg, #8B5CF6, #06B6D4)' },
          textColor: { type: String, default: '#FFFFFF' },
          borderColor: { type: String, default: 'transparent' }
        },
        // Botón "Ver más..." 
        viewMore: {
          text: { type: String, default: 'Ver más...' },
          background: { type: String, default: 'linear-gradient(135deg, #01c2cc 0%, #7528ee 100%)' },
          textColor: { type: String, default: '#FFFFFF' },
          borderColor: { type: String, default: 'transparent' }
        }
      }
    },
    darkMode: {
      // Colores base
      primary: { type: String, default: '#A78BFA' },
      secondary: { type: String, default: '#22D3EE' },
      background: { type: String, default: '#111827' },
      text: { type: String, default: '#F9FAFB' },
      textSecondary: { type: String, default: '#D1D5DB' },
      cardBg: { type: String, default: '#1F2937' },
      border: { type: String, default: '#374151' },
      
      // Botones específicos - Formato simplificado (background, textColor, borderColor)
      buttons: {
        // Botón "Conoce nuestros servicios"
        ctaPrimary: {
          text: { type: String, default: 'Conoce nuestros servicios' },
          background: { type: String, default: 'linear-gradient(90deg, #A78BFA, #22D3EE, #A78BFA)' },
          textColor: { type: String, default: '#111827' },
          borderColor: { type: String, default: 'transparent' }
        },
        // Botón "CONTÁCTANOS"
        contact: {
          text: { type: String, default: 'CONTÁCTANOS' },
          background: { type: String, default: 'transparent' },
          textColor: { type: String, default: '#A78BFA' },
          borderColor: { type: String, default: 'linear-gradient(90deg, #A78BFA, #22D3EE)' }
        },
        // Botón "Ir al Dashboard"
        dashboard: {
          text: { type: String, default: 'Ir al Dashboard' },
          background: { type: String, default: 'linear-gradient(90deg, #A78BFA, #22D3EE)' },
          textColor: { type: String, default: '#111827' },
          borderColor: { type: String, default: 'transparent' }
        },
        // Botón "Ver más..."
        viewMore: {
          text: { type: String, default: 'Ver más...' },
          background: { type: String, default: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)' },
          textColor: { type: String, default: '#111827' },
          borderColor: { type: String, default: 'transparent' }
        }
      }
    }
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true
});

// Importar y configurar tracking de cambios
import setupPageChangeTracking from '../utils/pageChangeTracker.js';

const Page = mongoose.model('Page', PageSchema);

// Configurar tracking
setupPageChangeTracking(Page);

export default Page;
