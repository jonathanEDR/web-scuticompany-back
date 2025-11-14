/**
 * Test del sistema conversacional de blog
 * Prueba el flujo completo desde inicio hasta guardar borrador
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/agents/blog/session`;

// Token de prueba (reemplazar con token real de Clerk)
const TEST_TOKEN = process.env.TEST_CLERK_TOKEN || 'your_clerk_token_here';

let sessionId = null;

async function makeRequest(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_TOKEN}`
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, options);
  const data = await response.json();
  
  return { status: response.status, data };
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function test1_StartSession() {
  console.log('\n📝 Test 1: Iniciar Sesión');
  console.log('═'.repeat(50));
  
  const { status, data } = await makeRequest('POST', '/start', {
    startedFrom: 'test'
  });
  
  if (data.success) {
    sessionId = data.data.sessionId;
    console.log('✅ Sesión iniciada correctamente');
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   Stage: ${data.data.stage}`);
    console.log(`   Progress: ${data.data.progress}%`);
    console.log(`   Mensaje: ${data.data.message.substring(0, 80)}...`);
    return true;
  } else {
    console.log('❌ Error al iniciar sesión:', data.message);
    return false;
  }
}

async function test2_DiscoverTopic() {
  console.log('\n🎯 Test 2: Descubrir Tema');
  console.log('═'.repeat(50));
  
  const { status, data } = await makeRequest('POST', `/${sessionId}/message`, {
    message: 'Quiero escribir sobre Next.js 14 y las nuevas características del App Router'
  });
  
  if (data.success) {
    console.log('✅ Tema procesado correctamente');
    console.log(`   Stage: ${data.data.stage}`);
    console.log(`   Progress: ${data.data.progress}%`);
    console.log(`   Título sugerido: ${data.data.context?.suggestedTitle || 'N/A'}`);
    console.log(`   Mensaje: ${data.data.message.substring(0, 80)}...`);
    return true;
  } else {
    console.log('❌ Error al procesar tema:', data.message);
    return false;
  }
}

async function test3_SelectType() {
  console.log('\n📚 Test 3: Seleccionar Tipo (Guía Completa)');
  console.log('═'.repeat(50));
  
  const { status, data } = await makeRequest('POST', `/${sessionId}/message`, {
    message: '2' // Guía completa
  });
  
  if (data.success) {
    console.log('✅ Tipo seleccionado correctamente');
    console.log(`   Stage: ${data.data.stage}`);
    console.log(`   Progress: ${data.data.progress}%`);
    console.log(`   Template: ${data.data.context?.selectedTemplate || 'N/A'}`);
    console.log(`   Mensaje: ${data.data.message.substring(0, 80)}...`);
    return true;
  } else {
    console.log('❌ Error al seleccionar tipo:', data.message);
    return false;
  }
}

async function test4_ProvideDetails() {
  console.log('\n🔧 Test 4: Proporcionar Detalles');
  console.log('═'.repeat(50));
  
  const { status, data } = await makeRequest('POST', `/${sessionId}/message`, {
    message: 'Audiencia: desarrolladores intermedios, Longitud: artículo largo, Keywords: Next.js 14, App Router, Server Components'
  });
  
  if (data.success) {
    console.log('✅ Detalles procesados correctamente');
    console.log(`   Stage: ${data.data.stage}`);
    console.log(`   Progress: ${data.data.progress}%`);
    console.log(`   Mensaje: ${data.data.message.substring(0, 80)}...`);
    return true;
  } else {
    console.log('❌ Error al procesar detalles:', data.message);
    return false;
  }
}

async function test5_SelectCategory() {
  console.log('\n🏷️  Test 5: Elegir Categoría');
  console.log('═'.repeat(50));
  
  const { status, data } = await makeRequest('POST', `/${sessionId}/message`, {
    message: '1' // Primera categoría
  });
  
  if (data.success) {
    console.log('✅ Categoría seleccionada correctamente');
    console.log(`   Stage: ${data.data.stage}`);
    console.log(`   Progress: ${data.data.progress}%`);
    console.log(`   Mensaje: ${data.data.message.substring(0, 80)}...`);
    return true;
  } else {
    console.log('❌ Error al seleccionar categoría:', data.message);
    return false;
  }
}

async function test6_ConfirmGeneration() {
  console.log('\n🎨 Test 6: Confirmar Generación');
  console.log('═'.repeat(50));
  
  const { status, data } = await makeRequest('POST', `/${sessionId}/message`, {
    message: 'sí, generar'
  });
  
  if (data.success) {
    console.log('✅ Generación iniciada correctamente');
    console.log(`   Status: ${data.data.status}`);
    console.log(`   Mensaje: ${data.data.message}`);
    
    if (data.data.shouldGenerate) {
      console.log('   ⏳ Esperando generación (esto toma 2-3 minutos)...');
      return true;
    }
    return true;
  } else {
    console.log('❌ Error al iniciar generación:', data.message);
    return false;
  }
}

async function test7_PollGeneration() {
  console.log('\n⏳ Test 7: Poll Generación (cada 5 segundos)');
  console.log('═'.repeat(50));
  
  let attempts = 0;
  const maxAttempts = 40; // 40 * 5s = 3.3 minutos max
  
  while (attempts < maxAttempts) {
    attempts++;
    
    const { status, data } = await makeRequest('GET', `/${sessionId}`);
    
    if (data.success) {
      const sessionData = data.data;
      
      process.stdout.write(`\r   Intento ${attempts}/${maxAttempts} | Status: ${sessionData.status} | Progress: ${sessionData.progress}%`);
      
      if (sessionData.status === 'completed') {
        console.log('\n✅ Generación completada exitosamente');
        console.log(`   Word Count: ${sessionData.result?.metadata?.wordCount || 'N/A'}`);
        console.log(`   Reading Time: ${sessionData.result?.metadata?.readingTime || 'N/A'} min`);
        console.log(`   SEO Score: ${sessionData.result?.metadata?.seoScore || 'N/A'}/100`);
        return true;
      }
      
      if (sessionData.status === 'failed') {
        console.log('\n❌ Generación falló');
        console.log(`   Error: ${sessionData.generation?.error || 'Unknown error'}`);
        return false;
      }
      
      // Esperar 5 segundos antes del próximo poll
      await sleep(5000);
    } else {
      console.log('\n❌ Error al obtener estado:', data.message);
      return false;
    }
  }
  
  console.log('\n⚠️  Timeout: Generación tomó más de 3 minutos');
  return false;
}

async function test8_SaveDraft() {
  console.log('\n💾 Test 8: Guardar Borrador');
  console.log('═'.repeat(50));
  
  const { status, data } = await makeRequest('POST', `/${sessionId}/save`, {
    tags: ['nextjs', 'react', 'javascript', 'test']
  });
  
  if (data.success) {
    console.log('✅ Borrador guardado correctamente');
    console.log(`   Post ID: ${data.data.id}`);
    console.log(`   Title: ${data.data.title}`);
    console.log(`   Slug: ${data.data.slug}`);
    console.log(`   Status: ${data.data.status}`);
    console.log(`   SEO Score: ${data.data.seoScore}/100`);
    console.log(`   URL: ${data.data.url}`);
    return true;
  } else {
    console.log('❌ Error al guardar borrador:', data.message);
    return false;
  }
}

async function test9_ListSessions() {
  console.log('\n📋 Test 9: Listar Sesiones');
  console.log('═'.repeat(50));
  
  const { status, data } = await makeRequest('GET', '?limit=5');
  
  if (data.success) {
    console.log(`✅ Sesiones listadas correctamente (${data.data.sessions.length})`);
    data.data.sessions.forEach((session, index) => {
      console.log(`   ${index + 1}. ${session.sessionId}`);
      console.log(`      Status: ${session.status} | Stage: ${session.stage} | Progress: ${session.progress}%`);
      console.log(`      Title: ${session.title || 'N/A'}`);
    });
    return true;
  } else {
    console.log('❌ Error al listar sesiones:', data.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🧪 INICIANDO TESTS DEL SISTEMA CONVERSACIONAL DE BLOG');
  console.log('═'.repeat(70));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Token: ${TEST_TOKEN.substring(0, 20)}...`);
  console.log('═'.repeat(70));
  
  const results = [];
  
  // Test 1: Iniciar sesión
  results.push({ test: 'Start Session', passed: await test1_StartSession() });
  if (!results[0].passed) {
    console.log('\n❌ Test 1 falló, deteniendo tests');
    return;
  }
  
  await sleep(1000);
  
  // Test 2: Descubrir tema
  results.push({ test: 'Discover Topic', passed: await test2_DiscoverTopic() });
  await sleep(1000);
  
  // Test 3: Seleccionar tipo
  results.push({ test: 'Select Type', passed: await test3_SelectType() });
  await sleep(1000);
  
  // Test 4: Proporcionar detalles
  results.push({ test: 'Provide Details', passed: await test4_ProvideDetails() });
  await sleep(1000);
  
  // Test 5: Elegir categoría
  results.push({ test: 'Select Category', passed: await test5_SelectCategory() });
  await sleep(1000);
  
  // Test 6: Confirmar generación
  results.push({ test: 'Confirm Generation', passed: await test6_ConfirmGeneration() });
  await sleep(2000);
  
  // Test 7: Poll generación
  results.push({ test: 'Poll Generation', passed: await test7_PollGeneration() });
  
  // Test 8: Guardar borrador
  results.push({ test: 'Save Draft', passed: await test8_SaveDraft() });
  await sleep(1000);
  
  // Test 9: Listar sesiones
  results.push({ test: 'List Sessions', passed: await test9_ListSessions() });
  
  // Resumen
  console.log('\n\n📊 RESUMEN DE TESTS');
  console.log('═'.repeat(70));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(1);
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.test}`);
  });
  
  console.log('═'.repeat(70));
  console.log(`✅ Passed: ${passed}/${total} (${percentage}%)`);
  
  if (passed === total) {
    console.log('\n🎉 ¡TODOS LOS TESTS PASARON EXITOSAMENTE!');
  } else {
    console.log(`\n⚠️  ${total - passed} test(s) fallaron`);
  }
}

// Ejecutar tests
if (!TEST_TOKEN || TEST_TOKEN === 'your_clerk_token_here') {
  console.log('❌ Error: Debes configurar TEST_CLERK_TOKEN en el archivo .env');
  console.log('   Ejemplo: TEST_CLERK_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...');
  process.exit(1);
}

runAllTests().catch(error => {
  console.error('\n❌ Error fatal en los tests:', error);
  process.exit(1);
});
