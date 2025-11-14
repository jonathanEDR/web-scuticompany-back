/**
 * Suite de Pruebas de Integración Completa
 * Valida el sistema BlogAgent refactorizado end-to-end
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BlogAgent from '../agents/specialized/BlogAgent.js';
import seoMonitor from '../utils/seoMonitor.js';
import { listTemplates } from '../utils/contentTemplates.js';
import logger from '../utils/logger.js';

dotenv.config();

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class IntegrationTestSuite {
  constructor() {
    this.agent = null;
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      test: '🧪'
    };
    console.log(`${icons[type]} ${message}`);
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      this.log('MongoDB conectado', 'success');
    } catch (error) {
      this.log(`Error conectando a MongoDB: ${error.message}`, 'error');
      throw error;
    }
  }

  async disconnect() {
    await mongoose.connection.close();
    this.log('Conexión a MongoDB cerrada', 'success');
  }

  async setup() {
    this.log('Inicializando BlogAgent...', 'info');
    this.agent = new BlogAgent();
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.log('BlogAgent inicializado', 'success');
  }

  async runTest(name, testFn) {
    this.results.total++;
    this.log(`\n${'='.repeat(60)}\n📝 TEST: ${name}\n${'='.repeat(60)}`, 'test');
    
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.results.passed++;
      this.results.tests.push({ name, status: 'passed', duration });
      this.log(`✅ PASSED en ${duration}s\n`, 'success');
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.results.failed++;
      this.results.tests.push({ name, status: 'failed', duration, error: error.message });
      this.log(`❌ FAILED en ${duration}s: ${error.message}\n`, 'error');
    }
  }

  async testGenerateFullPost() {
    await this.runTest('Generar Post Completo con Template', async () => {
      const result = await this.agent.generateFullPost({
        title: 'Guía Completa de React Hooks',
        category: 'React',
        style: 'professional',
        wordCount: 1000,
        focusKeywords: ['React', 'Hooks', 'useState', 'useEffect'],
        template: 'tutorial'
      });

      if (!result.success) throw new Error('Generación falló');
      if (!result.content) throw new Error('Contenido vacío');
      if (result.metadata.wordCount < 500) throw new Error('Contenido muy corto');
      if (result.metadata.seoScore < 80) throw new Error(`SEO score bajo: ${result.metadata.seoScore}`);
      if (!result.content.includes('##')) throw new Error('Sin headers');
      if (!result.content.includes('```')) throw new Error('Sin bloques de código');
      
      this.log(`   📊 Palabras: ${result.metadata.wordCount}`, 'info');
      this.log(`   🎯 SEO Score: ${result.metadata.seoScore}/100`, 'info');
      this.log(`   📋 Template: ${result.metadata.template}`, 'info');
      
      if (result.metadata.validation) {
        this.log(`   ✓ Validación: ${result.metadata.validation.valid ? 'PASSED' : 'FAILED'}`, 
          result.metadata.validation.valid ? 'success' : 'warning');
      }
    });
  }

  async testGenerateContentSection() {
    await this.runTest('Generar Sección de Contenido', async () => {
      const result = await this.agent.generateContentSection({
        title: 'Fundamentos de TypeScript',
        context: 'Este es un tutorial sobre desarrollo frontend moderno...',
        wordCount: 250
      });

      if (!result.success) throw new Error('Generación falló');
      if (!result.content) throw new Error('Contenido vacío');
      if (result.metadata.wordCount < 150) throw new Error('Contenido muy corto');
      
      this.log(`   📊 Palabras: ${result.metadata.wordCount}`, 'info');
    });
  }

  async testExtendContent() {
    await this.runTest('Extender Contenido Existente', async () => {
      const originalContent = `Node.js es una plataforma de desarrollo backend.
Es conocida por su modelo de E/S no bloqueante.`;

      const result = await this.agent.extendContent({
        currentContent: originalContent,
        instruction: 'Extender con información sobre sus ventajas y casos de uso',
        wordCount: 200
      });

      if (!result.success) throw new Error('Extensión falló');
      if (!result.content) throw new Error('Contenido vacío');
      if (result.metadata.addedWords < 100) throw new Error('Extensión insuficiente');
      
      this.log(`   📊 Palabras agregadas: ${result.metadata.addedWords}`, 'info');
    });
  }

  async testImproveContent() {
    await this.runTest('Mejorar Contenido Existente', async () => {
      const poorContent = 'Node.js es bueno. Usa JavaScript. Es rápido.';

      const result = await this.agent.improveContent({
        content: poorContent,
        instruction: 'Mejorar claridad y profesionalismo'
      });

      if (!result.success) throw new Error('Mejora falló');
      if (!result.content) throw new Error('Contenido vacío');
      if (result.metadata.improvements.length === 0) throw new Error('Sin mejoras detectadas');
      
      this.log(`   ✨ Mejoras: ${result.metadata.improvements.join(', ')}`, 'info');
    });
  }

  async testSuggestNextParagraph() {
    await this.runTest('Sugerir Siguiente Párrafo', async () => {
      const context = `Node.js es una plataforma de desarrollo backend que utiliza JavaScript.
Su arquitectura basada en eventos la hace ideal para aplicaciones en tiempo real.`;

      const result = await this.agent.suggestNextParagraph({
        currentContent: context,
        context: { before: 'Introducción a Node.js' }
      });

      if (!result.success) throw new Error('Sugerencia falló');
      if (!result.suggestion) throw new Error('Sin sugerencia');
      if (result.confidence < 70) throw new Error(`Confianza baja: ${result.confidence}%`);
      
      this.log(`   🎯 Confianza: ${result.confidence}%`, 'info');
    });
  }

  async testOptimizeSEO() {
    await this.runTest('Optimizar SEO (Mock)', async () => {
      // Este test requiere un post real en la base de datos
      // Por ahora solo verificamos que la función esté disponible
      if (typeof this.agent.optimizeSEO !== 'function') {
        throw new Error('Método optimizeSEO no disponible');
      }
      
      this.log('   ✓ Método optimizeSEO disponible', 'success');
    });
  }

  async testGenerateTags() {
    await this.runTest('Generar Tags (Mock)', async () => {
      if (typeof this.agent.generateTags !== 'function') {
        throw new Error('Método generateTags no disponible');
      }
      
      this.log('   ✓ Método generateTags disponible', 'success');
    });
  }

  async testAnalyzeContent() {
    await this.runTest('Analizar Contenido (Mock)', async () => {
      if (typeof this.agent.analyzeContent !== 'function') {
        throw new Error('Método analyzeContent no disponible');
      }
      
      this.log('   ✓ Método analyzeContent disponible', 'success');
    });
  }

  async testChat() {
    await this.runTest('Chat Conversacional', async () => {
      const result = await this.agent.chat({
        message: '¿Cómo puedo mejorar el SEO de mis posts?',
        conversationHistory: []
      });

      if (!result.success) throw new Error('Chat falló');
      if (!result.response) throw new Error('Sin respuesta');
      
      this.log(`   💬 Respuesta: ${result.response.substring(0, 100)}...`, 'info');
    });
  }

  async testSEOMonitor() {
    await this.runTest('Sistema de Monitoreo SEO', async () => {
      const testContent = `## Introducción
Node.js es una **plataforma poderosa** para desarrollo backend.

### Características
- Event-driven
- Non-blocking I/O
- JavaScript en servidor

\`\`\`javascript
const server = http.createServer();
\`\`\`

## Conclusión
Node.js es ideal para aplicaciones modernas.`;

      const metrics = seoMonitor.analyzePost(testContent, 'Node.js Tutorial');
      
      if (metrics.seoScore < 70) throw new Error(`SEO score bajo: ${metrics.seoScore}`);
      if (!metrics.hasHeaders) throw new Error('No detectó headers');
      if (!metrics.hasList) throw new Error('No detectó listas');
      if (!metrics.hasCodeBlocks) throw new Error('No detectó código');
      
      this.log(`   🎯 SEO Score: ${metrics.seoScore}/100`, 'info');
      this.log(`   📖 Legibilidad: ${metrics.readabilityScore}/100`, 'info');
      this.log(`   🏗️  Estructura: ${metrics.structureScore}/100`, 'info');
    });
  }

  async testTemplates() {
    await this.runTest('Sistema de Templates', async () => {
      const templates = listTemplates();
      
      if (templates.length === 0) throw new Error('Sin templates disponibles');
      
      const requiredTemplates = ['tutorial', 'guide', 'technical', 'informative', 'opinion'];
      for (const templateType of requiredTemplates) {
        const found = templates.find(t => t.key === templateType);
        if (!found) throw new Error(`Template ${templateType} no encontrado`);
      }
      
      this.log(`   📋 Templates disponibles: ${templates.length}`, 'info');
      templates.forEach(t => {
        this.log(`      • ${t.name}: ${t.description}`, 'info');
      });
    });
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE PRUEBAS DE INTEGRACIÓN');
    console.log('='.repeat(60));
    console.log(`\n✅ Pruebas exitosas: ${this.results.passed}/${this.results.total}`);
    console.log(`❌ Pruebas fallidas: ${this.results.failed}/${this.results.total}`);
    
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    console.log(`📈 Tasa de éxito: ${successRate}%`);
    
    const totalTime = this.results.tests.reduce((sum, t) => sum + parseFloat(t.duration), 0).toFixed(2);
    console.log(`⏱️  Tiempo total: ${totalTime}s`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Pruebas fallidas:');
      this.results.tests
        .filter(t => t.status === 'failed')
        .forEach(t => {
          console.log(`   • ${t.name}: ${t.error}`);
        });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(this.results.failed === 0 ? '🎉 ¡TODAS LAS PRUEBAS PASARON!' : '⚠️  ALGUNAS PRUEBAS FALLARON');
    console.log('='.repeat(60) + '\n');
  }

  async runAll() {
    try {
      console.log('\n');
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║  🧪 SUITE DE PRUEBAS DE INTEGRACIÓN - BLOGAGENT          ║');
      console.log('║         Sistema Refactorizado con Mejoras SEO             ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');
      
      await this.connect();
      await this.setup();
      
      // Tests de generación de contenido
      await this.testGenerateFullPost();
      await this.testGenerateContentSection();
      await this.testExtendContent();
      await this.testImproveContent();
      await this.testSuggestNextParagraph();
      
      // Tests de servicios auxiliares
      await this.testOptimizeSEO();
      await this.testGenerateTags();
      await this.testAnalyzeContent();
      await this.testChat();
      
      // Tests de nuevos sistemas
      await this.testSEOMonitor();
      await this.testTemplates();
      
      this.printSummary();
      
      await this.disconnect();
      
      // Exit code basado en resultados
      process.exit(this.results.failed > 0 ? 1 : 0);
      
    } catch (error) {
      this.log(`Error fatal: ${error.message}`, 'error');
      console.error(error);
      await this.disconnect();
      process.exit(1);
    }
  }
}

// Ejecutar tests
const suite = new IntegrationTestSuite();
suite.runAll();
