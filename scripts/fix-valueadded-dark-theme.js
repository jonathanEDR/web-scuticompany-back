import mongoose from 'mongoose';
import connectDB from '../config/database.js';

// Definir el esquema y modelo de Page
const pageSchema = new mongoose.Schema({
  pageSlug: String,
  pageName: String,
  content: mongoose.Schema.Types.Mixed,
  isPublished: Boolean
}, { timestamps: true });

const Page = mongoose.model('Page', pageSchema, 'pages');

async function fixDarkTheme() {
  try {
    // Conectar a la base de datos
    await connectDB();
    console.log('✅ Conectado a MongoDB');

    // Buscar la página home
    const page = await Page.findOne({ pageSlug: 'home' });
    
    if (!page) {
      console.error('❌ Página home no encontrada');
      process.exit(1);
    }

    console.log('📄 Página encontrada:', page.pageName);
    console.log('🎨 Estilos oscuros actuales:', JSON.stringify(page.content.valueAdded.cardsDesign.dark, null, 2));

    // Corregir los estilos del tema oscuro
    page.content.valueAdded.cardsDesign.dark = {
      background: 'rgba(17, 24, 39, 0.9)',
      border: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
      borderWidth: '2px',
      shadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      hoverBackground: 'rgba(31, 41, 55, 0.95)',
      hoverBorder: 'linear-gradient(135deg, #a78bfa, #22d3ee)',
      hoverShadow: '0 20px 40px rgba(139, 92, 246, 0.3)',
      iconGradient: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
      iconBackground: 'rgba(17, 24, 39, 0.8)',
      iconColor: '#ffffff',
      titleColor: '#FFFFFF',
      descriptionColor: '#D1D5DB',
      linkColor: '#a78bfa',
      cardMinWidth: '280px',
      cardMaxWidth: '350px',
      cardMinHeight: '200px',
      cardPadding: '2rem',
      cardsAlignment: 'center',
      iconBorderEnabled: false,
      iconAlignment: 'center'
    };

    // Guardar los cambios
    await page.save();
    
    console.log('\n✅ Estilos del tema oscuro corregidos exitosamente');
    console.log('🎨 Nuevos estilos:', JSON.stringify(page.content.valueAdded.cardsDesign.dark, null, 2));

    // Cerrar conexión
    await mongoose.connection.close();
    console.log('\n👋 Conexión cerrada');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixDarkTheme();
