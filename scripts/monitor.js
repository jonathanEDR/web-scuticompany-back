import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Page from '../models/Page.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti';
const LOG_FILE = path.join(__dirname, '../logs/changes.log');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(LOG_FILE, logMessage);
}

async function monitor() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    log('✅ Monitor iniciado - Conectado a MongoDB');
    log(`📦 Base de datos: ${mongoose.connection.name}`);
    log(`🔌 Host: ${mongoose.connection.host}`);
    log('');

    // Obtener snapshot inicial
    const initialPages = await Page.find({}).lean();
    const snapshots = new Map();
    
    initialPages.forEach(page => {
      snapshots.set(page._id.toString(), JSON.stringify(page));
      log(`📄 Snapshot inicial de página: ${page.pageName} (${page.pageSlug})`);
    });

    log('\n🔍 Monitoreando cambios cada 10 segundos...\n');

    // Monitorear cambios cada 10 segundos
    setInterval(async () => {
      try {
        const currentPages = await Page.find({}).lean();
        
        currentPages.forEach(page => {
          const pageId = page._id.toString();
          const currentSnapshot = JSON.stringify(page);
          const previousSnapshot = snapshots.get(pageId);

          if (previousSnapshot && previousSnapshot !== currentSnapshot) {
            // Detectar cambio
            log('═══════════════════════════════════════════════════');
            log(`🔄 CAMBIO DETECTADO en página: ${page.pageName} (${page.pageSlug})`);
            log('═══════════════════════════════════════════════════');
            log(`Última actualización: ${page.lastUpdated}`);
            log(`Actualizado por: ${page.updatedBy}`);
            
            // Comparar diferencias específicas
            const prev = JSON.parse(previousSnapshot);
            const curr = page;

            // Verificar imágenes
            if (JSON.stringify(prev.content?.hero?.backgroundImage) !== JSON.stringify(curr.content?.hero?.backgroundImage)) {
              log('  📸 Cambio en Hero backgroundImage:');
              log(`    Antes: ${JSON.stringify(prev.content?.hero?.backgroundImage)}`);
              log(`    Ahora: ${JSON.stringify(curr.content?.hero?.backgroundImage)}`);
            }

            if (JSON.stringify(prev.content?.solutions?.backgroundImage) !== JSON.stringify(curr.content?.solutions?.backgroundImage)) {
              log('  📸 Cambio en Solutions backgroundImage:');
              log(`    Antes: ${JSON.stringify(prev.content?.solutions?.backgroundImage)}`);
              log(`    Ahora: ${JSON.stringify(curr.content?.solutions?.backgroundImage)}`);
            }

            // Verificar iconos de items
            if (prev.content?.solutions?.items && curr.content?.solutions?.items) {
              prev.content.solutions.items.forEach((prevItem, index) => {
                const currItem = curr.content.solutions.items[index];
                if (currItem) {
                  if (prevItem.iconLight !== currItem.iconLight || prevItem.iconDark !== currItem.iconDark) {
                    log(`  🎨 Cambio en iconos del item ${index + 1} (${currItem.title}):`);
                    log(`    iconLight: ${prevItem.iconLight || 'vacío'} → ${currItem.iconLight || 'vacío'}`);
                    log(`    iconDark: ${prevItem.iconDark || 'vacío'} → ${currItem.iconDark || 'vacío'}`);
                  }
                }
              });
            }

            // Verificar theme
            if (JSON.stringify(prev.theme) !== JSON.stringify(curr.theme)) {
              log('  🎨 Cambio en theme');
            }

            log('');
            
            // Actualizar snapshot
            snapshots.set(pageId, currentSnapshot);
          }
        });

        // Verificar si se agregaron o eliminaron páginas
        const currentIds = new Set(currentPages.map(p => p._id.toString()));
        const previousIds = new Set(snapshots.keys());

        currentIds.forEach(id => {
          if (!previousIds.has(id)) {
            const page = currentPages.find(p => p._id.toString() === id);
            log(`✨ NUEVA PÁGINA CREADA: ${page.pageName} (${page.pageSlug})`);
            snapshots.set(id, JSON.stringify(page));
          }
        });

        previousIds.forEach(id => {
          if (!currentIds.has(id)) {
            log(`🗑️  PÁGINA ELIMINADA (ID: ${id})`);
            snapshots.delete(id);
          }
        });

      } catch (error) {
        log(`❌ Error durante monitoreo: ${error.message}`);
      }
    }, 10000); // Cada 10 segundos

    // Mantener el proceso vivo
    process.on('SIGINT', async () => {
      log('\n👋 Monitor detenido por el usuario');
      await mongoose.connection.close();
      process.exit(0);
    });

  } catch (error) {
    log(`❌ Error al iniciar monitor: ${error.message}`);
    process.exit(1);
  }
}

monitor();
