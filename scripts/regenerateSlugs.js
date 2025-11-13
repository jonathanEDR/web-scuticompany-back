/**
 * Script de regeneración de slugs para servicios sin slug
 * ✅ Ejecutar: node scripts/regenerateSlugs.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar .env desde la raíz del backend
const envPath = resolve(__dirname, '../.env');
console.log(`📄 Cargando .env desde: ${envPath}`);
dotenv.config({ path: envPath });

// Importar el modelo
import Servicio from '../models/Servicio.js';

async function regenerateSlugs() {
  try {
    // Conectar a la base de datos
    console.log('🔌 Conectando a MongoDB...');
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti';
    console.log(`📍 Using URI: ${mongoURI}`);
    await mongoose.connect(mongoURI);
    console.log('✅ Conectado a MongoDB');

    // Buscar todos los servicios sin slug
    console.log('\n🔍 Buscando servicios sin slug...');
    const serviciosSinSlug = await Servicio.find({ 
      $or: [
        { slug: null },
        { slug: undefined },
        { slug: '' }
      ]
    });

    console.log(`📊 Encontrados ${serviciosSinSlug.length} servicios sin slug`);

    if (serviciosSinSlug.length === 0) {
      console.log('✅ Todos los servicios ya tienen slug');
      await mongoose.disconnect();
      return;
    }

    // Regenerar slug para cada servicio
    let updated = 0;
    for (const servicio of serviciosSinSlug) {
      try {
        // El pre-save hook generará el slug automáticamente
        await servicio.save();
        console.log(`  ✅ ${servicio.titulo} → ${servicio.slug}`);
        updated++;
      } catch (error) {
        console.log(`  ❌ Error al guardar "${servicio.titulo}": ${error.message}`);
      }
    }

    console.log(`\n📊 Resumen: ${updated}/${serviciosSinSlug.length} servicios actualizados`);

    // Verificar que todos tienen slug
    console.log('\n🔍 Verificando que todos tienen slug...');
    const serviciosTotal = await Servicio.countDocuments({});
    const serviciosConSlug = await Servicio.countDocuments({ slug: { $exists: true, $ne: '' } });
    console.log(`✅ Servicios totales: ${serviciosTotal}`);
    console.log(`✅ Servicios con slug: ${serviciosConSlug}`);

    if (serviciosTotal === serviciosConSlug) {
      console.log('\n✅ ¡Regeneración completada exitosamente!');
    } else {
      console.log(`\n⚠️  Aún hay ${serviciosTotal - serviciosConSlug} servicios sin slug`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

regenerateSlugs();
