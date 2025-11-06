# ⚡ QUICK START - Integración en 30 minutos

> Sigue este checklist para tener el sistema funcionando en tu aplicación en 30 minutos

---

## ✅ PRE-REQUISITOS (5 minutos)

- [ ] Node.js >= 16 instalado
- [ ] Backend corriendo en http://localhost:5000
- [ ] MongoDB conectada
- [ ] Clerk configurado
- [ ] OpenAI API key válida
- [ ] Acceso a `/api/agents/health-advanced` ✅

**Verifica**:
```bash
curl http://localhost:5000/api/agents/health-advanced
```

Deberías ver:
```json
{ "status": "healthy", "timestamp": "...", "systems": {...} }
```

---

## 📦 INSTALACIÓN DEPENDENCIAS (3 minutos)

En tu proyecto frontend:

```bash
npm install axios
npm install -D tailwindcss  # opcional
npm install -D react-query  # opcional
```

---

## 🔧 SETUP INICIAL (5 minutos)

### 1. Crear archivo `.env.local`

```bash
# En raíz de tu proyecto frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_API_TIMEOUT=30000
```

### 2. Crear carpeta `hooks`

```bash
mkdir -p src/hooks
```

### 3. Crear `hooks/useAgentAnalysis.js`

```javascript
// Copia de FRONTEND_INTEGRATION_GUIDE.md -> Quick Start
// Opción rápida: copy-paste el código del hook

import { useState, useCallback } from 'react';
import axios from 'axios';

export const useAgentAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const analyzePost = useCallback(async (postId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agents/analyze-blog`,
        { postId, analysisType: 'full' }
      );

      setAnalysis(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, analysis, error, analyzePost };
};
```

---

## 🎨 CREAR COMPONENTE SIMPLE (5 minutos)

### 1. Crear `components/AI/AnalysisButton.jsx`

```javascript
import { useAgentAnalysis } from '@/hooks/useAgentAnalysis';

