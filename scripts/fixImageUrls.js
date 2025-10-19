import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Page from '../models/Page.js';

dotenv.config();

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}━━━ ${msg} ━━━${colors.reset}`)
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

// Función recursiva para limpiar URLs en un objeto
const cleanUrls = (obj, parentKey = '') => {
  if (!obj || typeof obj !== 'object') return { cleaned: obj, changed: false };
  
  // Si es un ObjectId de Mongoose, preservarlo
  if (obj.constructor && obj.constructor.name === 'ObjectId') {
    return { cleaned: obj, changed: false };
  }
  
  const cleaned = Array.isArray(obj) ? [] : {};
  let changed = false;
  
  for (const [key, value] of Object.entries(obj)) {
    // Saltar _id y otros campos internos de Mongoose
    if (key === '_id' || key === '__v') {
      continue; // No incluir en el objeto limpio
    }
    
    if (typeof value === 'string') {
      // Detectar y limpiar URLs con localhost
      if (value.includes('localhost')) {
        // Extraer solo la parte /uploads/...
        const match = value.match(/\/uploads\/.+$/);
        if (match) {
          cleaned[key] = match[0];
          changed = true;
          console.log(`      ${colors.yellow}${value}${colors.reset}`);
          console.log(`      → ${colors.green}${match[0]}${colors.reset}`);
        } else {
          cleaned[key] = value;
        }
      } else if (value.startsWith('http://') || value.startsWith('https://')) {
        // Si ya es una URL absoluta pero no localhost, extraer la parte relativa si es posible
        const match = value.match(/\/uploads\/.+$/);
        if (match) {
          cleaned[key] = match[0];
          changed = true;
          console.log(`      ${colors.yellow}${value}${colors.reset}`);
          console.log(`      → ${colors.green}${match[0]}${colors.reset}`);
        } else {
          cleaned[key] = value;
        }
      } else {
        cleaned[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      // Si es un ObjectId de Mongoose, preservarlo
      if (value.constructor && value.constructor.name === 'ObjectId') {
        // No incluir _id en el update
        continue;
      }
      
      const result = cleanUrls(value, key);
      cleaned[key] = result.cleaned;
      if (result.changed) changed = true;
    } else {
      cleaned[key] = value;
    }
  }
  
  return { cleaned, changed };
};

// Función principal para limpiar URLs en todas las páginas
const cleanAllPageUrls = async (dryRun = true) => {
  log.section('LIMPIEZA DE URLs EN PÁGINAS');
  
  if (dryRun) {
    log.warning('MODO DRY-RUN: No se guardarán cambios (solo preview)');
  } else {
    log.warning('MODO REAL: Se guardarán los cambios en la base de datos');
  }
  
  try {
    const pages = await Page.find({}).lean(); // Usar lean() para evitar problemas con Mongoose
    log.info(`Páginas encontradas: ${pages.length}`);
    
    let totalChanges = 0;
    
    for (const page of pages) {
      console.log(`\n📄 Procesando: ${page.pageName} (${page.pageSlug})`);
      
      const { cleaned: cleanedContent, changed } = cleanUrls(page.content);
      
      if (changed) {
        totalChanges++;
        
        if (!dryRun) {
          // Actualizar directamente en MongoDB sin validación de Mongoose
          await Page.updateOne(
            { _id: page._id },
            { 
              $set: { 
                content: cleanedContent,
                lastUpdated: Date.now()
              } 
            }
          );
          log.success('   ✅ Cambios guardados');
        } else {
          log.info('   👀 Cambios detectados (no guardados en dry-run)');
        }
      } else {
        log.info('   ✓ No se encontraron URLs para limpiar');
      }
    }
    
    log.section('RESUMEN');
    console.log(`Páginas procesadas: ${pages.length}`);
    console.log(`Páginas con cambios: ${totalChanges}`);
    
    if (dryRun && totalChanges > 0) {
      console.log(`\n${colors.yellow}Para aplicar los cambios, ejecuta:${colors.reset}`);
      console.log(`${colors.green}npm run fix:image-urls${colors.reset}`);
    } else if (!dryRun && totalChanges > 0) {
      log.success('\n✅ URLs limpiadas correctamente');
      log.info('Ahora las URLs son relativas y se transformarán automáticamente en producción');
    } else {
      log.success('\n✅ No se encontraron URLs para limpiar');
    }
    
    return totalChanges;
    
  } catch (error) {
    log.error(`Error al limpiar URLs: ${error.message}`);
    throw error;
  }
};

// Función principal
const run = async () => {
  console.log(`${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  🧹 LIMPIEZA DE URLs DE IMÁGENES         ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}\n`);
  
  console.log(`Fecha: ${new Date().toLocaleString('es-ES')}\n`);
  
  // Detectar modo (dry-run o real)
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');
  
  try {
    await connectDB();
    const changes = await cleanAllPageUrls(dryRun);
    
    await mongoose.connection.close();
    
    if (changes > 0 && dryRun) {
      process.exit(0); // Exit con 0 para indicar que hay cambios pendientes
    } else {
      process.exit(0);
    }
    
  } catch (error) {
    log.error(`Error fatal: ${error.message}`);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Ejecutar
run();
