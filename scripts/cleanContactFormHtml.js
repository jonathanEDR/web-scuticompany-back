import mongoose from 'mongoose';
import Page from '../models/Page.js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

/**
 * Script para limpiar etiquetas HTML de los campos de texto del formulario de contacto
 */

// Función para limpiar HTML
const stripHtml = (html) => {
  if (!html) return '';
  if (typeof html !== 'string') return html;
  if (!html.includes('<')) return html;
  
  // Remover etiquetas HTML comunes
  return html
    .replace(/<\/?p>/gi, '')
    .replace(/<\/?span[^>]*>/gi, '')
    .replace(/<\/?div[^>]*>/gi, '')
    .replace(/<\/?h[1-6][^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .trim();
};

const cleanContactFormData = async () => {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scuti');
    console.log('✅ Conectado a MongoDB\n');

    console.log('🔍 Buscando páginas con formularios de contacto...');
    const pages = await Page.find({ 'content.contactForm': { $exists: true } });
    
    console.log(`📄 Encontradas ${pages.length} páginas\n`);

    let updatedCount = 0;

    for (const page of pages) {
      let hasChanges = false;
      const contactForm = page.content.contactForm;

      console.log(`\n📝 Procesando página: ${page.pageName} (${page.pageSlug})`);

      // Limpiar title
      if (contactForm.title && contactForm.title.includes('<')) {
        const cleaned = stripHtml(contactForm.title);
        console.log(`  🧹 Title: "${contactForm.title}" → "${cleaned}"`);
        contactForm.title = cleaned;
        hasChanges = true;
      }

      // Limpiar subtitle
      if (contactForm.subtitle && contactForm.subtitle.includes('<')) {
        const cleaned = stripHtml(contactForm.subtitle);
        console.log(`  🧹 Subtitle: "${contactForm.subtitle}" → "${cleaned}"`);
        contactForm.subtitle = cleaned;
        hasChanges = true;
      }

      // Limpiar description
      if (contactForm.description && contactForm.description.includes('<')) {
        const cleaned = stripHtml(contactForm.description);
        console.log(`  🧹 Description: "${contactForm.description}" → "${cleaned}"`);
        contactForm.description = cleaned;
        hasChanges = true;
      }

      if (hasChanges) {
        page.content.contactForm = contactForm;
        page.markModified('content');
        await page.save();
        updatedCount++;
        console.log('  ✅ Página actualizada');
      } else {
        console.log('  ℹ️  No se encontraron etiquetas HTML para limpiar');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✨ Proceso completado!`);
    console.log(`📊 Páginas actualizadas: ${updatedCount}/${pages.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
    process.exit(0);
  }
};

// Ejecutar script
cleanContactFormData();
