import mongoose from 'mongoose';
import connectDB from './config/database.js';
import Servicio from './models/Servicio.js';

await connectDB();

console.log('🔍 Verificando servicios cargados por el backend:\n');

const servicios = await Servicio.find({ estado: 'activo' })
  .select('titulo precio duracion')
  .lean();

console.log(`✅ Servicios encontrados: ${servicios.length}\n`);

servicios.forEach((s, i) => {
  const precio = s.precio ? `S/ ${s.precio}` : 'Sin precio';
  const duracion = s.duracion ? `${s.duracion}` : 'Sin duración';
  console.log(`${i+1}. ${s.titulo}`);
  console.log(`   ${precio} - ${duracion}`);
});

await mongoose.disconnect();
