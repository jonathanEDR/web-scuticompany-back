#!/usr/bin/env node

/**
 * Script independiente para migrar servicios existentes
 * Úsalo si ya tienes servicios en tu base de datos
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { inicializarCategorias, migrarServiciosExistentes } from './utils/categoriaInitializer.js';

// Configuración
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/web-scuti';

console.log('🔄 Iniciando migración de categorías...\n');

// Conectar a la base de datos
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB');
    return runMigration();
  })
  .then(() => {
    console.log('\n🎉 Migración completada exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  });

async function runMigration() {
  try {
    // 1. Crear categorías por defecto si no existen
    console.log('\n📁 Paso 1: Inicializando categorías...');
    await inicializarCategorias();
    
    // 2. Migrar servicios existentes
    console.log('\n🔄 Paso 2: Migrando servicios existentes...');
    await migrarServiciosExistentes();
    
    console.log('\n✅ Todos los pasos completados');
    
  } catch (error) {
    console.error('Error durante la migración:', error);
    throw error;
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}