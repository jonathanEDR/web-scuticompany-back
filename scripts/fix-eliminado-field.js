import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const servicioSchema = new mongoose.Schema({}, { strict: false });
const Servicio = mongoose.model('Servicio', servicioSchema, 'servicios');

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti');

console.log('🔧 Actualizando campo "eliminado" en servicios nuevos...\n');

const result = await Servicio.updateMany(
  { eliminado: { $in: [null, undefined] } },
  { $set: { eliminado: false } }
);

console.log(`✅ Actualizados: ${result.modifiedCount} servicios`);
console.log(`📊 Documentos encontrados: ${result.matchedCount}`);

// Verificar resultado
const ahoraActivos = await Servicio.find({ estado: 'activo' })
  .select('titulo eliminado')
  .lean();

console.log(`\n✅ Servicios activos visibles ahora: ${ahoraActivos.length}`);
ahoraActivos.forEach((s, i) => {
  console.log(`   ${i+1}. ${s.titulo} (eliminado: ${s.eliminado})`);
});

await mongoose.disconnect();
console.log('\n✅ Completado');
