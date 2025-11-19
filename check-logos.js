import mongoose from 'mongoose';

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/web-scuti')
  .then(async () => {
    console.log('✅ Conectado a MongoDB\n');
    
    const PageSchema = new mongoose.Schema({}, { strict: false });
    const Page = mongoose.model('Page', PageSchema);
    
    const homePage = await Page.findOne({ 
      $or: [
        { name: 'home' },
        { name: 'Home' },
        { slug: 'home' },
        { 'content.hero': { $exists: true } }
      ]
    });
    
    if (!homePage) {
      console.error('❌ Página Home no encontrada');
      process.exit(1);
    }
    
    console.log('📄 Página Home encontrada\n');
    console.log('=== DIAGNÓSTICO DE LOGOS ===\n');
    
    // Verificar si existen logos
    const logos = homePage.content?.valueAdded?.logos;
    
    if (!logos || logos.length === 0) {
      console.log('❌ NO HAY LOGOS CONFIGURADOS');
      console.log('');
      console.log('📝 Necesitas agregar logos desde el CMS:');
      console.log('   1. Ve a: http://localhost:5173/dashboard/cms');
      console.log('   2. Edita la página "Home"');
      console.log('   3. Ve a la sección "Logos de Tecnologías"');
      console.log('   4. Haz clic en "Agregar Logo"');
      console.log('   5. Agrega logos como: Python, React, Node.js, etc.');
      console.log('');
    } else {
      console.log(`✅ Se encontraron ${logos.length} logos configurados:\n`);
      logos.forEach((logo, index) => {
        console.log(`${index + 1}. ${logo.name || 'Sin nombre'}`);
        console.log(`   - URL: ${logo.imageUrl || 'Sin URL'}`);
        console.log(`   - Alt: ${logo.alt || 'Sin texto alt'}`);
        console.log(`   - Orden: ${logo.order || 0}`);
        console.log('');
      });
    }
    
    // Verificar configuración de animaciones
    console.log('=== CONFIGURACIÓN DE ANIMACIONES ===\n');
    const animConfig = homePage.content?.valueAdded?.logosBarDesign?.light;
    
    if (animConfig) {
      console.log('✅ Configuración de animaciones:');
      console.log(`   - Animaciones habilitadas: ${animConfig.animationsEnabled ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   - Modo: ${animConfig.rotationMode || 'No configurado'}`);
      console.log(`   - Velocidad: ${animConfig.animationSpeed || 'No configurado'}`);
      console.log(`   - Hover: ${animConfig.hoverEffects ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   - Efectos de brillo: ${animConfig.glowEffects ? '✅ SÍ' : '❌ NO'}`);
    } else {
      console.log('❌ No hay configuración de animaciones');
    }
    
    console.log('');
    console.log('=== RESUMEN ===');
    console.log(`Logos configurados: ${logos?.length || 0}`);
    console.log(`Animaciones: ${animConfig?.animationsEnabled ? 'HABILITADAS ✅' : 'DESHABILITADAS ❌'}`);
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
