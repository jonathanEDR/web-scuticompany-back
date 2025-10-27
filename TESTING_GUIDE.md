# 🧪 TESTING DEL MÓDULO DE SERVICIOS

## ✅ ESTADO DEL SEED
- **5 servicios** creados exitosamente
- **14 paquetes** creados exitosamente

---

## 📋 PLAN DE TESTING

### **Fase 1: Endpoints Públicos (Sin autenticación)**
- [ ] GET /api/servicios - Listar todos
- [ ] GET /api/servicios/:id - Ver detalle
- [ ] GET /api/servicios/destacados
- [ ] GET /api/servicios/buscar?q=web
- [ ] GET /api/servicios/categoria/desarrollo
- [ ] GET /api/servicios/:id/paquetes

### **Fase 2: Endpoints con ADMIN**
- [ ] POST /api/servicios - Crear
- [ ] PUT /api/servicios/:id - Editar
- [ ] DELETE /api/servicios/:id - Eliminar
- [ ] GET /api/servicios/dashboard
- [ ] GET /api/servicios/stats
- [ ] POST /api/servicios/:id/duplicar
- [ ] POST /api/servicios/:id/paquetes

### **Fase 3: Endpoints con MODERATOR**
- [ ] POST /api/servicios - Crear (debe funcionar)
- [ ] PUT /api/servicios/:id - Editar propio (debe funcionar)
- [ ] PUT /api/servicios/:otro_id - Editar otro (debe fallar)
- [ ] DELETE /api/servicios/:id - Eliminar (debe fallar)

### **Fase 4: Validaciones**
- [ ] Crear servicio sin token (debe fallar)
- [ ] Crear servicio con token CLIENT (debe fallar)
- [ ] Ver dashboard con token MODERATOR (debe funcionar)
- [ ] Ownership validation

---

## 🚀 COMANDOS PARA TESTING

### **1. Iniciar el servidor**
```powershell
npm run dev
```

### **2. Testing con curl (PowerShell)**

#### Listar servicios (Público)
```powershell
curl http://localhost:5000/api/servicios
```

#### Ver servicio específico
```powershell
curl http://localhost:5000/api/servicios/desarrollo-web-profesional
```

#### Ver destacados
```powershell
curl http://localhost:5000/api/servicios/destacados
```

#### Buscar servicios
```powershell
curl "http://localhost:5000/api/servicios/buscar?q=web"
```

#### Ver paquetes de un servicio
```powershell
# Primero obtén el ID de un servicio de la lista
curl http://localhost:5000/api/servicios/:servicioId/paquetes
```

---

## 🔐 TESTING CON AUTENTICACIÓN

### **Necesitas un token de Clerk:**

1. **Login en tu frontend** con un usuario
2. **Capturar el JWT token** desde:
   - DevTools → Network → Headers → Authorization
   - O desde localStorage/cookies

3. **Usar el token en las requests:**

```powershell
# Variable con token
$token = "tu_token_aqui"

# Dashboard (requiere auth)
curl -H "Authorization: Bearer $token" http://localhost:5000/api/servicios/dashboard

# Crear servicio (requiere auth + permisos)
curl -X POST -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d '{\"titulo\":\"Test Service\",\"categoria\":\"desarrollo\",\"precio\":1000}' http://localhost:5000/api/servicios

# Ver estadísticas
curl -H "Authorization: Bearer $token" http://localhost:5000/api/servicios/stats
```

---

## 📊 RESULTADOS ESPERADOS

### **Endpoints Públicos:**
✅ Status 200 OK
✅ JSON con datos de servicios
✅ Sin necesidad de autenticación

### **Endpoints Protegidos sin token:**
❌ Status 401 Unauthorized
❌ Message: "Token de autenticación requerido"

### **Endpoints con token pero sin permisos:**
❌ Status 403 Forbidden
❌ Message: "Insufficient permissions"

### **Endpoints con token y permisos correctos:**
✅ Status 200/201 OK
✅ Operación exitosa

---

## 🎯 TESTING MANUAL EN THUNDER CLIENT / POSTMAN

### **Colección de Requests:**

#### 1. **Ver Servicios** (Público)
```
GET http://localhost:5000/api/servicios
```

#### 2. **Ver Dashboard** (Auth requerido)
```
GET http://localhost:5000/api/servicios/dashboard
Headers:
  Authorization: Bearer {{token}}
```

