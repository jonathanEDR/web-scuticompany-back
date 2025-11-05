/**
 * 🔧 Create Test User
 * Script simple para crear usuario de prueba
 */

import connectDB from '../config/database.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const createTestUser = async () => {
  console.log('🔧 Conectando a base de datos...');
  
  try {
    await connectDB();
    console.log('✅ Conectado a MongoDB');
    
    // Buscar usuario por email en lugar de ID
    let user = await User.findOne({ email: 'dev@example.com' });
    
    if (!user) {
      console.log('🔧 Creando usuario de prueba...');
      
      // Crear usuario de prueba sin especificar _id
      user = await User.create({
        clerkId: 'dev_clerk_id_test',
        email: 'dev@example.com',
        firstName: 'Desarrollador',
        lastName: 'Test',
        username: 'dev-test-user',
        role: 'USER'
      });
      
      console.log('✅ Usuario de prueba creado:', user.email);
      console.log('📋 Perfil inicial:', user.blogProfile);
    } else {
      console.log('✅ Usuario de prueba ya existe:', user.email);
      console.log('📋 Perfil actual:', user.blogProfile);
    }
    
    // Mostrar completeness
    console.log('📊 Completeness:', user.blogProfile.profileCompleteness + '%');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
};

createTestUser();