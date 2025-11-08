# 🤖 ServicesAgent - Agente AI para Gestión de Servicios

> Agente especializado en análisis, optimización y generación inteligente de servicios

## 📋 Descripción

ServicesAgent es un agente de IA diseñado con arquitectura modular para gestionar todo el ciclo de vida de servicios en la plataforma Web Scuti. Utiliza inteligencia artificial para analizar, optimizar, generar y recomendar mejoras en servicios y paquetes.

## 🎯 Capacidades

### Interacción
- ✅ `natural_language_command` - Comandos en lenguaje natural
- ✅ `chat_interaction` - Chat interactivo contextual

### Análisis
- ✅ `service_analysis` - Análisis profundo de servicios
- ✅ `portfolio_analysis` - Análisis de portafolio completo
- ✅ `pricing_analysis` - Análisis de estrategias de pricing
- ✅ `competitive_analysis` - Análisis competitivo de mercado
- ✅ `gap_analysis` - Detección de gaps en portafolio

### Generación
- ✅ `service_generation` - Generación de nuevos servicios
- ✅ `package_generation` - Creación inteligente de paquetes
- ✅ `description_generation` - Descripciones atractivas
- ✅ `content_creation` - Contenido de marketing

### Optimización
- ✅ `seo_optimization` - Optimización SEO de servicios
- ✅ `description_optimization` - Mejora de descripciones
- ✅ `price_optimization` - Optimización de precios
- ✅ `package_optimization` - Optimización de paquetes

### Estrategia
- ✅ `pricing_strategy` - Estrategias de pricing
- ✅ `bundling_strategy` - Estrategias de bundling
- ✅ `market_positioning` - Posicionamiento de mercado
- ✅ `upsell_recommendations` - Recomendaciones de upsell
- ✅ `cross_sell_suggestions` - Sugerencias de cross-sell

## 🏗️ Arquitectura

### Estructura Modular
```
services/
├── ServicesAgent.js                 [~300 líneas] - Clase principal
├── handlers/                        [~1,950 líneas]
│   ├── ServicesChatHandler.js      [~350 líneas]
│   ├── ServicesAnalyzer.js         [~400 líneas]
│   ├── ServicesOptimizer.js        [~400 líneas]
│   ├── ServicesGenerator.js        [~450 líneas]
│   └── ServicesPricingAdvisor.js   [~350 líneas]
├── utils/                           [~550 líneas]
│   ├── ServicesValidator.js        [~200 líneas]
│   ├── ServicesFormatter.js        [~150 líneas]
│   └── ServicesMetrics.js          [~200 líneas]
└── config/                          [~150 líneas]
    └── servicesAgentConfig.js
```

**Total:** ~3,000 líneas (modular y escalable)

### Principios de Diseño
- ✅ **Modularidad:** Cada handler < 450 líneas
- ✅ **Separación de responsabilidades:** Un handler, una responsabilidad
- ✅ **Reutilización:** Compartir servicios (OpenAI, Context, Memory)
- ✅ **Escalabilidad:** Fácil agregar nuevos handlers
- ✅ **Mantenibilidad:** Código claro y documentado

## 🚀 Uso

### Inicialización
```javascript
import ServicesAgent from './agents/specialized/services/ServicesAgent.js';
import AgentOrchestrator from './agents/core/AgentOrchestrator.js';

// Crear y registrar el agente
const servicesAgent = new ServicesAgent();
await AgentOrchestrator.registerAgent(servicesAgent);
```

### Chat Interactivo
```javascript
const response = await servicesAgent.chat(
  '¿Qué servicios debo destacar este mes?',
  'session-123',
  { userId: 'user-456' }
);
```

### Analizar Servicio
```javascript
const analysis = await servicesAgent.analyzeService(
  'service-id-123',
  { 
    depth: 'complete',
    includeCompetitors: true,
    includeSEO: true 
  }
);
```

### Optimizar Servicio
```javascript
const optimization = await servicesAgent.optimizeService(
  'service-id-123',
  'seo' // o 'description', 'structure', 'conversion'
);
```

### Generar Servicio
```javascript
const newService = await servicesAgent.generateService({
  category: 'Desarrollo Web',
  type: 'Premium',
  targetAudience: 'Empresas',
  requirements: 'E-commerce con pasarela de pagos'
});
```

### Sugerir Pricing
```javascript
const pricing = await servicesAgent.suggestPricing(
  { name: 'Diseño Web Premium', features: [...] },
  { competitors: [...], marketData: {...} }
);
```

## 📡 Endpoints API

### Chat
```http
POST /api/servicios/agent/chat
Content-Type: application/json

{
  "message": "¿Cómo puedo mejorar mis servicios?",
  "sessionId": "session-123"
}
```

### Analizar Servicio
```http
POST /api/servicios/:id/agent/analyze
Content-Type: application/json

{
  "analysisType": "complete",
  "options": {
    "includeCompetitors": true
  }
}
```

### Optimizar Servicio
```http
POST /api/servicios/:id/agent/optimize
Content-Type: application/json

{
  "optimizationType": "seo",
  "autoApply": false
}
```

