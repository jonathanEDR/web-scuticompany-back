#!/usr/bin/env node

/**
 * 🧪 Script de Prueba - Sistema de Perfiles Sociales
 * 
 * Este script verifica que todos los endpoints del sistema de perfiles funcionen correctamente
 */

import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_TOKEN = process.env.TEST_TOKEN || '';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, url, options = {}) {
  try {
    log(`\n🧪 Probando: ${name}`, 'cyan');
    log(`   URL: ${url}`, 'blue');
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      log(`   ✅ SUCCESS (${response.status})`, 'green');
      return { success: true, data };
    } else {
      log(`   ❌ ERROR (${response.status}): ${data.message || 'Unknown error'}`, 'red');
      return { success: false, error: data };
    }
  } catch (error) {
    log(`   ❌ FETCH ERROR: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n' + '='.repeat(60), 'yellow');
  log('🚀 INICIANDO PRUEBAS DEL SISTEMA DE PERFILES', 'yellow');
  log('='.repeat(60) + '\n', 'yellow');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: GET /api/profile (requiere autenticación)
  if (TEST_TOKEN) {
    const test1 = await testEndpoint(
      'Obtener Mi Perfil',
      `${API_URL}/api/profile`,
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      }
    );
    results.tests.push({ name: 'GET /api/profile', ...test1 });
    test1.success ? results.passed++ : results.failed++;
  } else {
    log('\n⚠️  Saltando test de perfil autenticado (sin TEST_TOKEN)', 'yellow');
  }

  // Test 2: GET /api/profile/public (listar perfiles públicos)
  const test2 = await testEndpoint(
    'Listar Perfiles Públicos',
    `${API_URL}/api/profile/public?page=1&limit=5`
  );
  results.tests.push({ name: 'GET /api/profile/public', ...test2 });
  test2.success ? results.passed++ : results.failed++;

  // Test 3: GET /api/profile/public (con búsqueda)
  const test3 = await testEndpoint(
    'Buscar Perfiles',
    `${API_URL}/api/profile/public?search=test&page=1&limit=5`
  );
  results.tests.push({ name: 'GET /api/profile/public?search=test', ...test3 });
  test3.success ? results.passed++ : results.failed++;

  // Test 4: GET /api/profile/public (filtro por rol)
  const test4 = await testEndpoint(
    'Filtrar Perfiles por Rol',
    `${API_URL}/api/profile/public?role=USER&page=1&limit=5`
  );
  results.tests.push({ name: 'GET /api/profile/public?role=USER', ...test4 });
  test4.success ? results.passed++ : results.failed++;

  // Test 5: Intentar obtener un perfil público específico
  // (esto fallará si no hay usuarios, pero es esperado)
  if (test2.success && test2.data.profiles && test2.data.profiles.length > 0) {
    const firstProfile = test2.data.profiles[0];
    const test5 = await testEndpoint(
      `Ver Perfil Público de ${firstProfile.username}`,
      `${API_URL}/api/profile/public/${firstProfile.username}`
    );
    results.tests.push({ name: `GET /api/profile/public/${firstProfile.username}`, ...test5 });
    test5.success ? results.passed++ : results.failed++;

    // Test 6: Obtener estadísticas del perfil
    const test6 = await testEndpoint(
      `Estadísticas de ${firstProfile.username}`,
      `${API_URL}/api/profile/stats/${firstProfile.username}`
    );
    results.tests.push({ name: `GET /api/profile/stats/${firstProfile.username}`, ...test6 });
    test6.success ? results.passed++ : results.failed++;
  } else {
    log('\n⚠️  Saltando tests de perfil específico (no hay perfiles disponibles)', 'yellow');
  }

  // Resumen
  log('\n' + '='.repeat(60), 'yellow');
  log('📊 RESUMEN DE PRUEBAS', 'yellow');
  log('='.repeat(60), 'yellow');
  log(`✅ Pasadas: ${results.passed}`, 'green');
  log(`❌ Fallidas: ${results.failed}`, 'red');
  log(`📝 Total: ${results.tests.length}`, 'blue');
  
  const successRate = (results.passed / results.tests.length * 100).toFixed(1);
  log(`\n🎯 Tasa de éxito: ${successRate}%`, successRate >= 80 ? 'green' : 'red');
  log('='.repeat(60) + '\n', 'yellow');

  // Detalles de tests fallidos
  const failedTests = results.tests.filter(t => !t.success);
  if (failedTests.length > 0) {
    log('\n❌ TESTS FALLIDOS:', 'red');
    failedTests.forEach(test => {
      log(`   • ${test.name}`, 'red');
      if (test.error) {
        log(`     Error: ${JSON.stringify(test.error, null, 2)}`, 'red');
      }
    });
  }

  // Instrucciones
  if (!TEST_TOKEN) {
    log('\n💡 CONSEJO:', 'yellow');
    log('   Para probar endpoints autenticados, proporciona un token:');
    log('   TEST_TOKEN=your_clerk_token node backend/scripts/testProfileSystem.js', 'cyan');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Ejecutar tests
runTests().catch(error => {
  log(`\n❌ ERROR FATAL: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
