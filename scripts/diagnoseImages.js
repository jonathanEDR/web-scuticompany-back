import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Image from '../models/Image.js';
import Page from '../models/Page.js';

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
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.cyan}${colors.bgYellow} ${msg} ${colors.reset}\n`),
  section: (msg) => console.log(`\n${colors.magenta}━━━ ${msg} ━━━${colors.reset}`)
};

// Función para conectar a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    log.success('Conectado a MongoDB');
  } catch (error) {
    log.error(`Error al conectar a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Función auxiliar para extraer URLs de imágenes de un objeto
const extractImageUrls = (obj, prefix = '') => {
  const urls = [];
  
  if (!obj || typeof obj !== 'object') return urls;
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'string') {
      // Detectar URLs de imágenes
      if (value.includes('/uploads/') || 
          value.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ||
          value.startsWith('http')) {
        urls.push({ path: currentPath, url: value });
      }
    } else if (typeof value === 'object' && value !== null) {
      urls.push(...extractImageUrls(value, currentPath));
    }
  }
  
  return urls;
};

// 1. Verificar configuración del servidor
const checkServerConfiguration = () => {
  log.section('1. CONFIGURACIÓN DEL SERVIDOR');
  
  const config = {
    PORT: process.env.PORT || '5000',
    NODE_ENV: process.env.NODE_ENV || 'development',
    BASE_URL: process.env.BASE_URL || 'NOT SET',
    FRONTEND_URL: process.env.FRONTEND_URL || 'NOT SET',
    MONGODB_URI: process.env.MONGODB_URI ? '✓ Configurado' : '✗ NO CONFIGURADO'
  };
  
  console.log('Variables de entorno:');
  Object.entries(config).forEach(([key, value]) => {
    if (value.includes('NOT SET') || value.includes('✗')) {
      log.error(`  ${key}: ${value}`);
    } else {
      log.success(`  ${key}: ${value}`);
    }
  });
  
  // Verificar BASE_URL para producción
  if (process.env.NODE_ENV === 'production' && !process.env.BASE_URL) {
    log.error('⚠️  PROBLEMA CRÍTICO: BASE_URL no está configurado para producción');
    log.warning('   Las URLs de imágenes no se transformarán correctamente');
    return false;
  }
  
  return true;
};

// 2. Verificar directorio de uploads
const checkUploadsDirectory = () => {
  log.section('2. DIRECTORIO DE UPLOADS');
  
  const uploadsDir = path.join(__dirname, '../uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    log.error(`Directorio no existe: ${uploadsDir}`);
    log.warning('Creando directorio...');
    fs.mkdirSync(uploadsDir, { recursive: true });
    log.success('Directorio creado');
  } else {
    log.success(`Directorio existe: ${uploadsDir}`);
  }
  
  // Listar archivos
  try {
    const files = fs.readdirSync(uploadsDir);
    log.info(`Total de archivos: ${files.length}`);
    
    if (files.length > 0) {
      console.log('\nArchivos encontrados:');
      files.forEach((file, index) => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`  ${index + 1}. ${file} (${sizeKB} KB)`);
      });
    } else {
      log.warning('No hay archivos en el directorio de uploads');
    }
    
    return files;
  } catch (error) {
    log.error(`Error al leer directorio: ${error.message}`);
    return [];
  }
};

// 3. Verificar registros en la base de datos
const checkImageRecords = async () => {
  log.section('3. REGISTROS DE IMÁGENES EN BD');
  
  try {
    const images = await Image.find({}).select('filename url mimetype size isOrphan usedIn').lean();
    log.info(`Total de registros de imágenes: ${images.length}`);
    
    if (images.length > 0) {
      console.log('\nImágenes registradas:');
      images.forEach((img, index) => {
        const status = img.isOrphan ? `${colors.yellow}[Huérfana]${colors.reset}` : `${colors.green}[En uso]${colors.reset}`;
        console.log(`  ${index + 1}. ${img.filename} ${status}`);
        console.log(`     URL: ${img.url}`);
        console.log(`     Referencias: ${img.usedIn ? img.usedIn.length : 0}`);
      });
    } else {
      log.warning('No hay imágenes registradas en la base de datos');
    }
    
    return images;
  } catch (error) {
    log.error(`Error al consultar imágenes: ${error.message}`);
    return [];
  }
};

