import mongoose from 'mongoose';
import Page from '../models/Page.js';

// Conectar a MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/web-scuti');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Corregir estilos de Value Added
const fixValueAddedStyles = async () => {
  try {
    console.log('🔧 Corrigiendo estilos de Value Added...');
    
    const page = await Page.findOne({ pageSlug: 'home' });
    
    if (!page) {
      console.log('❌ Página home no encontrada');
      return;
    }
    
    // Configuración correcta para tema oscuro (fondo blanco, texto negro)
    const correctDarkStyles = {
      background: 'rgba(255, 255, 255, 0.95)',  // ✅ Fondo blanco
      border: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
      borderWidth: '2px',
      shadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      hoverBackground: 'rgba(255, 255, 255, 1)',
      hoverBorder: 'linear-gradient(135deg, #a78bfa, #22d3ee)',
      hoverShadow: '0 20px 40px rgba(139, 92, 246, 0.3)',
      iconGradient: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
      iconBackground: 'rgba(255, 255, 255, 0.9)',
      iconColor: '#7528ee',
      titleColor: '#1F2937',      // ✅ Texto negro
      descriptionColor: '#4B5563', // ✅ Gris oscuro
      linkColor: '#06B6D4',
      cardMinWidth: '280px',
      cardMaxWidth: '350px',
      cardMinHeight: '200px',
      cardPadding: '2rem',
      cardsAlignment: 'center',
      iconBorderEnabled: false,
      iconAlignment: 'center'
    };
    
    // Actualizar solo los estilos del tema oscuro
    page.content.valueAdded.cardsDesign.dark = correctDarkStyles;
    
    await page.save();
    
    console.log('✅ Estilos de Value Added actualizados correctamente');
    console.log('📝 Tema oscuro ahora tiene:');
    console.log('   - Fondo: rgba(255, 255, 255, 0.95) (blanco)');
    console.log('   - Título: #1F2937 (negro)');
    console.log('   - Descripción: #4B5563 (gris oscuro)');
    
  } catch (error) {
    console.error('❌ Error al corregir estilos:', error);
  }
};

// Ejecutar script
const main = async () => {
  await connectDB();
  await fixValueAddedStyles();
  process.exit(0);
};

main();