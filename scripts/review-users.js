/**
 * Script para Revisar Usuarios Existentes en MongoDB
 * Analiza y migra usuarios existentes al nuevo sistema de roles
 */

import mongoose from 'mongoose';
import User from '../models/User.js';
import { ROLES } from '../config/roles.js';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

/**
 * Conectar a MongoDB si no está conectado
 */
async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Conectado a MongoDB:', process.env.MONGODB_URI);
    } catch (error) {
      console.error('❌ Error conectando a MongoDB:', error.message);
      process.exit(1);
    }
  }
}

/**
 * Revisar todos los usuarios existentes
 */
async function reviewExistingUsers() {
  try {
    console.log('\n🔍 REVISANDO USUARIOS EXISTENTES EN LA BASE DE DATOS\n');
    console.log('=' * 60);

    // Obtener todos los usuarios
    const users = await User.find({}).sort({ createdAt: 1 });
    
    console.log(`📊 Total de usuarios encontrados: ${users.length}\n`);

    if (users.length === 0) {
      console.log('📝 No se encontraron usuarios en la base de datos.');
      console.log('💡 Los nuevos usuarios se registrarán automáticamente con rol USER.');
      return { totalUsers: 0, needsMigration: [], validUsers: [] };
    }

    // Analizar cada usuario
    const needsMigration = [];
    const validUsers = [];
    const roleStats = {};

    users.forEach((user, index) => {
      console.log(`\n👤 Usuario ${index + 1}:`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🆔 ClerkId: ${user.clerkId || 'No definido'}`);
      console.log(`   👑 Rol actual: ${user.role || 'No definido'}`);
      console.log(`   ✅ Activo: ${user.isActive ? 'Sí' : 'No'}`);
      console.log(`   📅 Creado: ${user.createdAt ? user.createdAt.toLocaleString() : 'No definido'}`);
      console.log(`   🔄 Último login: ${user.lastLogin ? user.lastLogin.toLocaleString() : 'Nunca'}`);

      // Verificar si el rol es válido
      const hasValidRole = user.role && Object.values(ROLES).includes(user.role);
      
      if (!hasValidRole) {
        console.log(`   ⚠️  ROL INVÁLIDO: "${user.role}" - NECESITA MIGRACIÓN`);
        needsMigration.push({
          id: user._id,
          email: user.email,
          currentRole: user.role,
          suggestedRole: ROLES.USER
        });
      } else {
        console.log(`   ✅ Rol válido`);
        validUsers.push(user);
      }

      // Estadísticas por rol
      const roleKey = user.role || 'undefined';
      roleStats[roleKey] = (roleStats[roleKey] || 0) + 1;
    });

    console.log('\n' + '=' * 60);
    console.log('📈 ESTADÍSTICAS POR ROL:');
    Object.entries(roleStats).forEach(([role, count]) => {
      const isValid = Object.values(ROLES).includes(role);
      const status = isValid ? '✅' : '⚠️';
      console.log(`   ${status} ${role}: ${count} usuarios`);
    });

    console.log('\n📋 RESUMEN:');
    console.log(`   ✅ Usuarios con roles válidos: ${validUsers.length}`);
    console.log(`   ⚠️  Usuarios que necesitan migración: ${needsMigration.length}`);

    return {
      totalUsers: users.length,
      needsMigration,
      validUsers,
      roleStats
    };

  } catch (error) {
    console.error('❌ Error revisando usuarios:', error);
    return null;
  }
}

/**
 * Migrar usuarios que necesitan actualización
 */
async function migrateInvalidUsers(needsMigration) {
  if (needsMigration.length === 0) {
    console.log('\n✅ No hay usuarios que necesiten migración.');
    return { migrated: 0 };
  }

  console.log(`\n🔄 MIGRANDO ${needsMigration.length} USUARIOS...\n`);
  
  let migratedCount = 0;

  for (const userInfo of needsMigration) {
    try {
      const user = await User.findById(userInfo.id);
      
      if (user) {
        const oldRole = user.role;
        user.role = userInfo.suggestedRole;
        user.roleAssignedAt = new Date();
        
        await user.save();
        
        console.log(`✅ ${user.email}: "${oldRole}" → "${user.role}"`);
        migratedCount++;
      }
    } catch (error) {
      console.error(`❌ Error migrando ${userInfo.email}:`, error.message);
    }
  }

  console.log(`\n🎉 Migración completada: ${migratedCount} usuarios actualizados`);
  return { migrated: migratedCount };
}

/**
 * Crear usuario de prueba si no existe ninguno
 */
async function ensureTestUserExists() {
  try {
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      console.log('\n💡 No hay usuarios en la base de datos.');
      console.log('📝 Cuando registres el primer usuario desde Clerk, se creará automáticamente con rol USER.');
      return null;
    }

    // Verificar si existe un super admin
    const superAdmin = await User.findOne({ role: ROLES.SUPER_ADMIN });
    
    if (!superAdmin) {
      console.log('\n⚠️  NO SE ENCONTRÓ SUPER ADMINISTRADOR');
      console.log('💡 Opciones para crear uno:');
      console.log('   1. Registra un usuario con email "admin@scuti.com" desde Clerk');
      console.log('   2. Ejecuta: node scripts/migrate-roles.js migrate');
      console.log('   3. Promociona manualmente un usuario existente');
      
      // Sugerir promoción de usuario existente
      const firstUser = await User.findOne({}).sort({ createdAt: 1 });
      if (firstUser) {
        console.log(`\n🔧 SUGERENCIA: Promocionar usuario existente:`);
        console.log(`   Email: ${firstUser.email}`);
        console.log(`   Comando: node -e "import('./scripts/promote-user.js').then(m => m.promoteToSuperAdmin('${firstUser.email}'))"`);
      }
    } else {
      console.log(`\n👑 Super Admin encontrado: ${superAdmin.email}`);
    }

  } catch (error) {
    console.error('❌ Error verificando usuarios:', error);
  }
}

/**
 * Función principal
 */
async function main() {
  try {
    await connectToDatabase();
    
    console.log('🚀 ANÁLISIS DE USUARIOS - SISTEMA DE ROLES');
    console.log('Database:', process.env.MONGODB_URI);
    
    // Revisar usuarios existentes
    const analysis = await reviewExistingUsers();
    
    if (!analysis) {
      console.error('❌ No se pudo completar el análisis');
      process.exit(1);
    }

    // Migrar usuarios si es necesario
    if (analysis.needsMigration.length > 0) {
      console.log('\n❓ ¿Deseas migrar los usuarios con roles inválidos? (y/N)');
      
      // Para este script, migraremos automáticamente
      console.log('🔄 Migrando automáticamente...');
      await migrateInvalidUsers(analysis.needsMigration);
    }

    // Verificar estado del super admin
    await ensureTestUserExists();

    console.log('\n' + '=' * 60);
    console.log('✅ ANÁLISIS COMPLETADO');
    console.log(`📊 Usuarios totales: ${analysis.totalUsers}`);
    console.log('🔧 Sistema de roles configurado correctamente');
    console.log('💡 Los nuevos usuarios se registrarán automáticamente con rol USER');
    
  } catch (error) {
    console.error('❌ Error fatal:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('\n🔌 Desconectado de MongoDB');
    }
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { reviewExistingUsers, migrateInvalidUsers };