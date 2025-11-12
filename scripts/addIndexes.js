/**
 * 🔧 Script de Migración de Índices
 * 
 * Crea índices compuestos optimizados para mejorar el rendimiento
 * de las consultas más frecuentes en BlogPost y Servicio.
 * 
 * IMPORTANTE: Este script es seguro para ejecutar en producción.
 * MongoDB creará los índices en background sin bloquear operaciones.
 * 
 * Uso:
 *   node scripts/addIndexes.js
 * 
 * @author Web Scuti Performance Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BlogPost from '../models/BlogPost.js';
import Servicio from '../models/Servicio.js';
import BlogCategory from '../models/BlogCategory.js';
import BlogTag from '../models/BlogTag.js';

dotenv.config();

// Colores para output en consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}▶${colors.reset} ${msg}\n`)
};

/**
 * Obtener lista de índices existentes en una colección
 */
async function getExistingIndexes(model) {
  try {
    const indexes = await model.collection.getIndexes();
    return Object.keys(indexes);
  } catch (error) {
    return [];
  }
}

/**
 * Crear índices para BlogPost
 */
async function createBlogPostIndexes() {
  log.section('📄 Creando índices para BlogPost...');
  
  const existingIndexes = await getExistingIndexes(BlogPost);
  log.info(`Índices existentes: ${existingIndexes.length}`);
  
  const indexesToCreate = [
    {
      name: 'published_posts_optimized',
      spec: { isPublished: 1, status: 1, publishedAt: -1 },
      options: { name: 'published_posts_optimized', background: true }
    },
    {
      name: 'featured_posts_optimized',
      spec: { isPublished: 1, status: 1, isFeatured: 1, publishedAt: -1 },
      options: { name: 'featured_posts_optimized', background: true }
    },
    {
      name: 'category_posts_optimized',
      spec: { category: 1, isPublished: 1, status: 1, publishedAt: -1 },
      options: { name: 'category_posts_optimized', background: true }
    },
    {
      name: 'tag_posts_optimized',
      spec: { tags: 1, isPublished: 1, status: 1, publishedAt: -1 },
      options: { name: 'tag_posts_optimized', background: true }
    },
    {
      name: 'author_posts_optimized',
      spec: { author: 1, isPublished: 1, status: 1, publishedAt: -1 },
      options: { name: 'author_posts_optimized', background: true }
    },
    {
      name: 'admin_posts_list',
      spec: { status: 1, isPublished: 1, createdAt: -1 },
      options: { name: 'admin_posts_list', background: true }
    }
  ];
  
  let created = 0;
  let skipped = 0;
  
  for (const index of indexesToCreate) {
    try {
      if (existingIndexes.includes(index.name)) {
        log.warning(`Índice "${index.name}" ya existe, omitiendo...`);
        skipped++;
        continue;
      }
      
      log.info(`Creando índice: ${index.name}...`);
      await BlogPost.collection.createIndex(index.spec, index.options);
      log.success(`✓ Índice "${index.name}" creado exitosamente`);
      created++;
      
    } catch (error) {
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        log.warning(`Índice "${index.name}" ya existe con diferentes opciones`);
        skipped++;
      } else {
        log.error(`Error creando índice "${index.name}": ${error.message}`);
      }
    }
  }
  
  log.info(`\nResumen BlogPost: ${created} creados, ${skipped} omitidos`);
}

/**
 * Crear índices para Servicio
 */
async function createServicioIndexes() {
  log.section('⚙️ Creando índices para Servicio...');
  
  const existingIndexes = await getExistingIndexes(Servicio);
  log.info(`Índices existentes: ${existingIndexes.length}`);
  
  const indexesToCreate = [
    {
      name: 'public_services_optimized',
      spec: { activo: 1, visibleEnWeb: 1, eliminado: 1, orden: 1, destacado: -1 },
      options: { name: 'public_services_optimized', background: true }
    },
    {
      name: 'category_services_optimized',
      spec: { categoria: 1, activo: 1, visibleEnWeb: 1, destacado: -1, orden: 1 },
      options: { name: 'category_services_optimized', background: true }
    },
    {
      name: 'featured_services_optimized',
      spec: { destacado: 1, activo: 1, visibleEnWeb: 1, orden: 1 },
      options: { name: 'featured_services_optimized', background: true }
    },
    {
      name: 'admin_services_list',
      spec: { estado: 1, eliminado: 1, activo: 1, createdAt: -1 },
      options: { name: 'admin_services_list', background: true }
    },
    {
      name: 'responsible_services',
      spec: { responsable: 1, estado: 1, eliminado: 1, createdAt: -1 },
      options: { name: 'responsible_services', background: true }
    }
  ];
  
  let created = 0;
  let skipped = 0;
  
  for (const index of indexesToCreate) {
    try {
      if (existingIndexes.includes(index.name)) {
        log.warning(`Índice "${index.name}" ya existe, omitiendo...`);
        skipped++;
        continue;
      }
      
      log.info(`Creando índice: ${index.name}...`);
      await Servicio.collection.createIndex(index.spec, index.options);
      log.success(`✓ Índice "${index.name}" creado exitosamente`);
      created++;
      
    } catch (error) {
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        log.warning(`Índice "${index.name}" ya existe con diferentes opciones`);
        skipped++;
      } else {
        log.error(`Error creando índice "${index.name}": ${error.message}`);
      }
    }
  }
  
  log.info(`\nResumen Servicio: ${created} creados, ${skipped} omitidos`);
}

