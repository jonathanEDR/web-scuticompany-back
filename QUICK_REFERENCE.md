# 🚀 QUICK REFERENCE - Sistema de Agentes AI

## ⚡ Cheat Sheet de Endpoints

### Análisis de Blog
```bash
# Análisis completo
POST /api/agents/analyze-blog
Content-Type: application/json
{
  "postId": "ID_DEL_POST",
  "analysisType": "complete",
  "userId": "user123",
  "preferences": {
    "detailLevel": "standard",
    "includeMetrics": true,
    "includeExamples": true
  }
}

# Respuesta
200 OK
{
  "success": true,
  "analysis": {
    "overall_score": 8.5,
    "seo": { "score": 9.2, ... },
    "content": { "score": 8.1, ... },
    "performance": { "word_count": 1247, ... }
  },
  "recommendations": [...]
}
```

### Análisis Rápido
```bash
POST /api/agents/quick-analyze
{
  "content": "Tu contenido aquí...",
  "title": "Título del post",
  "category": "Technology",
  "analysisType": "quick"
}
```

### Generar Tags
```bash
POST /api/agents/generate-tags
{
  "postId": "ID_DEL_POST",
  "maxTags": 10,
  "includeKeywords": true,
  "language": "es"
}
```

### Optimizar SEO
```bash
POST /api/agents/optimize-seo
{
  "postId": "ID_DEL_POST",
  "targetKeywords": ["AI", "tecnología"],
  "competitorAnalysis": true,
  "generateMetaDescription": true
}
```

### Health Check
```bash
GET /api/agents/health
GET /api/agents/testing/health-advanced
GET /api/agents/testing/system-metrics
```

---

## 🎣 Hooks - Uso Rápido

### useAgentAnalysis
```javascript
import { useAgentAnalysis } from '@/hooks/useAgentAnalysis';

// En componente
const { loading, analysis, error, analyzePost } = useAgentAnalysis();

// Usar
await analyzePost(postId, {
  type: 'complete',
  detailLevel: 'standard'
});

// Acceder resultado
console.log(analysis.analysis.overall_score); // 8.5
console.log(analysis.recommendations); // Array de recomendaciones
```

### useTagGeneration
```javascript
import { useTagGeneration } from '@/hooks/useTagGeneration';

const { loading, tags, keywords, generateTags } = useTagGeneration();

await generateTags(postId, { maxTags: 10 });

// Usar
tags.forEach(tag => console.log(tag.name)); // "AI", "Machine Learning", ...
```

### useOptimizationSEO
```javascript
import { useOptimizationSEO } from '@/hooks/useOptimizationSEO';

const { loading, optimization, optimizeSEO } = useOptimizationSEO();

await optimizeSEO(postId, { keywords: ['AI'] });
```

---

## 🎨 Componentes - Copy & Paste

### Componente Mínimo
```javascript
import BlogAnalysisPanel from '@/components/AI/BlogAnalysisPanel';

export default function MyPage({ postId }) {
  return <BlogAnalysisPanel postId={postId} />;
}
```

### Con Estados
```javascript
import ScoreCard from '@/components/AI/ScoreCard';

<div className="grid grid-cols-4 gap-4">
  <ScoreCard title="Score" score={8.5} icon="🎯" />
  <ScoreCard title="SEO" score={9.2} icon="🔍" />
  <ScoreCard title="Contenido" score={8.1} icon="📝" />
  <ScoreCard title="Performance" score={9} icon="⚡" />
</div>
```

### Recomendaciones
```javascript
import RecommendationCard from '@/components/AI/RecommendationCard';

{recommendations.map((rec, i) => (
  <RecommendationCard 
    key={i} 
    recommendation={rec}
    onImplement={(r) => console.log('Implementar:', r)}
  />
))}
```

---

## 📊 Estructura de Datos

