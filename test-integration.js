/**
 * 🧪 Script de Pruebas de Integración
 * Verifica conexión OpenAI y endpoints del sistema de Chat IA
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde el archivo .env en la carpeta backend
dotenv.config({ path: join(__dirname, '.env') });

const API_URL = process.env.BASE_URL || 'http://localhost:5000';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`)
};

// Simulación de token de autenticación (reemplazar con token real para pruebas completas)
const MOCK_TOKEN = 'test-token-for-integration';

/**
 * Test 1: Verificar API Key de OpenAI
 */
async function testOpenAIConnection() {
  log.test('Test 1: Verificando conexión con OpenAI...');
  
  if (!OPENAI_API_KEY) {
    log.error('OPENAI_API_KEY no está configurada en .env');
    return false;
  }

  if (OPENAI_API_KEY.length < 20) {
    log.error('OPENAI_API_KEY parece inválida (muy corta)');
    return false;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      log.success(`OpenAI conectado correctamente. Modelos disponibles: ${data.data.length}`);
      log.info(`Modelo recomendado: gpt-4o-mini o gpt-3.5-turbo`);
      return true;
    } else {
      const error = await response.text();
      log.error(`Error conectando a OpenAI: ${response.status}`);
      console.log('Respuesta:', error.substring(0, 200));
      return false;
    }
  } catch (error) {
    log.error(`Error de red conectando a OpenAI: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Verificar que el backend está corriendo
 */
async function testBackendHealth() {
  log.test('Test 2: Verificando que el backend esté corriendo...');
  
  try {
    const response = await fetch(`${API_URL}/api/agents/health`, {
      method: 'GET'
    });

    if (response.ok) {
      const data = await response.json();
      log.success('Backend está corriendo correctamente');
      console.log('Health check:', JSON.stringify(data, null, 2));
      return true;
    } else {
      log.error(`Backend respondió con error: ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`No se pudo conectar al backend en ${API_URL}`);
    log.warning('Asegúrate de que el servidor esté corriendo: npm start');
    return false;
  }
}

/**
 * Test 3: Verificar endpoint de capacidades de agentes
 */
async function testAgentCapabilities() {
  log.test('Test 3: Verificando capacidades de los agentes...');
  
  try {
    const response = await fetch(`${API_URL}/api/agents/capabilities`, {
      method: 'GET'
    });

    if (response.ok) {
      const data = await response.json();
      log.success('Capacidades de agentes obtenidas');
      console.log('Agentes disponibles:', data.agents || 'N/A');
      return true;
    } else {
      log.error(`Error obteniendo capacidades: ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Error consultando capacidades: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Probar generación simple de texto con OpenAI
 */
async function testOpenAIGeneration() {
  log.test('Test 4: Probando generación de texto con OpenAI...');
  
  if (!OPENAI_API_KEY) {
    log.warning('Saltando test: OPENAI_API_KEY no configurada');
    return false;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Eres un asistente útil.' },
          { role: 'user', content: 'Di "hola" en una palabra' }
        ],
        max_tokens: 10
      })
    });

    if (response.ok) {
      const data = await response.json();
      const message = data.choices[0].message.content;
      log.success(`OpenAI generó texto correctamente: "${message}"`);
      return true;
    } else {
      const error = await response.json();
      log.error(`Error generando texto: ${error.error?.message || response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Error en generación de texto: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Probar endpoint de chat (SIN autenticación para debugging)
 */
async function testChatEndpoint() {
  log.test('Test 5: Probando endpoint de chat (sin auth)...');
  
  try {
    const response = await fetch(`${API_URL}/api/agents/blog/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Hola, ¿puedes ayudarme?',
        context: {
          title: 'Post de prueba',
          content: 'Este es un contenido de prueba',
          category: 'Tecnología'
        }
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      log.success('Endpoint de chat respondió correctamente');
      console.log('Respuesta:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
      return true;
    } else {
      log.warning(`Chat endpoint requiere autenticación o tiene error: ${response.status}`);
      console.log('Error:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    log.error(`Error llamando al endpoint de chat: ${error.message}`);
    return false;
  }
}

/**
 * Test 6: Probar endpoint de generación de contenido
 */
async function testGenerationEndpoint() {
  log.test('Test 6: Probando endpoint de generación de contenido...');
  
  try {
    const response = await fetch(`${API_URL}/api/agents/blog/generate-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'section',
        title: 'Beneficios de la IA',
        currentContent: 'La inteligencia artificial está transformando el mundo.',
        wordCount: 100
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      log.success('Endpoint de generación respondió correctamente');
      console.log('Contenido generado:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
      return true;
    } else {
      log.warning(`Generación endpoint requiere autenticación o tiene error: ${response.status}`);
      console.log('Error:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    log.error(`Error llamando al endpoint de generación: ${error.message}`);
    return false;
  }
}

/**
 * Ejecutar todas las pruebas
 */
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   🧪 SUITE DE PRUEBAS DE INTEGRACIÓN - CHAT IA BLOG      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const results = {
    total: 6,
    passed: 0,
    failed: 0
  };

  // Test 1: OpenAI Connection
  const test1 = await testOpenAIConnection();
  results[test1 ? 'passed' : 'failed']++;
  console.log('');

  // Test 2: Backend Health
  const test2 = await testBackendHealth();
  results[test2 ? 'passed' : 'failed']++;
  console.log('');

  // Test 3: Agent Capabilities
  const test3 = await testAgentCapabilities();
  results[test3 ? 'passed' : 'failed']++;
  console.log('');

  // Test 4: OpenAI Generation
  const test4 = await testOpenAIGeneration();
  results[test4 ? 'passed' : 'failed']++;
  console.log('');

  // Test 5: Chat Endpoint
  const test5 = await testChatEndpoint();
  results[test5 ? 'passed' : 'failed']++;
  console.log('');

  // Test 6: Generation Endpoint
  const test6 = await testGenerationEndpoint();
  results[test6 ? 'passed' : 'failed']++;
  console.log('');

  // Resumen
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                     RESUMEN DE PRUEBAS                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`Total de pruebas: ${results.total}`);
  console.log(`${colors.green}✅ Exitosas: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Fallidas: ${results.failed}${colors.reset}`);
  console.log('');

  if (results.passed === results.total) {
    log.success('¡Todas las pruebas pasaron! Sistema listo para usar 🎉');
  } else if (results.passed > 0) {
    log.warning(`${results.passed}/${results.total} pruebas pasaron. Revisa los errores arriba.`);
  } else {
    log.error('Todas las pruebas fallaron. Revisa la configuración del sistema.');
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                   PASOS SIGUIENTES                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (!test1) {
    console.log('1. Verifica tu OPENAI_API_KEY en el archivo .env');
    console.log('   - Obtén una key en: https://platform.openai.com/api-keys');
    console.log('   - Asegúrate de que tenga créditos disponibles\n');
  }

  if (!test2) {
    console.log('2. Inicia el servidor backend:');
    console.log('   cd backend && npm start\n');
  }

  if (test1 && test2 && (!test5 || !test6)) {
    console.log('3. Los endpoints requieren autenticación de Clerk');
    console.log('   - Prueba desde el frontend con un usuario autenticado');
    console.log('   - O usa el token de Clerk en las pruebas\n');
  }

  console.log('');
}

// Ejecutar pruebas
runAllTests().catch(error => {
  log.error(`Error ejecutando pruebas: ${error.message}`);
  console.error(error);
  process.exit(1);
});
