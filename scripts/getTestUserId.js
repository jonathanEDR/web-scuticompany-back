/**
 * 🔍 Get Test User ID
 * Script para obtener el ID del usuario de prueba
 */

import connectDB from '../config/database.js';
import User from '../models/User.js';

const getTestUserId = async () => {
  try {
    await connectDB();
    
    const user = await User.findOne({ email: 'dev@example.com' });
    
    if (user) {
      console.log('✅ Usuario encontrado:');
      console.log('ID:', user._id.toString());
      console.log('Email:', user.email);
      console.log('ClerkId:', user.clerkId);
      console.log('Role:', user.role);
      console.log('Username:', user.username);
    } else {
      console.log('❌ Usuario no encontrado');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
};

getTestUserId();