import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar .env desde diferentes ubicaciones
console.log('🔍 Intentando cargar .env desde diferentes rutas:\n');

const paths = [
  join(__dirname, '../.env'),
  join(__dirname, '../../dev-config.env'),
  join(__dirname, '../dev-config.env'),
];

paths.forEach(path => {
  console.log(`Intentando: ${path}`);
  const result = dotenv.config({ path });
  if (result.error) {
    console.log(`  ❌ No encontrado`);
  } else {
    console.log(`  ✅ Cargado exitosamente`);
  }
});

console.log('\n📊 Variables de entorno MongoDB:');
console.log(`MONGODB_URI: ${process.env.MONGODB_URI || '(no definido)'}`);
console.log(`MONGODB_URL: ${process.env.MONGODB_URL || '(no definido)'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || '(no definido)'}`);

const finalURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti';
console.log(`\n🔗 URI final que se usará: ${finalURI}`);

// Conectar y mostrar info
try {
  await mongoose.connect(finalURI);
  console.log('\n✅ Conectado exitosamente');
  console.log(`📍 Base de datos: ${mongoose.connection.db.databaseName}`);
  console.log(`🏠 Host: ${mongoose.connection.host}`);
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`\n📂 Colecciones disponibles (${collections.length}):`);
  collections.forEach(c => console.log(`   - ${c.name}`));
  
  await mongoose.disconnect();
} catch (error) {
  console.error('\n❌ Error conectando:', error.message);
}
