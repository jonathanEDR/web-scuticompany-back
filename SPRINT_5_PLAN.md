# 📊 SPRINT 5: SISTEMA DE ANALYTICS Y DASHBOARD

## 🎯 OBJETIVO
Implementar un sistema completo de analytics para el blog que permita medir engagement, rendimiento y tomar decisiones basadas en datos.

## 📋 COMPONENTES A DESARROLLAR

### 1. **Modelo de Analytics** (BlogAnalytics.js)
```javascript
- Schema para tracking de eventos
- Vistas de posts
- Tiempo de lectura
- Interacciones (comentarios, votos)
- Referrers y fuentes de tráfico
- Dispositivos y navegadores
```

### 2. **Sistema de Tracking** (analyticsTracker.js)
```javascript
- Middleware para tracking automático
- Eventos personalizados
- Sesiones de usuario
- Agregación de datos
- IP anonymization (GDPR compliant)
```

### 3. **Analytics Controller** (analyticsController.js)
```javascript
// Endpoints públicos
- GET /api/blog/:slug/analytics - Stats básicas de un post
- POST /api/analytics/track - Registrar evento

// Endpoints administrativos
- GET /api/admin/analytics/overview - Dashboard general
- GET /api/admin/analytics/posts - Analytics por post
- GET /api/admin/analytics/comments - Engagement de comentarios
- GET /api/admin/analytics/trends - Tendencias temporales
- GET /api/admin/analytics/export - Exportar datos
```

### 4. **Dashboard Service** (dashboardService.js)
```javascript
- Cálculo de métricas clave (KPIs)
- Agregaciones complejas
- Comparaciones temporales
- Top performers
- Detección de anomalías
```

### 5. **Routes** (analytics.js)
```javascript
- Rutas públicas (tracking básico)
- Rutas protegidas (admin only)
- Rate limiting para prevenir spam
```

### 6. **Real-time Stats Cache** (opcional)
```javascript
- Caché en memoria para stats frecuentes
- Invalidación inteligente
- Agregación periódica
```

## 📊 MÉTRICAS A TRACKEAR

### **Blog Analytics**
- ✅ Total de vistas por post
- ✅ Vistas únicas (por IP/sesión)
- ✅ Tiempo promedio de lectura
- ✅ Tasa de rebote
- ✅ Scroll depth (qué tan abajo llegan)
- ✅ Fuentes de tráfico (directo, social, búsqueda)
- ✅ Posts más populares
- ✅ Categorías más vistas
- ✅ Tendencias por fecha/hora

### **Comment Analytics**
- ✅ Total de comentarios por post
- ✅ Tasa de engagement (comentarios/vistas)
- ✅ Comentarios aprobados vs rechazados vs spam
- ✅ Tiempo promedio de moderación
- ✅ Usuarios más activos
- ✅ Comentarios más votados
- ✅ Threads más largos
- ✅ Tasa de respuesta del autor

### **Performance Metrics**
- ✅ Tiempo de carga de API
- ✅ Errores y excepciones
- ✅ Throughput (requests/segundo)
- ✅ Tamaño de respuestas

## 🗂️ ESTRUCTURA DE ARCHIVOS

```
backend/
├── models/
│   ├── BlogAnalytics.js          (NEW) - Modelo principal de analytics
│   └── AnalyticsSession.js       (NEW) - Sesiones de usuario
│
├── controllers/
│   └── analyticsController.js    (NEW) - Endpoints de analytics
│
├── services/
│   ├── analyticsTracker.js       (NEW) - Sistema de tracking
│   └── dashboardService.js       (NEW) - Cálculos y agregaciones
│
├── routes/
│   └── analytics.js              (NEW) - Rutas de analytics
│
├── middleware/
│   └── analyticsMiddleware.js    (NEW) - Tracking automático
│
└── utils/
    ├── analyticsAggregator.js    (NEW) - Agregación de datos
    └── metricsCalculator.js      (NEW) - Cálculo de KPIs
```

## 🔧 ENDPOINTS A CREAR

### **Públicos (Sin autenticación)**
```
POST   /api/analytics/track              - Registrar evento de tracking
GET    /api/blog/:slug/stats              - Stats básicas públicas del post
```