// 4. Verificar URLs en páginas
const checkPageImageUrls = async () => {
  log.section('4. URLs DE IMÁGENES EN PÁGINAS');
  
  try {
    const pages = await Page.find({}).lean();
    log.info(`Total de páginas: ${pages.length}`);
    
    const allUrls = [];
    
    for (const page of pages) {
      console.log(`\n📄 Página: ${page.pageName} (${page.pageSlug})`);
      
      const urls = extractImageUrls(page);
      
      if (urls.length === 0) {
        log.warning('  No se encontraron URLs de imágenes');
      } else {
        console.log(`  Total de URLs encontradas: ${urls.length}`);
        urls.forEach((item, index) => {
          const urlColor = item.url.startsWith('http') ? colors.green : 
                          item.url.startsWith('/uploads/') ? colors.yellow : 
                          colors.red;
          console.log(`    ${index + 1}. ${item.path}`);
          console.log(`       ${urlColor}${item.url}${colors.reset}`);
        });
      }
      
      allUrls.push(...urls);
    }
    
    return allUrls;
  } catch (error) {
    log.error(`Error al consultar páginas: ${error.message}`);
    return [];
  }
};

// 5. Comparar archivos físicos vs registros BD
const compareFilesWithRecords = (files, imageRecords) => {
  log.section('5. COMPARACIÓN ARCHIVOS vs BD');
  
  const fileNames = new Set(files);
  const recordNames = new Set(imageRecords.map(img => img.filename));
  
  // Archivos sin registro en BD
  const orphanFiles = files.filter(file => !recordNames.has(file));
  if (orphanFiles.length > 0) {
    log.warning(`Archivos SIN registro en BD: ${orphanFiles.length}`);
    orphanFiles.forEach(file => console.log(`  - ${file}`));
  } else {
    log.success('Todos los archivos tienen registro en BD');
  }
  
  // Registros sin archivo físico
  const missingFiles = imageRecords.filter(img => !fileNames.has(img.filename));
  if (missingFiles.length > 0) {
    log.error(`Registros SIN archivo físico: ${missingFiles.length}`);
    missingFiles.forEach(img => console.log(`  - ${img.filename} (URL: ${img.url})`));
  } else {
    log.success('Todos los registros tienen archivo físico');
  }
  
  return { orphanFiles, missingFiles };
};

// 6. Verificar formato de URLs
const checkUrlFormats = (pageUrls) => {
  log.section('6. ANÁLISIS DE FORMATO DE URLs');
  
  const urlTypes = {
    absolute: [],      // http://... o https://...
    relative: [],      // /uploads/...
    localhost: [],     // http://localhost:...
    malformed: []      // otros formatos
  };
  
  pageUrls.forEach(item => {
    const url = item.url;
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (url.includes('localhost')) {
        urlTypes.localhost.push(item);
      } else {
        urlTypes.absolute.push(item);
      }
    } else if (url.startsWith('/uploads/')) {
      urlTypes.relative.push(item);
    } else {
      urlTypes.malformed.push(item);
    }
  });
  
  console.log('Distribución de tipos de URL:');
  log.info(`  URLs absolutas (correctas para producción): ${urlTypes.absolute.length}`);
  log.warning(`  URLs relativas (necesitan transformación): ${urlTypes.relative.length}`);
  log.error(`  URLs con localhost (problemáticas): ${urlTypes.localhost.length}`);
  log.error(`  URLs mal formadas: ${urlTypes.malformed.length}`);
  
  if (urlTypes.localhost.length > 0) {
    console.log('\n⚠️  URLs con localhost encontradas:');
    urlTypes.localhost.forEach(item => {
      console.log(`    ${item.path}: ${item.url}`);
    });
  }
  
  if (urlTypes.relative.length > 0 && process.env.NODE_ENV === 'production') {
    console.log('\n⚠️  URLs relativas (deben transformarse a absolutas en producción):');
    urlTypes.relative.slice(0, 5).forEach(item => {
      console.log(`    ${item.path}: ${item.url}`);
    });
    if (urlTypes.relative.length > 5) {
      console.log(`    ... y ${urlTypes.relative.length - 5} más`);
    }
  }
  
  return urlTypes;
};

