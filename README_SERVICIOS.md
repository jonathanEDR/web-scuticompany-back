# 📦 MÓDULO DE SERVICIOS - Guía de Uso

## 🚀 Inicio Rápido

### 1. Ejecutar el Seed de Servicios

Para poblar la base de datos con servicios de ejemplo:

```powershell
npm run seed:servicios
```

O directamente:

```powershell
node scripts/seedServicios.js
```

Esto creará 5 servicios predefinidos con sus paquetes:
- 🌐 Desarrollo Web Profesional (3 paquetes)
- 📱 Apps Móviles (3 paquetes)
- 🔍 SEO & Marketing Digital (3 paquetes)
- 💼 Consultoría Tecnológica (2 paquetes)
- 🔧 Mantenimiento y Soporte (3 paquetes)

---

## 📚 API Endpoints

### **SERVICIOS**

#### Obtener todos los servicios
```http
GET /api/servicios
```

**Query params opcionales:**
- `categoria` - Filtrar por categoría (desarrollo, diseño, marketing, consultoría, mantenimiento)
- `estado` - Filtrar por estado (activo, desarrollo, pausado, descontinuado)
- `destacado` - true/false
- `activo` - true/false
- `visibleEnWeb` - true/false
- `etiqueta` - Filtrar por etiqueta
- `precioMin` - Precio mínimo
- `precioMax` - Precio máximo
- `tipoPrecio` - fijo, rango, paquetes, personalizado, suscripcion
- `departamento` - ventas, desarrollo, marketing, diseño, soporte
- `sort` - Campo de ordenamiento (ej: -createdAt, precio, orden)
- `page` - Página (default: 1)
- `limit` - Límite por página (default: 10)
- `includeDeleted` - true para incluir eliminados

**Ejemplo:**
```http
GET /api/servicios?categoria=desarrollo&destacado=true&limit=5
```

---

#### Obtener un servicio
```http
GET /api/servicios/:id
```

Puedes usar el ID de MongoDB o el slug:
```http
GET /api/servicios/desarrollo-web-profesional
GET /api/servicios/507f1f77bcf86cd799439011
```

**Query params:**
- `includePaquetes` - true (default) para incluir paquetes

---

#### Crear un servicio
```http
POST /api/servicios
Content-Type: application/json

{
  "titulo": "Mi Nuevo Servicio",
  "descripcion": "Descripción detallada del servicio...",
  "categoria": "desarrollo",
  "tipoPrecio": "paquetes",
  "precioMin": 1000,
  "precioMax": 5000,
  "duracion": {
    "valor": 4,
    "unidad": "semanas"
  },
  "estado": "activo",
  "destacado": true,
  "icono": "🚀",
  "colorIcono": "#4F46E5",
  "colorFondo": "#EEF2FF",
  "caracteristicas": [
    "Característica 1",
    "Característica 2"
  ],
  "etiquetas": ["web", "frontend"]
}
```

---

#### Actualizar un servicio
```http
PUT /api/servicios/:id
Content-Type: application/json

{
  "titulo": "Título actualizado",
  "precio": 2500,
  "estado": "activo"
}
```

---

#### Eliminar un servicio (soft delete)
```http
DELETE /api/servicios/:id/soft
```

El servicio se marca como eliminado pero no se borra de la BD.

---

#### Eliminar permanentemente
```http
DELETE /api/servicios/:id
```

---

#### Restaurar un servicio eliminado
```http
PATCH /api/servicios/:id/restaurar
```

---

#### Duplicar un servicio
```http
POST /api/servicios/:id/duplicar
```

Crea una copia del servicio con todos sus paquetes.

---

#### Cambiar estado de un servicio
```http
PATCH /api/servicios/:id/estado
Content-Type: application/json

{
  "estado": "desarrollo"
}
```

Estados válidos: `activo`, `desarrollo`, `pausado`, `descontinuado`, `agotado`

---

#### Cambiar estado masivo
```http
PATCH /api/servicios/bulk/estado
Content-Type: application/json

{
  "ids": ["id1", "id2", "id3"],
  "estado": "activo"
}
```

---

