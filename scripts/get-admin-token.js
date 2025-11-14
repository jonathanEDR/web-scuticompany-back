/**
 * Script para obtener token de autenticación del super administrador
 * Genera un token JWT válido para pruebas
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

dotenv.config();

async function getSuperAdminToken() {
  try {
    console.log('🔐 Obteniendo token del Super Administrador...\n');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    // Buscar usuario jonathan (super admin)
    const superAdmin = await User.findOne({ 
      $or: [
        { email: /jonathan/i },
        { email: 'edjonathan5@gmail.com' },
        { role: 'SUPER_ADMIN' },
        { role: 'superadmin' }
      ]
    }).sort({ createdAt: 1 }).limit(1);
    
    if (!superAdmin) {
      console.log('❌ No se encontró el super administrador');
      console.log('   Buscando cualquier usuario con rol admin...\n');
      
      const anyAdmin = await User.findOne({ 
        role: { $in: ['ADMIN', 'SUPER_ADMIN', 'admin', 'superadmin'] } 
      });
      
      if (anyAdmin) {
        console.log('✅ Usuario encontrado:');
        console.log(`   Nombre: ${anyAdmin.name}`);
        console.log(`   Email: ${anyAdmin.email}`);
        console.log(`   Role: ${anyAdmin.role}`);
        console.log(`   Clerk ID: ${anyAdmin.clerkId}\n`);
        
        return generateToken(anyAdmin);
      } else {
        console.log('❌ No se encontró ningún administrador');
        process.exit(1);
      }
    }
    
    console.log('✅ Super Administrador encontrado:');
    console.log(`   Nombre: ${superAdmin.name}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Role: ${superAdmin.role}`);
    console.log(`   Clerk ID: ${superAdmin.clerkId}\n`);
    
    return generateToken(superAdmin);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

function generateToken(user) {
  // Generar token JWT simple para pruebas
  // En producción, Clerk genera estos tokens
  const payload = {
    sub: user.clerkId, // Clerk usa 'sub' como ID principal
    userId: user.clerkId,
    email: user.email,
    name: user.name,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
  };
  
  // Usar la clave secreta de prueba (debe coincidir con .env)
  const secret = 'test-secret-key-for-local-development';
  const token = jwt.sign(payload, secret);
  
  console.log('═'.repeat(80));
  console.log('🎫 TOKEN GENERADO (válido por 24 horas):');
  console.log('═'.repeat(80));
  console.log(token);
  console.log('═'.repeat(80));
  console.log('\n📋 Para usar en las pruebas:\n');
  console.log('1. Copia el token de arriba');
  console.log('2. Agrégalo al archivo .env:');
  console.log(`   TEST_CLERK_TOKEN="${token}"`);
  console.log('\n3. O úsalo directamente en las requests:\n');
  console.log(`   Authorization: Bearer ${token}\n`);
  console.log('═'.repeat(80));
  
  return token;
}

// Ejecutar
getSuperAdminToken().then(() => {
  console.log('✅ Proceso completado');
  process.exit(0);
});
