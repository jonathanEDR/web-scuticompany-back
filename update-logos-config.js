import mongoose from 'mongoose';

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/web-scuti')
  .then(async () => {
    console.log('✅ Conectado a MongoDB');
    
    // Definir el schema mínimo
    const PageSchema = new mongoose.Schema({}, { strict: false });
    const Page = mongoose.model('Page', PageSchema);
    
    // Buscar la página Home por diferentes criterios
    let homePage = await Page.findOne({ 
      $or: [
        { name: 'home' },
        { name: 'Home' },
        { slug: 'home' },
        { 'content.hero': { $exists: true } } // La página principal tiene hero
      ]
    });
    
    if (!homePage) {
      // Listar todas las páginas para debug
      const allPages = await Page.find({}).limit(5);
      console.log('📋 Páginas encontradas:');
      allPages.forEach((p, i) => {
        console.log(`  ${i+1}. ID: ${p._id}, Slug: ${p.slug || 'N/A'}, Name: ${p.name || 'N/A'}`);
      });
      
      // Intentar tomar la primera página
      homePage = allPages[0];
      if (!homePage) {
        console.error('❌ No hay páginas en la base de datos');
        process.exit(1);
      }
      console.log(`⚠️  Usando la primera página encontrada: ${homePage._id}`);
    }
    
    console.log('📄 Página Home encontrada');
    
    // Asegurar que existe la estructura
    if (!homePage.content) homePage.content = {};
    if (!homePage.content.valueAdded) homePage.content.valueAdded = {};
    if (!homePage.content.valueAdded.logosBarDesign) {
      homePage.content.valueAdded.logosBarDesign = { light: {}, dark: {} };
    }
    
    // Configuración de animaciones de burbujas para tema LIGHT (limpia, sin propiedades obsoletas)
    homePage.content.valueAdded.logosBarDesign.light = {
      animationsEnabled: true,
      rotationMode: 'individual',
      animationSpeed: 'normal',
      hoverEffects: true,
      hoverIntensity: 'normal',
      glowEffects: true,
      autoDetectTech: true,
      logoSize: 'large',
      logoSpacing: 'normal',
      logoFormat: 'rectangle',
      maxLogoWidth: 'medium',
      uniformSize: false
    };
    
    // Configuración de animaciones de burbujas para tema DARK (limpia, sin propiedades obsoletas)
    homePage.content.valueAdded.logosBarDesign.dark = {
      animationsEnabled: true,
      rotationMode: 'individual',
      animationSpeed: 'normal',
      hoverEffects: true,
      hoverIntensity: 'normal',
      glowEffects: true,
      autoDetectTech: true,
      logoSize: 'medium',
      logoSpacing: 'normal',
      logoFormat: 'rectangle',
      maxLogoWidth: 'medium',
      uniformSize: false
    };
    
    // Guardar cambios
    await homePage.save();
    
    console.log('✅ Configuración de logos actualizada correctamente');
    console.log('🎈 Animaciones de burbujas HABILITADAS');
    console.log('');
    console.log('Configuración aplicada:');
    console.log('  - Animaciones: HABILITADAS');
    console.log('  - Modo: Individual (burbujas)');
    console.log('  - Velocidad: Normal');
    console.log('  - Hover: HABILITADO');
    console.log('  - Efectos de brillo: HABILITADOS');
    console.log('');
    console.log('🔄 Recarga la página en el navegador (Ctrl+F5) para ver los cambios');
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