#### Obtener servicios destacados
```http
GET /api/servicios/destacados
```

---

#### Buscar servicios
```http
GET /api/servicios/buscar?q=web&categoria=desarrollo
```

---

#### Servicios por categoría
```http
GET /api/servicios/categoria/desarrollo
```

---

#### Top servicios más vendidos
```http
GET /api/servicios/top/vendidos?limit=5
```

---

### **PAQUETES**

#### Obtener paquetes de un servicio
```http
GET /api/servicios/:servicioId/paquetes
```

**Query params:**
- `disponibles` - true/false (default: true)

---

#### Crear un paquete
```http
POST /api/servicios/:servicioId/paquetes
Content-Type: application/json

{
  "nombre": "Premium",
  "descripcion": "Paquete premium con todas las funcionalidades",
  "precio": 5000,
  "caracteristicas": [
    {
      "texto": "Páginas ilimitadas",
      "incluido": true
    },
    {
      "texto": "Soporte 24/7",
      "incluido": true
    }
  ],
  "destacado": true,
  "etiqueta": "Mejor Valor"
}
```

---

#### Actualizar un paquete
```http
PUT /api/paquetes/:id
Content-Type: application/json

{
  "precio": 4500,
  "disponible": true
}
```

---

#### Eliminar un paquete
```http
DELETE /api/paquetes/:id
```

---

#### Duplicar un paquete
```http
POST /api/paquetes/:id/duplicar
```

---

#### Registrar venta de un paquete
```http
POST /api/paquetes/:id/venta
Content-Type: application/json

{
  "cantidad": 1
}
```

Esto actualiza las métricas del paquete y del servicio.

---

#### Obtener paquete más popular
```http
GET /api/servicios/:servicioId/paquetes/popular
```

---

### **ESTADÍSTICAS Y DASHBOARD**

#### Dashboard principal
```http
GET /api/servicios/dashboard
```

Retorna:
- Servicios activos, en progreso, completados
- Ingresos del mes, año y total
- Top 5 servicios más vendidos
- Servicios por categoría

---

#### Estadísticas generales
```http
GET /api/servicios/stats
```

Retorna:
- Servicios por estado
- Promedios (precio, ventas, ingresos, rating)

---

#### Estadísticas de ventas
```http
GET /api/servicios/stats/ventas?periodo=6meses
```

**Periodos válidos:**
- `7dias`
- `30dias`
- `3meses`
- `6meses` (default)
- `anio`

Retorna:
- Tendencia de ventas por mes
- Servicios más vendidos en el periodo
- Categorías más populares

---

#### Métricas de conversión
```http
GET /api/servicios/stats/conversion
```

Retorna métricas de vistas, ventas y tasas de conversión por servicio.

---

#### Estadísticas de paquetes de un servicio
```http
GET /api/servicios/:id/stats/paquetes
```

---

## 🎨 Ejemplos de Uso

### Crear un servicio completo con paquetes

**1. Crear el servicio:**
```http
POST /api/servicios
{
  "titulo": "Diseño Gráfico Profesional",
  "descripcion": "Servicios de diseño gráfico...",
  "categoria": "diseño",
  "tipoPrecio": "paquetes",
  "precioMin": 500,
  "precioMax": 2000,
  "estado": "activo",
  "icono": "🎨",
  "destacado": true
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Servicio creado exitosamente",
  "data": {
    "_id": "65abc123...",
    "titulo": "Diseño Gráfico Profesional",
    "slug": "diseno-grafico-profesional",
    ...
  }
}
```

**2. Crear paquetes para ese servicio:**
```http
POST /api/servicios/65abc123.../paquetes
{
  "nombre": "Básico",
  "precio": 500,
  "caracteristicas": [...]
}

POST /api/servicios/65abc123.../paquetes
{
  "nombre": "Premium",
  "precio": 2000,
  "destacado": true,
  "caracteristicas": [...]
}
```

---

### Filtrar servicios activos de desarrollo con paquetes

```http
GET /api/servicios?categoria=desarrollo&estado=activo&tipoPrecio=paquetes&sort=-destacado
```

---

### Ver dashboard con métricas