/**
 * Crear índices adicionales para modelos relacionados
 */
async function createRelatedIndexes() {
  log.section('🔗 Creando índices para modelos relacionados...');
  
  try {
    // BlogCategory - optimizar búsquedas de categorías activas
    log.info('Creando índices para BlogCategory...');
    await BlogCategory.collection.createIndex(
      { isActive: 1, order: 1 },
      { name: 'active_categories', background: true }
    );
    log.success('✓ Índices de BlogCategory creados');
    
    // BlogTag - optimizar búsquedas de tags activos
    log.info('Creando índices para BlogTag...');
    await BlogTag.collection.createIndex(
      { slug: 1 },
      { name: 'tag_slug_lookup', background: true }
    );
    log.success('✓ Índices de BlogTag creados');
    
  } catch (error) {
    if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
      log.warning('Algunos índices ya existían');
    } else {
      log.error(`Error creando índices relacionados: ${error.message}`);
    }
  }
}

/**
 * Analizar estadísticas de índices
 */
async function analyzeIndexStats() {
  log.section('📊 Analizando estadísticas de índices...');
  
  try {
    const blogPostStats = await BlogPost.collection.stats();
    const servicioStats = await Servicio.collection.stats();
    
    console.log('\n┌─────────────────────────────────────┐');
    console.log('│     Estadísticas de Colecciones    │');
    console.log('└─────────────────────────────────────┘\n');
    
    console.log(`BlogPost:`);
    console.log(`  • Documentos: ${blogPostStats.count}`);
    console.log(`  • Tamaño: ${(blogPostStats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  • Índices: ${blogPostStats.nindexes}`);
    console.log(`  • Tamaño de índices: ${(blogPostStats.totalIndexSize / 1024 / 1024).toFixed(2)} MB\n`);
    
    console.log(`Servicio:`);
    console.log(`  • Documentos: ${servicioStats.count}`);
    console.log(`  • Tamaño: ${(servicioStats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  • Índices: ${servicioStats.nindexes}`);
    console.log(`  • Tamaño de índices: ${(servicioStats.totalIndexSize / 1024 / 1024).toFixed(2)} MB\n`);
    
  } catch (error) {
    log.warning(`No se pudieron obtener estadísticas: ${error.message}`);
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   🔧 MIGRACIÓN DE ÍNDICES - WEB SCUTI       ║');
  console.log('╚══════════════════════════════════════════════╝\n');
  
  try {
    // Conectar a MongoDB
    log.info('Conectando a MongoDB...');
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti';
    await mongoose.connect(mongoURI);
    log.success(`Conectado a: ${mongoose.connection.host}`);
    
    // Crear índices
    await createBlogPostIndexes();
    await createServicioIndexes();
    await createRelatedIndexes();
    
    // Mostrar estadísticas
    await analyzeIndexStats();
    
    // Finalizar
    log.section('✅ Migración completada exitosamente');
    console.log('\n💡 Recomendaciones:');
    console.log('   • Monitorea el rendimiento de las queries con MongoDB Atlas/Compass');
    console.log('   • Ejecuta explain() en queries lentas para verificar uso de índices');
    console.log('   • Considera agregar más índices según patrones de uso reales\n');
    
  } catch (error) {
    log.error(`Error fatal: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    log.info('Conexión a MongoDB cerrada');
    process.exit(0);
  }
}

// Ejecutar script
main().catch((error) => {
  console.error('Error no capturado:', error);
  process.exit(1);
});
