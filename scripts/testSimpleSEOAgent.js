/**
 * Test simple y directo del SEOAgent
 * Solo estructura y funcionalidades básicas
 */

console.log('🧪 Testing SEOAgent - Simple Structure Test\n');

try {
  // Import directo
  console.log('📥 Importing SEOAgent...');
  
  // Test de importación
  const module = await import('../agents/specialized/SEOAgent.js');
  console.log('✅ SEOAgent imported successfully');
  
  const { SEOAgent } = module;
  console.log('✅ SEOAgent class extracted');
  
  // Test básico de constructor
  console.log('\n🏗️ Testing constructor...');
  const agent = new SEOAgent(true); // Skip DB
  
  console.log('✅ SEOAgent instance created');
  console.log(`   Name: ${agent.name}`);
  console.log(`   Description: ${agent.description}`);
  console.log(`   Capabilities: ${agent.capabilities?.length || 0}`);
  
  // Test de capabilities
  console.log('\n🎯 Testing capabilities...');
  const expectedCaps = [
    'technical_seo_audit',
    'keyword_research',
    'schema_optimization',
    'performance_analysis'
  ];
  
  for (const cap of expectedCaps) {
    if (agent.capabilities?.includes(cap)) {
      console.log(`✅ ${cap} - OK`);
    } else {
      console.log(`❌ ${cap} - Missing`);
    }
  }
  
  // Test de configuración
  console.log('\n⚙️ Testing configuration...');
  console.log(`   Max Keywords: ${agent.config?.maxKeywordsPerAnalysis}`);
  console.log(`   Temperature: ${agent.config?.temperature}`);
  console.log(`   Max Tokens: ${agent.config?.maxTokens}`);
  
  // Test de métodos
  console.log('\n🔧 Testing methods...');
  const methods = ['executeTask', 'getDefaultPersonality', 'getDefaultContext'];
  for (const method of methods) {
    if (typeof agent[method] === 'function') {
      console.log(`✅ ${method}() - Available`);
    } else {
      console.log(`❌ ${method}() - Missing`);
    }
  }
  
  console.log('\n🎉 SEOAgent Basic Structure Test COMPLETED!');
  console.log('📝 Ready for next sprint phase');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}