```http
GET /api/servicios/dashboard
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "resumen": {
      "serviciosActivos": 12,
      "serviciosEnProgreso": 8,
      "serviciosCompletados": 45,
      "totalServicios": 65
    },
    "ingresos": {
      "mes": 12500,
      "anio": 87500,
      "total": 250000
    },
    "topServicios": [...],
    "porCategoria": [...]
  }
}
```

---

## 🔧 Configuración en package.json

Agrega este script al `package.json`:

```json
{
  "scripts": {
    "seed:servicios": "node scripts/seedServicios.js"
  }
}
```

---

## 📊 Estructura de Datos

### Servicio
```javascript
{
  _id: ObjectId,
  titulo: String,
  descripcion: String,
  descripcionCorta: String,
  icono: String,
  iconoType: 'emoji' | 'url' | 'icon-name',
  colorIcono: String,
  colorFondo: String,
  orden: Number,
  precio: Number,
  precioMin: Number,
  precioMax: Number,
  tipoPrecio: 'fijo' | 'rango' | 'paquetes' | 'personalizado' | 'suscripcion',
  moneda: 'USD' | 'MXN' | 'EUR',
  duracion: {
    valor: Number,
    unidad: 'horas' | 'días' | 'semanas' | 'meses' | 'años'
  },
  estado: 'activo' | 'desarrollo' | 'pausado' | 'descontinuado' | 'agotado',
  categoria: 'desarrollo' | 'diseño' | 'marketing' | 'consultoría' | 'mantenimiento' | 'otro',
  destacado: Boolean,
  activo: Boolean,
  visibleEnWeb: Boolean,
  requiereContacto: Boolean,
  imagenes: [String],
  caracteristicas: [String],
  beneficios: [String],
  tecnologias: [String],
  etiquetas: [String],
  departamento: String,
  responsable: ObjectId,
  esPlantilla: Boolean,
  plantillaId: ObjectId,
  vecesVendido: Number,
  ingresoTotal: Number,
  rating: Number,
  numeroReviews: Number,
  camposPersonalizados: [{
    nombre: String,
    valor: Mixed,
    tipo: String
  }],
  metaTitle: String,
  metaDescription: String,
  slug: String,
  eliminado: Boolean,
  eliminadoAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Paquete
```javascript
{
  _id: ObjectId,
  servicioId: ObjectId,
  nombre: String,
  descripcion: String,
  precio: Number,
  precioOriginal: Number,
  moneda: String,
  tipoFacturacion: 'unico' | 'mensual' | 'trimestral' | 'anual',
  caracteristicas: [{
    texto: String,
    incluido: Boolean,
    descripcion: String,
    icono: String
  }],
  limitaciones: [{
    tipo: String,
    descripcion: String,
    valor: Mixed
  }],
  addons: [{
    nombre: String,
    descripcion: String,
    precio: Number,
    obligatorio: Boolean
  }],
  orden: Number,
  destacado: Boolean,
  etiqueta: String,
  colorEtiqueta: String,
  disponible: Boolean,
  stock: Number,
  stockIlimitado: Boolean,
  enPromocion: Boolean,
  descuento: {
    tipo: 'porcentaje' | 'monto',
    valor: Number,
    fechaInicio: Date,
    fechaFin: Date
  },
  vecesVendido: Number,
  ingresoTotal: Number,
  metadatos: Mixed,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎯 Próximos Pasos

1. ✅ **Testing**: Probar todos los endpoints
2. ⏳ **Validaciones**: Agregar express-validator
3. ⏳ **Autenticación**: Proteger rutas con middleware
4. ⏳ **Historial**: Implementar tracking de cambios
5. ⏳ **Cotizaciones**: Modelo y endpoints para quotes
6. ⏳ **Exportar/Importar**: Excel y CSV
7. ⏳ **Documentación**: Swagger/Postman collection

---

## 📞 Soporte

Para dudas o problemas:
- Ver documentación completa en `PLAN_MODULO_SERVICIOS.md`
- Revisar ejemplos en `scripts/seedServicios.js`
- Consultar modelos en `models/`

---

**Última actualización**: 26 de Octubre, 2025
**Versión**: 1.0