### Generar Contenido
```http
POST /api/servicios/:id/agent/generate-content
Content-Type: application/json

{
  "contentType": "description",
  "requirements": {
    "tone": "professional",
    "length": "medium"
  }
}
```

### Sugerir Pricing
```http
POST /api/servicios/agent/pricing-suggestion
Content-Type: application/json

{
  "serviceData": {...},
  "competitors": [...]
}
```

## ⚙️ Configuración

### Configuración por Defecto
```javascript
{
  analysis: {
    minDescriptionLength: 100,
    optimalDescriptionLength: 300,
    seoScoreThreshold: 70
  },
  generation: {
    temperature: 0.7,
    maxTokens: 2000,
    creativityLevel: 'balanced'
  },
  pricing: {
    considerMarketRates: true,
    includeValueAnalysis: true
  }
}
```

### Personalizar Configuración
```javascript
servicesAgent.updateConfig({
  generation: {
    temperature: 0.9,
    creativityLevel: 'high'
  }
});
```

## 📊 Métricas

### Obtener Métricas del Agente
```javascript
const metrics = servicesAgent.getMetrics();
// {
//   totalTasks: 150,
//   successfulTasks: 142,
//   failedTasks: 8,
//   averageResponseTime: 2340,
//   successRate: 94.67
// }
```

### Métricas por Handler
```javascript
const chatMetrics = servicesAgent.chatHandler.getMetrics();
const analyzerMetrics = servicesAgent.analyzer.getMetrics();
```

## 🧪 Testing

### Ejecutar Tests
```bash
# Test general
node scripts/testServicesAgent.js

# Test específico de handler
node scripts/testServicesChatHandler.js
node scripts/testServicesAnalyzer.js
```

### Ejemplo de Test
```javascript
import ServicesAgent from './agents/specialized/services/ServicesAgent.js';

const agent = new ServicesAgent();
await agent.activate();

// Test chat
const chatResult = await agent.chat('¿Qué servicios recomiendas?', 'test-session');
console.assert(chatResult.success, 'Chat should succeed');

// Test analyze
const analyzeResult = await agent.analyzeService('service-123');
console.assert(analyzeResult.success, 'Analysis should succeed');
```

## 📚 Documentación Adicional

- [Plan de Implementación](./PLAN_IMPLEMENTACION.md)
- [Checklist de Desarrollo](./CHECKLIST.md)
- [Template de Handler](./TEMPLATE_HANDLER.js)
- [Documentación API](../../../docs/API_SERVICES_AGENT.md) (próximamente)
- [Guía Frontend](../../../docs/FRONTEND_INTEGRATION_SERVICES_AGENT.md) (próximamente)

## 🛠️ Desarrollo

### Estructura de un Handler
Todos los handlers siguen el [template estándar](./TEMPLATE_HANDLER.js):

```javascript
class HandlerName {
  constructor(config) { }
  async mainMethod(params) { }
  validateInput(params) { }
  async processWithAI(data, params) { }
  getMetrics() { }
}
```

### Agregar Nueva Funcionalidad
1. Crear nuevo handler en `handlers/`
2. Seguir el template estándar
3. Mantener < 450 líneas
4. Agregar a ServicesAgent.js
5. Actualizar capacidades
6. Crear tests
7. Documentar

## 🚨 Troubleshooting

### Error: "OpenAI service not available"
```javascript
// Verificar API key
if (!openaiService.isAvailable()) {
  console.error('OpenAI API key not configured');
}
```

### Performance lento
```javascript
// Habilitar caché
agent.updateConfig({ cacheEnabled: true });

// Reducir tokens
agent.updateConfig({ 
  generation: { maxTokens: 1000 } 
});
```

### Cache no funciona
```javascript
// Limpiar caché
agent.chatHandler.clearCache();
agent.analyzer.clearCache();
```

## 📈 Roadmap

### v1.0.0 (Actual)
- [x] Estructura base modular
- [ ] Implementación de handlers core
- [ ] Integración con backend
- [ ] Testing completo
- [ ] Documentación

### v1.1.0 (Futuro)
- [ ] Análisis de tendencias de mercado
- [ ] Recomendaciones basadas en ML
- [ ] Integración con analytics
- [ ] A/B testing automatizado
- [ ] Predicción de demanda

### v2.0.0 (Visión)
- [ ] Aprendizaje automático de patrones
- [ ] Optimización automática continua
- [ ] Integración con CRM
- [ ] Dashboard de insights
- [ ] API pública

## 👥 Contribuir

Al contribuir a ServicesAgent, por favor:
1. Seguir la arquitectura modular
2. Mantener archivos < 450 líneas
3. Documentar métodos públicos
4. Agregar tests para nuevas funcionalidades
5. Actualizar documentación

## 📝 Changelog

### [Unreleased]
- Estructura base creada
- Plan de implementación definido
- Templates y documentación inicial

---

**Estado:** 🚧 EN DESARROLLO  
**Versión:** 0.1.0  
**Última actualización:** 7 de Noviembre, 2025
