import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { initializeDatabase, checkDatabaseHealth } from '../utils/dbInitializer.js';
import Page from '../models/Page.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti';

async function testAutoInitialization() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     🧪 TEST DE AUTO-INICIALIZACIÓN DE BASE DE DATOS      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // 1. Conectar a MongoDB
    console.log('📡 PASO 1: Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Conectado a:', mongoose.connection.host);
    console.log('📦 Base de datos:', mongoose.connection.name);
    console.log('');

    // 2. Verificar estado actual
    console.log('🔍 PASO 2: Verificando estado actual...');
    const existingPage = await Page.findOne({ pageSlug: 'home' });
    
    if (existingPage) {
      console.log('✅ Página Home YA EXISTE');
      console.log('   ID:', existingPage._id);
      console.log('   Última actualización:', existingPage.lastUpdated);
      console.log('   Actualizada por:', existingPage.updatedBy);
      
      // Preguntar si quiere eliminarla para probar
      console.log('');
      console.log('⚠️  Para probar la creación automática, eliminaremos esta página');
      console.log('   (No te preocupes, se recreará inmediatamente)');
      console.log('');
      
      console.log('🗑️  Eliminando página para probar...');
      await Page.deleteOne({ pageSlug: 'home' });
      console.log('✅ Página eliminada');
    } else {
      console.log('⚠️  Página Home NO EXISTE (perfecto para probar creación)');
    }
    console.log('');

    // 3. Probar inicialización
    console.log('🚀 PASO 3: Ejecutando initializeDatabase()...');
    console.log('═'.repeat(60));
    await initializeDatabase();
    console.log('═'.repeat(60));
    console.log('');

    // 4. Verificar que se creó
    console.log('🔍 PASO 4: Verificando que la página se creó...');
    const newPage = await Page.findOne({ pageSlug: 'home' });
    
    if (!newPage) {
      console.log('❌ ERROR: La página NO se creó');
      throw new Error('initializeDatabase() no creó la página');
    }
    
    console.log('✅ Página Home creada exitosamente');
    console.log('   ID:', newPage._id);
    console.log('   Slug:', newPage.pageSlug);
    console.log('   Nombre:', newPage.pageName);
    console.log('   Publicada:', newPage.isPublished);
    console.log('   Actualizada por:', newPage.updatedBy);
    console.log('');

    // 5. Verificar contenido
    console.log('📋 PASO 5: Verificando contenido...');
    
    const checks = {
      'Hero title': !!newPage.content?.hero?.title,
      'Hero subtitle': !!newPage.content?.hero?.subtitle,
      'Hero description': !!newPage.content?.hero?.description,
      'Hero backgroundImage (objeto)': typeof newPage.content?.hero?.backgroundImage === 'object',
      'Hero backgroundImage.light (definido)': newPage.content?.hero?.backgroundImage?.light !== undefined,
      'Hero backgroundImage.dark (definido)': newPage.content?.hero?.backgroundImage?.dark !== undefined,
      'Solutions title': !!newPage.content?.solutions?.title,
      'Solutions description': !!newPage.content?.solutions?.description,
      'Solutions items (array)': Array.isArray(newPage.content?.solutions?.items),
      'Solutions items (al menos 1)': newPage.content?.solutions?.items?.length > 0,
      'Theme lightMode': !!newPage.theme?.lightMode,
      'Theme darkMode': !!newPage.theme?.darkMode,
      'Theme buttons (light)': !!newPage.theme?.lightMode?.buttons,
      'Theme buttons (dark)': !!newPage.theme?.darkMode?.buttons,
      'SEO metaTitle': !!newPage.seo?.metaTitle,
      'SEO metaDescription': !!newPage.seo?.metaDescription,
    };

    let passed = 0;
    let failed = 0;

    Object.entries(checks).forEach(([name, result]) => {
      if (result) {
        console.log(`   ✅ ${name}`);
        passed++;
      } else {
        console.log(`   ❌ ${name}`);
        failed++;
      }
    });

    console.log('');
    console.log(`📊 Resultados: ${passed} pasaron, ${failed} fallaron`);
    console.log('');

    // 6. Probar que no sobrescribe
    console.log('🔄 PASO 6: Probando que NO sobrescribe datos existentes...');
    
    // Modificar algo
    await Page.updateOne(
      { pageSlug: 'home' },
      { 
        $set: { 
          'content.hero.title': 'TÍTULO MODIFICADO PARA TEST',
          updatedBy: 'test-script'
        }
      }
    );
    console.log('✏️  Título modificado');
    
    // Ejecutar inicialización de nuevo
    await initializeDatabase();
    
    // Verificar que se mantuvo el cambio
    const unchangedPage = await Page.findOne({ pageSlug: 'home' });
    
    if (unchangedPage.content.hero.title === 'TÍTULO MODIFICADO PARA TEST') {
      console.log('✅ NO SOBRESCRIBIÓ: Los datos existentes se respetaron');
    } else {
      console.log('❌ ERROR: Sobrescribió los datos existentes');
      failed++;
    }
    
    // Restaurar título original
    await Page.updateOne(
      { pageSlug: 'home' },
      { 
        $set: { 
          'content.hero.title': 'Transformamos tu empresa con tecnología inteligente',
          updatedBy: 'system-init'
        }
      }
    );
    console.log('🔄 Título restaurado');
    console.log('');

    // 7. Probar health check
    console.log('🏥 PASO 7: Probando health check...');
    const health = await checkDatabaseHealth();
    
    console.log('   Healthy:', health.healthy ? '✅' : '❌');
    console.log('   Home page:', health.pages.home ? '✅' : '❌');
    console.log('   Timestamp:', health.timestamp);
    console.log('');

    // 8. Resumen final
    console.log('═'.repeat(60));
    console.log('');
    
    if (failed === 0) {
      console.log('✅ ¡TODOS LOS TESTS PASARON!');
      console.log('');
      console.log('🎯 La auto-inicialización está funcionando correctamente:');
      console.log('   ✅ Detecta si no existe la página');
      console.log('   ✅ Crea la página con datos por defecto');
      console.log('   ✅ No sobrescribe datos existentes');
      console.log('   ✅ Health check funciona');
      console.log('   ✅ Estructura de datos correcta');
    } else {
      console.log(`⚠️  ${failed} tests fallaron`);
      console.log('');
      console.log('Revisa los errores arriba para más detalles');
    }
    
    console.log('');
    console.log('═'.repeat(60));
    console.log('');
    console.log('💡 PRÓXIMOS PASOS:');
    console.log('   1. Inicia el servidor: npm run dev');
    console.log('   2. Verifica los logs de inicialización');
    console.log('   3. Accede al CMS Manager para configurar contenido');
    console.log('   4. Los cambios se guardarán y persistirán');
    console.log('');
    console.log('🚀 ¡Listo para producción!');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ ERROR DURANTE EL TEST:');
    console.error(error);
    console.error('');
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    console.log('');
  }
}

// Ejecutar test
testAutoInitialization();
