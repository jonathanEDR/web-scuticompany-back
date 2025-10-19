import dotenv from 'dotenv';
import cloudinary from '../config/cloudinary.js';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}════════════════════════════════════════${colors.reset}`);
console.log(`${colors.cyan}  VERIFICACIÓN DE CLOUDINARY           ${colors.reset}`);
console.log(`${colors.cyan}════════════════════════════════════════${colors.reset}\n`);

// Verificar variables de entorno
console.log('📋 Variables de entorno:\n');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log(`CLOUDINARY_CLOUD_NAME: ${cloudName ? `${colors.green}✓${colors.reset} ${cloudName}` : `${colors.red}✗ NO CONFIGURADO${colors.reset}`}`);
console.log(`CLOUDINARY_API_KEY: ${apiKey ? `${colors.green}✓${colors.reset} ${apiKey}` : `${colors.red}✗ NO CONFIGURADO${colors.reset}`}`);
console.log(`CLOUDINARY_API_SECRET: ${apiSecret ? `${colors.green}✓${colors.reset} ${apiSecret.substring(0, 4)}${'*'.repeat(apiSecret.length - 4)}` : `${colors.red}✗ NO CONFIGURADO${colors.reset}`}`);

if (!cloudName || !apiKey || !apiSecret) {
  console.log(`\n${colors.red}❌ ERROR: Faltan variables de entorno${colors.reset}`);
  console.log(`\nAsegúrate de configurar en .env:`);
  console.log(`  CLOUDINARY_CLOUD_NAME=ds54wlchi`);
  console.log(`  CLOUDINARY_API_KEY=648447163324168`);
  console.log(`  CLOUDINARY_API_SECRET=tu_secret_completo`);
  process.exit(1);
}

// Verificar conexión con Cloudinary
console.log(`\n🔌 Probando conexión con Cloudinary...\n`);

try {
  // Hacer una petición simple a Cloudinary
  const result = await cloudinary.api.ping();
  
  console.log(`${colors.green}✅ CONEXIÓN EXITOSA${colors.reset}`);
  console.log(`\nDetalles de la cuenta:`);
  console.log(`  Cloud name: ${cloudName}`);
  console.log(`  Estado: ${result.status}`);
  console.log(`\n${colors.green}🎉 ¡Cloudinary está configurado correctamente!${colors.reset}`);
  console.log(`\nPróximo paso:`);
  console.log(`  1. Hacer commit y push del código`);
  console.log(`  2. Configurar las mismas variables en Render`);
  console.log(`  3. Probar subida de imagen desde el CMS\n`);
  
  process.exit(0);
} catch (error) {
  console.log(`${colors.red}❌ ERROR DE CONEXIÓN${colors.reset}`);
  console.log(`\nDetalles del error:`);
  console.log(`  Mensaje: ${error.message}`);
  
  if (error.message.includes('Invalid API key')) {
    console.log(`\n${colors.yellow}💡 Solución:${colors.reset}`);
    console.log(`  El API_KEY es incorrecto. Verifica en Cloudinary Dashboard.`);
  } else if (error.message.includes('Invalid signature')) {
    console.log(`\n${colors.yellow}💡 Solución:${colors.reset}`);
    console.log(`  El API_SECRET es incorrecto. Verifica en Cloudinary Dashboard.`);
    console.log(`  Click en el ícono del ojo 👁️ para ver el valor completo.`);
  } else if (error.message.includes('cloud_name')) {
    console.log(`\n${colors.yellow}💡 Solución:${colors.reset}`);
    console.log(`  El CLOUD_NAME es incorrecto. Debe ser: ds54wlchi`);
  } else {
    console.log(`\n${colors.yellow}💡 Solución:${colors.reset}`);
    console.log(`  Revisa todas las credenciales en Cloudinary Dashboard.`);
  }
  
  console.log(`\nPara obtener las credenciales correctas:`);
  console.log(`  1. Ir a: https://cloudinary.com/console`);
  console.log(`  2. Ver "Account Details"`);
  console.log(`  3. Click en 👁️ para ver API Secret completo`);
  console.log(`  4. Copiar y pegar en .env\n`);
  
  process.exit(1);
}
