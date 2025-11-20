/**
 * Script para listar todos los servicios actuales
 * Ejecutar: node scripts/list-services.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../.env') });

// Importar modelo
const servicioSchema = new mongoose.Schema({}, { strict: false });
const Servicio = mongoose.model('Servicio', servicioSchema, 'servicios');

async function listServices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti');
    console.log('✅ Conectado a MongoDB\n');

    const servicios = await Servicio.find({ estado: 'activo' })
      .select('titulo descripcionCorta categoria precio duracion destacado')
      .lean();
    
    // Cargar categorías manualmente
    const Categoria = mongoose.model('Categoria', new mongoose.Schema({}, { strict: false }), 'categorias');
    const categorias = await Categoria.find().lean();
    const categoriasMap = Object.fromEntries(categorias.map(c => [c._id.toString(), c]));

    console.log(`📊 Total servicios activos: ${servicios.length}\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    servicios.forEach((s, i) => {
      const cat = s.categoria ? categoriasMap[s.categoria.toString()] : null;
      console.log(`${i + 1}. ${s.titulo || 'SIN TÍTULO'}`);
      console.log(`   Categoría: ${cat?.nombre || 'Sin categoría'}`);
      console.log(`   Precio: ${s.precio ? `S/ ${s.precio}` : 'No definido'}`);
      console.log(`   Duración: ${s.duracion?.valor ? `${s.duracion.valor} ${s.duracion.unidad}` : 'No definida'}`);
      console.log(`   Descripción: ${s.descripcionCorta || 'Sin descripción'}`);
      console.log(`   Destacado: ${s.destacado ? '⭐ Sí' : 'No'}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
}

listServices();
