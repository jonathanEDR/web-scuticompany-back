# 🗄️ API MongoDB - Web Scuti

Documentación de los endpoints de la API con MongoDB.

## 📊 Modelo: Servicio

### Estructura del Modelo

```javascript
{
  titulo: String,          // Obligatorio, máx 100 caracteres
  descripcion: String,     // Obligatorio, máx 500 caracteres
  icono: String,           // Emoji o URL del icono
  precio: Number,          // Precio en tu moneda
  categoria: String,       // 'desarrollo', 'diseño', 'marketing', 'consultoría', 'otro'
  destacado: Boolean,      // Si aparece en destacados
  activo: Boolean,         // Si está visible
  imagenes: [String],      // Array de URLs de imágenes
  caracteristicas: [String], // Lista de características
  metaTitle: String,       // Para SEO, máx 60 caracteres
  metaDescription: String, // Para SEO, máx 160 caracteres
  slug: String,            // URL amigable (auto-generado)
  createdAt: Date,         // Auto-generado
  updatedAt: Date          // Auto-generado
}
```

## 🛣️ Endpoints Disponibles

### Base URL
```
http://localhost:5000/api
```

---

## 📋 Servicios

### 1. Obtener todos los servicios
```http
GET /api/servicios
```

**Query Parameters (opcionales):**
- `categoria` - Filtrar por categoría (desarrollo, diseño, marketing, consultoría, otro)
- `destacado` - Filtrar destacados (true/false)
- `activo` - Filtrar activos (true/false, default: true)

**Ejemplo:**
```bash
GET /api/servicios?categoria=desarrollo&destacado=true
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "...",
      "titulo": "Desarrollo Web Profesional",
      "descripcion": "...",
      "precio": 1500,
      "categoria": "desarrollo",
      "destacado": true,
      ...
    }
  ]
}
```

---

### 2. Obtener un servicio por ID o slug
```http
GET /api/servicios/:id
```

**Parámetros:**
- `id` - Puede ser el ID de MongoDB o el slug

**Ejemplos:**
```bash
GET /api/servicios/507f1f77bcf86cd799439011
GET /api/servicios/desarrollo-web-profesional
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "titulo": "Desarrollo Web Profesional",
    "descripcion": "...",
    "slug": "desarrollo-web-profesional",
    ...
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "message": "Servicio no encontrado"
}
```

---

### 3. Crear un servicio
```http
POST /api/servicios
```

**Body (JSON):**
```json
{
  "titulo": "Nuevo Servicio",
  "descripcion": "Descripción completa del servicio",
  "icono": "🚀",
  "precio": 1000,
  "categoria": "desarrollo",
  "destacado": false,
  "caracteristicas": [
    "Característica 1",
    "Característica 2"
  ],
  "metaTitle": "Nuevo Servicio | Web Scuti",
  "metaDescription": "Descripción SEO del servicio"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Servicio creado exitosamente",
  "data": {
    "_id": "...",
    "titulo": "Nuevo Servicio",
    "slug": "nuevo-servicio",
    ...
  }
}
```

---

### 4. Actualizar un servicio
```http
PUT /api/servicios/:id
```

**Body (JSON) - Campos a actualizar:**
```json
{
  "precio": 1200,
  "destacado": true
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Servicio actualizado exitosamente",
  "data": { ... }
}
```

---

### 5. Eliminar un servicio
```http
DELETE /api/servicios/:id
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Servicio eliminado exitosamente",
  "data": {}
}
```

---

### 6. Obtener servicios destacados
```http
GET /api/servicios/destacados
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [ ... ]
}
```

---

## 🧪 Probar la API

### Con Thunder Client (VS Code) o Postman

1. **GET** `http://localhost:5000/api/servicios` - Ver todos
2. **GET** `http://localhost:5000/api/servicios/destacados` - Ver destacados
3. **POST** `http://localhost:5000/api/servicios` - Crear nuevo
4. **PUT** `http://localhost:5000/api/servicios/:id` - Actualizar
5. **DELETE** `http://localhost:5000/api/servicios/:id` - Eliminar

### Con cURL

```bash
# Obtener todos los servicios
curl http://localhost:5000/api/servicios

# Crear un servicio
curl -X POST http://localhost:5000/api/servicios \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Test Servicio",
    "descripcion": "Descripción de prueba",
    "precio": 500,
    "categoria": "otro"
  }'

# Actualizar un servicio
curl -X PUT http://localhost:5000/api/servicios/ID_AQUI \
  -H "Content-Type: application/json" \
  -d '{"precio": 600}'

# Eliminar un servicio
curl -X DELETE http://localhost:5000/api/servicios/ID_AQUI
```

---

## 🌱 Poblar Base de Datos

### Importar datos de ejemplo:
```bash
npm run seed
```

### Eliminar todos los datos:
```bash
npm run seed:delete
```

---

## ⚙️ Configuración

### Variables de Entorno (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/web-scuti
```

### Iniciar MongoDB

**Windows:**
```bash
mongod
```

**O usar MongoDB Compass** para gestión visual

---

## 🔍 Características Implementadas

✅ CRUD completo (Create, Read, Update, Delete)
✅ Filtros y búsquedas
✅ Validaciones de datos
✅ Generación automática de slugs
✅ Timestamps automáticos
✅ Campos para SEO
✅ Manejo de errores
✅ Respuestas consistentes
✅ Índices para optimización

---

## 📚 Próximas Mejoras

- [ ] Paginación de resultados
- [ ] Búsqueda por texto (search)
- [ ] Autenticación y autorización
- [ ] Upload de imágenes
- [ ] Rate limiting
- [ ] Caché con Redis
- [ ] Tests automatizados
- [ ] Logs estructurados