### **Administrativos (Requieren auth + permisos)**
```
GET    /api/admin/analytics/overview      - Dashboard general
GET    /api/admin/analytics/posts         - Analytics detalladas por posts
GET    /api/admin/analytics/posts/:id     - Analytics de un post específico
GET    /api/admin/analytics/comments      - Analytics de comentarios
GET    /api/admin/analytics/engagement    - Métricas de engagement
GET    /api/admin/analytics/traffic       - Fuentes de tráfico
GET    /api/admin/analytics/trends        - Tendencias temporales
GET    /api/admin/analytics/realtime      - Stats en tiempo real
GET    /api/admin/analytics/export        - Exportar datos (CSV/JSON)
```

## 📈 DASHBOARD OVERVIEW (Lo que verá el admin)

### **Panel Principal**
```javascript
{
  period: "last_30_days",
  summary: {
    totalViews: 15430,
    uniqueVisitors: 8920,
    totalComments: 342,
    avgReadTime: "4m 32s",
    bounceRate: "42%",
    engagementRate: "2.2%"
  },
  topPosts: [
    {
      title: "Post Title",
      slug: "post-slug",
      views: 2340,
      comments: 45,
      engagement: "3.5%"
    }
  ],
  recentActivity: [...],
  trafficSources: {
    direct: 45,
    social: 30,
    search: 20,
    referral: 5
  },
  trends: {
    viewsChart: [...],
    commentsChart: [...],
    engagementChart: [...]
  }
}
```

## 🎯 PLAN DE IMPLEMENTACIÓN

### **Fase 1: Modelos y Schemas** (20 min)
- [ ] Crear BlogAnalytics.js
- [ ] Crear AnalyticsSession.js
- [ ] Definir índices para queries rápidas

### **Fase 2: Sistema de Tracking** (25 min)
- [ ] Crear analyticsTracker.js
- [ ] Crear middleware de tracking automático
- [ ] Implementar IP anonymization

### **Fase 3: Servicios y Cálculos** (30 min)
- [ ] Crear dashboardService.js
- [ ] Crear analyticsAggregator.js
- [ ] Crear metricsCalculator.js
- [ ] Implementar agregaciones MongoDB

### **Fase 4: Controllers y Routes** (30 min)
- [ ] Crear analyticsController.js
- [ ] Implementar todos los endpoints
- [ ] Crear routes/analytics.js
- [ ] Configurar permisos y rate limiting

### **Fase 5: Integración** (15 min)
- [ ] Integrar con server.js
- [ ] Añadir tracking a endpoints existentes
- [ ] Configurar variables de entorno

### **Fase 6: Testing** (20 min)
- [ ] Crear test-analytics.js
- [ ] Probar tracking de eventos
- [ ] Probar dashboard endpoints
- [ ] Validar agregaciones

## ⚙️ CONFIGURACIÓN NECESARIA

### **.env**
```env
# Analytics
ENABLE_ANALYTICS=true
ANALYTICS_ANONYMIZE_IP=true
ANALYTICS_SESSION_TIMEOUT=30
ANALYTICS_AGGREGATION_INTERVAL=3600000
```

### **Permisos de Clerk**
```javascript
view_analytics      // Ver analytics básicas
export_analytics    // Exportar datos
manage_analytics    // Configurar analytics
```

## 🔒 CONSIDERACIONES DE PRIVACIDAD

- ✅ Anonimización de IPs (GDPR compliant)
- ✅ No trackear información personal sin consentimiento
- ✅ Permitir opt-out de tracking
- ✅ Datos agregados, no individuales
- ✅ Retención de datos configurable

## 📊 QUERIES OPTIMIZADAS

### **Índices MongoDB necesarios**
```javascript
// BlogAnalytics
{ post: 1, createdAt: -1 }
{ eventType: 1, createdAt: -1 }
{ sessionId: 1 }
{ createdAt: 1 } // TTL index opcional

// BlogPost (ya existente)
{ views: -1 }
{ publishedAt: -1 }
```

## 🚀 PRÓXIMOS PASOS

1. ¿Comenzamos con la Fase 1 (Modelos)?
2. ¿Quieres revisar/modificar alguna métrica?
3. ¿Prefieres empezar por otra parte?

---

**Tiempo estimado total: ~2.5 horas**
**Archivos a crear: 8**
**Líneas de código estimadas: ~2,500**
