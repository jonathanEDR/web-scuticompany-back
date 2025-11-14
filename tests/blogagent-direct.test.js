/**
 * Script de prueba DIRECTO del BlogAgent refactorizado
 * Sin necesidad de HTTP - prueba directamente los servicios
 */

import mongoose from 'mongoose';
import { BlogAgent } from '../agents/specialized/BlogAgent.js';
import dotenv from 'dotenv';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printSeparator() {
  log('\n═══════════════════════════════════════════════════════════════', 'cyan');
}

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti');
    log('✅ MongoDB conectado', 'green');
  } catch (error) {
    log(`❌ Error conectando a MongoDB: ${error.message}`, 'red');
    process.exit(1);
  }
}

async function testGenerateFullPost(agent) {
  printSeparator();
  log('📝 TEST 1: Generar Post Completo', 'cyan');
  printSeparator();
  
  try {
    const startTime = Date.now();
    
    const result = await agent.generateFullPost({
      title: 'Introducción a Node.js y Express',
      category: 'Backend Development',
      style: 'professional',
      wordCount: 600,
      focusKeywords: ['nodejs', 'express', 'javascript', 'backend']
    });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    if (result.success) {
      log(`✅ Post generado exitosamente en ${duration}s`, 'green');
      
      log('\n📊 MÉTRICAS:', 'yellow');
      log(`   • Palabras: ${result.metadata.wordCount}`, 'white');
      log(`   • Score SEO: ${result.metadata.seoScore}/100`, 'white');
      log(`   • Tags sugeridos: ${result.metadata.suggestedTags.length}`, 'white');
      
      log('\n📝 CONTENIDO GENERADO:', 'yellow');
      log('─────────────────────────────────────────────────────────────', 'blue');
      log(result.content.substring(0, 800) + '...', 'white');
      log('─────────────────────────────────────────────────────────────', 'blue');
      
      log('\n🏷️  TAGS SUGERIDOS:', 'yellow');
      result.metadata.suggestedTags.forEach(tag => {
        log(`   • ${tag}`, 'cyan');
      });
      
      // Análisis de estructura
      log('\n🔍 ANÁLISIS DE ESTRUCTURA:', 'magenta');
      analyzeContentStructure(result.content);
      
      return { success: true, duration, result };
    } else {
      log(`❌ Error: ${result.error}`, 'red');
      return { success: false, error: result.error };
    }
  } catch (error) {
    log(`❌ Error en la prueba: ${error.message}`, 'red');
    console.error(error.stack);
    return { success: false, error: error.message };
  }
}