### Objeto de Análisis Completo
```javascript
{
  success: true,
  analysis: {
    overall_score: 8.5,      // 0-10
    seo: {
      score: 9.2,            // 0-10
      keywords: [{
        keyword: 'AI',
        density: 2.1,
        recommendation: 'Bien optimizado'
      }],
      meta_optimization: {
        title_length: 62,
        title_recommendation: 'Óptimo',
        meta_description: '...',
        meta_recommendation: 'Aumentar a 155 caracteres'
      }
    },
    content: {
      score: 8.1,
      readability: {
        flesch_kincaid_grade: 8.5,
        recommendation: 'Excelente'
      },
      structure: {
        heading_count: 5,
        paragraph_avg_length: 145,
        list_count: 3
      },
      engagement: {
        call_to_actions: 2,
        internal_links: 4,
        external_links: 3
      }
    },
    performance: {
      estimated_reading_time: 5,    // minutos
      word_count: 1247,
      paragraph_count: 12,
      image_count: 3
    }
  },
  recommendations: [{
    priority: 'high',              // 'high', 'medium', 'low'
    category: 'seo',               // 'seo', 'content', 'performance'
    title: 'Optimizar meta descripción',
    description: '...',
    impact: 'Puede mejorar CTR en 15-25%',
    effort: 'low',                 // 'low', 'medium', 'high'
    implementation: 'Campo a editar: meta_description'
  }],
  agent_metadata: {
    agent: 'BlogAgent',
    processing_time: 1247,         // ms
    intelligence_applied: true,
    personalization_level: 'high',
    tokens_used: 1524
  }
}
```

### Objeto de Preferencias de Usuario
```javascript
{
  userId: 'user123',
  communication: {
    preferred_tone: 'professional',        // 'formal', 'casual', 'technical'
    detail_level: 'standard',              // 'brief', 'standard', 'detailed'
    response_style: 'explanatory',         // 'direct', 'explanatory', 'step_by_step'
    language_complexity: 'standard'        // 'simple', 'standard', 'technical'
  },
  task_preferences: {
    preferred_analysis_depth: 'standard',  // 'quick', 'standard', 'thorough'
    include_examples: true,
    include_metrics: true,
    include_next_steps: true,
    prioritize_quick_wins: false
  },
  expertise: {
    skill_level: 'intermediate'            // 'beginner', 'intermediate', 'advanced'
  }
}
```

---

## 🔧 Configuración

### Variables de Entorno (Frontend)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_API_TIMEOUT=30000
REACT_APP_ENABLE_AI=true
```

### Variables de Entorno (Backend)
```env
OPENAI_API_KEY=sk-...
MONGODB_URI=mongodb://localhost:27017/web-scuti
AI_AGENT_CACHE_TTL=1800000
LOG_LEVEL=info
```

---

## 🎯 Casos de Uso Comunes

### 1. Analizar al guardar
```javascript
const handleSave = async (post) => {
  // Guardar primero
  await savePost(post);
  
  // Luego analizar
  const analysis = await analyzePost(post.id);
  
  // Mostrar resultados
  showAnalysisResults(analysis);
};
```

### 2. Sugerencias mientras escribes
```javascript
const [content, setContent] = useState('');
const { analysis, quickAnalyze } = useAgentAnalysis();

const handleContentChange = async (newContent) => {
  setContent(newContent);
  
  // Debounce: esperar 2 segundos sin cambios
  debounce(() => {
    quickAnalyze(newContent, title, category);
  }, 2000);
};
```

### 3. Batch análisis
```javascript
const analyzeMultiple = async (postIds) => {
  const results = {};
  
  for (const id of postIds) {
    results[id] = await analyzePost(id);
    // Esperar entre requests
    await new Promise(r => setTimeout(r, 1000));
  }
  
  return results;
};
```

### 4. Actualizar basado en recomendaciones
```javascript
const implementRecommendation = (rec) => {
  switch (rec.category) {
    case 'seo':
      // Actualizar meta_description, title, etc.
      updatePost({
        meta_description: rec.suggestedValue,
        title: rec.suggestedTitle
      });
      break;
    
    case 'content':
      // Sugerir cambios en contenido
      showContentSuggestions(rec);
      break;
  }
};
```

---

## ⚠️ Errores Comunes

### "Rate limit exceeded"
```javascript
// ❌ MALO: Muchas solicitudes rápidas
posts.forEach(p => analyzePost(p.id)); // Simultáneamente

