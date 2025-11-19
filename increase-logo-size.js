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
    
    // Aumentar tamaño de logos para mejor visibilidad
    if (homePage.content?.valueAdded?.logosBarDesign) {
      if (homePage.content.valueAdded.logosBarDesign.light) {
        homePage.content.valueAdded.logosBarDesign.light.logoSize = 'large';
        homePage.content.valueAdded.logosBarDesign.light.logoSpacing = 'wide';
      }
      
      if (homePage.content.valueAdded.logosBarDesign.dark) {
        homePage.content.valueAdded.logosBarDesign.dark.logoSize = 'large';
        homePage.content.valueAdded.logosBarDesign.dark.logoSpacing = 'wide';
      }
      
      await homePage.save();
      
      console.log('✅ Tamaño de logos aumentado a LARGE');
      console.log('✅ Espaciado aumentado a WIDE');
      console.log('\n🎈 Los logos ahora deberían ser más visibles y grandes');
    } else {
      console.error('❌ No se encontró logosBarDesign');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
