import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/web-scuti')
  .then(async () => {
    console.log('✅ Conectado a MongoDB\n');
    
    const PageSchema = new mongoose.Schema({}, { strict: false });
    const Page = mongoose.model('Page', PageSchema);
    
    const homePage = await Page.findOne({ slug: 'home' });
    
    if (!homePage) {
      console.error('❌ Página home no encontrada');
      process.exit(1);
    }
    
    const lightConfig = homePage.content?.valueAdded?.logosBarDesign?.light;
    const darkConfig = homePage.content?.valueAdded?.logosBarDesign?.dark;
    
    console.log('=== CONFIGURACIÓN ACTUAL EN BASE DE DATOS ===\n');
    console.log('🌞 LIGHT Config (stringificada):');
    console.log(JSON.stringify(lightConfig, null, 2));
    console.log('\n🌙 DARK Config (stringificada):');
    console.log(JSON.stringify(darkConfig, null, 2));
    
    console.log('\n=== VERIFICACIÓN DE PROPIEDADES ===');
    console.log('✅ LIGHT.animationsEnabled:', lightConfig?.animationsEnabled);
    console.log('✅ LIGHT.rotationMode:', lightConfig?.rotationMode);
    console.log('❌ LIGHT.background (obsoleta):', lightConfig?.background ? '⚠️ EXISTE' : '✅ No existe');
    console.log('❌ LIGHT.borderColor (obsoleta):', lightConfig?.borderColor ? '⚠️ EXISTE' : '✅ No existe');
    console.log('❌ LIGHT.shadow (obsoleta):', lightConfig?.shadow ? '⚠️ EXISTE' : '✅ No existe');
    
    console.log('\n✅ Logos encontrados:', homePage.content?.valueAdded?.logos?.length || 0);
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