// 7. Verificar transformación de URLs
const checkUrlTransformation = () => {
  log.section('7. TRANSFORMACIÓN DE URLs');
  
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  
  console.log(`URL base configurada: ${baseUrl}`);
  
  // Ejemplos de transformación
  const testUrls = [
    '/uploads/test.jpg',
    'http://localhost:5000/uploads/test.jpg',
    'https://example.com/uploads/test.jpg'
  ];
  
  console.log('\nEjemplos de transformación:');
  testUrls.forEach(url => {
    let transformed = url;
    if (url.startsWith('/uploads/')) {
      transformed = `${baseUrl}${url}`;
    } else if (url.startsWith('http://localhost:')) {
      transformed = url.replace(/http:\/\/localhost:\d+/, baseUrl);
    }
    
    const arrow = url !== transformed ? '→' : '=';
    const color = url !== transformed ? colors.green : colors.yellow;
    console.log(`  ${url}`);
    console.log(`    ${arrow} ${color}${transformed}${colors.reset}`);
  });
};

// 8. Generar recomendaciones
const generateRecommendations = (urlTypes, missingFiles, orphanFiles) => {
  log.section('8. RECOMENDACIONES Y SOLUCIONES');
  
  const issues = [];
  
  // Issue 1: BASE_URL no configurado
  if (!process.env.BASE_URL && process.env.NODE_ENV === 'production') {
    issues.push({
      severity: 'CRÍTICO',
      issue: 'BASE_URL no está configurado para producción',
      impact: 'Las imágenes aparecerán rotas porque las URLs no se transforman correctamente',
      solution: 'Configurar BASE_URL en .env con la URL pública del backend (ej: https://api.tudominio.com)'
    });
  }
  
  // Issue 2: URLs con localhost
  if (urlTypes.localhost.length > 0) {
    issues.push({
      severity: 'CRÍTICO',
      issue: `${urlTypes.localhost.length} URLs contienen 'localhost'`,
      impact: 'Las imágenes no cargarán en producción si apuntan a localhost',
      solution: 'Actualizar las páginas para que las URLs se guarden como relativas (/uploads/...) y se transformen en el backend'
    });
  }
  
  // Issue 3: URLs relativas en producción
  if (urlTypes.relative.length > 0 && process.env.NODE_ENV === 'production') {
    issues.push({
      severity: 'ADVERTENCIA',
      issue: `${urlTypes.relative.length} URLs son relativas`,
      impact: 'Funcionarán solo si BASE_URL está configurado y el transformador funciona',
      solution: 'Verificar que transformImageUrls() se esté aplicando en todas las respuestas del API'
    });
  }
  
  // Issue 4: Archivos faltantes
  if (missingFiles.length > 0) {
    issues.push({
      severity: 'ERROR',
      issue: `${missingFiles.length} registros en BD sin archivo físico`,
      impact: 'Imágenes aparecerán rotas (404)',
      solution: 'Eliminar registros huérfanos o re-subir las imágenes faltantes'
    });
  }
  
  // Issue 5: Archivos sin registro
  if (orphanFiles.length > 0) {
    issues.push({
      severity: 'INFO',
      issue: `${orphanFiles.length} archivos sin registro en BD`,
      impact: 'Desperdicio de espacio en disco',
      solution: 'Ejecutar script de limpieza para eliminar archivos no utilizados'
    });
  }
  
  if (issues.length === 0) {
    log.success('✨ No se encontraron problemas. El sistema está configurado correctamente.');
  } else {
    console.log(`\n${colors.bgRed}${colors.white} PROBLEMAS ENCONTRADOS: ${issues.length} ${colors.reset}\n`);
    
    issues.forEach((issue, index) => {
      const severityColor = {
        'CRÍTICO': colors.bgRed,
        'ERROR': colors.red,
        'ADVERTENCIA': colors.yellow,
        'INFO': colors.blue
      }[issue.severity];
      
      console.log(`${severityColor}${colors.white} ${issue.severity} ${colors.reset} Problema ${index + 1}`);
      console.log(`  ${colors.yellow}❓ Issue:${colors.reset} ${issue.issue}`);
      console.log(`  ${colors.red}💥 Impacto:${colors.reset} ${issue.impact}`);
      console.log(`  ${colors.green}💡 Solución:${colors.reset} ${issue.solution}\n`);
    });
  }
  
  // Recomendaciones generales
  console.log(`\n${colors.cyan}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  RECOMENDACIONES PARA PRODUCCIÓN${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════${colors.reset}\n`);
  
  console.log('1. Configuración de Variables de Entorno:');
  console.log(`   ${colors.green}BASE_URL${colors.reset}=https://tu-backend.com (URL pública del backend)`);
  console.log(`   ${colors.green}FRONTEND_URL${colors.reset}=https://tu-frontend.com (para CORS)`);
  console.log(`   ${colors.green}NODE_ENV${colors.reset}=production`);
  
  console.log('\n2. Verificar que express.static esté configurado:');
  console.log(`   ${colors.yellow}app.use('/uploads', express.static(path.join(__dirname, 'uploads')));${colors.reset}`);
  
  console.log('\n3. Asegurar que transformImageUrls() se aplique en:');
  console.log('   - getAllPages()');
  console.log('   - getPageBySlug()');
  console.log('   - Cualquier respuesta que incluya URLs de imágenes');
  
  console.log('\n4. Verificar CORS:');
  console.log('   - Permitir origen del frontend');
  console.log('   - Permitir métodos GET para imágenes');
  
  console.log('\n5. Headers de respuesta para imágenes:');
  console.log('   - Cache-Control: public, max-age=31536000');
  console.log('   - Content-Type correcto según extensión');
  
  return issues;
};

