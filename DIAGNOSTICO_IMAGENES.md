# 🔍 Guía de Diagnóstico de Imágenes - Web Scuti Backend

## 📋 Resumen del Problema

Las imágenes se cargan correctamente en el backend pero no se visualizan en el frontend en producción. Este documento te ayudará a diagnosticar y solucionar el problema.

---

## 🛠️ Herramientas de Diagnóstico Disponibles

### 1. **Diagnóstico Completo de Imágenes**
```bash
npm run diagnose:images
```

**¿Qué hace?**
- ✅ Verifica la configuración de variables de entorno
- ✅ Lista archivos físicos en `/uploads`
- ✅ Consulta registros de imágenes en MongoDB
- ✅ Analiza URLs en todas las páginas
- ✅ Compara archivos físicos vs registros en BD
- ✅ Identifica URLs con formato incorrecto (localhost, relativas, etc.)
- ✅ Genera recomendaciones específicas para solucionar problemas

**Cuándo usar:** Primera ejecución para diagnóstico inicial completo.

---

### 2. **Test de Endpoints de Imágenes**
```bash
npm run test:images
```

**¿Qué hace?**
- ✅ Verifica que el servidor esté corriendo
- ✅ Prueba el endpoint `/api/cms/pages`
- ✅ Intenta acceder directamente a las imágenes
- ✅ Verifica la ruta estática `/uploads`
- ✅ Comprueba configuración CORS
- ✅ Identifica problemas de accesibilidad

**Cuándo usar:** Para verificar que los endpoints funcionen correctamente en tiempo real.

---

## 🔧 Problemas Comunes y Soluciones

### ❌ Problema 1: Variable `BASE_URL` no configurada

**Síntoma:**
- Las imágenes funcionan en desarrollo pero no en producción
- Las URLs son relativas (`/uploads/imagen.jpg`) en lugar de absolutas

**Diagnóstico:**
```bash
npm run diagnose:images
```
Busca: "BASE_URL no está configurado para producción"

**Solución:**
1. Editar el archivo `.env` en producción:
```env
BASE_URL=https://tu-dominio-backend.com
```

2. Reiniciar el servidor

**Verificar:**
```bash
npm run test:images
```

---

### ❌ Problema 2: URLs contienen "localhost"

**Síntoma:**
- Las imágenes muestran URLs como `http://localhost:5000/uploads/...`
- Funcionan localmente pero no en producción

**Diagnóstico:**
```bash
npm run diagnose:images
```
Busca: "URLs contienen 'localhost'"

**Solución:**
1. Las URLs **NO** deben guardarse con localhost en la base de datos
2. Deben guardarse como **relativas**: `/uploads/imagen.jpg`
3. El backend las transformará automáticamente usando `BASE_URL`

**Para corregir URLs existentes:**
Ejecutar en MongoDB:
```javascript
db.pages.updateMany(
  {},
  [
    {
      $set: {
        "content.hero.backgroundImage.light": {
          $replaceAll: {
            input: "$content.hero.backgroundImage.light",
            find: /http:\/\/localhost:\d+/,
            replacement: ""
          }
        }
      }
    }
  ]
)
```

O mejor: Desde el CMS Manager, actualizar las imágenes para que se guarden correctamente.

---

### ❌ Problema 3: Archivos no se sirven (404)

**Síntoma:**
- El registro existe en BD pero el archivo no se encuentra
- Error 404 al acceder a `/uploads/imagen.jpg`

**Diagnóstico:**
```bash
npm run diagnose:images
```
Busca: "Registros SIN archivo físico"

**Causas comunes:**
1. El archivo fue eliminado manualmente
2. El directorio `/uploads` no tiene los permisos correctos
3. El archivo está en una ubicación diferente

**Solución:**
1. Verificar que el directorio `/uploads` existe y tiene permisos de lectura
2. Re-subir las imágenes faltantes
3. O eliminar los registros huérfanos:

```bash
# Conectar a MongoDB
mongosh

# Usar base de datos
use web-scuti

# Listar imágenes huérfanas
db.images.find({ isOrphan: true })

# Eliminar registros sin archivo físico (CUIDADO)
# Primero hacer backup
```

