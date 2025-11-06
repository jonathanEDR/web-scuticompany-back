/**
 * Script rápido para verificar que el endpoint devuelve el trainingConfig
 */

import axios from 'axios';

async function testEndpoint() {
  try {
    console.log('🔄 Testing endpoint: http://localhost:5000/api/agents/config/blog');
    
    const response = await axios.get('http://localhost:5000/api/agents/config/blog');
    
    console.log('\n📡 Response status:', response.status);
    console.log('📊 Response structure:', {
      success: response.data.success,
      hasData: !!response.data.data,
      hasTrainingConfig: !!response.data.data?.trainingConfig
    });
    
    if (response.data.data?.trainingConfig) {
      const tc = response.data.data.trainingConfig;
      console.log('\n✅ Training Config found!');
      console.log('   Examples:', tc.examples?.length || 0);
      console.log('   Rules:', tc.behaviorRules?.length || 0);
      console.log('   Learning Mode:', tc.learningMode);
      console.log('   Special Instructions:', tc.specialInstructions ? `${tc.specialInstructions.length} chars` : 'none');
      
      if (tc.examples && tc.examples.length > 0) {
        console.log('\n📖 First example:');
        console.log('   Category:', tc.examples[0].category);
        console.log('   Input:', tc.examples[0].input.substring(0, 80) + '...');
      }
    } else {
      console.log('\n❌ No training config in response!');
      console.log('Response data keys:', Object.keys(response.data.data || {}));
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testEndpoint();
