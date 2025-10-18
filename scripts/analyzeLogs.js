import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.join(__dirname, '../logs');
const API_LOG_FILE = path.join(logsDir, 'api-requests.log');
const DB_LOG_FILE = path.join(logsDir, 'database-changes.log');

function analyzeApiLogs() {
  console.log('═══════════════════════════════════════════════════');
  console.log('📊 ANÁLISIS DE LOGS DE API');
  console.log('═══════════════════════════════════════════════════\n');

  if (!fs.existsSync(API_LOG_FILE)) {
    console.log('❌ No se encontró archivo de logs de API\n');
    return;
  }

  const content = fs.readFileSync(API_LOG_FILE, 'utf-8');
  const entries = content.split('='.repeat(80)).filter(e => e.trim());

  console.log(`Total de entries: ${entries.length}\n`);

  // Contar requests por método
  const methodCounts = {};
  const urlCounts = {};
  const userActions = {};
  const imageUpdates = [];
  const errors = [];

  entries.forEach(entry => {
    try {
      const cleanEntry = entry.replace('RESPONSE:', '').trim();
      const data = JSON.parse(cleanEntry);

      if (data.method) {
        methodCounts[data.method] = (methodCounts[data.method] || 0) + 1;
        
        if (data.url) {
          urlCounts[data.url] = (urlCounts[data.url] || 0) + 1;
        }

        const user = data.user || 'anonymous';
        if (!userActions[user]) {
          userActions[user] = [];
        }
        userActions[user].push({
          timestamp: data.timestamp,
          method: data.method,
          url: data.url
        });

        // Detectar actualizaciones de imágenes
        if (data.contentSummary) {
          imageUpdates.push({
            timestamp: data.timestamp,
            user: data.user,
            heroImage: data.contentSummary.heroBackgroundImage,
            solutionsImage: data.contentSummary.solutionsBackgroundImage,
            items: data.contentSummary.solutionsItems
          });
        }
      }

      // Detectar errores
      if (data.success === false || data.statusCode >= 400) {
        errors.push({
          timestamp: data.timestamp,
          method: data.method,
          url: data.url,
          statusCode: data.statusCode,
          message: data.message
        });
      }

    } catch (e) {
      // Ignorar entries que no se puedan parsear
    }
  });

  console.log('📈 Requests por método:');
  Object.entries(methodCounts).forEach(([method, count]) => {
    console.log(`  ${method}: ${count}`);
  });
  console.log('');

  console.log('🔗 URLs más solicitadas:');
  Object.entries(urlCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([url, count]) => {
      console.log(`  ${count}x - ${url}`);
    });
  console.log('');

  console.log('👤 Acciones por usuario:');
  Object.entries(userActions).forEach(([user, actions]) => {
    console.log(`  ${user}: ${actions.length} acciones`);
    
    // Mostrar últimas 5 acciones
    const recent = actions.slice(-5);
    recent.forEach(action => {
      console.log(`    - ${action.timestamp}: ${action.method} ${action.url}`);
    });
  });
  console.log('');

  if (imageUpdates.length > 0) {
    console.log('📸 Actualizaciones de imágenes detectadas:');
    imageUpdates.forEach((update, index) => {
      console.log(`  ${index + 1}. ${update.timestamp} (${update.user})`);
      if (update.heroImage) {
        console.log(`     Hero: ${JSON.stringify(update.heroImage)}`);
      }
      if (update.solutionsImage) {
        console.log(`     Solutions: ${JSON.stringify(update.solutionsImage)}`);
      }
      if (update.items) {
        console.log(`     Items con iconos:`);
        update.items.forEach(item => {
          console.log(`       - ${item.title}: light=${item.iconLight || 'N/A'}, dark=${item.iconDark || 'N/A'}`);
        });
      }
    });
    console.log('');
  }

  if (errors.length > 0) {
    console.log('❌ Errores encontrados:');
    errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.timestamp} - ${error.method} ${error.url}`);
      console.log(`     Status: ${error.statusCode} - ${error.message}`);
    });
    console.log('');
  }
}

function analyzeDatabaseLogs() {
  console.log('═══════════════════════════════════════════════════');
  console.log('💾 ANÁLISIS DE LOGS DE BASE DE DATOS');
  console.log('═══════════════════════════════════════════════════\n');

  if (!fs.existsSync(DB_LOG_FILE)) {
    console.log('❌ No se encontró archivo de logs de base de datos\n');
    return;
  }

  const content = fs.readFileSync(DB_LOG_FILE, 'utf-8');
  const entries = content.split('='.repeat(80)).filter(e => e.trim());

  console.log(`Total de entries: ${entries.length}\n`);

  const actionCounts = {};
  const pageUpdates = {};
  const suspiciousPatterns = [];

  entries.forEach(entry => {
    try {
      const data = JSON.parse(entry.trim());

      actionCounts[data.action] = (actionCounts[data.action] || 0) + 1;

      if (data.pageSlug) {
        if (!pageUpdates[data.pageSlug]) {
          pageUpdates[data.pageSlug] = [];
        }
        pageUpdates[data.pageSlug].push(data);

        // Detectar patrones sospechosos
        // 1. Cambios sin usuario identificado
        if (data.action === 'UPDATE' && (!data.updatedBy || data.updatedBy === 'system')) {
          suspiciousPatterns.push({
            type: 'UPDATE_WITHOUT_USER',
            timestamp: data.timestamp,
            page: data.pageSlug,
            updatedBy: data.updatedBy
          });
        }

        // 2. Cambios que eliminan imágenes
        if (data.changes) {
          const hasEmptyImages = 
            (data.changes.heroBackgroundImage && !data.changes.heroBackgroundImage.light && !data.changes.heroBackgroundImage.dark) ||
            (data.changes.solutionsBackgroundImage && !data.changes.solutionsBackgroundImage.light && !data.changes.solutionsBackgroundImage.dark);

          if (hasEmptyImages) {
            suspiciousPatterns.push({
              type: 'IMAGES_CLEARED',
              timestamp: data.timestamp,
              page: data.pageSlug,
              changes: data.changes
            });
          }
        }

        // 3. Múltiples actualizaciones en poco tiempo
        const recentUpdates = pageUpdates[data.pageSlug].filter(u => {
          const timeDiff = new Date(data.timestamp) - new Date(u.timestamp);
          return timeDiff < 60000 && timeDiff > 0; // Últimos 60 segundos
        });

        if (recentUpdates.length > 3) {
          suspiciousPatterns.push({
            type: 'RAPID_UPDATES',
            timestamp: data.timestamp,
            page: data.pageSlug,
            count: recentUpdates.length
          });
        }
      }

    } catch (e) {
      // Ignorar entries que no se puedan parsear
    }
  });

  console.log('📊 Acciones en base de datos:');
  Object.entries(actionCounts).forEach(([action, count]) => {
    console.log(`  ${action}: ${count}`);
  });
  console.log('');

  console.log('📄 Actualizaciones por página:');
  Object.entries(pageUpdates).forEach(([slug, updates]) => {
    console.log(`  ${slug}: ${updates.length} actualizaciones`);
    
    // Mostrar últimas 3
    const recent = updates.slice(-3);
    recent.forEach(update => {
      console.log(`    - ${update.timestamp}: ${update.action} por ${update.updatedBy || 'unknown'}`);
      if (update.modifiedPaths) {
        console.log(`      Paths: ${update.modifiedPaths.slice(0, 5).join(', ')}`);
      }
    });
  });
  console.log('');

  if (suspiciousPatterns.length > 0) {
    console.log('⚠️  PATRONES SOSPECHOSOS DETECTADOS:');
    suspiciousPatterns.forEach((pattern, index) => {
      console.log(`  ${index + 1}. [${pattern.type}] ${pattern.timestamp}`);
      console.log(`     Página: ${pattern.page || 'N/A'}`);
      if (pattern.updatedBy) {
        console.log(`     Actualizado por: ${pattern.updatedBy}`);
      }
      if (pattern.changes) {
        console.log(`     Cambios: ${JSON.stringify(pattern.changes, null, 6)}`);
      }
      if (pattern.count) {
        console.log(`     Cantidad: ${pattern.count}`);
      }
      console.log('');
    });
  }
}

function generateReport() {
  console.log('\n');
  console.log('🔍 GENERANDO REPORTE DE DIAGNÓSTICO');
  console.log('═══════════════════════════════════════════════════\n');

  analyzeApiLogs();
  console.log('\n');
  analyzeDatabaseLogs();

  console.log('\n═══════════════════════════════════════════════════');
  console.log('💡 RECOMENDACIONES');
  console.log('═══════════════════════════════════════════════════\n');
  console.log('1. Revisa los patrones sospechosos identificados arriba');
  console.log('2. Verifica si hay procesos automáticos ejecutándose (seeders, cronjobs)');
  console.log('3. Asegúrate de que no haya caché invalidando las actualizaciones');
  console.log('4. Verifica las variables de entorno (MONGODB_URI)');
  console.log('5. Ejecuta el monitor en tiempo real: npm run monitor');
  console.log('6. Ejecuta el diagnóstico de BD: npm run diagnose');
  console.log('\n');
}

// Ejecutar reporte
generateReport();