---

### ❌ Problema 4: CORS bloquea las imágenes

**Síntoma:**
- Error de CORS en la consola del navegador
- Las imágenes no cargan desde el frontend

**Diagnóstico:**
```bash
npm run test:images
```
Busca la sección: "CONFIGURACIÓN CORS"

**Solución:**
1. Verificar que `FRONTEND_URL` esté configurado en `.env`:
```env
FRONTEND_URL=https://tu-frontend.com,https://www.tu-frontend.com
```

2. Verificar configuración CORS en `server.js`:
```javascript
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
```

3. Las imágenes estáticas deben ser accesibles sin CORS estricto

---

### ❌ Problema 5: Ruta estática no configurada

**Síntoma:**
- El servidor responde pero las imágenes no se encuentran
- Error 404 en `/uploads/*`

**Diagnóstico:**
Verificar en `server.js` línea ~104:
```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

**Solución:**
1. Asegurar que esta línea esté **antes** de las rutas de API
2. Verificar que el directorio `uploads` existe
3. Reiniciar el servidor

**Verificar:**
```bash
curl http://localhost:5000/uploads/nombre-archivo.jpg
```

---

## ✅ Checklist para Producción

### Antes de Desplegar

- [ ] Variables de entorno configuradas:
  - [ ] `BASE_URL` apunta a la URL pública del backend
  - [ ] `FRONTEND_URL` incluye la URL del frontend
  - [ ] `NODE_ENV=production`
  - [ ] `PORT` configurado (si es necesario)

- [ ] Directorio de uploads:
  - [ ] Directorio `/uploads` existe
  - [ ] Permisos correctos (lectura/escritura)
  - [ ] Archivos están presentes

- [ ] Código del servidor:
  - [ ] `express.static` configurado para `/uploads`
  - [ ] `transformImageUrls()` se aplica en todas las respuestas
  - [ ] CORS permite el origen del frontend

### Después de Desplegar

- [ ] Ejecutar diagnóstico:
```bash
npm run diagnose:images
```

- [ ] Probar endpoints:
```bash
npm run test:images
```

- [ ] Verificar manualmente:
  - [ ] Abrir frontend y verificar que las imágenes cargan
  - [ ] Inspeccionar red en navegador (DevTools)
  - [ ] Verificar URLs en las respuestas de API

---

## 🔍 Diagnóstico Manual

### 1. Verificar Variables de Entorno
```bash
# En el servidor
echo $BASE_URL
echo $FRONTEND_URL
echo $NODE_ENV
```

### 2. Verificar Archivos Físicos
```bash
# Listar archivos en uploads
ls -la uploads/

# Ver permisos
ls -ld uploads/
```

### 3. Probar Acceso a Imagen
```bash
# Desde el servidor
curl http://localhost:5000/uploads/nombre-archivo.jpg

# Desde fuera (reemplazar con tu dominio)
curl https://tu-backend.com/uploads/nombre-archivo.jpg
```

### 4. Ver Logs del Servidor
```bash
# Si usas PM2
pm2 logs

# O ver logs directos
tail -f logs/api.log
```

### 5. Verificar MongoDB
```bash
mongosh

use web-scuti

# Ver URLs en páginas
db.pages.find({}, { "content.hero.backgroundImage": 1 }).pretty()

# Ver registros de imágenes
db.images.find({}, { filename: 1, url: 1, isOrphan: 1 }).pretty()
```

---

## 🚨 Solución Rápida de Emergencia

Si las imágenes no funcionan en producción y necesitas una solución rápida:

### Opción A: Usar URLs Absolutas Temporalmente

1. Actualizar directamente en MongoDB:
```javascript
// Conectar a MongoDB
use web-scuti

