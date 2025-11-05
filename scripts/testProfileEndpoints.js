/**
 * 🧪 Test Profile Endpoints
 * Script para probar los endpoints de perfil
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'Bearer test-token';

const headers = {
  'Authorization': TEST_TOKEN,
  'Content-Type': 'application/json'
};

// ============================================
// FUNCIONES DE PRUEBA
// ============================================

/**
 * Crear usuario de prueba
 */
const createTestUser = async () => {
  console.log('\n🔧 Creando usuario de prueba...');
  
  // Importar modelos
  const { default: connectDB } = await import('./config/database.js');
  const { default: User } = await import('./models/User.js');
  
  await connectDB();
  
  // Verificar si ya existe
  let user = await User.findById('dev-user-id');
  
  if (!user) {
    // Crear usuario de prueba
    user = await User.create({
      _id: 'dev-user-id',
      email: 'dev@example.com',
      firstName: 'Desarrollador',
      lastName: 'Test',
      username: 'dev-test-user',
      role: 'USER',
      blogProfile: {
        displayName: 'Dev User',
        bio: 'Usuario de prueba para desarrollo',
        isPublicProfile: true
      }
    });
    
    console.log('✅ Usuario de prueba creado:', user.email);
  } else {
    console.log('✅ Usuario de prueba ya existe:', user.email);
  }
  
  return user;
};

/**
 * Probar GET /api/profile
 */
const testGetMyProfile = async () => {
  console.log('\n📝 Probando GET /api/profile');
  
  try {
    const response = await fetch(`${BASE_URL}/profile`, {
      method: 'GET',
      headers
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
};

/**
 * Probar PUT /api/profile
 */
const testUpdateProfile = async () => {
  console.log('\n📝 Probando PUT /api/profile');
  
  const updateData = {
    displayName: 'Desarrollador Actualizado',
    bio: 'Bio actualizada desde API',
    location: 'Ciudad de Desarrollo',
    expertise: 'Full Stack Developer',
    website: 'https://example.dev',
    social: {
      twitter: '@devtest',
      github: 'devtest',
      linkedin: 'https://linkedin.com/in/devtest'
    },
    privacy: {
      showEmail: false,
      showLocation: true,
      showSocialLinks: true
    },
    isPublicProfile: true
  };
  
  try {
    const response = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData)
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
};

/**
 * Probar GET /api/profile/public/:username
 */
const testGetPublicProfile = async (username = 'dev-test-user') => {
  console.log(`\n📝 Probando GET /api/profile/public/${username}`);
  
  try {
    const response = await fetch(`${BASE_URL}/profile/public/${username}`, {
      method: 'GET'
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
};

/**
 * Probar GET /api/profile/:username/stats
 */
const testGetProfileStats = async (username = 'dev-test-user') => {
  console.log(`\n📝 Probando GET /api/profile/${username}/stats`);
  
  try {
    const response = await fetch(`${BASE_URL}/profile/${username}/stats`, {
      method: 'GET'
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
};

/**
 * Probar GET /api/profile/public (listar perfiles)
 */
const testListPublicProfiles = async () => {
  console.log('\n📝 Probando GET /api/profile/public');
  
  try {
    const response = await fetch(`${BASE_URL}/profile/public?page=1&limit=5`, {
      method: 'GET'
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
};

// ============================================
// EJECUTAR PRUEBAS
// ============================================

const runTests = async () => {
  console.log('🚀 Iniciando pruebas de endpoints de perfil');
  
  try {
    // 1. Crear usuario de prueba
    await createTestUser();
    
    // 2. Probar obtener mi perfil
    await testGetMyProfile();
    
    // 3. Probar actualizar perfil
    await testUpdateProfile();
    
    // 4. Probar obtener perfil público
    await testGetPublicProfile();
    
    // 5. Probar estadísticas
    await testGetProfileStats();
    
    // 6. Probar listar perfiles públicos
    await testListPublicProfiles();
    
    console.log('\n✅ Todas las pruebas completadas');
    
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error);
  } finally {
    process.exit(0);
  }
};

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔄 Iniciando script...');
  runTests().catch(console.error);
}

export default runTests;