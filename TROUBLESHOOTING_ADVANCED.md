# 🔧 TROUBLESHOOTING AVANZADO - Sistema de Agentes AI

## 📚 Índice de Problemas

1. [Problemas de Conexión](#1-problemas-de-conexión)
2. [Errores de API](#2-errores-de-api)
3. [Problemas de Performance](#3-problemas-de-performance)
4. [Errores de Autenticación](#4-errores-de-autenticación)
5. [Problemas de Datos](#5-problemas-de-datos)
6. [Problemas en Frontend](#6-problemas-en-frontend)
7. [Problemas en Testing](#7-problemas-en-testing)
8. [Debugging Avanzado](#8-debugging-avanzado)

---

## 1. Problemas de Conexión

### Problema: Backend no responde

**Síntomas**:
```
Error: connect ECONNREFUSED 127.0.0.1:5000
```

**Soluciones**:

```bash
# 1. Verificar puerto
lsof -i :5000

# 2. Reiniciar servidor
npm start

# 3. Verificar si hay otro proceso usando puerto
Get-NetTCPConnection -LocalPort 5000 | Stop-Process -Force

# 4. Cambiar puerto
PORT=3001 npm start
```

**Código para testing**:

```javascript
// utils/connectionTest.js
export const testConnection = async (baseUrl = 'http://localhost:5000') => {
  try {
    const response = await fetch(`${baseUrl}/api/agents/health-advanced`);
    const health = await response.json();
    
    console.log('✅ Conexión OK', {
      timestamp: new Date().toISOString(),
      status: response.status,
      health: health.status
    });
    
    return true;
  } catch (error) {
    console.error('❌ Conexión FAILED', {
      error: error.message,
      baseUrl,
      timestamp: new Date().toISOString()
    });
    
    return false;
  }
};
```

---

## 2. Errores de API

### Problema: 401 Unauthorized

**Síntomas**:
```json
{
  "error": "Unauthorized",
  "message": "Token inválido o expirado"
}
```

**Soluciones**:

```javascript
// frontend/utils/authDebug.js
export const debugAuth = () => {
  // 1. Verificar token en localStorage
  const token = localStorage.getItem('__clerk_db_jwt');
  console.log('Token presente:', !!token);
  
  // 2. Verificar en session storage
  const sessionToken = sessionStorage.getItem('__clerk_db_jwt');
  console.log('Session token presente:', !!sessionToken);
  
  // 3. Verificar cookie
  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('__clerk_db_jwt'));
  console.log('Cookie token presente:', !!cookieToken);
  
  // 4. Decodificar JWT (para debugging)
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Token payload:', {
        exp: new Date(payload.exp * 1000),
        iat: new Date(payload.iat * 1000),
        expiresIn: Math.round((payload.exp - Date.now() / 1000) / 60) + ' min'
      });
    } catch (e) {
      console.error('Error decodificando token:', e.message);
    }
  }
};

// Usar en componente
import { useAuth } from '@clerk/nextjs';

export default function DebugComponent() {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      console.log('Auth state:', { isLoaded, isSignedIn });
      debugAuth();
    }
  }, [isLoaded]);

  return <div>Ver console para debugging</div>;
}
```

### Problema: 403 Forbidden - Permisos insuficientes

**Síntomas**:
```json
{
  "error": "Forbidden",
  "message": "No tienes permisos para esta acción"
}
```

**Soluciones**:

```javascript
// frontend/utils/permissionDebug.js
export const debugPermissions = async () => {
  try {
    // Obtener perfil del usuario
    const profileResponse = await fetch('/api/profile/me');
    const profile = await profileResponse.json();
    
    console.log('User Profile:', {
      role: profile.role,
      permissions: profile.permissions,
      capabilities: profile.capabilities
    });
    
    // Verificar si tiene permiso para una acción específica
    const hasPermission = (action) => {
      return profile.permissions?.includes(action) || 
             profile.role === 'admin';
    };
    
    console.log('Permisos disponibles:');
    console.log('- Crear posts:', hasPermission('create:post'));
    console.log('- Editar posts:', hasPermission('edit:post'));
    console.log('- Analizar posts:', hasPermission('analyze:post'));
    
  } catch (error) {
    console.error('Error debugging permisos:', error);
  }
};
```

### Problema: 500 Internal Server Error

**Síntomas**:
```json
{
  "error": "Internal Server Error",
  "message": "Error interno del servidor"
}
```

**Soluciones**:

```bash
# 1. Ver logs del servidor
# En terminal donde corre npm start

# 2. Habilitar debugging en backend
DEBUG=* npm start

# 3. Ver logs guardados
tail -f logs/error.log
tail -f logs/combined.log

# 4. Conectar debugger de Node
node --inspect-brk=9229 server.js
# Luego en Chrome: chrome://inspect
```

**Script para revisar logs**:

```javascript
// utils/logAnalyzer.js
import fs from 'fs';
import path from 'path';

export const analyzeErrorLogs = () => {
  const logPath = path.join(process.cwd(), 'logs', 'error.log');
  
  try {
    const logs = fs.readFileSync(logPath, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .slice(-20); // Últimas 20 líneas
    
    console.log('=== ÚLTIMOS ERRORES ===');
    logs.forEach(log => {
      try {
        const parsed = JSON.parse(log);
        console.log({
          timestamp: parsed.timestamp,
          level: parsed.level,
          message: parsed.message,
          error: parsed.error?.stack?.split('\n')[0]
        });
      } catch (e) {
        console.log(log);
      }
    });
  } catch (error) {
    console.error('No se pueden leer logs:', error.message);
  }
};
```

---

## 3. Problemas de Performance

### Problema: Análisis lento (>5 segundos)

**Síntomas**:
```
Analysis took: 8234ms
```

**Soluciones**:

```javascript
// utils/performanceMonitor.js
export class PerformanceMonitor {
  static async measureAnalysis(postId) {
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = Date.now();

    try {
      const response = await fetch('/api/agents/analyze-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
      });

      const data = await response.json();
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage().heapUsed;

      return {
        success: true,
        duration,
        memoryDelta: (endMemory - startMemory) / 1024 / 1024, // MB
        tokensUsed: data.metrics?.tokens_used,
        timestamp: new Date().toISOString(),
        performance: {
          fast: duration < 2000,
          acceptable: duration < 5000,
          slow: duration >= 5000
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async comparePerformance(postIds) {
    const results = await Promise.all(
      postIds.map(id => this.measureAnalysis(id))
    );

    const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;
    
    console.log('📊 Performance Report:');
    console.log(`Average duration: ${avgDuration.toFixed(0)}ms`);
    
    results.forEach((r, i) => {
      console.log(
        `Post ${i + 1}: ${r.duration}ms - ` +
        (r.performance.fast ? '✅ RÁPIDO' : r.performance.acceptable ? '⚠️ ACEPTABLE' : '❌ LENTO')
      );
    });

    return { avgDuration, results };
  }
}
```

**Optimizaciones**:

```javascript
// 1. Usar análisis "quick" en lugar de "full"
const result = await analyzePost(postId, { type: 'quick' });

// 2. Cachear resultados
export const useAnalysisCache = () => {
  const cache = useRef(new Map());
  
  const getOrAnalyze = useCallback(async (postId) => {
    if (cache.current.has(postId)) {
      return cache.current.get(postId);
    }
    
    const result = await analyzePost(postId);
    cache.current.set(postId, result);
    
    // Limpiar caché después de 10 minutos
    setTimeout(() => cache.current.delete(postId), 10 * 60 * 1000);
    
    return result;
  }, []);
  
  return { getOrAnalyze, clearCache: () => cache.current.clear() };
};

// 3. Batch analysis con concurrencia limitada
export const batchAnalyzeOptimized = async (postIds, maxConcurrent = 3) => {
  const results = [];
  const queue = [...postIds];
  
  const worker = async () => {
    while (queue.length > 0) {
      const postId = queue.shift();
      try {
        const result = await analyzePost(postId, { type: 'quick' });
        results.push(result);
      } catch (error) {
        console.error(`Error analizando ${postId}:`, error);
      }
    }
  };
  
  await Promise.all(
    Array(maxConcurrent).fill().map(() => worker())
  );
  
  return results;
};
```

---

## 4. Errores de Autenticación

### Problema: Sesión expirada

**Síntomas**:
```
Error: Session expired, please login again
```

**Soluciones**:

```javascript
// frontend/hooks/useAuthRefresh.js
import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';

export const useAuthRefresh = () => {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;

    // Refresh token cada 50 minutos
    const interval = setInterval(async () => {
      try {
        await getToken();
        console.log('✅ Token refrescado');
      } catch (error) {
        console.error('❌ Error refrescando token:', error);
        // Redirigir a login si falla
        window.location.href = '/sign-in';
      }
    }, 50 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isSignedIn, getToken]);
};

// Usar en layout
export default function Layout({ children }) {
  useAuthRefresh();
  return <>{children}</>;
}
```

### Problema: Token inválido después de redeploy

**Soluciones**:

```javascript
// frontend/utils/tokenRecovery.js
export const recoverFromExpiredToken = async () => {
  // 1. Limpiar tokens
  localStorage.removeItem('__clerk_db_jwt');
  sessionStorage.removeItem('__clerk_db_jwt');
  
  // 2. Limpiar cookies
  document.cookie = '__clerk_db_jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  
  // 3. Recargar
  window.location.href = '/sign-in?redirect_url=' + window.location.href;
};

// Usar en axios interceptor
import axios from 'axios';

const apiClient = axios.create();

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      recoverFromExpiredToken();
    }
    return Promise.reject(error);
  }
);
```

---

## 5. Problemas de Datos

### Problema: Datos no se sincronizan

**Síntomas**:
```
Cambios no se reflejan en UI
```

**Soluciones**:

```javascript
// frontend/hooks/useSyncedData.js
import { useState, useEffect, useCallback } from 'react';

export const useSyncedData = (key, initialValue, syncInterval = 5000) => {
  const [data, setData] = useState(initialValue);
  const [isStale, setIsStale] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/data/${key}`);
      const newData = await response.json();
      
      setData(newData);
      setIsStale(false);
      
      return newData;
    } catch (error) {
      console.error('Error sincronizando:', error);
      setIsStale(true);
    }
  }, [key]);

  useEffect(() => {
    // Sincronizar inmediatamente
    refresh();

    // Sincronizar periódicamente
    const interval = setInterval(refresh, syncInterval);

    // Sincronizar cuando tab regresa a focus
    window.addEventListener('focus', refresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, [key, syncInterval, refresh]);

  return { data, isStale, refresh };
};
```

### Problema: Caché obsoleto

**Síntomas**:
```
Ver datos antiguos aunque se hayan actualizado en BD
```

**Soluciones**:

```javascript
// utils/cacheManager.js
export class CacheManager {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutos por defecto
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: this.ttl
    });
  }

  get(key) {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    
    if (age > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.value;
  }

  invalidate(key) {
    this.cache.delete(key);
  }

  invalidatePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Usar en servicio
const cache = new CacheManager(10 * 60 * 1000); // 10 minutos

export const getPostAnalysis = async (postId) => {
  const cacheKey = `analysis_${postId}`;
  
  // Intentar obtener del caché
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Obtener de API
  const response = await fetch(`/api/agents/analyze-blog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId })
  });
  
  const result = await response.json();
  cache.set(cacheKey, result);
  
  return result;
};

// Invalidar caché cuando se edita
export const updatePost = async (postId, data) => {
  const response = await fetch(`/api/blog/posts/${postId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  
  // Limpiar caché relacionado
  cache.invalidatePattern(`${postId}`);
  
  return response.json();
};
```

---

## 6. Problemas en Frontend

### Problema: Hook no funciona correctamente

**Síntomas**:
```
Infinite loops, estado no se actualiza, etc
```

**Debugging**:

```javascript
// hooks/useAgentAnalysis.js - CON DEBUG
import { useState, useCallback, useRef } from 'react';
import axios from 'axios';

export const useAgentAnalysis = (debug = false) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const requestRef = useRef(null);

  const analyzePost = useCallback(async (postId, options = {}) => {
    // Evitar múltiples requests simultáneos
    if (requestRef.current) {
      if (debug) console.warn('Request anterior aún en progreso');
      return;
    }

    if (debug) console.log('🔍 Iniciando análisis:', { postId, options });

    setLoading(true);
    setError(null);
    requestRef.current = true;

    try {
      if (debug) console.time('analysis_duration');

      const response = await axios.post('/api/agents/analyze-blog', {
        postId,
        analysisType: options.type || 'full'
      });

      if (debug) {
        console.timeEnd('analysis_duration');
        console.log('✅ Análisis completado:', response.data);
      }

      setAnalysis(response.data);
      return response.data;

    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      
      if (debug) {
        console.error('❌ Error en análisis:', {
          status: err.response?.status,
          message: errorMsg,
          data: err.response?.data
        });
      }

      setError(errorMsg);
      throw err;

    } finally {
      setLoading(false);
      requestRef.current = false;
    }
  }, [debug]);

  return { loading, analysis, error, analyzePost };
};

// Usar con debug
function Component() {
  const { analyzePost, loading, analysis, error } = useAgentAnalysis(true);
  // Ver console para logs detallados
}
```

### Problema: Component no renderiza correctamente

**Síntomas**:
```
Componente no muestra datos aunque hook funciona
```

**Soluciones**:

```javascript
// Usar React DevTools Profiler
import { Profiler } from 'react';

export default function MyComponent() {
  const handleRenderCallback = (
    id, // Identificador del profiler
    phase, // "mount" o "update"
    actualDuration, // Tiempo de render
    baseDuration,
    startTime,
    commitTime,
    interactions
  ) => {
    console.log(`${id} (${phase}) took ${actualDuration}ms`);
  };

  return (
    <Profiler id="MyComponent" onRender={handleRenderCallback}>
      {/* Contenido */}
    </Profiler>
  );
}

// O usar React Query DevTools
import { ReactQueryDevtools } from 'react-query/devtools';

export default function App() {
  return (
    <>
      {/* App content */}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}
```

---

## 7. Problemas en Testing

### Problema: Tests fallan aleatoriamente

**Síntomas**:
```
Sometimes pass, sometimes fail (flaky tests)
```

**Soluciones**:

```javascript
// tests/api.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';

describe('API Tests', () => {
  beforeEach(() => {
    // Mock axios antes de cada test
    vi.mock('axios');
  });

  afterEach(() => {
    // Limpiar mocks
    vi.clearAllMocks();
  });

  it('should retry on timeout', async () => {
    const mockAnalyzePost = vi.fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({ success: true });

    const result = await retryAnalyzePost('123', { maxRetries: 3 });
    
    expect(mockAnalyzePost).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
  });

  it('should handle race conditions', async () => {
    const results = await Promise.all([
      analyzePost('123'),
      analyzePost('123'),
      analyzePost('123')
    ]);

    // Debe hacer solo 1 request, no 3
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it('should timeout after duration', async () => {
    const promise = analyzePost('123');
    
    // Timeout después de 10 segundos
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 10000)
    );

    await expect(Promise.race([promise, timeoutPromise])).rejects.toThrow();
  });
});
```

---

## 8. Debugging Avanzado

### Utilidades de debugging

```javascript
// utils/debugUtils.js
export const createDebugger = (namespace) => {
  return {
    log: (...args) => console.log(`[${namespace}]`, ...args),
    error: (...args) => console.error(`[${namespace}] ❌`, ...args),
    warn: (...args) => console.warn(`[${namespace}] ⚠️`, ...args),
    time: (label) => console.time(`[${namespace}] ${label}`),
    timeEnd: (label) => console.timeEnd(`[${namespace}] ${label}`),
    table: (data) => console.table(data),
    group: (label) => console.group(`[${namespace}] ${label}`),
    groupEnd: () => console.groupEnd(),
    trace: () => console.trace(`[${namespace}]`)
  };
};

// Uso
const debug = createDebugger('BlogAgent');
debug.log('Iniciando análisis');
debug.time('analysis');
// ... análisis
debug.timeEnd('analysis');

// Debugging de Redux/Zustand
export const createStateDebugger = (store) => {
  return {
    logState: () => {
      console.log('🏪 Current State:', store.getState());
    },
    
    watchState: (selector) => {
      let prevValue = selector(store.getState());
      
      store.subscribe(() => {
        const newValue = selector(store.getState());
        if (prevValue !== newValue) {
          console.log('📊 State Changed:', { from: prevValue, to: newValue });
          prevValue = newValue;
        }
      });
    }
  };
};
```

### Network Interceptor para debugging

```javascript
// utils/networkDebugger.js
import axios from 'axios';

export const setupNetworkDebugger = (options = {}) => {
  const { logResponses = true, logErrors = true } = options;

  axios.interceptors.request.use(config => {
    console.log(`📤 [${config.method.toUpperCase()}] ${config.url}`);
    config.metadata = { startTime: Date.now() };
    return config;
  });

  axios.interceptors.response.use(
    response => {
      const duration = Date.now() - response.config.metadata.startTime;
      
      if (logResponses) {
        console.log(
          `✅ [${response.status}] ${response.config.url} (${duration}ms)`
        );
        console.log('   Data:', response.data);
      }
      
      return response;
    },
    error => {
      const duration = Date.now() - error.config?.metadata?.startTime;
      
      if (logErrors) {
        console.error(
          `❌ [${error.response?.status}] ${error.config.url} (${duration}ms)`
        );
        console.error('   Error:', error.response?.data);
      }
      
      return Promise.reject(error);
    }
  );
};

// Usar en app init
if (process.env.NODE_ENV === 'development') {
  setupNetworkDebugger({ logResponses: true, logErrors: true });
}
```

---

## 🎯 Checklist de Debugging

- [ ] ¿Verificaste la consola del navegador (DevTools)?
- [ ] ¿Viste los logs del servidor?
- [ ] ¿El token está válido?
- [ ] ¿La API está respondiendo?
- [ ] ¿Los datos están llegando correctamente?
- [ ] ¿Hay un problema de performance?
- [ ] ¿El componente se está renderizando?
- [ ] ¿El estado se actualiza?
- [ ] ¿Hay ciclos infinitos?
- [ ] ¿El network está funcionando?

---

## 📞 Recursos Útiles

### Herramientas
- **Chrome DevTools**: `F12`
- **React DevTools**: `npm install -D @react-devtools/shell`
- **Redux DevTools**: `npm install --save-dev redux-devtools`
- **Postman**: Para testear APIs
- **VS Code Debugger**: Integrado en VSCode

### Comandos útiles

```bash
# Ver logs en tiempo real
tail -f logs/*.log

# Buscar error en logs
grep "ERROR" logs/error.log

# Ver estadísticas del proceso
ps aux | grep node

# Monitorear performance
npm install -g node-inspector
node-inspect server.js

# Test de endpoints
curl -X POST http://localhost:5000/api/agents/health-advanced
```

¡Espero que este guía te ayude a resolver los problemas! 🚀