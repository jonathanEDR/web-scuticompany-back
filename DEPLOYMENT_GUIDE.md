# 🚀 GUÍA DE DEPLOYMENT - Sistema de Agentes AI

## 📋 Índice de Deployment

1. [Pre-Deployment Checklist](#1-pre-deployment-checklist)
2. [Configuración de Producción](#2-configuración-de-producción)
3. [Deployment en Vercel (Frontend)](#3-deployment-en-vercel-frontend)
4. [Deployment en Render (Backend)](#4-deployment-en-render-backend)
5. [Deployment en Heroku (Alternativa)](#5-deployment-en-heroku-alternativa)
6. [Setup de Dominio](#6-setup-de-dominio)
7. [Monitoreo y Alertas](#7-monitoreo-y-alertas)
8. [Rollback y Recuperación](#8-rollback-y-recuperación)

---

## 1. Pre-Deployment Checklist

### Verificación Backend

```bash
# 1. Asegurarse que todas las dependencias están instaladas
npm install --production
npm audit fix

# 2. Ejecutar linter
npx eslint . --fix

# 3. Ejecutar tests
npm test

# 4. Verificar variables de entorno
echo "PORT: $PORT"
echo "MONGODB_URI: $MONGODB_URI" (no mostrar valor completo)
echo "OPENAI_API_KEY: ${OPENAI_API_KEY:0:10}..."
echo "CLERK_WEBHOOK_SECRET: ${CLERK_WEBHOOK_SECRET:0:10}..."

# 5. Build check (si aplica)
npm run build

# 6. Verificar que no hay secrets en repo
git grep -i "password\|secret\|token" --exclude-dir=node_modules

# 7. Health check local
curl http://localhost:5000/api/agents/health-advanced
```

### Verificación Frontend

```bash
# 1. Frontend en carpeta separada
cd frontend

# 2. Install dependencies
npm install

# 3. Build para producción
npm run build

# 4. Verificar build sin errores
ls -la .next/  # Si es Next.js
ls -la build/  # Si es CRA

# 5. Verificar env variables
cat .env.local

# 6. Test de producción localmente
npm start  # o npm run start si es Next.js

# 7. Verificar conectividad a API
curl -H "Authorization: Bearer [test-token]" \
  http://localhost:3000/api/agents/health-advanced
```

### Checklist de Documentación

```
- [ ] README actualizado con instrucciones de deploy
- [ ] Documentación de API actualizada
- [ ] Variables de entorno documentadas
- [ ] Scripts de deployment documentados
- [ ] Procedimiento de rollback documentado
- [ ] Contactos de emergencia establecidos
- [ ] Runbook creado para operaciones
```

### Checklist de Seguridad

```
- [ ] Todos los secrets en .env, NO en código
- [ ] SSL/TLS configurado
- [ ] CORS configurado correctamente
- [ ] Rate limiting activado
- [ ] Input validation activado
- [ ] CSRF protection configurado
- [ ] Headers de seguridad (CSP, X-Frame-Options, etc)
- [ ] Credenciales de BD no en código
- [ ] API keys rotadas recientemente
```

---

## 2. Configuración de Producción

### Backend Environment

**`.env.production`**:

```bash
# NODE ENVIRONMENT
NODE_ENV=production

# PORT
PORT=3000  # O el puerto que use tu plataforma

# DATABASE
MONGODB_URI=mongodb+srv://[username]:[password]@cluster.mongodb.net/web-scuti?retryWrites=true&w=majority
MONGODB_OPTIONS={"maxPoolSize": 10, "minPoolSize": 5}

# OPENAI
OPENAI_API_KEY=sk-[tu-key-aqui]
OPENAI_MODEL=gpt-4o
OPENAI_MAX_TOKENS=4000

# CLERK (Auth)
CLERK_WEBHOOK_SECRET=[tu-secret]
CLERK_PUBLISHABLE_KEY=[tu-key]
CLERK_SECRET_KEY=[tu-secret]

# CLOUDINARY (Images)
CLOUDINARY_NAME=[tu-name]
CLOUDINARY_API_KEY=[tu-key]
CLOUDINARY_API_SECRET=[tu-secret]

# EMAIL SERVICE
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=[tu-key]
EMAIL_FROM=noreply@web-scuti.com

# LOGGING
LOG_LEVEL=info
LOG_DIR=/var/log/web-scuti

# SECURITY
BCRYPT_ROUNDS=12
JWT_EXPIRY=7d
SESSION_SECRET=[generar-con-crypto.randomBytes(32).toString('hex')]

# FRONTEND URL
FRONTEND_URL=https://web-scuti.com

# REDIS (Opcional)
REDIS_URL=redis://[user]:[password]@[host]:[port]

# FEATURE FLAGS
ENABLE_MEMORY_SYSTEM=true
ENABLE_PROMPT_SYSTEM=true
ENABLE_LEARNING_SYSTEM=true
CACHE_TTL=300000
```

### Frontend Environment

**`frontend/.env.production`**:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.web-scuti.com
NEXT_PUBLIC_API_TIMEOUT=30000

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=[tu-key]
CLERK_SECRET_KEY=[tu-secret]

# Features
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_CRASH_REPORTING=true

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://[id]@[organization].ingest.sentry.io/[project]

# Other
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Configuración de Node.js Production

**`server.js` - verificar configuración**:

```javascript
// Al inicio del archivo
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Starting in PRODUCTION mode');
  
  // Compress responses
  app.use(require('compression')());
  
  // Security headers
  app.use(require('helmet')());
  
  // Rate limiting
  const rateLimit = require('express-rate-limit');
  app.use(require('express-rate-limit')({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite de 100 requests por ventana
    message: 'Demasiadas solicitudes, intenta más tarde'
  }));
  
  // Trust proxy
  app.set('trust proxy', 1);
  
  // Disable x-powered-by
  app.disable('x-powered-by');
}
```

---

## 3. Deployment en Vercel (Frontend)

### Instalación y Setup

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Link proyecto (primera vez)
cd frontend
vercel link

# O crear nuevo proyecto
vercel
```

### Configuración `vercel.json`

**`frontend/vercel.json`**:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "public": false,
  "framework": "nextjs",
  "env": [
    {
      "key": "NEXT_PUBLIC_API_URL",
      "value": "https://api.web-scuti.com"
    },
    {
      "key": "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
      "value": "@clerk_key"
    }
  ],
  "headers": [
    {
      "source": "/api/:path*",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=300" }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/old-path",
      "destination": "/new-path",
      "permanent": true
    }
  ]
}
```

### Deploy

```bash
# 1. Deploy a preview (desarrollo)
vercel --env-file .env.preview

# 2. Deploy a production
vercel --prod --env-file .env.production

# 3. Con git (automático)
git push origin main
# Vercel automáticamente detecta y deploya

# 4. Ver logs
vercel logs [deployment-id]

# 5. Ver estado
vercel status
```

### Github Integration

1. Ir a vercel.com/dashboard
2. Settings → Git
3. Conectar repo de GitHub
4. Auto-deploy en cada push a `main`

---

## 4. Deployment en Render (Backend)

### Setup en Render

1. **Crear cuenta**: https://render.com
2. **Conectar GitHub**
3. **Crear nuevo servicio Web Service**

### Configuración `render.yaml`

**`render.yaml`** (en raíz del repo):

```yaml
services:
  - type: web
    name: web-scuti-api
    env: node
    plan: standard
    region: oregon
    
    buildCommand: npm install && npm run build
    startCommand: npm start
    
    healthCheckPath: /api/agents/health-advanced
    healthCheckInterval: 30
    
    envVars:
      - key: NODE_ENV
        value: production
      
      - key: MONGODB_URI
        fromDatabase:
          name: web-scuti-db
          property: connectionString
      
      - key: OPENAI_API_KEY
        sync: false  # Manual sync desde UI
      
      - key: PORT
        value: 3000
    
    autoDeploy: true
    
databases:
  - name: web-scuti-db
    databaseName: web-scuti
    region: oregon
```

### Deploy Steps

1. **Crear base de datos MongoDB en Render**:
   - Dashboard → Databases → New Database
   - Llenar credenciales

2. **Crear servicio Web**:
   - Dashboard → Services → New Web Service
   - Seleccionar repo GitHub
   - Usar `render.yaml`

3. **Agregar variables de entorno**:
   - Settings → Environment
   - Pegar variables de `.env.production`

4. **Deployer**:
   ```bash
   git push origin main
   # Render automáticamente deploya
   ```

5. **Ver logs**:
   - Dashboard → Logs en real-time

---

## 5. Deployment en Heroku (Alternativa)

### Setup Heroku

```bash
# 1. Instalar CLI
npm install -g heroku

# 2. Login
heroku login

# 3. Crear app (primera vez)
heroku create web-scuti-api

# O usar uno existente
heroku apps:info web-scuti-api
```

### Procfile

**`Procfile`** (en raíz):

```
web: npm start
worker: node scripts/learningWorker.js
```

### Deploy

```bash
# 1. Push a Heroku
git push heroku main

# 2. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="mongodb+srv://..."
heroku config:set OPENAI_API_KEY="sk-..."

# 3. Ver variables
heroku config

# 4. Ver logs
heroku logs --tail

# 5. Restart
heroku restart

# 6. Scale dynos
heroku ps:scale web=1 worker=1
```

### Buildpack

```bash
# Buildpack automático para Node.js es agregado por defecto
# Si necesitas custom:
heroku buildpacks:set heroku/nodejs
```

---

## 6. Setup de Dominio

### Comprar Dominio

1. **Registrador**: Namecheap, GoDaddy, etc.
2. **Comprar**: `web-scuti.com`
3. **Notepad DNS nameservers**

### Configurar DNS

#### Si usas Vercel (Frontend)

1. Vercel Dashboard → Domains
2. Add Domain: `web-scuti.com`
3. Seguir instrucciones para cambiar nameservers
4. Automáticamente Vercel configura DNS

#### Si usas Cloudflare (Recomendado)

```bash
# 1. Crear cuenta: cloudflare.com
# 2. Add Site: web-scuti.com
# 3. Change nameservers en registrador
# 4. Cloudflare configura automáticamente

# DNS Records necesarios:
# A    @ → [IP del backend]
# CNAME www → web-scuti.com
# CNAME api → render.com url
# TXT @ → [Verification]
```

### Configurar SSL/TLS

**Vercel**: Automático (Let's Encrypt)
**Render**: Automático (Let's Encrypt)
**Heroku**: `heroku certs:auto:enable`

---

## 7. Monitoreo y Alertas

### Monitoreo Backend

```bash
# 1. Usar PM2 (Process Manager)
npm install -g pm2

pm2 start server.js --name "web-scuti-api"
pm2 monit
pm2 save
```

### Setup Sentry (Error Tracking)

**Backend**:

```javascript
// server.js - top
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.requestHandler());

// ... rutas ...

app.use(Sentry.Handlers.errorHandler());
```

**Frontend**:

```javascript
// pages/_app.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_APP_ENV,
  tracesSampleRate: 1.0
});
```

### Health Checks

```bash
# 1. Crear script de health check
# scripts/healthCheck.js

const checkHealth = async () => {
  try {
    const response = await fetch(
      `${process.env.API_URL}/api/agents/health-advanced`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TEST_TOKEN}`
        }
      }
    );
    
    if (!response.ok) {
      console.error('Health check failed:', response.status);
      process.exit(1);
    }
    
    console.log('✅ Health check passed');
  } catch (error) {
    console.error('Health check error:', error);
    process.exit(1);
  }
};

checkHealth();

# 2. Ejecutar periódicamente
crontab -e
# Agregar: */5 * * * * node scripts/healthCheck.js

# 3. O usar servicio externo
# - Uptime Robot (gratuito)
# - Better Stack
# - Datadog
```

### Monitoring Dashboard

**Setup Datadog** (opcional pero recomendado):

```bash
# 1. Crear cuenta en datadoghq.com
# 2. Instalar agent en servidor
# 3. Conectar MongoDB, Redis, etc.
# 4. Crear dashboards personalizados
# 5. Setup alertas
```

---

## 8. Rollback y Recuperación

### Rollback Rápido

#### Vercel

```bash
# Ver deployments
vercel ls

# Rollback a versión anterior
vercel rollback

# O específicamente
vercel rollback [deployment-id]
```

#### Render

```bash
# Via UI:
# Dashboard → Deployments → Seleccionar anterior → Redeploy
```

#### Git Rollback

```bash
# Ver commits
git log --oneline

# Revert a commit anterior
git revert [commit-id]
git push origin main

# O reset completo (cuidado!)
git reset --hard [commit-id]
git push --force origin main
```

### Database Backup/Restore

```bash
# MongoDB - Backup
mongodump --uri="mongodb+srv://..." --out ./backup

# MongoDB - Restore
mongorestore --uri="mongodb+srv://..." ./backup

# O usando Atlas Backup (automático en MongoDB Atlas)
# Dashboard → Backups → Restore
```

### Disaster Recovery Plan

```
1. DETECCIÓN
   - Alertas disparan
   - Equipo notificado

2. EVALUACIÓN (5 min)
   - ¿Qué servicios afectados?
   - ¿Qué datos comprometidos?
   - ¿Alcance del daño?

3. COMUNICACIÓN
   - Notificar usuarios
   - Status page update
   - Estimación de ETA

4. ACCIÓN
   - Rollback si aplica
   - Hotfix si es rápido
   - Mantenimiento si es grande

5. VERIFICACIÓN
   - Validar funcionalidad
   - Revisar logs
   - Confirmar recuperación

6. POST-MORTEM
   - Analizar qué falló
   - Implementar fixes
   - Update documentación
```

---

## 📋 Checklist Final de Deployment

### Pre-Deploy
- [ ] Todos los tests pasan
- [ ] No hay warnings en build
- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada
- [ ] Backups creados
- [ ] Team notificado
- [ ] Runbook preparado

### Deploy
- [ ] Código pushed a producción
- [ ] Build completa sin errores
- [ ] Servicios arrancaron correctamente
- [ ] Health checks pasan
- [ ] API respondiendo
- [ ] Frontend cargando
- [ ] SSO funcionando (Clerk)

### Post-Deploy
- [ ] Verificar en navegador
- [ ] Probar flujos críticos
- [ ] Revisar logs
- [ ] Confirmar métricas
- [ ] Health monitoring activo
- [ ] Team notificado de éxito
- [ ] Documentación actualizada

---

## 🆘 Troubleshooting Deploy

### Build Falla

```bash
# 1. Ver logs detallados
npm run build --verbose

# 2. Limpiar caché
rm -rf node_modules package-lock.json
npm install

# 3. Verificar dependencias
npm audit fix

# 4. Check Node version
node --version  # Debe ser >= 16
```

### API No Responde

```bash
# 1. Ver si está corriendo
ps aux | grep node

# 2. Ver logs
pm2 logs
# o en plataforma (Render/Heroku)

# 3. Revisar puerto
lsof -i :3000

# 4. Reiniciar
pm2 restart web-scuti-api
# o redeploy en plataforma
```

### Database Connection Fails

```bash
# 1. Verificar URI
echo $MONGODB_URI

# 2. Verificar IP whitelist
# MongoDB Atlas → Network Access

# 3. Test conexión
mongosh "$MONGODB_URI"

# 4. Revisar credenciales
# ¿Usuario tiene permisos?
# ¿Password tiene caracteres especiales?
```

### Performance Lenta

```bash
# 1. Revisar índices
db.collection.getIndexes()

# 2. Monitorear queries
mongosh > db.setProfilingLevel(1)

# 3. Ver resources
htop  # CPU, Memoria
free -h  # Memoria disponible

# 4. Escalar si es necesario
# Upgrade dyno en Heroku
# O upgrade plan en Render
```

---

## 📞 Recursos Útiles

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Heroku Docs**: https://devcenter.heroku.com/
- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **Cloudflare**: https://www.cloudflare.com/
- **Sentry**: https://sentry.io/

---

## 🎯 Próximos Pasos

1. ✅ Completar checklist pre-deployment
2. ✅ Configurar todas las variables de entorno
3. ✅ Deploy frontend a Vercel
4. ✅ Deploy backend a Render (o tu plataforma)
5. ✅ Configurar dominio y SSL
6. ✅ Setup monitoreo con Sentry
7. ✅ Validar en producción
8. ✅ Comunicar a usuarios

**¡Tu sistema de AI Agents está listo para producción! 🚀**