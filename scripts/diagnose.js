import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Page from '../models/Page.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti';

async function diagnose() {
  try {
    console.log('🔍 Iniciando diagnóstico de base de datos...\n');
    
    // 1. Conectar a la base de datos
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Conectado a MongoDB:', mongoose.connection.host);
    console.log('📦 Base de datos:', mongoose.connection.name);
    console.log('');

    // 2. Verificar páginas existentes
    const pages = await Page.find({});
    console.log(`📄 Total de páginas encontradas: ${pages.length}\n`);
    
    if (pages.length === 0) {
      console.log('⚠️  No hay páginas en la base de datos');
      console.log('💡 Ejecuta: npm run seed:home para crear la página inicial\n');
      return;
    }

    // 3. Analizar cada página
    for (const page of pages) {
      console.log('═══════════════════════════════════════════════════');
      console.log(`📄 Página: ${page.pageName} (${page.pageSlug})`);
      console.log('═══════════════════════════════════════════════════');
      console.log(`ID: ${page._id}`);
      console.log(`Publicada: ${page.isPublished ? '✅' : '❌'}`);
      console.log(`Última actualización: ${page.lastUpdated}`);
      console.log(`Actualizada por: ${page.updatedBy}`);
      console.log('');

      // Verificar hero
      if (page.content?.hero) {
        console.log('🎯 HERO SECTION:');
        console.log(`  Título: ${page.content.hero.title ? '✅' : '❌'}`);
        console.log(`  Subtítulo: ${page.content.hero.subtitle ? '✅' : '❌'}`);
        console.log(`  Descripción: ${page.content.hero.description ? '✅' : '❌'}`);
        
        // Verificar imágenes de fondo
        if (page.content.hero.backgroundImage) {
          if (typeof page.content.hero.backgroundImage === 'string') {
            console.log(`  ⚠️  backgroundImage es STRING (formato antiguo): "${page.content.hero.backgroundImage}"`);
          } else {
            console.log(`  Imagen fondo (light): ${page.content.hero.backgroundImage.light || '❌ vacío'}`);
            console.log(`  Imagen fondo (dark): ${page.content.hero.backgroundImage.dark || '❌ vacío'}`);
          }
        } else {
          console.log('  ❌ NO HAY backgroundImage definido');
        }
        console.log('');
      }

      // Verificar solutions
      if (page.content?.solutions) {
        console.log('💡 SOLUTIONS SECTION:');
        console.log(`  Título: ${page.content.solutions.title ? '✅' : '❌'}`);
        console.log(`  Descripción: ${page.content.solutions.description ? '✅' : '❌'}`);
        
        // Verificar imágenes de fondo
        if (page.content.solutions.backgroundImage) {
          if (typeof page.content.solutions.backgroundImage === 'string') {
            console.log(`  ⚠️  backgroundImage es STRING (formato antiguo): "${page.content.solutions.backgroundImage}"`);
          } else {
            console.log(`  Imagen fondo (light): ${page.content.solutions.backgroundImage.light || '❌ vacío'}`);
            console.log(`  Imagen fondo (dark): ${page.content.solutions.backgroundImage.dark || '❌ vacío'}`);
          }
        } else {
          console.log('  ❌ NO HAY backgroundImage definido');
        }
        
        // Verificar items de soluciones
        console.log(`  Items: ${page.content.solutions.items?.length || 0}`);
        if (page.content.solutions.items && page.content.solutions.items.length > 0) {
          page.content.solutions.items.forEach((item, index) => {
            console.log(`    Item ${index + 1}:`);
            console.log(`      - Título: ${item.title || '❌'}`);
            console.log(`      - Icono Light: ${item.iconLight || '❌ NO DEFINIDO'}`);
            console.log(`      - Icono Dark: ${item.iconDark || '❌ NO DEFINIDO'}`);
            console.log(`      - Icono Legacy: ${item.icon || '❌'}`);
          });
        }
        
        // Verificar diseño de cards
        if (page.content.solutions.cardsDesign) {
          console.log('  Diseño de cards:');
          console.log(`    - Light mode: ${page.content.solutions.cardsDesign.light ? '✅' : '❌'}`);
          console.log(`    - Dark mode: ${page.content.solutions.cardsDesign.dark ? '✅' : '❌'}`);
          
          if (page.content.solutions.cardsDesign.light) {
            console.log(`    - Icon Border Enabled (light): ${page.content.solutions.cardsDesign.light.iconBorderEnabled}`);
            console.log(`    - Icon Alignment (light): ${page.content.solutions.cardsDesign.light.iconAlignment}`);
          }
        } else {
          console.log('  ❌ NO HAY cardsDesign definido');
        }
        console.log('');
      }

      // Verificar theme
      if (page.theme) {
        console.log('🎨 THEME:');
        console.log(`  Tema por defecto: ${page.theme.default || 'light'}`);
        console.log(`  Light mode configurado: ${page.theme.lightMode ? '✅' : '❌'}`);
        console.log(`  Dark mode configurado: ${page.theme.darkMode ? '✅' : '❌'}`);
        
        // Verificar botones
        if (page.theme.lightMode?.buttons) {
          console.log('  Botones (light):');
          Object.keys(page.theme.lightMode.buttons).forEach(key => {
            const btn = page.theme.lightMode.buttons[key];
            console.log(`    - ${key}: ${btn.background ? '✅' : '❌'} bg, ${btn.textColor ? '✅' : '❌'} text, ${btn.borderColor ? '✅' : '❌'} border`);
          });
        }
        
        if (page.theme.darkMode?.buttons) {
          console.log('  Botones (dark):');
          Object.keys(page.theme.darkMode.buttons).forEach(key => {
            const btn = page.theme.darkMode.buttons[key];
            console.log(`    - ${key}: ${btn.background ? '✅' : '❌'} bg, ${btn.textColor ? '✅' : '❌'} text, ${btn.borderColor ? '✅' : '❌'} border`);
          });
        }
        console.log('');
      }

      // Verificar SEO
      if (page.seo) {
        console.log('🔍 SEO:');
        console.log(`  Meta título: ${page.seo.metaTitle || '❌ vacío'}`);
        console.log(`  Meta descripción: ${page.seo.metaDescription || '❌ vacío'}`);
        console.log(`  OG Image: ${page.seo.ogImage || '❌ vacío'}`);
        console.log('');
      }

      // Mostrar el documento completo en JSON (solo estructura, no valores)
      console.log('📋 ESTRUCTURA DEL DOCUMENTO:');
      console.log(JSON.stringify(page.toObject(), null, 2).substring(0, 1000) + '...');
      console.log('\n');
    }

    // 4. Verificar archivos en uploads
    console.log('═══════════════════════════════════════════════════');
    console.log('📁 VERIFICANDO DIRECTORIO DE UPLOADS');
    console.log('═══════════════════════════════════════════════════');
    
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const uploadsDir = path.join(__dirname, '../uploads');
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log(`Total de archivos: ${files.length}`);
      
      if (files.length > 0) {
        console.log('\nArchivos encontrados:');
        files.forEach(file => {
          const stats = fs.statSync(path.join(uploadsDir, file));
          console.log(`  - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
        });
      } else {
        console.log('⚠️  El directorio está vacío');
      }
    } else {
      console.log('❌ El directorio de uploads no existe');
    }
    console.log('');

    // 5. Verificar eventos de mongoose
    console.log('═══════════════════════════════════════════════════');
    console.log('⚙️  CONFIGURACIÓN DE MONGOOSE');
    console.log('═══════════════════════════════════════════════════');
    console.log(`ReadyState: ${mongoose.connection.readyState} (1 = conectado)`);
    console.log(`Host: ${mongoose.connection.host}`);
    console.log(`Port: ${mongoose.connection.port}`);
    console.log(`Nombre BD: ${mongoose.connection.name}`);
    console.log('');

    // 6. Resumen y recomendaciones
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 RESUMEN Y RECOMENDACIONES');
    console.log('═══════════════════════════════════════════════════');
    
    const homePage = pages.find(p => p.pageSlug === 'home');
    if (!homePage) {
      console.log('❌ PROBLEMA: No existe la página "home"');
      console.log('💡 SOLUCIÓN: Ejecuta npm run seed:home');
    } else {
      const issues = [];
      
      // Verificar imágenes
      if (homePage.content?.hero?.backgroundImage) {
        if (typeof homePage.content.hero.backgroundImage === 'string') {
          issues.push('❌ Hero backgroundImage está en formato STRING antiguo (debe ser objeto {light, dark})');
        } else if (!homePage.content.hero.backgroundImage.light && !homePage.content.hero.backgroundImage.dark) {
          issues.push('⚠️  Hero backgroundImage está vacío (light y dark)');
        }
      }
      
      if (homePage.content?.solutions?.backgroundImage) {
        if (typeof homePage.content.solutions.backgroundImage === 'string') {
          issues.push('❌ Solutions backgroundImage está en formato STRING antiguo (debe ser objeto {light, dark})');
        } else if (!homePage.content.solutions.backgroundImage.light && !homePage.content.solutions.backgroundImage.dark) {
          issues.push('⚠️  Solutions backgroundImage está vacío (light y dark)');
        }
      }
      
      // Verificar iconos de items
      if (homePage.content?.solutions?.items) {
        const itemsWithoutIcons = homePage.content.solutions.items.filter(
          item => !item.iconLight && !item.iconDark
        );
        if (itemsWithoutIcons.length > 0) {
          issues.push(`⚠️  ${itemsWithoutIcons.length} items sin iconos (iconLight/iconDark)`);
        }
      }
      
      if (issues.length > 0) {
        console.log('\n🔴 PROBLEMAS ENCONTRADOS:');
        issues.forEach(issue => console.log(`  ${issue}`));
        console.log('\n💡 POSIBLES CAUSAS:');
        console.log('  1. Los datos se guardaron pero luego se sobrescribieron con valores por defecto');
        console.log('  2. Hay un proceso que ejecuta el seeder automáticamente');
        console.log('  3. El schema de MongoDB tiene valores por defecto que sobrescriben los datos');
        console.log('  4. Hay un problema de caché o sincronización');
        console.log('\n🔧 SOLUCIONES RECOMENDADAS:');
        console.log('  1. Verificar si hay procesos automáticos que ejecutan seeders');
        console.log('  2. Revisar logs del servidor para ver si hay resets automáticos');
        console.log('  3. Implementar versionado de datos para detectar cambios no autorizados');
        console.log('  4. Agregar timestamps y logs en cada actualización');
      } else {
        console.log('✅ No se encontraron problemas evidentes en la estructura de datos');
      }
    }
    
    console.log('');
    console.log('✅ Diagnóstico completado\n');

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar diagnóstico
diagnose();
