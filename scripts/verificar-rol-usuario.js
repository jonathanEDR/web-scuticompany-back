/**
 * 🔧 SCRIPT DE VERIFICACIÓN Y ASIGNACIÓN DE ROL
 * Verifica y actualiza el rol de un usuario en la base de datos
 */

import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/scuti-crm';

async function verificarYAsignarRol() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Listar todos los usuarios
    const usuarios = await User.find().select('email firstName lastName role clerkId isActive');
    
    if (usuarios.length === 0) {
      console.log('⚠️  No hay usuarios en la base de datos');
      console.log('');
      console.log('💡 Para crear un usuario, primero regístrate en la aplicación usando Clerk');
      process.exit(0);
    }

    console.log('\n📋 USUARIOS ENCONTRADOS:\n');
    usuarios.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Nombre: ${user.firstName} ${user.lastName}`);
      console.log(`   Rol actual: ${user.role}`);
      console.log(`   Clerk ID: ${user.clerkId}`);
      console.log(`   Activo: ${user.isActive ? '✅' : '❌'}`);
      console.log('');
    });

    // Para modo interactivo, podrías usar readline
    // Por ahora, vamos a actualizar todos los usuarios con rol USER a CLIENT
    console.log('🔄 Actualizando usuarios con rol USER a CLIENT...\n');

    const result = await User.updateMany(
      { role: 'USER' },
      { $set: { role: 'CLIENT' } }
    );

    console.log(`✅ ${result.modifiedCount} usuario(s) actualizado(s) a rol CLIENT`);

    // Mostrar usuarios actualizados
    const usuariosActualizados = await User.find().select('email role');
    console.log('\n📋 ROLES ACTUALIZADOS:\n');
    usuariosActualizados.forEach(user => {
      console.log(`- ${user.email}: ${user.role}`);
    });

    console.log('\n✨ Proceso completado');
    console.log('🔄 Ahora puedes reiniciar el servidor backend y probar de nuevo');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

verificarYAsignarRol();