// Función principal
const diagnose = async () => {
  log.title('🔍 DIAGNÓSTICO DE SISTEMA DE IMÁGENES');
  
  console.log(`Fecha: ${new Date().toLocaleString('es-ES')}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}\n`);
  
  try {
    // 1. Configuración
    const configOk = checkServerConfiguration();
    
    // 2. Directorio de uploads
    const files = checkUploadsDirectory();
    
    // Conectar a BD
    await connectDB();
    
    // 3. Registros de imágenes
    const imageRecords = await checkImageRecords();
    
    // 4. URLs en páginas
    const pageUrls = await checkPageImageUrls();
    
    // 5. Comparar archivos vs BD
    const { orphanFiles, missingFiles } = compareFilesWithRecords(files, imageRecords);
    
    // 6. Analizar formato de URLs
    const urlTypes = checkUrlFormats(pageUrls);
    
    // 7. Verificar transformación
    checkUrlTransformation();
    
    // 8. Generar recomendaciones
    const issues = generateRecommendations(urlTypes, missingFiles, orphanFiles);
    
    // Resumen final
    log.section('RESUMEN');
    console.log(`Total de archivos físicos: ${files.length}`);
    console.log(`Total de registros en BD: ${imageRecords.length}`);
    console.log(`Total de URLs en páginas: ${pageUrls.length}`);
    console.log(`Problemas encontrados: ${issues.length}`);
    
    if (issues.some(i => i.severity === 'CRÍTICO' || i.severity === 'ERROR')) {
      log.error('\n❌ Se encontraron problemas que requieren atención inmediata');
      process.exit(1);
    } else {
      log.success('\n✅ El sistema está funcionando correctamente');
      process.exit(0);
    }
    
  } catch (error) {
    log.error(`Error durante el diagnóstico: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

// Ejecutar diagnóstico
diagnose();
