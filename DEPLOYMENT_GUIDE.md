# 🚀 Guía de Despliegue en Producción - Web Scuti

## 📋 Resumen del Problema Actual

**Estado:** Las imágenes existen en el backend pero no se visualizan en el frontend de producción.

**Causa identificada:** La variable `BASE_URL` no está configurada correctamente en Render, por lo que las URLs de las imágenes no se transforman de relativas a absolutas.

---

## ✅ Solución Inmediata

### Paso 1: Configurar Variables de Entorno en Render

1. **Acceder al Dashboard de Render:**
   - Ir a: https://dashboard.render.com
   - Seleccionar tu servicio de backend

2. **Configurar Environment Variables:**
   - Ir a: **Environment** (en el menú lateral)
   - Agregar/Actualizar las siguientes variables:

```env
BASE_URL=https://web-scuticompany-back.onrender.com
NODE_ENV=production
FRONTEND_URL=https://web-scuticompany.vercel.app,https://www.web-scuticompany.vercel.app
```

3. **Guardar y esperar el reinicio automático**
   - Render reiniciará el servicio automáticamente
   - Esto toma 1-2 minutos

### Paso 2: Verificar que Funcionó

1. **Abrir la consola del navegador** en tu frontend:
   - F12 → Network → Filtrar por "uploads"
   
2. **Recargar la página principal**

3. **Las URLs deben verse así:**
   ```
   ✅ https://web-scuticompany-back.onrender.com/uploads/1760758937633-evobkt.webp
   ```
   
   **NO así:**
   ```
   ❌ /uploads/1760758937633-evobkt.webp
   ❌ http://localhost:5000/uploads/...
   ```

---

## 🔧 Configuración Completa de Render

### Variables de Entorno Requeridas

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `PORT` | `5000` | Puerto del servidor (opcional, Render lo asigna) |
| `NODE_ENV` | `production` | **CRÍTICO** - Entorno de producción |
| `BASE_URL` | `https://web-scuticompany-back.onrender.com` | **CRÍTICO** - URL pública del backend |
| `FRONTEND_URL` | `https://web-scuticompany.vercel.app` | Para CORS |
| `MONGODB_URI` | Tu URI de MongoDB Atlas | Conexión a base de datos |
| `CLERK_SECRET_KEY` | Tu clave de Clerk | Autenticación |
| `CLERK_PUBLISHABLE_KEY` | Tu clave pública de Clerk | Autenticación |
| `CLERK_WEBHOOK_SECRET` | Tu secret de webhook | Webhooks de Clerk |

### Cómo Agregar Variables en Render:

1. **Dashboard de Render** → Tu servicio
2. **Environment** (menú lateral izquierdo)
3. **Add Environment Variable**
4. Agregar cada variable:
   - **Key:** Nombre de la variable (ej: `BASE_URL`)
   - **Value:** Valor (ej: `https://web-scuticompany-back.onrender.com`)
   - **NO usar comillas** en los valores
5. **Save Changes**

---

## 🎯 Verificación Post-Despliegue

### Checklist de Verificación:

- [ ] **Variables de entorno configuradas en Render**
  ```bash
  # Verificar en Render Dashboard → Environment
  - BASE_URL ✓
  - NODE_ENV=production ✓
  - FRONTEND_URL ✓
  - MONGODB_URI ✓
  ```

- [ ] **Servidor reiniciado y corriendo**
  ```bash
  # Ver logs en Render Dashboard → Logs
  # Buscar: "Server running on port 5000"
  ```

- [ ] **Health check funciona**
  ```bash
  # Abrir en navegador:
  https://web-scuticompany-back.onrender.com/api/health
  
  # Debe responder:
  {
    "status": "OK",
    "database": { "healthy": true },
    ...
  }
  ```

- [ ] **Endpoint de páginas funciona**
  ```bash
  # Abrir en navegador:
  https://web-scuticompany-back.onrender.com/api/cms/pages
  
  # Verificar que las URLs de imágenes sean absolutas:
  # Buscar en la respuesta: "https://web-scuticompany-back.onrender.com/uploads/..."
  ```

- [ ] **Las imágenes cargan en el frontend**
  ```bash
  # Abrir: https://web-scuticompany.vercel.app
  # F12 → Network → Filtrar "uploads"
  # Todas deben retornar 200 OK
  ```

---

## 🐛 Troubleshooting

### Problema: Las imágenes aún no cargan

**Síntomas:**
- Imágenes no se ven en el frontend
- Error 404 en las peticiones de imágenes

**Diagnóstico:**

1. **Ver los logs de Render:**
   ```
   Dashboard → Tu servicio → Logs
   ```

2. **Verificar URL en la respuesta del API:**
   ```bash
   # Abrir:
   https://web-scuticompany-back.onrender.com/api/cms/pages/home
   
   # Buscar "backgroundImage"
   # Debe ser: "https://web-scuticompany-back.onrender.com/uploads/..."
   # NO debe ser: "/uploads/..." o "http://localhost:..."
   ```

3. **Verificar que BASE_URL está configurado:**
   - Render Dashboard → Environment
   - Confirmar que `BASE_URL` existe y tiene el valor correcto
   - **SIN barra final:** `https://...com` ✅, NO `https://...com/` ❌

**Soluciones:**

| Síntoma | Causa | Solución |
|---------|-------|----------|
| URLs son relativas `/uploads/...` | `BASE_URL` no configurado | Agregar `BASE_URL` en Render Environment |
| URLs tienen `localhost` | BD tiene URLs mal guardadas | Ejecutar script de limpieza (ver abajo) |
| Error 404 en imágenes | Archivos no existen en servidor | Re-subir imágenes o migrar `/uploads` |
| Error CORS | `FRONTEND_URL` incorrecto | Actualizar `FRONTEND_URL` con dominio correcto |

