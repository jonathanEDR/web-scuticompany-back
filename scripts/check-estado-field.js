import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Servicio from '../models/Servicio.js';

dotenv.config({ path: './dev-config.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti';
console.log('🔗 Conectando a:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => {
    console.error('❌ Error conectando a MongoDB:', err);
    process.exit(1);
  });

async function checkEstadoField() {
  try {
    console.log('\n📋 Verificando campo "estado" de todos los servicios:\n');
    
    const allServices = await Servicio.find({})
      .select('titulo estado visibleEnWeb')
      .lean();
    
    console.log(`Total servicios en DB: ${allServices.length}\n`);
    
    allServices.forEach((service, index) => {
      console.log(`${index + 1}. ${service.titulo}`);
      console.log(`   estado: "${service.estado}" (tipo: ${typeof service.estado})`);
      console.log(`   visibleEnWeb: ${service.visibleEnWeb}`);
      console.log('');
    });
    
    // Count by estado
    const porEstado = {};
    allServices.forEach(s => {
      const estado = s.estado || 'undefined';
      porEstado[estado] = (porEstado[estado] || 0) + 1;
    });
    
    console.log('📊 Resumen por estado:');
    Object.entries(porEstado).forEach(([estado, count]) => {
      console.log(`   ${estado}: ${count}`);
    });
    
    // Test the actual query used in ServicesChatHandler
    console.log('\n🔍 Ejecutando query real del código:');
    const activosQuery = await Servicio.find({ estado: 'activo' })
      .select('titulo estado')
      .lean();
    console.log(`   Resultados: ${activosQuery.length}`);
    activosQuery.forEach(s => console.log(`   - ${s.titulo}`));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado');
  }
}

checkEstadoField();
