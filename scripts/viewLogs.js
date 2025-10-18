import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.join(__dirname, '../logs');

console.clear();
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║         📊 DASHBOARD DE LOGS - WEB SCUTI                 ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');

// Verificar si existe el directorio de logs
if (!fs.existsSync(logsDir)) {
  console.log('❌ Directorio de logs no existe todavía');
  console.log('💡 Los logs se crearán automáticamente cuando:');
  console.log('   1. Inicies el servidor (logs de API)');
  console.log('   2. Ejecutes el monitor (logs de cambios)');
  console.log('');
  process.exit(0);
}

const files = fs.readdirSync(logsDir);

if (files.length === 0) {
  console.log('📁 Directorio de logs existe pero está vacío');
  console.log('');
  console.log('💡 Para generar logs:');
  console.log('   • Inicia el servidor: npm run dev');
  console.log('   • Inicia el monitor: npm run monitor');
  console.log('   • Haz cambios en el CMS');
  console.log('');
  process.exit(0);
}

console.log('📂 ARCHIVOS DE LOG ENCONTRADOS:\n');

files.forEach(file => {
  const filePath = path.join(logsDir, file);
  const stats = fs.statSync(filePath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  const modifiedDate = stats.mtime.toLocaleString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  console.log(`  📄 ${file}`);
  console.log(`     Tamaño: ${sizeKB} KB`);
  console.log(`     Última modificación: ${modifiedDate}`);
  console.log('');
});

console.log('═'.repeat(60));
console.log('');

// Leer últimas entradas de cada archivo
const API_LOG = path.join(logsDir, 'api-requests.log');
const DB_LOG = path.join(logsDir, 'database-changes.log');
const MONITOR_LOG = path.join(logsDir, 'changes.log');

// API Requests
if (fs.existsSync(API_LOG)) {
  console.log('🌐 ÚLTIMAS REQUESTS HTTP (5 más recientes):');
  console.log('═'.repeat(60));
  
  try {
    const content = fs.readFileSync(API_LOG, 'utf-8');
    const entries = content.split('='.repeat(80)).filter(e => e.trim());
    const recent = entries.slice(-5).reverse();

    if (recent.length === 0) {
      console.log('  (Aún no hay requests registradas)\n');
    } else {
      recent.forEach((entry, index) => {
        try {
          const cleanEntry = entry.replace('RESPONSE:', '').trim();
          const data = JSON.parse(cleanEntry);
          
          if (data.method) {
            const timestamp = new Date(data.timestamp).toLocaleTimeString('es-PE');
            const icon = data.method === 'GET' ? '🔍' : data.method === 'PUT' ? '✏️' : '➕';
            
            console.log(`  ${icon} ${timestamp} - ${data.method} ${data.url}`);
            console.log(`     Usuario: ${data.user || 'anonymous'}`);
            
            if (data.success !== undefined) {
              console.log(`     Resultado: ${data.success ? '✅ Éxito' : '❌ Error'}`);
            }
            
            if (data.contentSummary) {
              if (data.contentSummary.heroBackgroundImage) {
                console.log(`     📸 Hero: ${JSON.stringify(data.contentSummary.heroBackgroundImage).substring(0, 50)}...`);
              }
              if (data.contentSummary.solutionsItems) {
                console.log(`     🎨 Items: ${data.contentSummary.solutionsItems.length} items`);
              }
            }
            
            console.log('');
          }
        } catch (e) {
          // Ignorar entries malformadas
        }
      });
    }
  } catch (error) {
    console.log(`  ❌ Error al leer: ${error.message}\n`);
  }
}

// Database Changes
if (fs.existsSync(DB_LOG)) {
  console.log('💾 ÚLTIMOS CAMBIOS EN BASE DE DATOS (5 más recientes):');
  console.log('═'.repeat(60));
  
  try {
    const content = fs.readFileSync(DB_LOG, 'utf-8');
    const entries = content.split('='.repeat(80)).filter(e => e.trim());
    const recent = entries.slice(-5).reverse();

    if (recent.length === 0) {
      console.log('  (Aún no hay cambios registrados)\n');
    } else {
      recent.forEach((entry, index) => {
        try {
          const data = JSON.parse(entry.trim());
          const timestamp = new Date(data.timestamp).toLocaleTimeString('es-PE');
          const icon = data.action === 'CREATE' ? '✨' : data.action === 'UPDATE' ? '🔄' : '🗑️';
          
          console.log(`  ${icon} ${timestamp} - ${data.action} en ${data.pageSlug || 'desconocido'}`);
          console.log(`     Actualizado por: ${data.updatedBy || 'unknown'}`);
          
          if (data.modifiedPaths && data.modifiedPaths.length > 0) {
            console.log(`     Campos modificados (${data.modifiedPaths.length}): ${data.modifiedPaths.slice(0, 3).join(', ')}${data.modifiedPaths.length > 3 ? '...' : ''}`);
          }
          
          if (data.changes) {
            if (data.changes.heroBackgroundImage) {
              const isEmpty = !data.changes.heroBackgroundImage.light && !data.changes.heroBackgroundImage.dark;
              console.log(`     ⚠️  Hero image: ${isEmpty ? '❌ VACÍO' : '✅ Configurado'}`);
            }
            if (data.changes.solutionsBackgroundImage) {
              const isEmpty = !data.changes.solutionsBackgroundImage.light && !data.changes.solutionsBackgroundImage.dark;
              console.log(`     ⚠️  Solutions image: ${isEmpty ? '❌ VACÍO' : '✅ Configurado'}`);
            }
            if (data.changes.solutionsItems) {
              const withIcons = data.changes.solutionsItems.filter(i => i.iconLight || i.iconDark).length;
              console.log(`     🎨 Items: ${data.changes.solutionsItems.length} total, ${withIcons} con iconos`);
            }
          }
          
          console.log('');
        } catch (e) {
          // Ignorar entries malformadas
        }
      });
    }
  } catch (error) {
    console.log(`  ❌ Error al leer: ${error.message}\n`);
  }
}

// Monitor Changes
if (fs.existsSync(MONITOR_LOG)) {
  console.log('👁️  MONITOR EN TIEMPO REAL (Últimos cambios detectados):');
  console.log('═'.repeat(60));
  
  try {
    const content = fs.readFileSync(MONITOR_LOG, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    const recent = lines.slice(-20).reverse();

    if (recent.length === 0) {
      console.log('  (Monitor no ha detectado cambios aún)\n');
    } else {
      recent.forEach(line => {
        if (line.includes('CAMBIO DETECTADO')) {
          console.log(`  🔴 ${line}`);
        } else if (line.includes('Cambio en')) {
          console.log(`     ${line}`);
        } else if (line.includes('Antes:') || line.includes('Ahora:')) {
          console.log(`       ${line}`);
        } else if (line.trim()) {
          console.log(`  ${line}`);
        }
      });
      console.log('');
    }
  } catch (error) {
    console.log(`  ❌ Error al leer: ${error.message}\n`);
  }
}

console.log('═'.repeat(60));
console.log('');
console.log('💡 COMANDOS ÚTILES:');
console.log('');
console.log('  Ver logs completos:');
console.log('    cat backend/logs/api-requests.log');
console.log('    cat backend/logs/database-changes.log');
console.log('    cat backend/logs/changes.log');
console.log('');
console.log('  Análisis detallado:');
console.log('    npm run analyze-logs');
console.log('');
console.log('  Diagnóstico completo:');
console.log('    npm run diagnose');
console.log('');
console.log('  Iniciar monitor:');
console.log('    npm run monitor');
console.log('');

// Mostrar estadísticas
console.log('📊 ESTADÍSTICAS:');
console.log('═'.repeat(60));

let totalSize = 0;
let totalRequests = 0;
let totalDbChanges = 0;

files.forEach(file => {
  const filePath = path.join(logsDir, file);
  const stats = fs.statSync(filePath);
  totalSize += stats.size;

  if (file === 'api-requests.log') {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const entries = content.split('='.repeat(80)).filter(e => e.trim());
      totalRequests = entries.length;
    } catch (e) {}
  }

  if (file === 'database-changes.log') {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const entries = content.split('='.repeat(80)).filter(e => e.trim());
      totalDbChanges = entries.length;
    } catch (e) {}
  }
});

console.log(`  📁 Tamaño total de logs: ${(totalSize / 1024).toFixed(2)} KB`);
console.log(`  🌐 Total de requests HTTP: ${totalRequests}`);
console.log(`  💾 Total de cambios en BD: ${totalDbChanges}`);
console.log('');

// Advertencias
if (totalSize > 1024 * 1024) { // > 1MB
  console.log('⚠️  Los logs están ocupando más de 1 MB');
  console.log('   Los logs se limpian automáticamente después de 7 días');
  console.log('');
}

console.log('✅ Dashboard actualizado');
console.log('');
