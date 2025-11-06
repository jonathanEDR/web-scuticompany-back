# 💻 EJEMPLOS PRÁCTICOS - Sistema de Agentes AI

## 📚 Índice de Ejemplos

1. [Integración Básica](#1-integración-básica)
2. [Editor de Blog Completo](#2-editor-de-blog-completo)
3. [Dashboard de Analytics](#3-dashboard-de-analytics)
4. [Sistema de Recomendaciones](#4-sistema-de-recomendaciones)
5. [Análisis Batch](#5-análisis-batch)
6. [Custom Hooks](#6-custom-hooks)
7. [Context API Integration](#7-context-api-integration)

---

## 1. Integración Básica

### Ejemplo más simple posible

**`pages/blog/simple.jsx`**:

```javascript
import React from 'react';
import { useAgentAnalysis } from '@/hooks/useAgentAnalysis';

export default function SimpleBlogAnalysis({ postId = '123' }) {
  const { loading, analysis, error, analyzePost } = useAgentAnalysis();

  return (
    <div style={{ padding: '20px' }}>
      <h1>🤖 Análisis Simple</h1>

      <button 
        onClick={() => analyzePost(postId)}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#0066ff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {loading ? '⏳ Analizando...' : '🚀 Analizar'}
      </button>

      {error && <div style={{ color: 'red', marginTop: '10px' }}>Error: {error}</div>}

      {analysis && (
        <div style={{ marginTop: '20px', backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '8px' }}>
          <h2>Resultados</h2>
          <p>Score General: <strong>{analysis.analysis.overall_score}/10</strong></p>
          <p>Recomendaciones: <strong>{analysis.recommendations.length}</strong></p>
        </div>
      )}
    </div>
  );
}
```

---

## 2. Editor de Blog Completo

### Editor profesional con análisis en tiempo real

**`pages/blog/editor-completo.jsx`**:

```javascript
import React, { useState, useCallback, useRef } from 'react';
import { useAgentAnalysis } from '@/hooks/useAgentAnalysis';
import { useTagGeneration } from '@/hooks/useTagGeneration';
import BlogAnalysisPanel from '@/components/AI/BlogAnalysisPanel';

export default function CompleteEditor() {
  const [post, setPost] = useState({
    id: 'new',
    title: '',
    content: '',
    category: 'Technology',
    tags: [],
    slug: ''
  });

  const [activeTab, setActiveTab] = useState('editor');
  const { loading: analyzing, analysis, analyzePost } = useAgentAnalysis();
  const { loading: generating, tags, generateTags } = useTagGeneration();
  const autoAnalyzeRef = useRef(null);

  // Auto-analizar después de 3 segundos de inactividad
  const handleContentChange = useCallback((newContent) => {
    setPost(prev => ({ ...prev, content: newContent }));

    // Limpiar timeout anterior
    if (autoAnalyzeRef.current) {
      clearTimeout(autoAnalyzeRef.current);
    }

    // Nuevo timeout
    autoAnalyzeRef.current = setTimeout(() => {
      if (post.id !== 'new') {
        analyzePost(post.id, { type: 'quick' });
      }
    }, 3000);
  }, [post.id]);

  const handleGenerateTags = async () => {
    if (post.id === 'new') {
      alert('Guarda el post primero');
      return;
    }
    
    const result = await generateTags(post.id);
    
    // Agregar tags sugeridos
    setPost(prev => ({
      ...prev,
      tags: [...new Set([...prev.tags, ...result.tags.map(t => t.name)])]
    }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/blog/posts', {
        method: post.id === 'new' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post)
      });

      if (response.ok) {
        const saved = await response.json();
        setPost(prev => ({ ...prev, id: saved.id }));
        alert('✅ Post guardado');
        
        // Auto-analizar después de guardar
        setTimeout(() => analyzePost(saved.id), 500);
      }
    } catch (error) {
      alert('❌ Error al guardar: ' + error.message);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', padding: '20px' }}>
      {/* Panel Principal */}
      <div className="editor-panel">
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Título del post"
            value={post.title}
            onChange={(e) => setPost(prev => ({ ...prev, title: e.target.value }))}
            style={{
              width: '100%',
              fontSize: '24px',
              fontWeight: 'bold',
              border: 'none',
              borderBottom: '2px solid #ddd',
              padding: '10px 0',
              marginBottom: '10px'
            }}
          />

          <input
            type="text"
            placeholder="Slug (URL amigable)"
            value={post.slug}
            onChange={(e) => setPost(prev => ({ ...prev, slug: e.target.value }))}
            style={{
              width: '100%',
              border: '1px solid #ddd',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          />
        </div>

        <textarea
          placeholder="Escribe tu contenido aquí..."
          value={post.content}
          onChange={(e) => handleContentChange(e.target.value)}
          style={{
            width: '100%',
            height: '400px',
            border: '1px solid #ddd',
            padding: '15px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '14px',
            resize: 'vertical'
          }}
        />

        {/* Botones de Acción */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#0066ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            💾 Guardar
          </button>

          <button
            onClick={handleGenerateTags}
            disabled={generating || post.id === 'new'}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#00cc00',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: generating || post.id === 'new' ? 0.5 : 1
            }}
          >
            {generating ? '⏳ Generando...' : '🏷️ Generar Tags'}
          </button>

          <button
            onClick={() => analyzePost(post.id)}
            disabled={analyzing || post.id === 'new'}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#ff6600',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: analyzing || post.id === 'new' ? 0.5 : 1
            }}
          >
            {analyzing ? '⏳ Analizando...' : '🔍 Analizar'}
          </button>
        </div>

        {/* Tags sugeridos */}
        {tags.length > 0 && (
          <div style={{ marginTop: '15px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '4px' }}>
            <strong>🏷️ Etiquetas Sugeridas:</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              {tags.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    backgroundColor: '#e3f2fd',
                    color: '#0066ff',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    if (!post.tags.includes(tag.name)) {
                      setPost(prev => ({
                        ...prev,
                        tags: [...prev.tags, tag.name]
                      }));
                    }
                  }}
                >
                  + {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Panel de Análisis */}
      <div style={{ borderLeft: '1px solid #ddd', paddingLeft: '20px' }}>
        {post.id === 'new' ? (
          <div style={{ textAlign: 'center', color: '#999' }}>
            <p>💾 Guarda el post primero</p>
            <p>para ver el análisis</p>
          </div>
        ) : (
          <BlogAnalysisPanel postId={post.id} />
        )}
      </div>
    </div>
  );
}
```

---

## 3. Dashboard de Analytics

### Dashboard con múltiples posts y análisis

**`pages/blog/dashboard.jsx`**:

```javascript
import React, { useState, useEffect } from 'react';
import { useAgentAnalysis } from '@/hooks/useAgentAnalysis';

export default function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [analyses, setAnalyses] = useState({});
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('score');

  const { analyzePost } = useAgentAnalysis();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const response = await fetch('/api/blog/posts');
    const data = await response.json();
    setPosts(data.posts || []);
  };

  const analyzeAll = async () => {
    setLoading(true);
    const newAnalyses = {};

    for (const post of posts) {
      try {
        const result = await analyzePost(post.id);
        newAnalyses[post.id] = {
          score: result.analysis.overall_score,
          seo: result.analysis.seo.score,
          content: result.analysis.content.score,
          recommendations: result.recommendations.length
        };
        
        // Esperar 500ms entre análisis
        await new Promise(r => setTimeout(r, 500));
      } catch (error) {
        console.error(`Error analizando ${post.id}:`, error);
      }
    }

    setAnalyses(newAnalyses);
    setLoading(false);
  };

  const getSortedPosts = () => {
    return [...posts].sort((a, b) => {
      const scoreA = analyses[a.id]?.score || 0;
      const scoreB = analyses[b.id]?.score || 0;
      
      switch (sortBy) {
        case 'score':
          return scoreB - scoreA;
        case 'seo':
          return (analyses[b.id]?.seo || 0) - (analyses[a.id]?.seo || 0);
        case 'recent':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });
  };

  const getScoreColor = (score) => {
    if (score >= 8.5) return '#10b981'; // green
    if (score >= 7) return '#f59e0b'; // amber
    if (score >= 5) return '#ef4444'; // red
    return '#8b5cf6'; // purple
  };

  const getScoreBadge = (score) => {
    if (score >= 8.5) return '⭐⭐⭐ Excelente';
    if (score >= 7) return '⭐⭐ Bueno';
    if (score >= 5) return '⭐ Necesita mejora';
    return '❌ Revisar urgentemente';
  };

  const avgScore = Object.values(analyses).reduce((sum, a) => sum + (a.score || 0), 0) / Object.keys(analyses).length || 0;

  return (
    <div style={{ padding: '20px' }}>
      <h1>📊 Dashboard de Análisis</h1>

      {/* Estadísticas Generales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0066ff' }}>
            {posts.length}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>Posts Total</div>
        </div>

        <div style={{ backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            {Object.keys(analyses).length}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>Analizados</div>
        </div>

        <div style={{ backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
            {avgScore.toFixed(1)}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>Score Promedio</div>
        </div>

        <div style={{ backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <button
            onClick={analyzeAll}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0066ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%',
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? '⏳ Analizando...' : '🤖 Analizar Todo'}
          </button>
        </div>
      </div>

      {/* Ordenamiento */}
      <div style={{ marginBottom: '15px' }}>
        <label>Ordenar por: </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="score">Score General</option>
          <option value="seo">Score SEO</option>
          <option value="recent">Más Reciente</option>
        </select>
      </div>

      {/* Tabla de Posts */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Título</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Score General</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>SEO</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Contenido</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Recomendaciones</th>
            </tr>
          </thead>
          <tbody>
            {getSortedPosts().map(post => {
              const analysis = analyses[post.id];

              return (
                <tr key={post.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>
                    {post.title}
                  </td>

                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {analysis ? (
                      <div>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: getScoreColor(analysis.score)
                        }}>
                          {analysis.score.toFixed(1)}/10
                        </div>
                        <div style={{ fontSize: '10px', color: '#999' }}>
                          {getScoreBadge(analysis.score)}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#999' }}>-</span>
                    )}
                  </td>

                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {analysis ? (
                      <span style={{ fontWeight: 'bold', color: getScoreColor(analysis.seo) }}>
                        {analysis.seo.toFixed(1)}/10
                      </span>
                    ) : (
                      <span style={{ color: '#999' }}>-</span>
                    )}
                  </td>

                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {analysis ? (
                      <span style={{ fontWeight: 'bold', color: getScoreColor(analysis.content) }}>
                        {analysis.content.toFixed(1)}/10
                      </span>
                    ) : (
                      <span style={{ color: '#999' }}>-</span>
                    )}
                  </td>

                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {analysis ? (
                      <span style={{
                        backgroundColor: '#e3f2fd',
                        color: '#0066ff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {analysis.recommendations}
                      </span>
                    ) : (
                      <span style={{ color: '#999' }}>-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 4. Sistema de Recomendaciones

### Mostrar recomendaciones con implementación

**`components/AI/RecommendationsList.jsx`**:

```javascript
import React, { useState } from 'react';

const RecommendationsList = ({ recommendations, onImplement }) => {
  const [implemented, setImplemented] = useState(new Set());

  const handleImplement = (index) => {
    const rec = recommendations[index];
    setImplemented(prev => new Set(prev).add(index));
    
    if (onImplement) {
      onImplement(rec, index);
    }
  };

  const groupedByCategory = recommendations.reduce((acc, rec, i) => {
    if (!acc[rec.category]) acc[rec.category] = [];
    acc[rec.category].push({ ...rec, index: i });
    return acc;
  }, {});

  const categories = {
    seo: { icon: '🔍', color: '#10b981', label: 'SEO' },
    content: { icon: '📝', color: '#0066ff', label: 'Contenido' },
    performance: { icon: '⚡', color: '#f59e0b', label: 'Performance' }
  };

  return (
    <div style={{ space: '20px' }}>
      {Object.entries(groupedByCategory).map(([category, recs]) => {
        const cat = categories[category] || { icon: '💡', color: '#8b5cf6', label: category };

        return (
          <div key={category} style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>
              {cat.icon} {cat.label} ({recs.length})
            </h3>

            <div style={{ display: 'grid', gap: '10px' }}>
              {recs.map(rec => (
                <div
                  key={rec.index}
                  style={{
                    border: `2px solid ${cat.color}`,
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: `${cat.color}10`,
                    opacity: implemented.has(rec.index) ? 0.5 : 1
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0 }}>{rec.title}</h4>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      backgroundColor: rec.priority === 'high' ? '#fecaca' : '#fef08a',
                      color: rec.priority === 'high' ? '#991b1b' : '#78350f'
                    }}>
                      {rec.priority.toUpperCase()}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                    {rec.description}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px' }}>
                      <strong>Impacto:</strong> {rec.impact}
                    </div>
                    <div style={{ fontSize: '12px' }}>
                      <strong>Esfuerzo:</strong> {rec.effort}
                    </div>
                  </div>

                  <button
                    onClick={() => handleImplement(rec.index)}
                    disabled={implemented.has(rec.index)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: implemented.has(rec.index) ? '#d1d5db' : cat.color,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: implemented.has(rec.index) ? 'default' : 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {implemented.has(rec.index) ? '✅ Implementado' : '→ Implementar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RecommendationsList;
```

---

## 5. Análisis Batch

### Analizar múltiples posts en paralelo

**`utils/batchAnalyzer.js`**:

```javascript
import apiClient from './ai/apiClient';

/**
 * Analizar múltiples posts con control de concurrencia
 */
export const analyzeBatch = async (postIds, options = {}) => {
  const {
    concurrency = 3,
    delayBetween = 500,
    onProgress = null
  } = options;

  const results = {};
  const queue = [...postIds];
  let completed = 0;

  const worker = async () => {
    while (queue.length > 0) {
      const postId = queue.shift();

      try {
        const response = await apiClient.post('/agents/analyze-blog', {
          postId,
          analysisType: 'quick'
        });

        results[postId] = {
          success: true,
          data: response.data
        };
      } catch (error) {
        results[postId] = {
          success: false,
          error: error.message
        };
      }

      completed++;
      onProgress?.({
        completed,
        total: postIds.length,
        percentage: Math.round((completed / postIds.length) * 100)
      });

      // Esperar entre requests
      if (queue.length > 0) {
        await new Promise(r => setTimeout(r, delayBetween));
      }
    }
  };

  // Ejecutar workers
  const workers = Array(concurrency).fill().map(() => worker());
  await Promise.all(workers);

  return results;
};

// Uso en componente:
// const results = await analyzeBatch(
//   ['post1', 'post2', 'post3'],
//   {
//     concurrency: 3,
//     delayBetween: 500,
//     onProgress: (progress) => console.log(`${progress.percentage}% completado`)
//   }
// );
```

---

## 6. Custom Hooks

### Hook avanzado con caché local

**`hooks/useAnalysisWithCache.js`**:

```javascript
import { useState, useCallback, useRef } from 'react';
import { useAgentAnalysis } from './useAgentAnalysis';

/**
 * Hook con caché local de resultados
 */
export const useAnalysisWithCache = (cacheDuration = 5 * 60 * 1000) => {
  const cacheRef = useRef(new Map());
  const [isCached, setIsCached] = useState(false);
  const { loading, analysis, error, analyzePost: apiAnalyzePost } = useAgentAnalysis();

  const analyzePostCached = useCallback(async (postId, options = {}) => {
    const cacheKey = `${postId}_${JSON.stringify(options)}`;
    const cached = cacheRef.current.get(cacheKey);

    // Verificar caché válido
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      setIsCached(true);
      return cached.data;
    }

    // Request a API
    const result = await apiAnalyzePost(postId, options);

    // Guardar en caché
    cacheRef.current.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    setIsCached(false);
    return result;
  }, [cacheDuration]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return {
    loading,
    analysis,
    error,
    isCached,
    analyzePost: analyzePostCached,
    clearCache
  };
};
```

---

## 7. Context API Integration

### Compartir estado de análisis globalmente

**`context/AnalysisContext.jsx`**:

```javascript
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { useAgentAnalysis } from '@/hooks/useAgentAnalysis';

const AnalysisContext = createContext();

export const AnalysisProvider = ({ children }) => {
  const [state, dispatch] = useReducer(analysisReducer, initialState);
  const { analyzePost: apiAnalyzePost } = useAgentAnalysis();

  const analyzePost = useCallback(async (postId, options = {}) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const result = await apiAnalyzePost(postId, options);
      dispatch({
        type: 'SET_ANALYSIS',
        payload: { postId, analysis: result }
      });
      return result;
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.message
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [apiAnalyzePost]);

  const clearAnalysis = useCallback((postId) => {
    dispatch({ type: 'CLEAR_ANALYSIS', payload: postId });
  }, []);

  return (
    <AnalysisContext.Provider value={{ state, analyzePost, clearAnalysis }}>
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysisContext = () => {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysisContext debe usarse dentro de AnalysisProvider');
  }
  return context;
};

const initialState = {
  analyses: {},  // postId -> analysis
  loading: false,
  error: null
};

function analysisReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ANALYSIS':
      return {
        ...state,
        analyses: {
          ...state.analyses,
          [action.payload.postId]: action.payload.analysis
        },
        error: null
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'CLEAR_ANALYSIS':
      const { [action.payload]: _, ...rest } = state.analyses;
      return { ...state, analyses: rest };
    
    default:
      return state;
  }
}
```

**Usar en componente**:

```javascript
import { useAnalysisContext } from '@/context/AnalysisContext';

function MyComponent({ postId }) {
  const { state, analyzePost } = useAnalysisContext();
  const analysis = state.analyses[postId];

  return (
    <div>
      <button onClick={() => analyzePost(postId)}>
        Analizar
      </button>
      {analysis && <pre>{JSON.stringify(analysis, null, 2)}</pre>}
    </div>
  );
}
```

---

## 🎯 Próximos Pasos

1. Copiar los ejemplos más relevantes para tu caso de uso
2. Adaptar estilos a tu diseño actual
3. Integrar con tus datos existentes
4. Testing local
5. Deployment

¡Todos los ejemplos son completamente funcionales y listos para usar! 🚀