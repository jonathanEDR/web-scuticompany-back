import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const servicioSchema = new mongoose.Schema({}, { strict: false });
const Servicio = mongoose.model('Servicio', servicioSchema, 'servicios');

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti');

console.log('🔍 Verificando campo "eliminado" en todos los servicios:\n');

const allServices = await Servicio.find({})
  .select('titulo estado eliminado createdAt')
  .sort('-createdAt')
  .lean();

console.log(`Total servicios: ${allServices.length}\n`);

allServices.forEach((s, i) => {
  const emoji = s.eliminado ? '🗑️' : '✅';
  console.log(`${emoji} ${i+1}. ${s.titulo}`);
  console.log(`   eliminado: ${s.eliminado}`);
  console.log(`   estado: ${s.estado}`);
  console.log(`   createdAt: ${s.createdAt ? new Date(s.createdAt).toLocaleString('es-PE') : 'N/A'}`);
  console.log('');
});

console.log('📊 Resumen:');
const eliminados = allServices.filter(s => s.eliminado === true).length;
const noEliminados = allServices.filter(s => s.eliminado !== true).length;
console.log(`   Eliminados: ${eliminados}`);
console.log(`   No eliminados: ${noEliminados}`);

await mongoose.disconnect();
