import mongoose from 'mongoose';
import Page from './models/Page.js';
import dotenv from 'dotenv';

dotenv.config();

const updatePagesWithButtonThemes = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔌 Conectado a MongoDB');

    // Definir configuraciones de botones por defecto
    const defaultButtonThemes = {
      lightMode: {
        buttons: {
          ctaPrimary: {
            background: 'linear-gradient(90deg, #8B5CF6, #06B6D4, #8B5CF6)',
            text: '#FFFFFF',
            border: 'transparent',
            hoverBackground: 'linear-gradient(90deg, #7C3AED, #0891B2, #7C3AED)'
          },
          contact: {
            background: 'transparent',
            text: '#06B6D4',
            border: '#06B6D4',
            hoverBackground: '#06B6D4',
            hoverText: '#FFFFFF'
          },
          dashboard: {
            background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)',
            text: '#FFFFFF',
            border: 'transparent',
            hoverBackground: 'linear-gradient(90deg, #7C3AED, #0891B2)'
          }
        }
      },
      darkMode: {
        buttons: {
          ctaPrimary: {
            background: 'linear-gradient(90deg, #A78BFA, #22D3EE, #A78BFA)',
            text: '#111827',
            border: 'transparent',
            hoverBackground: 'linear-gradient(90deg, #8B5CF6, #06B6D4, #8B5CF6)'
          },
          contact: {
            background: 'transparent',
            text: '#22D3EE',
            border: '#22D3EE',
            hoverBackground: '#22D3EE',
            hoverText: '#111827'
          },
          dashboard: {
            background: 'linear-gradient(90deg, #A78BFA, #22D3EE)',
            text: '#111827',
            border: 'transparent',
            hoverBackground: 'linear-gradient(90deg, #8B5CF6, #06B6D4)'
          }
        }
      }
    };

    // Actualizar todas las páginas
    const pages = await Page.find({});
    
    for (const page of pages) {
      // Si no tiene tema, crear uno
      if (!page.theme) {
        page.theme = {
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
        };
      }

      // Agregar configuraciones de botones
      if (!page.theme.lightMode.buttons) {
        page.theme.lightMode.buttons = defaultButtonThemes.lightMode.buttons;
      }
      
      if (!page.theme.darkMode.buttons) {
        page.theme.darkMode.buttons = defaultButtonThemes.darkMode.buttons;
      }

      await page.save();
      console.log(`✅ Actualizada página: ${page.pageName}`);
    }

    console.log('🎉 Todas las páginas han sido actualizadas con configuraciones de botones');

  } catch (error) {
    console.error('❌ Error actualizando páginas:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
};

// Ejecutar la actualización
updatePagesWithButtonThemes();