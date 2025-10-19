import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  white: '\x1b[37m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}━━━ ${msg} ━━━${colors.reset}`)
};

// Configuración
const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

// Función para hacer peticiones HTTP con timeout
const fetchWithTimeout = async (url, options = {}, timeout = 5000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Test 1: Verificar que el servidor está corriendo
const testServerHealth = async () => {
  log.section('1. VERIFICAR SERVIDOR');
  
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/health`);
    
    if (response.ok) {
      const data = await response.json();
      log.success(`Servidor OK (${response.status})`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Database: ${data.database?.healthy ? 'Conectada' : 'Desconectada'}`);
      return true;
    } else {
      log.error(`Servidor respondió con error: ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`No se pudo conectar al servidor: ${error.message}`);
    console.log(`   Verificar que el servidor esté corriendo en ${BASE_URL}`);
    return false;
  }
};

// Test 2: Verificar endpoint de páginas (incluye URLs de imágenes)
const testPagesEndpoint = async () => {
  log.section('2. ENDPOINT DE PÁGINAS');
  
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/cms/pages`);
    
    if (!response.ok) {
      log.error(`Error al obtener páginas: ${response.status}`);
      return null;
    }
    
    const result = await response.json();
    log.success(`Páginas obtenidas: ${result.count}`);
    
    // Extraer URLs de imágenes
    const imageUrls = [];
    
    const extractUrls = (obj, path = '') => {
      if (!obj || typeof obj !== 'object') return;
      
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && (
          value.includes('/uploads/') || 
          value.match(/\.(jpg|jpeg|png|gif|webp)$/i)
        )) {
          imageUrls.push({ path: `${path}.${key}`, url: value });
        } else if (typeof value === 'object' && value !== null) {
          extractUrls(value, path ? `${path}.${key}` : key);
        }
      }
    };
    
    if (result.data) {
      result.data.forEach(page => {
        extractUrls(page, page.pageSlug);
      });
    }
    
    console.log(`   URLs de imágenes encontradas: ${imageUrls.length}`);
    
    if (imageUrls.length > 0) {
      console.log('\n   Muestra de URLs:');
      imageUrls.slice(0, 3).forEach((item, idx) => {
        const isAbsolute = item.url.startsWith('http');
        const color = isAbsolute ? colors.green : colors.yellow;
        console.log(`   ${idx + 1}. ${color}${item.url}${colors.reset}`);
        console.log(`      Campo: ${item.path}`);
      });
      
      if (imageUrls.length > 3) {
        console.log(`   ... y ${imageUrls.length - 3} URLs más`);
      }
    }
    
    return imageUrls;
  } catch (error) {
    log.error(`Error al probar endpoint: ${error.message}`);
    return null;
  }
};

// Test 3: Verificar acceso directo a imágenes
const testImageAccess = async (imageUrls) => {
  log.section('3. ACCESO DIRECTO A IMÁGENES');
  
  if (!imageUrls || imageUrls.length === 0) {
    log.warning('No hay URLs de imágenes para probar');
    return;
  }
  
  // Probar las primeras 5 imágenes
  const samplUrls = imageUrls.slice(0, 5);
  
  for (const item of samplUrls) {
    try {
      console.log(`\n   Probando: ${item.url}`);
      
      const response = await fetchWithTimeout(item.url, {}, 10000);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');
        
        log.success(`Accesible (${response.status})`);
        console.log(`     Content-Type: ${contentType}`);
        console.log(`     Tamaño: ${contentLength ? (parseInt(contentLength) / 1024).toFixed(2) + ' KB' : 'Desconocido'}`);
      } else {
        log.error(`No accesible (${response.status})`);
        
        if (response.status === 404) {
          console.log(`     ${colors.red}La imagen no existe en el servidor${colors.reset}`);
        } else if (response.status === 403) {
          console.log(`     ${colors.red}Acceso denegado (problema de CORS o permisos)${colors.reset}`);
        }
      }
    } catch (error) {
      log.error(`Error al acceder: ${error.message}`);
      
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        console.log(`     ${colors.red}El servidor no es accesible desde esta URL${colors.reset}`);
      }
    }
  }
};

