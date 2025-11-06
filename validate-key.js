/**
 * 🔐 Validador de API Key de OpenAI
 * Verifica que la key sea válida sin hacer solicitudes a la API
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const apiKey = process.env.OPENAI_API_KEY;

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║        🔐 VALIDADOR DE API KEY - OPENAI                  ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

if (!apiKey) {
  console.log('❌ ERROR: No hay API key configurada en .env\n');
  process.exit(1);
}

console.log('📋 Información de la API Key:');
console.log('─────────────────────────────────────────────────────────────');
console.log(`Primeros caracteres: ${apiKey.substring(0, 20)}...`);
console.log(`Últimos caracteres:  ...${apiKey.substring(apiKey.length - 10)}`);
console.log(`Longitud total:      ${apiKey.length} caracteres`);
console.log('');

// Validaciones básicas
console.log('🔍 Validaciones:');
console.log('─────────────────────────────────────────────────────────────');

const validations = [
  {
    name: 'Comienza con "sk-"',
    test: apiKey.startsWith('sk-'),
    required: true
  },
  {
    name: 'Contiene "proj"',
    test: apiKey.includes('proj'),
    required: true
  },
  {
    name: 'Longitud >= 48 caracteres',
    test: apiKey.length >= 48,
    required: true
  },
  {
    name: 'Solo caracteres válidos (a-z, A-Z, 0-9, -, _)',
    test: /^[a-zA-Z0-9_-]+$/.test(apiKey),
    required: true
  },
  {
    name: 'Sin espacios en blanco',
    test: apiKey.trim() === apiKey,
    required: true
  },
  {
    name: 'Sin saltos de línea (\\n, \\r)',
    test: !apiKey.includes('\n') && !apiKey.includes('\r'),
    required: true
  }
];

let allValid = true;
for (const validation of validations) {
  const status = validation.test ? '✅' : '❌';
  console.log(`${status} ${validation.name}`);
  if (!validation.test && validation.required) {
    allValid = false;
  }
}

console.log('');

if (!allValid) {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                  ❌ PROBLEMAS ENCONTRADOS                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('🔧 SOLUCIONES:\n');
  console.log('1. La API key es INVÁLIDA o INCOMPLETA');
  console.log('2. Asegúrate de copiar la clave COMPLETA sin espacios');
  console.log('3. No debe tener saltos de línea al inicio o final\n');
  
  console.log('📝 Pasos para obtener una nueva key:\n');
  console.log('1. Ve a: https://platform.openai.com/api-keys');
  console.log('2. Click en "Create new secret key"');
  console.log('3. Dale un nombre (ej: "Web-Scuti-Dev")');
  console.log('4. Click en "Create secret key"');
  console.log('5. COPIA la clave (solo aparece UNA VEZ)');
  console.log('6. Pega en el .env en la línea OPENAI_API_KEY=');
  console.log('7. GUARDA el archivo .env\n');
  
  console.log('⚠️  IMPORTANTE:\n');
  console.log('- Asegúrate de que NO haya espacios extras');
  console.log('- La línea debe verse exactamente así:');
  console.log('  OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx');
  console.log('- Sin comillas simples o dobles');
  console.log('- Sin comentarios en la misma línea\n');
  
} else {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║              ✅ API KEY VÁLIDA (FORMATO)                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('✅ La API key tiene el formato correcto');
  console.log('');
  console.log('Próximo paso: Ejecuta las pruebas de integración');
  console.log('');
  console.log('  node test-integration.js');
  console.log('');
  console.log('Si aún falla, puede ser que:\n');
  console.log('1. La key esté revocada o no esté activa');
  console.log('2. No tengas créditos en tu cuenta');
  console.log('3. Tu cuenta no esté verificada\n');
}

console.log('📞 Verifica tu cuenta en:');
console.log('   https://platform.openai.com/account/billing/overview\n');
