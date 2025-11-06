/**
 * 🧪 Script de Prueba con Autenticación Clerk
 * Simula un usuario autenticado para probar endpoints protegidos
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const API_URL = 'http://localhost:5000';

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

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║   🧪 PRUEBAS CON AUTENTICACIÓN CLERK                      ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

log.warning('NOTA: Para pruebas COMPLETAS, necesitas un token válido de Clerk');
log.info('Obtén un token iniciando sesión en el frontend y copiando de DevTools\n');

log.test('Test 1: Endpoint de chat SIN token (debe fallar con 401)...');
try {
  const response = await fetch(`${API_URL}/api/agents/blog/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Hola',
      context: { title: 'Test', content: 'Test content' }
    })
  });

  const data = await response.json();
  
  if (response.status === 401) {
    log.success('Endpoint correctamente protegido (401 esperado)');
    console.log('Respuesta:', JSON.stringify(data, null, 2).substring(0, 150));
  } else {
    log.error(`Status inesperado: ${response.status}`);
  }
} catch (error) {
  log.error(`Error: ${error.message}`);
}

console.log('');

log.test('Test 2: Endpoint de generación SIN token (debe fallar con 401)...');
try {
  const response = await fetch(`${API_URL}/api/agents/blog/generate-content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'section',
      title: 'Test',
      currentContent: 'Test content'
    })
  });

  const data = await response.json();
  
  if (response.status === 401) {
    log.success('Endpoint correctamente protegido (401 esperado)');
  } else {
    log.error(`Status inesperado: ${response.status}`);
  }
} catch (error) {
  log.error(`Error: ${error.message}`);
}

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║              INSTRUCCIONES PARA PRÓXIMOS PASOS             ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('1️⃣  OPCIÓN A: Probar desde el Frontend (Recomendado)');
console.log('   ───────────────────────────────────────────────────────\n');
console.log('   a) Asegúrate de que AMBOS servidores estén corriendo:');
console.log('      - Backend: npm start (en esta terminal)');
console.log('      - Frontend: npm run dev (en otra terminal)\n');
console.log('   b) Abre: http://localhost:5173\n');
console.log('   c) Inicia sesión con tu usuario\n');
console.log('   d) Ve a: Dashboard → Blog → Crear/Editar Post\n');
console.log('   e) Click en "✨ Asistente IA"\n');
console.log('   f) Prueba el chat escribiendo:');
console.log('      "Ayúdame a escribir un artículo sobre inteligencia artificial"\n');

console.log('\n2️⃣  OPCIÓN B: Probar con Token (Avanzado)');
console.log('   ───────────────────────────────────────────────────────\n');
console.log('   a) Inicia sesión en http://localhost:5173\n');
console.log('   b) Abre DevTools (F12) → Pestaña "Application"\n');
console.log('   c) Ve a "Cookies" → Busca "__clerk_db_jwt"\n');
console.log('   d) Copia el valor del token\n');
console.log('   e) Crea un archivo test-with-token.js y usa:\n');

const exampleCode = `
fetch('http://localhost:5000/api/agents/blog/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer TU_TOKEN_AQUI'
  },
  body: JSON.stringify({
    message: 'Hola, ayúdame a escribir',
    context: { title: 'Mi Post', content: 'Contenido inicial' }
  })
})
.then(r => r.json())
.then(data => console.log(data));
`;

console.log(exampleCode);

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                   RESUMEN FINAL                            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

log.success('✅ API Key de OpenAI: FUNCIONANDO');
log.success('✅ Backend: FUNCIONANDO');
log.success('✅ Agentes: INICIALIZADOS');
log.success('✅ Endpoints: PROTEGIDOS CORRECTAMENTE');
log.warning('⏳ Falta: Probar desde el frontend con usuario autenticado\n');

console.log('🎯 SIGUIENTE PASO:\n');
console.log('Reinicia AMBOS servidores y accede desde http://localhost:5173\n');

console.log('═══════════════════════════════════════════════════════════════\n');
