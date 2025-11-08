# 🚀 QUICK REFERENCE - ServicesAgent API

**Para referencia rápida mientras integras el ServicesAgent en tu frontend**

---

## 📌 BASE URL
```
http://localhost:5000/api/servicios/agent/
```

## 🔐 AUTENTICACIÓN
```javascript
headers: {
  'Authorization': `Bearer ${token}`,  // Obtén con getToken() de Clerk
  'Content-Type': 'application/json'
}
```

---

## 📚 ENDPOINTS RÁPIDOS

### 1️⃣ CREAR SERVICIO
```http
POST /create
```
```javascript
// Request
{
  "requirements": "Crea un servicio de desarrollo web",
  "categoria": "CATEGORIA_ID"
}

// Response
{
  "success": true,
  "data": {
    "serviceId": "ID_DEL_SERVICIO",
    "titulo": "Desarrollo Web Profesional",
    "categoria": "CATEGORIA_ID"
  }
}
```

### 2️⃣ EDITAR SERVICIO
```http
POST /:serviceId/edit
```
```javascript
{
  "optimizations": ["seo", "description", "conversion"],
  "instructions": "Mejora el SEO y conversión"
}
```

### 3️⃣ ANALIZAR SERVICIO
```http
POST /:serviceId/analyze
```
```javascript
// Response
{
  "data": {
    "analysis": {
      "scores": {
        "seo": 75,
        "quality": 82,
        "completeness": 88,
        "conversion": 70
      }
    }
  }
}
```

### 4️⃣ SUGERIR PRICING
```http
POST /suggest-pricing
```
```javascript
{
  "serviceData": {
    "titulo": "Landing Page",
    "descripcion": "Landing page de alta conversión"
  }
}

// Response
{
  "recommended": 2500,
  "range": { "min": 2000, "max": 3500 },
  "strategies": [...]
}
```

### 5️⃣ CHAT
```http
POST /chat
```
```javascript
{
  "message": "¿Qué servicios puedo crear?",
  "sessionId": "session-123"
}
```

### 6️⃣ PORTFOLIO
```http
POST /analyze-portfolio
```
```javascript
{
  "categoria": "CATEGORIA_ID",
  "limit": 10
}
```

### 7️⃣ MÉTRICAS
```http
GET /metrics
```

### 8️⃣ STATUS
```http
GET /status
```

---

## ⚡ EJEMPLOS RÁPIDOS

### React
```javascript
import axios from 'axios';
import { useAuth } from '@clerk/nextjs';

export function CreateService() {
  const { getToken } = useAuth();

  const create = async () => {
    const token = await getToken();
    const res = await axios.post(
      'http://localhost:5000/api/servicios/agent/create',
      {
        requirements: 'Landing page profesional',
        categoria: 'CATEGORIA_ID'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(res.data.data.serviceId);
  };

  return <button onClick={create}>Crear</button>;
}
```

### Fetch API
```javascript
const token = await getToken();
const response = await fetch(
  'http://localhost:5000/api/servicios/agent/create',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requirements: 'Tu servicio aquí',
      categoria: 'CATEGORIA_ID'
    })
  }
);
const data = await response.json();
console.log(data.data.serviceId);
```

---

## ❌ ERRORES COMUNES

| Error | Solución |
|-------|----------|
| 401 | Token expirado, solicita uno nuevo |
| 403 | Sin permisos, verifica rol de usuario |
| 400 | Datos inválidos, revisa el JSON |
| 429 | Demasiadas solicitudes, espera y reintenta |
| 500 | Error del servidor, revisa logs backend |

---

## 🎯 CHECKLIST RÁPIDO

- [ ] Token JWT válido
- [ ] Headers Authorization correctos
- [ ] Categoria ID válido
- [ ] User con permisos canCreateServices (para crear)
- [ ] Rate limiting considerado (10 req/5min para IA)
- [ ] Manejo de errores implementado
- [ ] Loading states en UI
- [ ] Success/Error notifications

---

## 📊 PERFORMANCE ESPERADO

- ⚡ Chat: 8-56ms
- ⚡ Crear: ~41ms
- ⚡ Editar: ~11ms
- ⚡ Analizar: ~25ms
- ⚡ Pricing: ~6ms

---

## 🔗 DOCUMENTACIÓN COMPLETA

Ver: `IMPLEMENTACION_SERVICESAGENT_FRONTEND.md`

---

## ✅ STATUS
**LISTO PARA USAR: SÍ ✅**
