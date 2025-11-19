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
    
    // Asegurar estructura
    if (!homePage.content.valueAdded.logosBarDesign) {
      homePage.content.valueAdded.logosBarDesign = { light: {}, dark: {} };
    }
    
    // Aumentar tamaño de logos a 'large'
    homePage.content.valueAdded.logosBarDesign.light.logoSize = 'large';
    homePage.content.valueAdded.logosBarDesign.dark.logoSize = 'large';
    
    // Aumentar espaciado para más separación
    homePage.content.valueAdded.logosBarDesign.light.logoSpacing = 'wide';
    homePage.content.valueAdded.logosBarDesign.dark.logoSpacing = 'wide';
    
    await homePage.save();
    
    console.log('✅ Tamaño de logos actualizado a LARGE');
    console.log('✅ Espaciado actualizado a WIDE');
    console.log('\n🎈 Los logos ahora serán más grandes y visibles');
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
