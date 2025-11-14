/**
 * Script para listar todos los usuarios y crear un super admin si no existe
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

dotenv.config();

async function listAndCreateAdmin() {
  try {
    console.log('👥 Verificando usuarios en la base de datos...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    // Listar todos los usuarios
    const users = await User.find({}).select('name email role clerkId createdAt').sort({ createdAt: 1 });
    
    console.log(`📊 Total de usuarios: ${users.length}\n`);
    
    if (users.length > 0) {
      console.log('═'.repeat(80));
      users.forEach((user, index) => {
        console.log(`${index + 1}. Nombre: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Clerk ID: ${user.clerkId}`);
        console.log(`   Creado: ${user.createdAt}`);
        console.log('─'.repeat(80));
      });
      console.log('═'.repeat(80));
      
      // Buscar si hay algún admin
      const admin = users.find(u => u.role === 'admin' || u.role === 'superadmin');
      
      if (admin) {
        console.log('\n✅ Administrador encontrado:', admin.name);
        return admin;
      } else {
        console.log('\n⚠️  No hay administradores. Promoviendo al primer usuario...\n');
        
        // Promover al primer usuario a superadmin
        const firstUser = users[0];
        firstUser.role = 'superadmin';
        await firstUser.save();
        
        console.log(`✅ Usuario ${firstUser.name} promovido a Super Admin`);
        return firstUser;
      }
    } else {
      console.log('⚠️  No hay usuarios en la base de datos');
      console.log('   Creando usuario de prueba...\n');
      
      // Crear usuario de prueba
      const testUser = await User.create({
        clerkId: `test_${Date.now()}`,
        name: 'Jonathan Test',
        email: 'jonathan@webscuti.com',
        role: 'superadmin'
      });
      
      console.log('✅ Usuario de prueba creado:');
      console.log(`   Nombre: ${testUser.name}`);
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Role: ${testUser.role}`);
      
      return testUser;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

listAndCreateAdmin().then(() => {
  console.log('\n✅ Proceso completado');
  process.exit(0);
});
