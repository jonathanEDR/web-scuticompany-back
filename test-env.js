/**
 * 🔍 Script de Diagnóstico de Variables de Entorno
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar .env
const result = dotenv.config({ path: join(__dirname, '.env') });

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║         DIAGNÓSTICO DE VARIABLES DE ENTORNO               ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('Archivo .env cargado desde:', join(__dirname, '.env'));
console.log('Resultado de dotenv.config():', result.error ? `ERROR: ${result.error}` : 'OK');
console.log('');

// Variables críticas
const criticalVars = {
  'PORT': process.env.PORT,
  'NODE_ENV': process.env.NODE_ENV,
  'MONGODB_URI': process.env.MONGODB_URI ? '✅ Configurada' : '❌ No configurada',
  'OPENAI_API_KEY': process.env.OPENAI_API_KEY ? 
    `✅ Configurada (${process.env.OPENAI_API_KEY.substring(0, 10)}...${process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 5)})` 
    : '❌ No configurada',
  'BASE_URL': process.env.BASE_URL,
  'CLERK_SECRET_KEY': process.env.CLERK_SECRET_KEY ? '✅ Configurada' : '❌ No configurada'
};

console.log('Variables Críticas:');
console.log('─────────────────────────────────────────────────────────────');
for (const [key, value] of Object.entries(criticalVars)) {
  console.log(`${key.padEnd(20)}: ${value}`);
}

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                      CONCLUSIÓN                            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

if (!process.env.OPENAI_API_KEY) {
  console.log('❌ PROBLEMA: OPENAI_API_KEY no está disponible');
  console.log('');
  console.log('Soluciones posibles:');
  console.log('1. Verifica que el archivo .env existe en la carpeta backend');
  console.log('2. Verifica que la línea OPENAI_API_KEY= no tenga espacios extras');
  console.log('3. Reinicia el servidor después de modificar .env');
  console.log('');
} else {
  console.log('✅ OPENAI_API_KEY está configurada correctamente');
  console.log('');
  console.log('Longitud de la key:', process.env.OPENAI_API_KEY.length, 'caracteres');
  console.log('');
}