async function testGenerateSection(agent) {
  printSeparator();
  log('📝 TEST 2: Generar Sección de Contenido', 'cyan');
  printSeparator();
  
  try {
    const startTime = Date.now();
    
    const result = await agent.generateContentSection({
      title: '¿Qué es Node.js?',
      context: 'Node.js es una plataforma de desarrollo backend que ha revolucionado la forma en que construimos aplicaciones web.',
      wordCount: 250
    });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    if (result.success) {
      log(`✅ Sección generada exitosamente en ${duration}s`, 'green');
      
      log('\n📊 MÉTRICAS:', 'yellow');
      log(`   • Palabras: ${result.metadata.wordCount}`, 'white');
      
      log('\n📝 SECCIÓN GENERADA:', 'yellow');
      log('─────────────────────────────────────────────────────────────', 'blue');
      log(result.content, 'white');
      log('─────────────────────────────────────────────────────────────', 'blue');
      
      return { success: true, duration, result };
    } else {
      log(`❌ Error: ${result.error}`, 'red');
      return { success: false, error: result.error };
    }
  } catch (error) {
    log(`❌ Error en la prueba: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testExtendContent(agent) {
  printSeparator();
  log('📝 TEST 3: Extender Contenido Existente', 'cyan');
  printSeparator();
  
  try {
    const startTime = Date.now();
    
    const currentContent = `Node.js es una plataforma de desarrollo backend que utiliza JavaScript. 
Es conocida por su modelo de E/S no bloqueante y orientado a eventos, lo que la hace 
perfecta para aplicaciones en tiempo real y altamente escalables.`;
    
    const result = await agent.extendContent({
      currentContent,
      instruction: 'Agrega información sobre sus ventajas y casos de uso',
      wordCount: 200
    });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    if (result.success) {
      log(`✅ Contenido extendido exitosamente en ${duration}s`, 'green');
      
      log('\n📊 MÉTRICAS:', 'yellow');
      log(`   • Palabras agregadas: ${result.metadata.wordCount}`, 'white');
      log(`   • Palabras originales: ${result.metadata.originalLength}`, 'white');
      
      log('\n📝 CONTENIDO ORIGINAL:', 'yellow');
      log('─────────────────────────────────────────────────────────────', 'blue');
      log(currentContent, 'cyan');
      
      log('\n📝 EXTENSIÓN GENERADA:', 'yellow');
      log('─────────────────────────────────────────────────────────────', 'blue');
      log(result.content, 'white');
      log('─────────────────────────────────────────────────────────────', 'blue');
      
      return { success: true, duration, result };
    } else {
      log(`❌ Error: ${result.error}`, 'red');
      return { success: false, error: result.error };
    }
  } catch (error) {
    log(`❌ Error en la prueba: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testImproveContent(agent) {
  printSeparator();
  log('📝 TEST 4: Mejorar Contenido Existente', 'cyan');
  printSeparator();
  
  try {
    const startTime = Date.now();
    
    const originalContent = `Node.js es bueno. Usa JavaScript. Es rápido y sirve para hacer apps web.`;
    
    const result = await agent.improveContent({
      content: originalContent,
      instruction: 'Mejora la profesionalidad y detalle del contenido'
    });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    if (result.success) {
      log(`✅ Contenido mejorado exitosamente en ${duration}s`, 'green');
      
      log('\n📝 CONTENIDO ORIGINAL:', 'yellow');
      log('─────────────────────────────────────────────────────────────', 'red');
      log(originalContent, 'red');
      
      log('\n📝 CONTENIDO MEJORADO:', 'yellow');
      log('─────────────────────────────────────────────────────────────', 'green');
      log(result.content, 'green');
      log('─────────────────────────────────────────────────────────────', 'blue');
      
      log('\n✨ MEJORAS DETECTADAS:', 'yellow');
      if (result.metadata.improvements && result.metadata.improvements.length > 0) {
        result.metadata.improvements.forEach(improvement => {
          log(`   • ${improvement}`, 'cyan');
        });
      }
      
      return { success: true, duration, result };
    } else {
      log(`❌ Error: ${result.error}`, 'red');
      return { success: false, error: result.error };
    }
  } catch (error) {
    log(`❌ Error en la prueba: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testAutoComplete(agent) {
  printSeparator();
  log('📝 TEST 5: Autocompletar Párrafo', 'cyan');
  printSeparator();
  
  try {
    const startTime = Date.now();
    
    const currentContent = `Node.js ha revolucionado el desarrollo backend al permitir usar JavaScript 
tanto en el frontend como en el backend. Su arquitectura basada en eventos y su modelo 
de E/S no bloqueante lo hacen ideal para aplicaciones en tiempo real.

Express.js es el framework web más popular para Node.js. Proporciona una capa delgada 
de características fundamentales para aplicaciones web, sin ocultar las características 
de Node.js que ya conoces y amas.

Para empezar con Express, primero necesitas instalarlo usando npm:`;
    
    const result = await agent.suggestNextParagraph({
      currentContent,
      context: { title: 'Introducción a Node.js y Express', category: 'Backend Development' }
    });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    if (result.success) {
      log(`✅ Autocompletado generado exitosamente en ${duration}s`, 'green');
      
      log('\n📝 CONTEXTO PREVIO (últimas líneas):', 'yellow');
      log('─────────────────────────────────────────────────────────────', 'cyan');
      const lastLines = currentContent.split('\n').slice(-2).join('\n');
      log(lastLines, 'cyan');
      
      log('\n🤖 SUGERENCIA DE CONTINUACIÓN:', 'yellow');
      log('─────────────────────────────────────────────────────────────', 'green');
      log(result.suggestion, 'green');
      log('─────────────────────────────────────────────────────────────', 'blue');
      
      log(`\n🎯 Confianza: ${(result.metadata.confidence * 100).toFixed(0)}%`, 'yellow');
      
      return { success: true, duration, result };
    } else {
      log(`❌ Error: ${result.error}`, 'red');
      return { success: false, error: result.error };
    }
  } catch (error) {
    log(`❌ Error en la prueba: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

function analyzeContentStructure(content) {
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.split(/\s+/).filter(w => w.trim().length > 0);
  
  log(`   • Párrafos: ${paragraphs.length}`, 'white');
  log(`   • Oraciones: ${sentences.length}`, 'white');
  log(`   • Palabras totales: ${words.length}`, 'white');
  log(`   • Promedio palabras/párrafo: ${(words.length / paragraphs.length).toFixed(1)}`, 'white');
  log(`   • Promedio palabras/oración: ${(words.length / sentences.length).toFixed(1)}`, 'white');
  
  // Detectar estructura
  const hasHeaders = /#{1,6}\s/.test(content);
  const hasLists = /[-*]\s/.test(content);
  const hasCode = /```/.test(content);
  
  log('\n   Elementos estructurales:', 'cyan');
  log(`   • Encabezados: ${hasHeaders ? '✅' : '❌'}`, hasHeaders ? 'green' : 'red');
  log(`   • Listas: ${hasLists ? '✅' : '❌'}`, hasLists ? 'green' : 'red');
  log(`   • Bloques de código: ${hasCode ? '✅' : '❌'}`, hasCode ? 'green' : 'red');
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'magenta');
  log('║  🧪 PRUEBAS DIRECTAS DE GENERACIÓN - BLOGAGENT           ║', 'magenta');
  log('║            (Versión Refactorizada)                         ║', 'magenta');
  log('╚════════════════════════════════════════════════════════════╝', 'magenta');
  
  // Conectar a DB
  await connectDB();
  
  // Crear instancia del agente
  log('\n🤖 Inicializando BlogAgent...', 'cyan');
  const agent = new BlogAgent();
  
  // Esperar a que cargue la configuración
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  log('✅ BlogAgent inicializado\n', 'green');
  
  const results = {
    fullPost: null,
    section: null,
    extend: null,
    improve: null,
    autocomplete: null
  };
  
  log('⏰ Iniciando pruebas...', 'cyan');
  
  // Test 1: Post completo
  results.fullPost = await testGenerateFullPost(agent);
  await sleep(2000);
  
  // Test 2: Sección
  results.section = await testGenerateSection(agent);
  await sleep(2000);
  
  // Test 3: Extender
  results.extend = await testExtendContent(agent);
  await sleep(2000);
  
  // Test 4: Mejorar
  results.improve = await testImproveContent(agent);
  await sleep(2000);
  
  // Test 5: Autocompletar
  results.autocomplete = await testAutoComplete(agent);
  
  // Resumen final
  printSeparator();
  log('📊 RESUMEN DE PRUEBAS', 'magenta');
  printSeparator();
  
  const testsRun = Object.keys(results).length;
  const testsPassed = Object.values(results).filter(r => r?.success).length;
  const testsFailed = testsRun - testsPassed;
  
  log(`\n✅ Pruebas exitosas: ${testsPassed}/${testsRun}`, 'green');
  log(`❌ Pruebas fallidas: ${testsFailed}/${testsRun}`, testsFailed > 0 ? 'red' : 'green');
  
  if (testsPassed > 0) {
    const totalDuration = Object.values(results)
      .filter(r => r?.success)
      .reduce((sum, r) => sum + parseFloat(r.duration), 0);
    
    log(`\n⏱️  Tiempo total: ${totalDuration.toFixed(2)}s`, 'cyan');
    log(`⚡ Promedio por prueba: ${(totalDuration / testsPassed).toFixed(2)}s`, 'cyan');
  }
  
  log('\n🎉 Pruebas completadas', 'green');
  
  // Recomendaciones
  printSeparator();
  log('💡 RECOMENDACIONES', 'yellow');
  printSeparator();
  
  if (results.fullPost?.success) {
    const wordCount = results.fullPost.result.metadata.wordCount;
    const seoScore = results.fullPost.result.metadata.seoScore;
    
    if (wordCount < 500) {
      log('   ⚠️  Considerar aumentar el conteo de palabras mínimo', 'yellow');
    }
    
    if (seoScore < 70) {
      log('   ⚠️  Mejorar score SEO en contenido generado', 'yellow');
    } else {
      log('   ✅ Score SEO satisfactorio', 'green');
    }
  }
  
  log('\n   Sugerencias de mejora general:', 'cyan');
  log('   • Agregar más elementos estructurales (headers, listas)', 'white');
  log('   • Incluir ejemplos de código cuando sea relevante', 'white');
  log('   • Optimizar longitud de párrafos (60-80 palabras)', 'white');
  log('   • Mejorar coherencia entre secciones', 'white');
  
  printSeparator();
  
  // Cerrar conexión
  await mongoose.connection.close();
  log('\n✅ Conexión a MongoDB cerrada', 'green');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Ejecutar pruebas
runAllTests().catch(error => {
  log(`\n❌ Error crítico: ${error.message}`, 'red');
  console.error(error);
  mongoose.connection.close();
  process.exit(1);
});
