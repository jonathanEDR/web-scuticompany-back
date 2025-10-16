import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Configuración del entorno
dotenv.config();

// Función para actualizar la página home con configuración de botones separada
const updateHomePageWithButtonThemes = async () => {
  // Conectar a MongoDB
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti');
  console.log('📦 Conectado a MongoDB');
  try {
    console.log('🔄 Actualizando configuración de botones para temas claro y oscuro...');

    const result = await mongoose.connection.db.collection('pages').updateOne(
      { pageSlug: 'home' },
      {
        $set: {
          'theme.lightMode.buttons': {
            ctaPrimary: {
              background: 'linear-gradient(90deg, #8B5CF6, #06B6D4, #8B5CF6)',
              text: '#FFFFFF',
              border: 'transparent',
              hoverBackground: 'linear-gradient(90deg, #7C3AED, #0891B2, #7C3AED)'
            },
            contact: {
              background: 'transparent',
              text: '#06B6D4', // Azul para tema claro
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
          },
          'theme.darkMode.buttons': {
            ctaPrimary: {
              background: 'linear-gradient(90deg, #A78BFA, #22D3EE, #A78BFA)',
              text: '#111827',
              border: 'transparent',
              hoverBackground: 'linear-gradient(90deg, #8B5CF6, #06B6D4, #8B5CF6)'
            },
            contact: {
              background: 'transparent',
              text: '#22D3EE', // Cian más brillante para tema oscuro
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
      }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Configuración de botones actualizada correctamente');
      console.log('📋 Botones configurados:');
      console.log('   🚀 CTA Principal: Mismo para ambos temas');
      console.log('   📞 CONTÁCTANOS: #06B6D4 (claro) / #22D3EE (oscuro)');
      console.log('   🎯 Dashboard: Mismo para ambos temas');
    } else {
      console.log('ℹ️ No se realizaron cambios (página ya actualizada)');
    }

    // Verificar los cambios
    const updatedPage = await mongoose.connection.db.collection('pages').findOne({ pageSlug: 'home' });
    
    console.log('\n📊 Verificación de configuración:');
    console.log('Tema Claro - Contacto:', updatedPage.theme?.lightMode?.buttons?.contact?.text);
    console.log('Tema Oscuro - Contacto:', updatedPage.theme?.darkMode?.buttons?.contact?.text);

  } catch (error) {
    console.error('❌ Error al actualizar:', error);
  } finally {
    mongoose.disconnect();
  }
};

// Ejecutar la función
updateHomePageWithButtonThemes();