### Problema: Error CORS

**Síntomas:**
- Console error: "blocked by CORS policy"
- Las peticiones fallan con error de CORS

**Solución:**
```env
# En Render Environment, verificar:
FRONTEND_URL=https://web-scuticompany.vercel.app,https://www.web-scuticompany.vercel.app

# Si tienes dominio personalizado, agrégalo:
FRONTEND_URL=https://web-scuticompany.vercel.app,https://tudominio.com,https://www.tudominio.com
```

### Problema: Base de datos no conecta

**Síntomas:**
- Error en logs: "Error al conectar a la base de datos"
- Health check muestra database: false

**Solución:**
1. Verificar que `MONGODB_URI` esté configurado
2. Confirmar que la IP de Render esté en whitelist de MongoDB Atlas
3. Verificar que el string de conexión sea correcto

---

## 📁 Migrar Archivos de Uploads

Si necesitas migrar las imágenes del servidor local a Render:

### Opción 1: Re-subir desde el CMS Manager (Recomendado)

1. Acceder al CMS Manager en producción
2. Ir a Media Library
3. Subir nuevamente las imágenes
4. Actualizar las páginas con las nuevas imágenes

### Opción 2: Usar SCP/SFTP (Avanzado)

```bash
# Comprimir uploads local
cd C:\Users\pc1\Desktop\web-scuti\backend
tar -czf uploads.tar.gz uploads/

# Subir a Render (requiere configuración SSH)
# Ver documentación de Render para acceso SSH
```

### Opción 3: Usar CDN (Recomendado para producción)

Considerar usar un servicio como:
- **Cloudinary** (gratis hasta 25GB)
- **AWS S3 + CloudFront**
- **Vercel Blob Storage**

---

## 🔄 Script de Corrección (Si es necesario)

Si las URLs en la BD tienen `localhost`, ejecutar en tu máquina local:

```bash
# Conectar a MongoDB de producción
mongosh "tu-mongodb-uri-de-produccion"

# Ejecutar corrección
use web-scuti

# Ver URLs actuales
db.pages.findOne({pageSlug: 'home'}, {'content.hero.backgroundImage': 1})

# Si tienen localhost, ejecutar fix
db.pages.updateMany(
  {},
  [{
    $set: {
      "content.hero.backgroundImage.light": {
        $replaceAll: {
          input: "$content.hero.backgroundImage.light",
          find: "http://localhost:5000",
          replacement: ""
        }
      },
      "content.hero.backgroundImage.dark": {
        $replaceAll: {
          input: "$content.hero.backgroundImage.dark",
          find: "http://localhost:5000",
          replacement: ""
        }
      }
    }
  }]
)
```

---

## 📊 Monitoreo Post-Despliegue

### Logs en Tiempo Real:

```bash
# En Render Dashboard → Logs
# Filtrar por:
- "Error" (para ver problemas)
- "uploads" (para ver peticiones de imágenes)
- "MongoDB" (para ver conexión BD)
```

### Métricas a Monitorear:

1. **Uptime:** Debe estar en 99%+
2. **Response Time:** < 500ms
3. **Errores 404:** Deben ser 0 en `/uploads/*`
4. **Errores 500:** Investigar inmediatamente

---

## 🎯 Mejoras Recomendadas

### Corto Plazo:

1. **Configurar CDN para imágenes**
   - Usar Cloudinary o AWS S3
   - Mejora velocidad de carga
   - Reduce carga del servidor

2. **Implementar caché**
   - Headers de caché para imágenes
   - Cache-Control: public, max-age=31536000

3. **Comprimir imágenes automáticamente**
   - Implementar WebP automático
   - Generar thumbnails

### Largo Plazo:

1. **Implementar CI/CD**
   - GitHub Actions para tests
   - Deploy automático en merge a main

2. **Monitoring avanzado**
   - Sentry para errores
   - LogRocket para sesiones de usuario
   - Uptime monitoring

3. **Performance**
   - Redis para caché de sesiones
   - Rate limiting por usuario
   - Lazy loading de imágenes

---

## ✅ Checklist Final

Antes de considerar el despliegue completo:

- [ ] Variables de entorno configuradas
- [ ] BASE_URL apunta al dominio correcto
- [ ] CORS permite el frontend
- [ ] MongoDB conecta correctamente
- [ ] Health check responde OK
- [ ] Endpoint /api/cms/pages responde con URLs absolutas
- [ ] Las imágenes cargan en el frontend
- [ ] No hay errores en los logs de Render
- [ ] No hay errores en la consola del navegador
- [ ] Las imágenes se ven correctamente en todas las páginas
- [ ] Autenticación funciona (Clerk)
- [ ] CMS Manager funciona en producción

---

## 📞 Soporte

Si después de seguir esta guía las imágenes aún no cargan:

1. **Capturar información:**
   - Screenshot de Network tab (F12)
   - Logs de Render (últimas 50 líneas)
   - Respuesta completa de `/api/cms/pages/home`
   - Variables de entorno configuradas (sin valores sensibles)

2. **Verificar:**
   - URL exacta que se intenta cargar
   - Código de respuesta (200, 404, 500, etc.)
   - Headers de la respuesta
   - Mensaje de error en console

---

**Última actualización:** Octubre 19, 2025  
**Versión:** 1.0.0  
**Estado:** ✅ URLs corregidas en BD local, pendiente configuración en Render
