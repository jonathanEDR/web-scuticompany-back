# 🎨 GUÍA DE INTEGRACIÓN FRONTEND - Sistema AI de Agentes

## 📑 Tabla de Contenidos

1. [Inicio Rápido](#inicio-rápido)
2. [Instalación y Setup](#instalación-y-setup)
3. [Hooks Personalizados](#hooks-personalizados)
4. [Componentes React](#componentes-react)
5. [Patrones de Uso](#patrones-de-uso)
6. [Ejemplos Completos](#ejemplos-completos)
7. [Styling y UI](#styling-y-ui)
8. [Testing](#testing)

---

## 🚀 Inicio Rápido

### En 5 minutos

```javascript
// 1. Importar hook
import { useAgentAnalysis } from '@/hooks/useAgentAnalysis';

// 2. En tu componente
const MyComponent = ({ postId }) => {
  const { loading, analysis, analyzePost } = useAgentAnalysis();

  return (
    <div>
      <button onClick={() => analyzePost(postId)}>
        {loading ? 'Analizando...' : 'Analizar con AI'}
      </button>
      
      {analysis && (
        <div>
          Score: {analysis.analysis.overall_score}/10
        </div>
      )}
    </div>
  );
};
```

**¡Listo!** Ya tienes análisis AI en tu app. ✨

---

## 📦 Instalación y Setup

### 1. Crear la carpeta de hooks

```bash
# En tu proyecto frontend
mkdir -p src/hooks
mkdir -p src/components/AI
mkdir -p src/contexts
mkdir -p src/utils/ai
```

### 2. Copiar archivos base

**Copiar todos los hooks a `src/hooks/`**:
- `useAgentAnalysis.js`
- `useTagGeneration.js`
- `useOptimization.js`

### 3. Configurar variables de entorno

**.env.local**:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_API_TIMEOUT=30000
```

### 4. Crear cliente API

**`src/utils/ai/apiClient.js`**:

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      error.message = 'Análisis tardó demasiado - intenta de nuevo';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 🎣 Hooks Personalizados

### Hook Principal: useAgentAnalysis

**`src/hooks/useAgentAnalysis.js`**:

```javascript
import { useState, useCallback, useRef } from 'react';
import apiClient from '@/utils/ai/apiClient';

/**
 * Hook para análisis de blog con IA
 * 
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - { loading, analysis, error, analyzePost, quickAnalyze, cancel }
 * 
 * @example
 * const { loading, analysis, analyzePost } = useAgentAnalysis();
 * 
 * const handleAnalyze = () => {
 *   analyzePost('postId123', {
 *     type: 'complete',
 *     detailLevel: 'standard'
 *   });
 * };
 */
export const useAgentAnalysis = (options = {}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  
  const cancelTokenRef = useRef(null);
  const requestRef = useRef(null);

  const analyzePost = useCallback(async (postId, opts = {}) => {
    // Cancelar request anterior si existe
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Nueva solicitud iniciada');
    }

    cancelTokenRef.current = axios.CancelToken.source();
    setLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      setProgress(20);

      requestRef.current = apiClient.post('/agents/analyze-blog', {
        postId,
        analysisType: opts.type || 'complete',
        userId: opts.userId,
        preferences: {
          detailLevel: opts.detailLevel || 'standard',
          includeMetrics: opts.includeMetrics !== false,
          includeExamples: opts.includeExamples !== false,
          focusAreas: opts.focusAreas || ['seo', 'content', 'performance']
        }
      }, {
        cancelToken: cancelTokenRef.current.token,
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setProgress(Math.min(percentCompleted, 90));
        }
      });

      setProgress(50);
      const { data } = await requestRef.current;

      if (data.success) {
        setAnalysis(data);
        setProgress(100);
        return data;
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('Request cancelled');
      } else {
        const errorMsg = err.response?.data?.error || err.message || 'Error desconocido';
        setError(errorMsg);
        console.error('Analysis error:', err);
      }
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }, []);

  const quickAnalyze = useCallback(async (content, title, category) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data } = await apiClient.post('/agents/quick-analyze', {
        content,
        title,
        category,
        analysisType: 'quick'
      });

      if (data.success) {
        setAnalysis(data);
        return data;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancel = useCallback(() => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Análisis cancelado por usuario');
      setLoading(false);
    }
  }, []);

  return {
    loading,
    analysis,
    error,
    progress,
    analyzePost,
    quickAnalyze,
    cancel
  };
};
```

---

### Hook: useTagGeneration

**`src/hooks/useTagGeneration.js`**:

```javascript
import { useState, useCallback } from 'react';
import apiClient from '@/utils/ai/apiClient';

/**
 * Hook para generar tags inteligentes
 */
export const useTagGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [error, setError] = useState(null);

  const generateTags = useCallback(async (postId, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data } = await apiClient.post('/agents/generate-tags', {
        postId,
        maxTags: options.maxTags || 10,
        includeKeywords: true,
        language: options.language || 'es'
      });

      if (data.success) {
        setTags(data.tags || []);
        setKeywords(data.keywords || []);
        return data;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, tags, keywords, error, generateTags };
};
```

---

### Hook: useOptimizationSEO

**`src/hooks/useOptimizationSEO.js`**:

```javascript
import { useState, useCallback } from 'react';
import apiClient from '@/utils/ai/apiClient';

/**
 * Hook para optimización SEO avanzada
 */
export const useOptimizationSEO = () => {
  const [loading, setLoading] = useState(false);
  const [optimization, setOptimization] = useState(null);
  const [error, setError] = useState(null);

  const optimizeSEO = useCallback(async (postId, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data } = await apiClient.post('/agents/optimize-seo', {
        postId,
        targetKeywords: options.keywords || [],
        competitorAnalysis: options.competitive !== false,
        generateMetaDescription: true
      });

      if (data.success) {
        setOptimization(data);
        return data;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, optimization, error, optimizeSEO };
};
```

---

## ⚛️ Componentes React

### 1. ScoreCard - Tarjeta de Score

**`src/components/AI/ScoreCard.jsx`**:

```javascript
import React from 'react';

const ScoreCard = ({ title, score, max = 10, icon = '📊', variant = 'default' }) => {
  const percentage = (score / max) * 100;
  
  const getColor = () => {
    if (score >= max * 0.8) return '#10b981'; // green
    if (score >= max * 0.6) return '#f59e0b'; // amber
    if (score >= max * 0.4) return '#ef4444'; // red
    return '#8b5cf6'; // purple
  };

  const getBackgroundColor = () => {
    if (score >= max * 0.8) return '#ecfdf5';
    if (score >= max * 0.6) return '#fffbeb';
    if (score >= max * 0.4) return '#fef2f2';
    return '#f3e8ff';
  };

  return (
    <div 
      className="p-4 rounded-lg transition-all hover:shadow-lg"
      style={{ backgroundColor: getBackgroundColor() }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{title}</span>
        <span className="text-lg">{icon}</span>
      </div>
      
      <div className="mb-2">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${percentage}%`,
              backgroundColor: getColor()
            }}
          />
        </div>
      </div>
      
      <div className="text-2xl font-bold" style={{ color: getColor() }}>
        {score}/{max}
      </div>
    </div>
  );
};

export default ScoreCard;
```

---

### 2. RecommendationCard - Tarjeta de Recomendación

**`src/components/AI/RecommendationCard.jsx`**:

```javascript
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const RecommendationCard = ({ recommendation, onImplement }) => {
  const [expanded, setExpanded] = useState(false);

  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-green-100 text-green-800 border-green-300'
  };

  const effortColors = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-red-600'
  };

  return (
    <div className={`border-l-4 p-4 rounded-r-lg mb-3 cursor-pointer transition-all ${
      priorityColors[recommendation.priority] || priorityColors.medium
    }`}
    onClick={() => setExpanded(!expanded)}>
      
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-sm">
              {recommendation.title}
            </h4>
            <span className={`text-xs font-semibold px-2 py-1 rounded ${
              priorityColors[recommendation.priority]
            }`}>
              {recommendation.priority.toUpperCase()}
            </span>
          </div>
          
          {expanded && (
            <p className="text-sm mt-2 text-gray-700">
              {recommendation.description}
            </p>
          )}
        </div>
        
        <button className="text-gray-500 hover:text-gray-700">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Impacto:</span>
            <span className="font-semibold text-blue-600">{recommendation.impact}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Esfuerzo:</span>
            <span className={`font-semibold ${effortColors[recommendation.effort]}`}>
              {recommendation.effort.toUpperCase()}
            </span>
          </div>

          {recommendation.implementation && (
            <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
              <strong>Implementación:</strong>
              <p className="mt-1 text-gray-600">{recommendation.implementation}</p>
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onImplement?.(recommendation);
            }}
            className="w-full mt-3 bg-blue-600 text-white py-2 rounded text-xs font-semibold hover:bg-blue-700"
          >
            → Implementar
          </button>
        </div>
      )}
    </div>
  );
};

export default RecommendationCard;
```

---

### 3. BlogAnalysisPanel - Panel Completo de Análisis

**`src/components/AI/BlogAnalysisPanel.jsx`**:

```javascript
import React, { useState, useEffect } from 'react';
import { useAgentAnalysis } from '@/hooks/useAgentAnalysis';
import ScoreCard from './ScoreCard';
import RecommendationCard from './RecommendationCard';

const BlogAnalysisPanel = ({ postId, onAnalysisComplete }) => {
  const { loading, analysis, error, progress, analyzePost, cancel } = useAgentAnalysis();
  const [analysisType, setAnalysisType] = useState('complete');
  const [detailLevel, setDetailLevel] = useState('standard');

  const handleAnalyze = () => {
    analyzePost(postId, {
      type: analysisType,
      detailLevel: detailLevel
    }).then((result) => {
      onAnalysisComplete?.(result);
    });
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-semibold text-red-900 mb-2">❌ Error en el Análisis</h3>
        <p className="text-red-700 text-sm">{error}</p>
        <button
          onClick={handleAnalyze}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-blue-50 rounded-lg p-6">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-blue-900 font-medium">🤖 Analizando contenido...</span>
        </div>
        
        <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="text-center mt-2 text-sm text-blue-700">
          {progress}% completado
        </div>
        
        <button
          onClick={cancel}
          className="w-full mt-4 bg-red-500 text-white py-2 rounded text-sm hover:bg-red-600"
        >
          Cancelar
        </button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">🤖 Análisis AI Inteligente</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Análisis
            </label>
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="complete">Análisis Completo</option>
              <option value="seo">Solo SEO</option>
              <option value="content">Solo Contenido</option>
              <option value="performance">Solo Performance</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nivel de Detalle
            </label>
            <select
              value={detailLevel}
              onChange={(e) => setDetailLevel(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="brief">Breve</option>
              <option value="standard">Estándar</option>
              <option value="detailed">Detallado</option>
              <option value="comprehensive">Exhaustivo</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={handleAnalyze}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          🚀 Iniciar Análisis
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ScoreCard
          title="Score General"
          score={analysis.analysis.overall_score}
          icon="🎯"
        />
        <ScoreCard
          title="SEO"
          score={analysis.analysis.seo.score}
          icon="🔍"
        />
        <ScoreCard
          title="Contenido"
          score={analysis.analysis.content.score}
          icon="📝"
        />
        <ScoreCard
          title="Performance"
          score={analysis.analysis.performance.estimated_reading_time <= 5 ? 9 : 6}
          icon="⚡"
        />
      </div>

      {/* Recomendaciones */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">
          💡 Recomendaciones ({analysis.recommendations.length})
        </h3>
        <div className="space-y-2">
          {analysis.recommendations.map((rec, i) => (
            <RecommendationCard key={i} recommendation={rec} />
          ))}
        </div>
      </div>

      {/* Botón para re-analizar */}
      <button
        onClick={handleAnalyze}
        className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
      >
        🔄 Re-analizar
      </button>
    </div>
  );
};

export default BlogAnalysisPanel;
```

---

## 🎯 Patrones de Uso

### Patrón 1: Análisis en Editor

```javascript
// En tu componente de editor de blog
const BlogEditor = ({ post }) => {
  const [content, setContent] = useState(post.content);

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      
      <div>
        <BlogAnalysisPanel postId={post.id} />
      </div>
    </div>
  );
};
```

---

### Patrón 2: Análisis con Tab

```javascript
const PostDetailView = ({ post }) => {
  const [tab, setTab] = useState('content');

  return (
    <div>
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setTab('content')}
          className={tab === 'content' ? 'border-b-2 border-blue-600' : ''}
        >
          Contenido
        </button>
        <button
          onClick={() => setTab('analysis')}
          className={tab === 'analysis' ? 'border-b-2 border-blue-600' : ''}
        >
          🤖 Análisis AI
        </button>
      </div>

      {tab === 'content' && <PostContent post={post} />}
      {tab === 'analysis' && <BlogAnalysisPanel postId={post.id} />}
    </div>
  );
};
```

---

### Patrón 3: Análisis en Batch

```javascript
const BlogDashboard = ({ posts }) => {
  const { loading, analysis, analyzePost } = useAgentAnalysis();
  const [results, setResults] = useState({});

  const analyzeAll = async () => {
    for (const post of posts) {
      const result = await analyzePost(post.id);
      setResults(prev => ({
        ...prev,
        [post.id]: result
      }));
      // Esperar entre análisis para no saturar
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  return (
    <div>
      <button onClick={analyzeAll} disabled={loading}>
        Analizar Todo
      </button>
      
      {posts.map(post => (
        <div key={post.id}>
          <h3>{post.title}</h3>
          {results[post.id]?.analysis && (
            <div>
              Score: {results[post.id].analysis.overall_score}/10
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
```

---

## 💻 Ejemplos Completos

### Ejemplo 1: Página de Editor Completo

**`pages/blog/editor.jsx`**:

```javascript
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAgentAnalysis } from '@/hooks/useAgentAnalysis';
import { useTagGeneration } from '@/hooks/useTagGeneration';
import BlogAnalysisPanel from '@/components/AI/BlogAnalysisPanel';
import TagInput from '@/components/common/TagInput';

export default function BlogEditor() {
  const router = useRouter();
  const { id: postId } = router.query;
  
  const [post, setPost] = useState({ title: '', content: '', tags: [] });
  const { generateTags, tags, loading: generatingTags } = useTagGeneration();

  const handleGenerateTags = async () => {
    await generateTags(postId, { maxTags: 10 });
  };

  const handleSave = async () => {
    // Guardar post
    await fetch(`/api/blog/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    });
  };

  return (
    <div className="grid grid-cols-3 gap-6 p-6">
      {/* Editor Principal */}
      <div className="col-span-2 space-y-4">
        <input
          type="text"
          placeholder="Título del post"
          value={post.title}
          onChange={(e) => setPost(prev => ({ ...prev, title: e.target.value }))}
          className="w-full text-2xl font-bold border-b-2 pb-2 focus:outline-none focus:border-blue-600"
        />
        
        <textarea
          placeholder="Escribe tu contenido..."
          value={post.content}
          onChange={(e) => setPost(prev => ({ ...prev, content: e.target.value }))}
          className="w-full h-96 border rounded-lg p-4 font-mono"
        />
        
        <div className="flex justify-between">
          <button
            onClick={handleGenerateTags}
            disabled={generatingTags}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {generatingTags ? '⏳ Generando...' : '🏷️ Generar Tags'}
          </button>
          
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            💾 Guardar
          </button>
        </div>

        {tags.length > 0 && (
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-bold mb-2">Etiquetas sugeridas:</h3>
            <TagInput tags={tags} />
          </div>
        )}
      </div>

      {/* Panel AI */}
      <div>
        <BlogAnalysisPanel postId={postId} />
      </div>
    </div>
  );
}
```

---

### Ejemplo 2: Dashboard con Análisis

**`pages/blog/dashboard.jsx`**:

```javascript
import React, { useState, useEffect } from 'react';
import BlogAnalysisPanel from '@/components/AI/BlogAnalysisPanel';

export default function BlogDashboard() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    // Obtener posts
    fetch('/api/blog/posts')
      .then(res => res.json())
      .then(data => setPosts(data.posts));
  }, []);

  return (
    <div className="grid grid-cols-4 gap-6 p-6">
      {/* Lista de Posts */}
      <div className="col-span-1 border-r">
        <h2 className="font-bold mb-4">Tus Posts</h2>
        <div className="space-y-2">
          {posts.map(post => (
            <button
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className={`w-full text-left p-3 rounded ${
                selectedPost?.id === post.id
                  ? 'bg-blue-100 border-l-4 border-blue-600'
                  : 'hover:bg-gray-100'
              }`}
            >
              <h3 className="font-semibold text-sm">{post.title}</h3>
              <p className="text-xs text-gray-600 mt-1">
                {post.status} • {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Panel de Análisis */}
      <div className="col-span-3">
        {selectedPost ? (
          <BlogAnalysisPanel postId={selectedPost.id} />
        ) : (
          <div className="text-center text-gray-500 py-12">
            Selecciona un post para analizar
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 🎨 Styling y UI

### Tailwind Setup

**`tailwind.config.js`**:

```javascript
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'ai-blue': '#0066ff',
        'ai-purple': '#7c3aed',
      },
      animation: {
        'pulse-ai': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    }
  },
  plugins: []
};
```

---

## 🧪 Testing

### Test básico de hook

**`__tests__/hooks/useAgentAnalysis.test.js`**:

```javascript
import { renderHook, act } from '@testing-library/react-hooks';
import { useAgentAnalysis } from '@/hooks/useAgentAnalysis';
import * as apiClient from '@/utils/ai/apiClient';

jest.mock('@/utils/ai/apiClient');

describe('useAgentAnalysis', () => {
  it('should analyze post successfully', async () => {
    const mockResponse = {
      success: true,
      analysis: { overall_score: 8.5 }
    };

    apiClient.post.mockResolvedValue({ data: mockResponse });

    const { result } = renderHook(() => useAgentAnalysis());

    await act(async () => {
      await result.current.analyzePost('postId123');
    });

    expect(result.current.analysis).toEqual(mockResponse);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors', async () => {
    const error = new Error('API Error');
    apiClient.post.mockRejectedValue(error);

    const { result } = renderHook(() => useAgentAnalysis());

    await act(async () => {
      try {
        await result.current.analyzePost('postId123');
      } catch (e) {
        // Error esperado
      }
    });

    expect(result.current.error).toBeDefined();
  });
});
```

---

**¡Tu integración frontend está lista!** 🎉

Puedes empezar a usar los componentes y hooks inmediatamente en tu aplicación React/Next.js.