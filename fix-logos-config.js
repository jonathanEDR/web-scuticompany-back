import mongoose from 'mongoose';

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/web-scuti')
  .then(async () => {
    console.log('✅ Conectado a MongoDB');
    
    // Definir el schema mínimo
    const PageSchema = new mongoose.Schema({}, { strict: false });
    const Page = mongoose.model('Page', PageSchema);
    
    // Buscar la página Home
    let homePage = await Page.findOne({ 
      $or: [
        { name: 'home' },
        { name: 'Home' },
        { slug: 'home' },
        { pageSlug: 'home' },
        { 'content.hero': { $exists: true } }
      ]
    });
    
    if (!homePage) {
      const allPages = await Page.find({}).limit(5);
      console.log('📋 Páginas encontradas:');
      allPages.forEach((p, i) => {
        console.log(`  ${i+1}. ID: ${p._id}, Slug: ${p.pageSlug || 'N/A'}`);
      });
      homePage = allPages[0];
      if (!homePage) {
        console.error('❌ No hay páginas en la base de datos');
        process.exit(1);
      }
    }
    
    console.log(`📄 Página encontrada: ${homePage.pageSlug || homePage.slug || homePage._id}`);
    
    // Mostrar configuración ANTES
    console.log('\n=== CONFIGURACIÓN ANTES ===');
    if (homePage.content?.valueAdded?.logosBarDesign?.light) {
      console.log('🌞 Light:', Object.keys(homePage.content.valueAdded.logosBarDesign.light));
    }
    if (homePage.content?.valueAdded?.logosBarDesign?.dark) {
      console.log('🌙 Dark:', Object.keys(homePage.content.valueAdded.logosBarDesign.dark));
    }
    
    // Asegurar estructura
    if (!homePage.content) homePage.content = {};
    if (!homePage.content.valueAdded) homePage.content.valueAdded = {};
    
    // 🔥 CONFIGURACIÓN NUEVA LIMPIA (SOLO propiedades válidas)
    const cleanConfig = {
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
    
    // 🔥 REEMPLAZAR COMPLETAMENTE (no merge, REEMPLAZO TOTAL)
    homePage.content.valueAdded.logosBarDesign = {
      light: { ...cleanConfig },
      dark: { ...cleanConfig }
    };
    
    // Guardar con markModified para forzar actualización
    homePage.markModified('content.valueAdded.logosBarDesign');
    await homePage.save();
    
    console.log('\n=== CONFIGURACIÓN DESPUÉS ===');
    console.log('🌞 Light:', Object.keys(homePage.content.valueAdded.logosBarDesign.light));
    console.log('🌙 Dark:', Object.keys(homePage.content.valueAdded.logosBarDesign.dark));
    
    console.log('\n✅ Configuración REEMPLAZADA completamente');
    console.log('🎈 Animaciones de burbujas configuradas correctamente');
    
    // Verificar que se guardó correctamente
    const verifyPage = await Page.findById(homePage._id);
    const lightKeys = Object.keys(verifyPage.content.valueAdded.logosBarDesign.light);
    const hasOldProps = lightKeys.some(key => 
      ['background', 'borderColor', 'borderWidth', 'borderRadius', 'shadow', 'backdropBlur'].includes(key)
    );
    
    if (hasOldProps) {
      console.error('\n❌ ERROR: Todavía existen propiedades viejas:');
      console.error('   Propiedades encontradas:', lightKeys);
    } else {
      console.log('\n✅ VERIFICADO: Solo propiedades nuevas presentes');
      console.log('   Propiedades:', lightKeys);
    }
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    mongoose.disconnect();
    process.exit(1);
  });
