/**
 * 🧪 Diagnóstico Completo del Error 404
 * Verifica todas las capas del sistema
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

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
console.log('║         🔍 DIAGNÓSTICO DE ERROR 404 EN CHAT              ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

log.test('Test 1: Verificar que la ruta existe en el servidor...');
try {
  const response = await fetch('http://localhost:5000/api/agents/blog/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'test'
    })
  });

  console.log(`Status: ${response.status}`);
  const data = await response.json();
  
  if (response.status === 401) {
    log.success('✅ Ruta EXISTE (401 = autenticación requerida, es correcto)');
  } else if (response.status === 404) {
    log.error('❌ Ruta NO existe (404)');
    console.log('Respuesta:', JSON.stringify(data, null, 2));
  } else {
    console.log('Status:', response.status);
    console.log('Respuesta:', JSON.stringify(data, null, 2).substring(0, 200));
  }
} catch (error) {
  log.error(`Error de conexión: ${error.message}`);
}

console.log('\n' + '═'.repeat(60) + '\n');

log.test('Test 2: Verificar endpoints base...');
try {
  const response = await fetch('http://localhost:5000/api/agents/health');
  const data = await response.json();
  
  if (response.ok) {
    log.success('✅ Endpoint /health funciona');
  } else {
    log.error('❌ Endpoint /health retorna error');
  }
} catch (error) {
  log.error(`Error: ${error.message}`);
}

console.log('\n' + '═'.repeat(60) + '\n');

log.test('Test 3: Mostrar posibles problemas...\n');

console.log('📋 CHECKLIST DE CAUSAS COMUNES:\n');

console.log('1. ¿El servidor está corriendo?');
console.log('   Ejecución: npm start (en backend)');
console.log('   ¿Estado?: Verifica los logs del servidor\n');

console.log('2. ¿El puerto es correcto?');
console.log('   Backend debe estar en: http://localhost:5000');
console.log('   Frontend debe llamar a: http://localhost:5000/api/agents/blog/chat\n');

console.log('3. ¿El token de Clerk se está enviando?');
console.log('   Header requerido: Authorization: Bearer <TOKEN>');
console.log('   El frontend debe obtener el token con useAuth().getToken()\n');

console.log('4. ¿El middleware de autenticación está configurado?');
console.log('   En: backend/routes/agents.js');
console.log('   La ruta /blog/chat tiene: ...requireUser, chatWithBlogAgent\n');

console.log('5. ¿El CORS está configurado correctamente?');
console.log('   Frontend origin: http://localhost:5173');
console.log('   Debe estar en la lista de FRONTEND_URL en .env\n');

console.log('\n' + '═'.repeat(60) + '\n');

log.test('Test 4: Verificar logs del servidor...\n');

console.log('📝 LO QUE DEBERÍAS VER EN LOS LOGS DEL BACKEND:\n');
console.log('Cuando el frontend intenta llamar a /api/agents/blog/chat:\n');
console.log('ANTES (si falla autenticación):');
console.log('  ⚠️  [API] POST /api/agents/blog/chat - Status: 401');
console.log('  O');
console.log('  ❌ Token de autenticación requerido\n');

console.log('DESPUÉS (si funciona):');
console.log('  💬 Chat request from user <USER_ID>: "...');
console.log('  ✅ Chat response generated for user <USER_ID>');
console.log('  ✅ [API] POST /api/agents/blog/chat - Status: 200\n');

console.log('\n' + '═'.repeat(60) + '\n');

log.warning('\n⚠️  PRÓXIMOS PASOS PARA DEBUGGING:\n');

console.log('1. Abre el navegador en http://localhost:5173\n');

console.log('2. Abre DevTools (F12) y ve a la pestaña "Network"\n');

console.log('3. Filtra por "blog/chat"\n');

console.log('4. Intenta enviar un mensaje en el chat\n');

console.log('5. Deberías ver la solicitud en Network:\n');
console.log('   - URL: http://localhost:5000/api/agents/blog/chat');
console.log('   - Método: POST');
console.log('   - Status: 200 (éxito) o 401 (falta token)\n');

console.log('6. Click en la solicitud y ve a "Headers"\n');

console.log('7. Verifica que exista:\n');
console.log('   Authorization: Bearer eyJ0eXAiOiJKV1Q...\n');

console.log('8. Si NO está el header Authorization:\n');
console.log('   👉 El problema está en el frontend');
console.log('   👉 El hook useAIChat no está enviando el token\n');

console.log('9. Si ESTÁ el header:\n');
console.log('   👉 Revisa los logs del backend');
console.log('   👉 Busca el error específico\n');

console.log('\n' + '═'.repeat(60) + '\n');

log.info('💡 SOLUCIÓN RÁPIDA:\n');
console.log('Si el error persiste, ejecuta:\n');
console.log('1. Reinicia el backend: Ctrl+C, luego npm start');
console.log('2. Reinicia el frontend: Ctrl+C, luego npm run dev');
console.log('3. Limpia el navegador: Ctrl+Shift+Del → Caché\n');

console.log('\n✅ Análisis completado. Revisa los logs del servidor.\n');