// ✅ BUENO: Con delay
for (const p of posts) {
  await analyzePost(p.id);
  await delay(1000);
}
```

### "Post not found"
```javascript
// Verificar
const post = await fetch(`/api/blog/posts/${postId}`);
if (!post.ok) console.error('Post no existe');

// Usar ID correcto
console.log('Post ID:', postId); // Debugging
```

### "Timeout"
```javascript
// ❌ Largo timeout
analyzePost(postId, { type: 'comprehensive' })

// ✅ Usar quick-analyze
quickAnalyze(content, title, category)
```

---

## 🚨 Status Codes

| Código | Significado | Acción |
|--------|------------|--------|
| 200 | Éxito | Procesar resultado |
| 400 | Datos inválidos | Verificar parámetros |
| 404 | Post no encontrado | Verificar postId |
| 429 | Rate limit | Esperar y reintentar |
| 500 | Error servidor | Contactar soporte |

---

## 📱 Mobile Responsive

### Breakpoints
```javascript
// Usar Tailwind classes
<div className="
  grid-cols-1        // Mobile: 1 columna
  md:grid-cols-2     // Tablet: 2 columnas
  lg:grid-cols-4     // Desktop: 4 columnas
">
```

### Para Análisis
```javascript
<div className="
  flex flex-col       // Mobile: stack vertical
  md:flex-row         // Desktop: lado a lado
  gap-4
">
  <div className="w-full md:w-2/3">Editor</div>
  <div className="w-full md:w-1/3">Análisis</div>
</div>
```

---

## 🔐 Seguridad

### Token en LocalStorage
```javascript
// Guardar
localStorage.setItem('authToken', token);

// Recuperar automáticamente (en apiClient)
const token = localStorage.getItem('authToken');
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

### Rate Limiting
```javascript
// Frontend: implementar backoff exponencial
const retryWithBackoff = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (e.status === 429 && i < retries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw e;
      }
    }
  }
};
```

---

## 📈 Performance

### Caché de resultados
```javascript
const cache = new Map();

const analyzePostCached = async (postId) => {
  if (cache.has(postId)) {
    return cache.get(postId);
  }
  
  const result = await analyzePost(postId);
  cache.set(postId, result);
  return result;
};
```

### Lazy loading
```javascript
// Usar React.lazy()
const BlogAnalysisPanel = React.lazy(() => 
  import('@/components/AI/BlogAnalysisPanel')
);

// En componente
<Suspense fallback={<Loading />}>
  <BlogAnalysisPanel postId={postId} />
</Suspense>
```

---

## 🆘 Debugging

### Console logs útiles
```javascript
// En useAgentAnalysis
console.log('Loading:', loading);
console.log('Progress:', progress);
console.log('Analysis:', analysis);
console.log('Error:', error);

// En componente
console.log('Post ID:', postId);
console.log('Analysis scores:', {
  overall: analysis.analysis.overall_score,
  seo: analysis.analysis.seo.score,
  content: analysis.analysis.content.score
});
```

### Network DevTools
```
1. Abre DevTools (F12)
2. Ve a Network tab
3. Realiza una solicitud de análisis
4. Verifica:
   - Status 200
   - Response contiene "success": true
   - Tiempo de respuesta
   - Tamaño de payload
```

---

## 🎓 Recursos

- [Documentación Completa](./ADVANCED_AI_AGENTS_GUIDE.md)
- [Guía Frontend Completa](./FRONTEND_INTEGRATION_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [GitHub Repo](https://github.com/jonathanEDR/web-scuticompany-back)

---

**Última actualización**: 5 de Noviembre, 2025
**Versión**: 2.0.0
**Estado**: Production Ready ✅