// Actualizar todas las URLs
db.pages.updateMany(
  {},
  {
    $set: {
      "content.hero.backgroundImage.dark": {
        $concat: ["https://tu-backend.com", "$content.hero.backgroundImage.dark"]
      }
    }
  }
)
```

### Opción B: Servir Imágenes desde CDN

1. Subir imágenes a un servicio de CDN (Cloudinary, AWS S3, etc.)
2. Actualizar URLs en la base de datos
3. Cambiar en el frontend para usar URLs del CDN

---

## 📊 Interpretando los Resultados

### Script `diagnose:images`

**✅ Todo bien:**
```
✓ Configuración del servidor OK
✓ Todos los archivos tienen registro en BD
✓ Todos los registros tienen archivo físico
✓ No se encontraron URLs con localhost
✨ No se encontraron problemas
```

**⚠️ Advertencias:**
```
⚠ URLs relativas (necesitan transformación)
→ Asegurar que BASE_URL está configurado
```

**❌ Errores críticos:**
```
✗ BASE_URL no está configurado para producción
✗ URLs contienen 'localhost'
✗ Registros sin archivo físico
```

---

## 📞 Soporte y Depuración Avanzada

Si los scripts de diagnóstico no identifican el problema:

1. **Habilitar logs detallados:**
   - Editar `utils/logger.js` para aumentar verbosidad
   - Verificar logs en tiempo real durante una petición

2. **Usar herramientas de red:**
   - Chrome DevTools → Network
   - Verificar:
     - URL exacta de la petición
     - Status code
     - Headers (CORS, Content-Type)
     - Respuesta del servidor

3. **Verificar en servidor de producción:**
   ```bash
   # SSH al servidor
   ssh usuario@servidor
   
   # Navegar al proyecto
   cd /ruta/al/proyecto
   
   # Ejecutar diagnóstico
   npm run diagnose:images
   ```

4. **Logs del servidor web (si usas nginx/apache):**
   ```bash
   # Nginx
   tail -f /var/log/nginx/error.log
   
   # Apache
   tail -f /var/log/apache2/error.log
   ```

---

## 🎯 Mejores Prácticas

### Guardar URLs en Base de Datos

**❌ Incorrecto:**
```javascript
{
  backgroundImage: "http://localhost:5000/uploads/imagen.jpg"
}
```

**✅ Correcto:**
```javascript
{
  backgroundImage: "/uploads/imagen.jpg"  // Relativa
}
```

El backend transformará automáticamente a:
```javascript
{
  backgroundImage: "https://tu-backend.com/uploads/imagen.jpg"
}
```

### Estructura del Modelo Page

Las imágenes deben seguir el formato:
```javascript
{
  content: {
    hero: {
      backgroundImage: {
        light: "/uploads/imagen-light.jpg",
        dark: "/uploads/imagen-dark.jpg"
      }
    }
  }
}
```

---

## 📝 Notas Adicionales

- **Cache:** Si cambias URLs, puede ser necesario limpiar cache del navegador
- **CDN:** Si usas Cloudflare u otro CDN, verificar que no esté cacheando respuestas viejas
- **HTTPS:** En producción, asegurar que todas las URLs usen HTTPS (no mezclar HTTP/HTTPS)
- **Permisos:** El usuario que ejecuta Node.js debe tener permisos de lectura en `/uploads`

---

## 🔄 Workflow Recomendado

1. **Desarrollo local:**
   ```bash
   npm run dev
   npm run test:images  # Verificar que todo funciona
   ```

2. **Antes de commit:**
   ```bash
   npm run diagnose:images  # Verificar no hay problemas
   ```

3. **Después de desplegar:**
   ```bash
   # En producción
   npm run diagnose:images
   npm run test:images
   ```

4. **Monitoreo continuo:**
   - Configurar alertas para errores 404 en `/uploads/*`
   - Revisar logs periódicamente

---

## 🆘 Comandos de Emergencia

```bash
# Ver estado del servidor
npm run diagnose:images

# Probar endpoints
npm run test:images

# Reiniciar servidor (PM2)
pm2 restart all

# Ver logs en tiempo real
pm2 logs --lines 100

# Verificar espacio en disco
df -h

# Verificar permisos de uploads
ls -la uploads/

# Contar imágenes
ls uploads/ | wc -l
```

---

**Última actualización:** Octubre 2025  
**Autor:** Sistema de Diagnóstico Web Scuti