// Test 4: Verificar archivos físicos en el servidor
const testPhysicalFiles = () => {
  log.section('4. ARCHIVOS FÍSICOS EN SERVIDOR');
  
  const uploadsDir = path.join(__dirname, '../uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    log.error('El directorio uploads no existe');
    return [];
  }
  
  const files = fs.readdirSync(uploadsDir);
  log.success(`Archivos encontrados: ${files.length}`);
  
  if (files.length > 0) {
    console.log('\n   Archivos:');
    files.slice(0, 5).forEach((file, idx) => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`   ${idx + 1}. ${file} (${sizeKB} KB)`);
    });
    
    if (files.length > 5) {
      console.log(`   ... y ${files.length - 5} archivos más`);
    }
  }
  
  return files;
};

// Test 5: Verificar ruta estática de Express
const testStaticRoute = async () => {
  log.section('5. RUTA ESTÁTICA /uploads');
  
  // Obtener un archivo de ejemplo
  const uploadsDir = path.join(__dirname, '../uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    log.warning('No se puede probar: directorio uploads no existe');
    return;
  }
  
  const files = fs.readdirSync(uploadsDir);
  
  if (files.length === 0) {
    log.warning('No se puede probar: no hay archivos en uploads');
    return;
  }
  
  const testFile = files[0];
  const testUrl = `${BASE_URL}/uploads/${testFile}`;
  
  console.log(`   Probando ruta estática con: ${testFile}`);
  
  try {
    const response = await fetchWithTimeout(testUrl);
    
    if (response.ok) {
      log.success('Ruta estática configurada correctamente');
      console.log(`   URL: ${testUrl}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    } else {
      log.error(`Ruta estática no funciona (${response.status})`);
      console.log(`   URL probada: ${testUrl}`);
    }
  } catch (error) {
    log.error(`Error al probar ruta estática: ${error.message}`);
  }
};

// Test 6: Verificar CORS
const testCORS = async () => {
  log.section('6. CONFIGURACIÓN CORS');
  
  const frontendUrls = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(u => u.trim())
    : ['http://localhost:5173'];
  
  console.log('   Frontend URLs configuradas:');
  frontendUrls.forEach(url => console.log(`   - ${url}`));
  
  // Probar CORS con una petición OPTIONS
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/cms/pages`, {
      method: 'OPTIONS',
      headers: {
        'Origin': frontendUrls[0],
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    const allowOrigin = response.headers.get('access-control-allow-origin');
    const allowMethods = response.headers.get('access-control-allow-methods');
    
    if (allowOrigin) {
      log.success('CORS configurado');
      console.log(`   Allow-Origin: ${allowOrigin}`);
      console.log(`   Allow-Methods: ${allowMethods || 'No especificado'}`);
    } else {
      log.warning('CORS podría no estar configurado correctamente');
    }
  } catch (error) {
    log.warning(`No se pudo verificar CORS: ${error.message}`);
  }
};

// Test 7: Comparar URLs esperadas vs reales
const compareUrlFormats = (imageUrls, files) => {
  log.section('7. ANÁLISIS DE FORMATO DE URLs');
  
  const issues = [];
  
  // Verificar formato de URLs
  imageUrls.forEach(item => {
    const url = item.url;
    
    // URLs que incluyen localhost
    if (url.includes('localhost')) {
      issues.push({
        type: 'LOCALHOST_URL',
        severity: 'CRÍTICO',
        url: url,
        path: item.path,
        message: 'URL contiene localhost - no funcionará en producción'
      });
    }
    
    // URLs relativas en producción
    if (url.startsWith('/uploads/') && process.env.NODE_ENV === 'production') {
      issues.push({
        type: 'RELATIVE_URL',
        severity: 'ADVERTENCIA',
        url: url,
        path: item.path,
        message: 'URL relativa - asegurar que BASE_URL esté configurado'
      });
    }
    
    // Extraer nombre de archivo
    const filename = url.split('/').pop().split('?')[0];
    
    // Verificar si el archivo existe
    if (filename && !files.includes(filename)) {
      issues.push({
        type: 'MISSING_FILE',
        severity: 'ERROR',
        url: url,
        path: item.path,
        message: `Archivo ${filename} no encontrado en el servidor`
      });
    }
  });
  
  if (issues.length === 0) {
    log.success('No se encontraron problemas en las URLs');
  } else {
    log.warning(`Se encontraron ${issues.length} problemas`);
    
    // Agrupar por tipo
    const grouped = {};
    issues.forEach(issue => {
      if (!grouped[issue.type]) grouped[issue.type] = [];
      grouped[issue.type].push(issue);
    });
    
    console.log('');
    Object.entries(grouped).forEach(([type, items]) => {
      const severity = items[0].severity;
      const color = severity === 'CRÍTICO' ? colors.red : 
                   severity === 'ERROR' ? colors.red : colors.yellow;
      
      console.log(`   ${color}${severity}${colors.reset}: ${type} (${items.length})`);
      items.slice(0, 3).forEach(item => {
        console.log(`     - ${item.path}`);
        console.log(`       ${item.url}`);
        console.log(`       ${colors.yellow}${item.message}${colors.reset}`);
      });
      
      if (items.length > 3) {
        console.log(`     ... y ${items.length - 3} más`);
      }
      console.log('');
    });
  }
  
  return issues;
};

// Función principal
const runTests = async () => {
  console.log(`${colors.cyan}╔═══════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  🧪 TEST DE ENDPOINTS DE IMÁGENES       ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════╝${colors.reset}\n`);
  
  console.log(`Fecha: ${new Date().toLocaleString('es-ES')}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}\n`);
  
  // Ejecutar tests
  const serverOk = await testServerHealth();
  
  if (!serverOk) {
    log.error('\n❌ El servidor no está accesible. Tests abortados.');
    console.log('\nVerificar:');
    console.log('  1. El servidor está corriendo: npm run dev');
    console.log('  2. El puerto es correcto en .env');
    console.log('  3. No hay firewall bloqueando la conexión');
    process.exit(1);
  }
  
  const imageUrls = await testPagesEndpoint();
  const files = testPhysicalFiles();
  
  if (imageUrls && imageUrls.length > 0) {
    await testImageAccess(imageUrls);
    const issues = compareUrlFormats(imageUrls, files);
    
    // Resumen de problemas
    if (issues.length > 0) {
      console.log(`\n${colors.bgRed}${colors.white} RESUMEN DE PROBLEMAS ${colors.reset}\n`);
      
      const critical = issues.filter(i => i.severity === 'CRÍTICO');
      const errors = issues.filter(i => i.severity === 'ERROR');
      const warnings = issues.filter(i => i.severity === 'ADVERTENCIA');
      
      if (critical.length > 0) {
        console.log(`${colors.red}❌ Problemas críticos: ${critical.length}${colors.reset}`);
      }
      if (errors.length > 0) {
        console.log(`${colors.red}⚠️  Errores: ${errors.length}${colors.reset}`);
      }
      if (warnings.length > 0) {
        console.log(`${colors.yellow}⚠️  Advertencias: ${warnings.length}${colors.reset}`);
      }
    }
  }
  
  await testStaticRoute();
  await testCORS();
  
  // Conclusión
  log.section('CONCLUSIÓN');
  
  if (imageUrls && imageUrls.length > 0) {
    const issues = compareUrlFormats(imageUrls, files);
    const hasCritical = issues.some(i => i.severity === 'CRÍTICO');
    
    if (hasCritical) {
      log.error('Se encontraron problemas críticos que deben solucionarse');
      console.log('\n💡 Ejecuta: npm run diagnose:images para más detalles\n');
      process.exit(1);
    } else if (issues.length > 0) {
      log.warning('Hay advertencias pero el sistema debería funcionar');
      process.exit(0);
    } else {
      log.success('✅ Todos los tests pasaron correctamente');
      process.exit(0);
    }
  } else {
    log.warning('No se pudieron realizar todos los tests');
    process.exit(0);
  }
};

// Ejecutar tests
runTests().catch(error => {
  log.error(`Error fatal: ${error.message}`);
  console.error(error);
  process.exit(1);
});
