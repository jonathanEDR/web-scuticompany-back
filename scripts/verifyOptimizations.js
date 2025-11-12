/**
 * 🧪 Script de Verificación Rápida
 * 
 * Verifica que las optimizaciones estén funcionando correctamente.
 * 
 * Uso: node scripts/verifyOptimizations.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BlogPost from '../models/BlogPost.js';
import Servicio from '../models/Servicio.js';

dotenv.config();

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

async function verifyPoolSize() {
  log.section('Verificando Pool de Conexiones');
  
  const connectionOptions = mongoose.connection.getClient().options;
  
  log.info(`maxPoolSize: ${connectionOptions.maxPoolSize || 'No configurado'}`);
  log.info(`minPoolSize: ${connectionOptions.minPoolSize || 'No configurado'}`);
  log.info(`socketTimeoutMS: ${connectionOptions.socketTimeoutMS || 'No configurado'}`);
  
  if (connectionOptions.maxPoolSize >= 50) {
    log.success('Pool de conexiones correctamente configurado');
    return true;
  } else {
    log.error('Pool de conexiones NO configurado (debe ser >= 50)');
    return false;
  }
}

async function verifyIndexes() {
  log.section('Verificando Índices Críticos');
  
  const db = mongoose.connection.db;
  
  // Verificar índices de BlogPost
  const blogPostIndexes = await db.collection('blogposts').indexes();
  const blogPostIndexNames = blogPostIndexes.map(idx => idx.name);
  
  const requiredBlogPostIndexes = [
    'published_posts_optimized',
    'category_posts_optimized',
    'tag_posts_optimized'
  ];
  
  let blogPostOk = true;
  for (const indexName of requiredBlogPostIndexes) {
    if (blogPostIndexNames.includes(indexName)) {
      log.success(`BlogPost: Índice "${indexName}" encontrado`);
    } else {
      log.error(`BlogPost: Índice "${indexName}" NO encontrado`);
      blogPostOk = false;
    }
  }
  
  // Verificar índices de Servicio
  const servicioIndexes = await db.collection('servicios').indexes();
  const servicioIndexNames = servicioIndexes.map(idx => idx.name);
  
  const requiredServicioIndexes = [
    'public_services_optimized',
    'category_services_optimized'
  ];
  
  let servicioOk = true;
  for (const indexName of requiredServicioIndexes) {
    if (servicioIndexNames.includes(indexName)) {
      log.success(`Servicio: Índice "${indexName}" encontrado`);
    } else {
      log.error(`Servicio: Índice "${indexName}" NO encontrado`);
      servicioOk = false;
    }
  }
  
  return blogPostOk && servicioOk;
}

async function verifyQueryPerformance() {
  log.section('Verificando Rendimiento de Queries');
  
  // Test 1: Query simple con índice
  const start1 = Date.now();
  await BlogPost.find({ isPublished: true, status: 'published' })
    .sort({ publishedAt: -1 })
    .limit(10)
    .lean();
  const time1 = Date.now() - start1;
  
  if (time1 < 100) {
    log.success(`Query de posts publicados: ${time1}ms (excelente)`);
  } else if (time1 < 300) {
    log.warning(`Query de posts publicados: ${time1}ms (aceptable)`);
  } else {
    log.error(`Query de posts publicados: ${time1}ms (muy lento)`);
  }
  
  // Test 2: Query con populate (debe ser rápido con índices)
  const start2 = Date.now();
  await Servicio.find({ activo: true, visibleEnWeb: true })
    .sort({ orden: 1 })
    .limit(10)
    .lean();
  const time2 = Date.now() - start2;
  
  if (time2 < 100) {
    log.success(`Query de servicios activos: ${time2}ms (excelente)`);
  } else if (time2 < 300) {
    log.warning(`Query de servicios activos: ${time2}ms (aceptable)`);
  } else {
    log.error(`Query de servicios activos: ${time2}ms (muy lento)`);
  }
  
  return time1 < 300 && time2 < 300;
}

async function verifyMemoryUsage() {
  log.section('Verificando Uso de Memoria');
  
  const used = process.memoryUsage();
  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
  
  log.info(`Heap usado: ${heapUsedMB}MB / ${heapTotalMB}MB`);
  
  if (heapUsedMB < 200) {
    log.success('Uso de memoria normal');
    return true;
  } else if (heapUsedMB < 400) {
    log.warning('Uso de memoria moderado');
    return true;
  } else {
    log.error('Uso de memoria alto (>400MB)');
    return false;
  }
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   🧪 VERIFICACIÓN DE OPTIMIZACIONES        ║');
  console.log('╚══════════════════════════════════════════════╝\n');
  
  try {
    // Conectar a MongoDB
    log.info('Conectando a MongoDB...');
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti';
    await mongoose.connect(mongoURI);
    log.success('Conectado a MongoDB\n');
    
    // Ejecutar verificaciones
    const results = {
      poolSize: await verifyPoolSize(),
      indexes: await verifyIndexes(),
      performance: await verifyQueryPerformance(),
      memory: await verifyMemoryUsage()
    };
    
    // Resumen final
    log.section('📊 Resumen de Verificación');
    
    const allPassed = Object.values(results).every(result => result);
    
    console.log('┌─────────────────────────────────────┐');
    console.log('│          RESULTADOS                 │');
    console.log('├─────────────────────────────────────┤');
    console.log(`│ Pool de Conexiones:  ${results.poolSize ? '✅ PASS' : '❌ FAIL'}    │`);
    console.log(`│ Índices:             ${results.indexes ? '✅ PASS' : '❌ FAIL'}    │`);
    console.log(`│ Rendimiento:         ${results.performance ? '✅ PASS' : '❌ FAIL'}    │`);
    console.log(`│ Memoria:             ${results.memory ? '✅ PASS' : '❌ FAIL'}    │`);
    console.log('└─────────────────────────────────────┘\n');
    
    if (allPassed) {
      log.success('✅ Todas las optimizaciones funcionan correctamente\n');
      process.exit(0);
    } else {
      log.error('❌ Algunas optimizaciones no están funcionando correctamente\n');
      log.warning('Revisa los logs arriba para más detalles\n');
      process.exit(1);
    }
    
  } catch (error) {
    log.error(`Error fatal: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

main().catch(console.error);
