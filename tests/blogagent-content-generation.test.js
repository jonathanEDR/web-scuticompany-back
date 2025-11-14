/**
 * Script de prueba para generación de contenido con BlogAgent refactorizado
 * Prueba diferentes tipos de generación y evalúa la estructura
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:5000';
const AUTH_TOKEN = 'your-auth-token'; // Temporalmente usaremos sin auth

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

async function testGenerateFullPost() {
  printSeparator();
  log('📝 TEST 1: Generar Post Completo', 'cyan');
  printSeparator();
  
  try {
    const startTime = Date.now();
    
    const response = await axios.post(`${API_URL}/api/agents/blog/generate-content`, {
      type: 'full',
      title: 'Introducción a Node.js y Express',
      category: 'Backend Development',
      style: 'professional',
      wordCount: 600,
      focusKeywords: ['nodejs', 'express', 'javascript', 'backend']
    });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    if (response.data.success) {
      log(`✅ Post generado exitosamente en ${duration}s`, 'green');
      
      const result = response.data.result;
      
      log('\n📊 MÉTRICAS:', 'yellow');
      log(`   • Palabras: ${result.metadata.wordCount}`, 'white');
      log(`   • Score SEO: ${result.metadata.seoScore}/100`, 'white');
      log(`   • Tags sugeridos: ${result.metadata.suggestedTags.length}`, 'white');
      
      log('\n📝 CONTENIDO GENERADO:', 'yellow');
      log('─────────────────────────────────────────────────────────────', 'blue');
      log(result.content.substring(0, 500) + '...', 'white');
      log('─────────────────────────────────────────────────────────────', 'blue');
      
      log('\n🏷️  TAGS SUGERIDOS:', 'yellow');
      result.metadata.suggestedTags.forEach(tag => {
        log(`   • ${tag}`, 'cyan');
      });
      
      // Guardar resultado
      const filename = `test-full-post-${Date.now()}.json`;
      fs.writeFileSync(
        path.join(__dirname, filename),
        JSON.stringify(response.data, null, 2)
      );
      log(`\n💾 Resultado guardado en: ${filename}`, 'green');
      
      // Análisis de estructura
      log('\n🔍 ANÁLISIS DE ESTRUCTURA:', 'magenta');
      analyzeContentStructure(result.content);
      
      return { success: true, duration, result };
    } else {
      log(`❌ Error: ${response.data.error}`, 'red');
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    log(`❌ Error en la prueba: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return { success: false, error: error.message };
  }
}

async function testGenerateSection() {
  printSeparator();
  log('📝 TEST 2: Generar Sección de Contenido', 'cyan');
  printSeparator();
  
  try {
    const startTime = Date.now();
    
    const response = await axios.post(`${API_URL}/api/agents/blog/generate-content`, {
      type: 'section',
      title: '¿Qué es Node.js?',
      currentContent: 'Node.js es una plataforma de desarrollo backend que ha revolucionado la forma en que construimos aplicaciones web.',
      wordCount: 250
    });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    if (response.data.success) {
      log(`✅ Sección generada exitosamente en ${duration}s`, 'green');
      
      const result = response.data.result;
      
      log('\n📊 MÉTRICAS:', 'yellow');
      log(`   • Palabras: ${result.metadata.wordCount}`, 'white');
      
      log('\n📝 SECCIÓN GENERADA:', 'yellow');
      log('─────────────────────────────────────────────────────────────', 'blue');
      log(result.content, 'white');
      log('─────────────────────────────────────────────────────────────', 'blue');
      
      return { success: true, duration, result };
    } else {
      log(`❌ Error: ${response.data.error}`, 'red');
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    log(`❌ Error en la prueba: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testExtendContent() {
  printSeparator();
  log('📝 TEST 3: Extender Contenido Existente', 'cyan');
  printSeparator();
  
  try {
    const startTime = Date.now();
    
    const currentContent = `Node.js es una plataforma de desarrollo backend que utiliza JavaScript. 
Es conocida por su modelo de E/S no bloqueante y orientado a eventos, lo que la hace 
perfecta para aplicaciones en tiempo real y altamente escalables.`;
    
    const response = await axios.post(`${API_URL}/api/agents/blog/generate-content`, {
      type: 'extend',
      currentContent,
      instruction: 'Agrega información sobre sus ventajas y casos de uso',
      wordCount: 200
    });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    if (response.data.success) {
      log(`✅ Contenido extendido exitosamente en ${duration}s`, 'green');
      
      const result = response.data.result;
      
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
      log(`❌ Error: ${response.data.error}`, 'red');
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    log(`❌ Error en la prueba: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testImproveContent() {
  printSeparator();
  log('📝 TEST 4: Mejorar Contenido Existente', 'cyan');
  printSeparator();
  
  try {
    const startTime = Date.now();
    
    const originalContent = `Node.js es bueno. Usa JavaScript. Es rápido y sirve para hacer apps web.`;
    
    const response = await axios.post(`${API_URL}/api/agents/blog/generate-content`, {
      type: 'improve',
      currentContent: originalContent,
      instruction: 'Mejora la profesionalidad y detalle del contenido'
    });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    if (response.data.success) {
      log(`✅ Contenido mejorado exitosamente en ${duration}s`, 'green');
      
      const result = response.data.result;
      
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
      log(`❌ Error: ${response.data.error}`, 'red');
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    log(`❌ Error en la prueba: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function testAutoComplete() {
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
    
    const response = await axios.post(`${API_URL}/api/agents/blog/generate-content`, {
      type: 'autocomplete',
      currentContent,
      title: 'Introducción a Node.js y Express',
      category: 'Backend Development'
    });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    if (response.data.success) {
      log(`✅ Autocompletado generado exitosamente en ${duration}s`, 'green');
      
      const result = response.data.result;
      
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
      log(`❌ Error: ${response.data.error}`, 'red');
      return { success: false, error: response.data.error };
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
  log('║  🧪 PRUEBAS DE GENERACIÓN DE CONTENIDO - BLOGAGENT       ║', 'magenta');
  log('║            (Versión Refactorizada)                         ║', 'magenta');
  log('╚════════════════════════════════════════════════════════════╝', 'magenta');
  
  const results = {
    fullPost: null,
    section: null,
    extend: null,
    improve: null,
    autocomplete: null
  };
  
  log('\n⏰ Iniciando pruebas...', 'cyan');
  
  // Test 1: Post completo
  results.fullPost = await testGenerateFullPost();
  await sleep(2000); // Esperar 2s entre pruebas
  
  // Test 2: Sección
  results.section = await testGenerateSection();
  await sleep(2000);
  
  // Test 3: Extender
  results.extend = await testExtendContent();
  await sleep(2000);
  
  // Test 4: Mejorar
  results.improve = await testImproveContent();
  await sleep(2000);
  
  // Test 5: Autocompletar
  results.autocomplete = await testAutoComplete();
  
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
  
  log('\n   Sugerencias de mejora:', 'cyan');
  log('   • Agregar más elementos estructurales (headers, listas)', 'white');
  log('   • Incluir ejemplos de código cuando sea relevante', 'white');
  log('   • Optimizar longitud de párrafos (60-80 palabras)', 'white');
  log('   • Mejorar coherencia entre secciones', 'white');
  
  printSeparator();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Ejecutar pruebas
runAllTests().catch(error => {
  log(`\n❌ Error crítico: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
