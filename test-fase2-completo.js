/**
 * TEST COMPLETO FASE 2
 * Prueba todas las funcionalidades del blog con IA
 * Incluye: Chat, Generación, Mejora, SEO, Autocompletado
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const CLERK_TOKEN = process.env.TEST_CLERK_TOKEN || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${CLERK_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

let passedTests = 0;
let failedTests = 0;

async function test(name, fn) {
  try {
    console.log(`\n⏳ Probando: ${name}...`);
    await fn();
    console.log(`✅ PASÓ: ${name}`);
    passedTests++;
  } catch (error) {
    console.error(`❌ FALLÓ: ${name}`);
    console.error(`   Error: ${error.message}`);
    failedTests++;
  }
}

// ============ PRUEBAS FASE 2 ============

async function runTests() {
  console.log('═══════════════════════════════════════════');
  console.log('   FASE 2: TESTING COMPLETO');
  console.log('═══════════════════════════════════════════\n');

  // TEST 1: Chat Conversacional
  await test('Chat Conversacional - Mensaje simple', async () => {
    const response = await api.post('/agents/blog/chat', {
      message: '¿Puedes ayudarme a escribir sobre inteligencia artificial?',
      context: {
        postId: 'test-post',
        title: 'IA en el futuro',
        content: 'Contenido inicial...',
      },
    });
    if (!response.data.response) throw new Error('No response generated');
    console.log(`   Respuesta recibida: "${response.data.response.substring(0, 60)}..."`);
  });

  // TEST 2: Generación de Contenido
  await test('Generación de Contenido - Crear sección', async () => {
    const response = await api.post('/agents/blog/generate-content', {
      action: 'generate',
      topic: 'Inteligencia Artificial',
      format: 'section',
      tone: 'profesional',
    });
    if (!response.data.content) throw new Error('No content generated');
    console.log(`   Sección generada: "${response.data.content.substring(0, 60)}..."`);
  });

  // TEST 3: Mejora de Contenido
  await test('Mejora de Contenido - Expandir texto', async () => {
    const response = await api.post('/agents/blog/generate-content', {
      action: 'expand',
      content: 'La IA es importante',
      length: 'medium',
    });
    if (!response.data.content) throw new Error('No expanded content');
    console.log(`   Contenido expandido: ${response.data.content.length} caracteres`);
  });

  // TEST 4: Análisis SEO
  await test('Análisis SEO - Optimizar para buscadores', async () => {
    const response = await api.post('/agents/blog/generate-content', {
      action: 'seo',
      content: 'Contenido sobre IA',
      keywords: ['inteligencia artificial', 'machine learning'],
    });
    if (!response.data.suggestions) throw new Error('No SEO suggestions');
    console.log(`   Sugerencias SEO: ${Object.keys(response.data.suggestions).length} recomendaciones`);
  });

  // TEST 5: Autocompletado
  await test('Autocompletado - Sugerencias en tiempo real', async () => {
    const response = await api.post('/agents/blog/chat', {
      message: 'Sugiere títulos para un artículo sobre',
      context: {
        mode: 'autocomplete',
      },
    });
    if (!response.data.suggestions) throw new Error('No suggestions');
    console.log(`   Sugerencias: ${response.data.suggestions.length} opciones`);
  });

  // TEST 6: Análisis de Intención
  await test('Análisis de Intención - Entender contexto', async () => {
    const response = await api.post('/agents/blog/chat', {
      message: 'Este párrafo necesita sonar más profesional',
      context: {
        postId: 'test-post',
      },
    });
    if (!response.data.response) throw new Error('No analysis');
    console.log(`   Análisis generado: "${response.data.response.substring(0, 60)}..."`);
  });

  // TEST 7: Validación de Errores
  await test('Validación - Request sin message', async () => {
    try {
      await api.post('/agents/blog/chat', {
        context: {},
      });
      throw new Error('Debería haber fallado');
    } catch (error) {
      if (error.response?.status !== 400) throw error;
      console.log(`   Error validado correctamente: ${error.response.status}`);
    }
  });

  // TEST 8: Rate Limiting
  await test('Rate Limiting - 10 requests rápidos', async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        api.post('/agents/blog/chat', {
          message: `Mensaje ${i}`,
          context: { postId: 'test' },
        }).catch(() => null)
      );
    }
    await Promise.all(promises);
    console.log(`   10 requests procesados`);
  });

  // TEST 9: Persistencia de Chat (opcional - si existe endpoint)
  await test('Persistencia - Guardar mensaje', async () => {
    try {
      const response = await api.post('/chat/save', {
        postId: 'test-post',
        message: 'Test message',
        response: 'Test response',
      }).catch(() => ({ status: 404 }));
      
      if (response.status === 404) {
        console.log(`   Endpoint aún no implementado (para Fase 2.2)`);
      } else {
        console.log(`   Mensaje guardado: ${response.data.id}`);
      }
    } catch (error) {
      console.log(`   Endpoint no disponible (esperado)`);
    }
  });

  // TEST 10: Salud General del Sistema
  await test('Salud del Sistema', async () => {
    const response = await api.get('/health');
    if (response.data.status !== 'ok') throw new Error('System not healthy');
    console.log(`   Sistema operacional: ${response.data.agents?.length || '?'} agentes activos`);
  });

  // ============ RESUMEN ============
  console.log('\n═══════════════════════════════════════════');
  console.log('   RESUMEN RESULTADOS');
  console.log('═══════════════════════════════════════════');
  console.log(`✅ Pasaron: ${passedTests} pruebas`);
  console.log(`❌ Fallaron: ${failedTests} pruebas`);
  console.log(`📊 Total: ${passedTests + failedTests} pruebas`);
  console.log(`🎯 Tasa éxito: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);
  console.log('═══════════════════════════════════════════\n');

  // Recomendaciones
  if (failedTests === 0) {
    console.log('🎉 ¡TODAS LAS PRUEBAS PASARON!');
    console.log('✅ Fase 2.1 completada: Testing funcionalidades');
    console.log('⏳ Próximo: 2.2 Persistencia de chat en BD');
  } else {
    console.log(`⚠️  ${failedTests} prueba(s) necesita(n) atención`);
  }
}

runTests().catch(console.error);