#### 3. **Crear Servicio** (Auth + Permisos)
```
POST http://localhost:5000/api/servicios
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json
Body:
{
  "titulo": "Servicio de Prueba",
  "descripcion": "Descripción del servicio de prueba",
  "categoria": "desarrollo",
  "tipoPrecio": "fijo",
  "precio": 1500,
  "estado": "activo",
  "icono": "🚀",
  "caracteristicas": [
    "Característica 1",
    "Característica 2"
  ],
  "etiquetas": ["test", "prueba"]
}
```

#### 4. **Editar Servicio** (Auth + Ownership)
```
PUT http://localhost:5000/api/servicios/:id
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json
Body:
{
  "precio": 2000,
  "estado": "pausado"
}
```

#### 5. **Duplicar Servicio** (Auth + Permisos)
```
POST http://localhost:5000/api/servicios/:id/duplicar
Headers:
  Authorization: Bearer {{token}}
```

#### 6. **Ver Estadísticas** (Auth + Permisos)
```
GET http://localhost:5000/api/servicios/stats/ventas?periodo=6meses
Headers:
  Authorization: Bearer {{token}}
```

---

## 🧪 CHECKLIST DE TESTING

### **Funcionalidad Básica**
- [ ] Servidor arranca sin errores
- [ ] Endpoints públicos responden
- [ ] JSON válido en respuestas
- [ ] Paginación funciona
- [ ] Filtros funcionan

### **Autenticación**
- [ ] Endpoints protegidos requieren token
- [ ] Token inválido es rechazado
- [ ] Token válido es aceptado
- [ ] req.user se popula correctamente

### **Autorización**
- [ ] SUPER_ADMIN tiene acceso total
- [ ] ADMIN tiene acceso total a servicios
- [ ] MODERATOR puede crear pero no eliminar
- [ ] MODERATOR solo edita sus servicios
- [ ] CLIENT/USER no pueden modificar

### **Ownership**
- [ ] Usuario se asigna como responsable al crear
- [ ] Moderator puede editar solo sus servicios
- [ ] Admin puede editar cualquier servicio
- [ ] Mensaje de error apropiado para ownership

### **CRUD Completo**
- [ ] Crear servicio funciona
- [ ] Leer servicio funciona
- [ ] Actualizar servicio funciona
- [ ] Eliminar servicio funciona
- [ ] Soft delete funciona
- [ ] Restaurar funciona

### **Paquetes**
- [ ] Crear paquete funciona
- [ ] Listar paquetes funciona
- [ ] Editar paquete funciona
- [ ] Eliminar paquete funciona
- [ ] Duplicar paquete funciona

### **Estadísticas**
- [ ] Dashboard muestra datos correctos
- [ ] Stats generales funcionan
- [ ] Stats de ventas funcionan
- [ ] Métricas de conversión funcionan

---

## 📝 REGISTRO DE PRUEBAS

### **Servicios Creados en Seed:**
1. 🌐 Desarrollo Web Profesional (3 paquetes)
2. 📱 Apps Móviles (3 paquetes)
3. 🔍 SEO & Marketing Digital (3 paquetes)
4. 💼 Consultoría Tecnológica (2 paquetes)
5. 🔧 Mantenimiento y Soporte (3 paquetes)

**Total: 5 servicios, 14 paquetes**

---

## 🐛 ERRORES COMUNES

### Error: "Token de autenticación requerido"
**Solución:** Agregar header `Authorization: Bearer <token>`

### Error: "Usuario no encontrado. Sincronización requerida"
**Solución:** El usuario de Clerk no está sincronizado en MongoDB. Hacer login una vez.

### Error: "Insufficient permissions"
**Solución:** El rol del usuario no tiene el permiso requerido. Verificar rol en MongoDB.

### Error: "Solo puedes editar servicios de los que eres responsable"
**Solución:** Como MODERATOR, solo puedes editar servicios donde `responsable === tu_id`

### Warning: "Duplicate schema index on slug"
**Info:** No afecta funcionalidad. Es un warning de Mongoose sobre índices duplicados.

---

## ✅ CRITERIOS DE ÉXITO

### **Testing Completo Exitoso si:**
✅ Todos los endpoints públicos responden correctamente
✅ Autenticación funciona (rechaza sin token, acepta con token)
✅ Autorización funciona (roles tienen permisos correctos)
✅ Ownership validation funciona (MODERATOR solo edita sus servicios)
✅ CRUD completo funciona
✅ Dashboard muestra datos reales
✅ Sin errores en consola del servidor
✅ Respuestas JSON bien formateadas

---

**Última actualización:** 26 de Octubre, 2025
