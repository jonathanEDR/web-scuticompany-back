/**
 * Script de Migración para Sistema de Roles
 * Actualiza usuarios existentes al nuevo sistema de roles
 */

import mongoose from 'mongoose';
import User from '../models/User.js';
import { ROLES, DEFAULT_SUPER_ADMIN } from '../config/roles.js';
import { cleanupInconsistentRoles } from '../utils/roleHelper.js';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

/**
 * Migrar usuarios existentes al nuevo sistema de roles
 */
async function migrateUsers() {
  try {
    logger.startup('🔄 Iniciando migración del sistema de roles');

    // Conectar a la base de datos
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
      logger.success('Conectado a MongoDB para migración');
    }

    // 1. Limpiar roles inconsistentes
    logger.init('Paso 1: Limpiando roles inconsistentes');
    const cleanupResult = await cleanupInconsistentRoles();
    
    if (cleanupResult.cleanedUsers > 0) {
      logger.success(`✅ ${cleanupResult.cleanedUsers} usuarios actualizados con roles válidos`);
    }

    // 2. Mapear roles antiguos a nuevos
    logger.init('Paso 2: Mapeando roles antiguos al nuevo sistema');
    
    const roleMapping = {
      'user': ROLES.USER,
      'admin': ROLES.ADMIN,
      'moderator': ROLES.MODERATOR
      // 'client' no existía antes, se mantiene como está si ya existe
    };

    let updatedCount = 0;
    
    for (const [oldRole, newRole] of Object.entries(roleMapping)) {
      const result = await User.updateMany(
        { role: oldRole },
        { 
          role: newRole,
          roleAssignedAt: new Date()
        }
      );
      
      if (result.modifiedCount > 0) {
        logger.success(`✅ ${result.modifiedCount} usuarios actualizados de ${oldRole} a ${newRole}`);
        updatedCount += result.modifiedCount;
      }
    }

    // 3. Crear/verificar Super Admin por defecto
    logger.init('Paso 3: Verificando Super Administrador por defecto');
    
    const defaultEmail = DEFAULT_SUPER_ADMIN.email;
    let superAdmin = await User.findOne({ role: ROLES.SUPER_ADMIN });
    
    if (!superAdmin) {
      // Buscar usuario con el email por defecto
      const userToPromote = await User.findOne({ email: defaultEmail });
      
      if (userToPromote) {
        await userToPromote.assignRole(ROLES.SUPER_ADMIN, null);
        logger.success(`✅ Usuario ${defaultEmail} promovido a Super Admin`);
        superAdmin = userToPromote;
      } else {
        logger.warn(`⚠️  No se encontró usuario con email ${defaultEmail} para promover a Super Admin`);
        logger.warn(`💡 Recomendación: Crear usuario con email ${defaultEmail} en Clerk y ejecutar migración nuevamente`);
      }
    } else {
      logger.success('✅ Super Admin ya existe en el sistema');
    }

    // 4. Agregar campos faltantes a usuarios existentes
    logger.init('Paso 4: Agregando campos faltantes');
    
    const usersWithoutCustomPermissions = await User.updateMany(
      { customPermissions: { $exists: false } },
      { $set: { customPermissions: [] } }
    );

    if (usersWithoutCustomPermissions.modifiedCount > 0) {
      logger.success(`✅ Campo customPermissions agregado a ${usersWithoutCustomPermissions.modifiedCount} usuarios`);
    }

    // 5. Reporte final
    logger.init('Paso 5: Generando reporte final');
    
    const finalStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } }
        }
      }
    ]);

    logger.success('📊 Estadísticas finales por rol:');
    finalStats.forEach(stat => {
      logger.info(`   ${stat._id}: ${stat.count} total, ${stat.active} activos`);
    });

    const totalUsers = await User.countDocuments();
    
    logger.success('🎉 Migración completada exitosamente');
    logger.info(`📈 Resumen: ${totalUsers} usuarios totales, ${updatedCount} migrados`);
    
    return {
      success: true,
      totalUsers,
      migratedUsers: updatedCount,
      finalStats,
      superAdminExists: !!superAdmin
    };

  } catch (error) {
    logger.error('❌ Error durante la migración', error);
    throw error;
  }
}

/**
 * Verificar estado del sistema de roles
 */
async function verifyRoleSystem() {
  try {
    logger.init('🔍 Verificando integridad del sistema de roles');

    // Verificar que todos los usuarios tienen roles válidos
    const usersWithInvalidRoles = await User.find({
      role: { $nin: Object.values(ROLES) }
    });

    if (usersWithInvalidRoles.length > 0) {
      logger.error(`❌ ${usersWithInvalidRoles.length} usuarios con roles inválidos encontrados`);
      usersWithInvalidRoles.forEach(user => {
        logger.warn(`   Usuario: ${user.email} - Rol inválido: ${user.role}`);
      });
      return false;
    }

    // Verificar que existe al menos un super admin
    const superAdminCount = await User.countDocuments({ 
      role: ROLES.SUPER_ADMIN, 
      isActive: true 
    });

    if (superAdminCount === 0) {
      logger.error('❌ No se encontró ningún Super Admin activo');
      return false;
    }

    logger.success('✅ Sistema de roles verificado correctamente');
    logger.info(`📊 Super Admins activos: ${superAdminCount}`);
    
    return true;

  } catch (error) {
    logger.error('Error verificando sistema de roles', error);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  try {
    const action = process.argv[2] || 'migrate';

    switch (action) {
      case 'migrate':
        await migrateUsers();
        break;
      
      case 'verify':
        await verifyRoleSystem();
        break;
        
      case 'both':
        await migrateUsers();
        await verifyRoleSystem();
        break;
        
      default:
        console.log('Uso: node scripts/migrate-roles.js [migrate|verify|both]');
        process.exit(1);
    }

    logger.success('🏁 Proceso completado exitosamente');
    
    if (mongoose.connection.readyState) {
      await mongoose.disconnect();
      logger.debug('Desconectado de MongoDB');
    }

  } catch (error) {
    logger.error('Error fatal en migración', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { migrateUsers, verifyRoleSystem };