export default function AnalysisButton({ postId }) {
  const { loading, analysis, error, analyzePost } = useAgentAnalysis();

  const handleClick = () => {
    analyzePost(postId).catch(err => console.error(err));
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#0066ff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '⏳ Analizando...' : '🚀 Analizar'}
      </button>

      {error && <div style={{ color: 'red', marginTop: '10px' }}>Error: {error}</div>}

      {analysis && (
        <div style={{ marginTop: '20px', backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '8px' }}>
          <h3>📊 Resultados</h3>
          <p><strong>Score:</strong> {analysis.analysis.overall_score}/10</p>
          <p><strong>Recomendaciones:</strong> {analysis.recommendations.length}</p>
          <details>
            <summary>Ver detalles completos</summary>
            <pre>{JSON.stringify(analysis, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
```

### 2. Usar en tu página

```javascript
// pages/blog/[id].jsx
import AnalysisButton from '@/components/AI/AnalysisButton';

export default function BlogPostPage({ postId }) {
  return (
    <div>
      <h1>Mi Blog Post</h1>
      <p>Contenido del blog...</p>
      
      {/* Agregar botón de análisis */}
      <AnalysisButton postId={postId} />
    </div>
  );
}
```

---

## ✨ PRUEBA RÁPIDA (5 minutos)

### 1. Inicia el desarrollo

```bash
npm run dev
```

### 2. Abre el navegador

```
http://localhost:3000/blog/[algún-id]
```

### 3. Haz click en "🚀 Analizar"

Deberías ver:
- ⏳ Indicador de carga (2-3 seg)
- ✅ Resultados con score
- 📊 Detalles completos

---

## 🎯 SIGUIENTE: PERSONALIZACIÓN (5 minutos)

### Opción 1: Dashboard Completo

Copia `PRACTICAL_EXAMPLES.md` → Sección 3 → `Dashboard de Analytics`

### Opción 2: Editor Avanzado

Copia `PRACTICAL_EXAMPLES.md` → Sección 2 → `Editor de Blog Completo`

### Opción 3: Batch Processing

Copia `PRACTICAL_EXAMPLES.md` → Sección 5 → `Análisis Batch`

---

## 🐛 SOLUCIÓN RÁPIDA DE PROBLEMAS

### Error: "Cannot find module 'axios'"

```bash
npm install axios
```

### Error: "API URL no definida"

Verifica `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Error: "401 Unauthorized"

Backend no tiene autenticación de desarrollo:
1. Backend permite anónimo en modo test
2. O agrega token en headers:

```javascript
// En hook, agregar headers
headers: {
  Authorization: `Bearer ${token}`
}
```

### Error: "Backend no responde"

```bash
# 1. Verifica que corre
curl http://localhost:5000/api/agents/health-advanced

# 2. Si no, inicia
npm start

# 3. Si falla, ver error
npm start --verbose
```

### Error: "Database not connected"

Backend necesita MongoDB:
```bash
# Verifica MongoDB está corriendo
mongosh

# Si no, inicia en Docker o Atlas
```

---

## 📊 VERIFICAR QUE FUNCIONA

### Checklist Final

- [ ] Backend responde en http://localhost:5000
- [ ] Frontend carga sin errores
- [ ] Botón "Analizar" aparece
- [ ] Puedo hacer click
- [ ] Ver respuesta en 2-3 segundos
- [ ] Score aparece correctamente
- [ ] No hay errores en console

**Si todo ✅**: ¡Integración completa en 30 min!

---

## 🚀 PRÓXIMOS PASOS

### Inmediatos (Hoy)
- [ ] Integración básica ✅ (Ya terminado)
- [ ] Probar con 3-5 posts
- [ ] Ajustar estilos CSS

### Corto Plazo (Esta semana)
- [ ] Agregar más funcionalidades
- [ ] Setup en staging
- [ ] Invitar beta testers

### Mediano Plazo (Este mes)
- [ ] Deploy a producción
- [ ] Monitoreo y alertas
- [ ] Documentar para el team

---

## 📚 REFERENCIAS RÁPIDAS

| Necesito | Archivo | Sección |
|----------|---------|---------|
| Código hook | FRONTEND_INTEGRATION_GUIDE.md | Hooks Personalizados |
| Componentes | PRACTICAL_EXAMPLES.md | Ejemplos 1-3 |
| Endpoints API | QUICK_REFERENCE.md | Cheat Sheet |
| Solucionar error | TROUBLESHOOTING_ADVANCED.md | Tu tipo de error |
| Entender arquitectura | ARCHITECTURE_DIAGRAMS.md | Diagramas |

---

## 💬 SOPORTE RÁPIDO

### FAQ de Integración

**P: ¿Cuánto tarda el análisis?**
R: 1-3 segundos (depende del tamaño del post)

**P: ¿Puedo analizar offline?**
R: No, necesita conexión a OpenAI

**P: ¿Hay límite de análisis?**
R: Sí, 100 req/15min por defecto

**P: ¿Cómo cache resultados?**
R: Ver `PRACTICAL_EXAMPLES.md` → Hook with Cache

**P: ¿Funciona en mobile?**
R: Sí, totalmente responsive

**P: ¿Puedo personalizar los prompts?**
R: Sí, ver `ADVANCED_AI_AGENTS_GUIDE.md` → Dynamic Prompts

---

## ✅ COMPLETADO!

```
┌─────────────────────────────────────────┐
│  INTEGRACIÓN EXITOSA EN 30 MINUTOS  ✅   │
├─────────────────────────────────────────┤
│ ✅ Backend configurado                   │
│ ✅ Hook creado                           │
│ ✅ Componente integrado                  │
│ ✅ Primera análisis funcionando         │
│ ✅ Código probado                        │
└─────────────────────────────────────────┘
```

### Métricas de Éxito
- ✅ Análisis en <3 segundos
- ✅ Score visible en UI
- ✅ Sin errores en console
- ✅ Componente responsive
- ✅ Datos persistiendo

---

## 🎉 ¡PRÓXIMO: LEE FULL DOCS!

Ahora que funciona, lee:

1. **FRONTEND_INTEGRATION_GUIDE.md** - Completo
2. **PRACTICAL_EXAMPLES.md** - Inspírate
3. **QUICK_REFERENCE.md** - Referencia rápida

---

## 📞 NECESITAS AYUDA?

| Problema | Solución |
|----------|----------|
| Build errors | TROUBLESHOOTING_ADVANCED.md #2 |
| API errors | TROUBLESHOOTING_ADVANCED.md #2 |
| Performance | TROUBLESHOOTING_ADVANCED.md #3 |
| Database | TROUBLESHOOTING_ADVANCED.md #5 |
| Auth issues | TROUBLESHOOTING_ADVANCED.md #4 |

---

**¡Felicitaciones por completar tu integración! 🎊**

Ahora tienes poder AI en tu aplicación. 🚀

---

Basado en: **Sistema de Agentes AI v1.0**
Última actualización: Noviembre 2024
Estado: ✅ Production Ready