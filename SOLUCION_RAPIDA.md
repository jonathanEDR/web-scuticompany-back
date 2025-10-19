# 🎯 Checklist Rápido - Solución de Imágenes en Producción

## ✅ **PROBLEMA IDENTIFICADO:**
Las imágenes no se muestran en producción porque `BASE_URL` no está configurado en Render.

---

## 🚨 **SOLUCIÓN INMEDIATA** (5 minutos)

### 1. Acceder a Render Dashboard
```
https://dashboard.render.com
→ Seleccionar: web-scuticompany-back
```

### 2. Agregar/Actualizar Variables de Entorno

**Ir a:** Environment (menú lateral)

**Agregar estas 3 variables:**

```env
BASE_URL=https://web-scuticompany-back.onrender.com
NODE_ENV=production
FRONTEND_URL=https://web-scuticompany.vercel.app
```

⚠️ **IMPORTANTE:** 
- NO usar comillas en los valores
- NO poner barra `/` al final de BASE_URL
- Guardar y esperar reinicio automático (1-2 min)

### 3. Verificar que Funcionó

**A) Verificar API Response:**
```
Abrir: https://web-scuticompany-back.onrender.com/api/cms/pages/home

Buscar "backgroundImage" en la respuesta
Debe ser: https://web-scuticompany-back.onrender.com/uploads/...
```

**B) Verificar en el Frontend:**
```
1. Abrir: https://web-scuticompany.vercel.app
2. F12 → Network → Filtrar "uploads"
3. Recargar página
4. Todas las imágenes deben responder 200 OK
```

---

## 📋 **DIAGNÓSTICO LOCAL** (Opcional)

Si quieres verificar el estado actual:

```bash
# Ver URLs en MongoDB local
npm run diagnose:images

# Probar endpoints (requiere servidor corriendo)
npm run test:images
```

---

## 🔧 **SI LAS IMÁGENES AÚN NO FUNCIONAN:**

### Opción A: Verificar que los archivos existen en Render

```bash
# Las imágenes deben estar en: /uploads/ en el servidor de Render
# Si no existen, necesitas re-subirlas desde el CMS Manager
```

### Opción B: Re-subir imágenes

```
1. Ir a: https://web-scuticompany.vercel.app/dashboard/media
2. Subir las imágenes nuevamente
3. Actualizar las páginas con las nuevas URLs
```

---

## 📞 **VERIFICACIÓN RÁPIDA**

### ✅ Checklist de 3 pasos:

1. [ ] **BASE_URL configurado en Render**
   - Valor: `https://web-scuticompany-back.onrender.com`
   - Sin barra final `/`

2. [ ] **API responde con URLs absolutas**
   - Abrir: `https://web-scuticompany-back.onrender.com/api/cms/pages`
   - URLs deben empezar con `https://`

3. [ ] **Frontend muestra las imágenes**
   - Abrir: `https://web-scuticompany.vercel.app`
   - Las imágenes deben verse

---

## 📚 **DOCUMENTACIÓN COMPLETA:**

- **Guía de Despliegue:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Diagnóstico de Imágenes:** [DIAGNOSTICO_IMAGENES.md](./DIAGNOSTICO_IMAGENES.md)
- **Resumen del Problema:** [RESUMEN_DIAGNOSTICO.md](./RESUMEN_DIAGNOSTICO.md)

---

## 🎯 **SIGUIENTE PASO: MEJORAS**

Una vez que las imágenes funcionen, considera:

1. **Implementar CDN** (Cloudinary, AWS S3)
2. **Caché de imágenes** (headers Cache-Control)
3. **Optimización automática** (WebP, thumbnails)
4. **Monitoring** (Sentry, uptime checks)

---

**Estado actual:**
- ✅ URLs en BD corregidas (formato relativo)
- ⏳ Pendiente: Configurar BASE_URL en Render
- ⏳ Pendiente: Verificar archivos en servidor de Render

**Tiempo estimado:** 5-10 minutos
**Complejidad:** Baja (solo configurar variables de entorno)
