# Sistema de Categorías para Servicios

Este sistema permite gestionar categorías de servicios de forma dinámica, reemplazando el enum fijo anterior.

## 🚀 Características

- ✅ **CRUD completo** para categorías
- ✅ **Migración automática** de servicios existentes
- ✅ **Slug automático** generado desde el nombre
- ✅ **Validaciones** robustas
- ✅ **Soft delete** para protección de datos
- ✅ **Índices optimizados** para mejor rendimiento
- ✅ **Contadores automáticos** de servicios por categoría

## 📋 Endpoints Disponibles

### Obtener categorías
```http
GET /api/categorias
GET /api/categorias?activas=true&conServicios=true
```

### Obtener categoría por ID
```http
GET /api/categorias/:id
```

### Crear nueva categoría
```http
POST /api/categorias
Content-Type: application/json

{
  "nombre": "Nueva Categoría",
  "descripcion": "Descripción de la categoría",
  "icono": "🎯",
  "color": "#FF6B6B",
  "orden": 10
}
```

### Actualizar categoría
```http
PUT /api/categorias/:id
Content-Type: application/json

{
  "nombre": "Nombre Actualizado",
  "activo": false
}
```

### Eliminar categoría
```http
DELETE /api/categorias/:id
```

### Estadísticas
```http
GET /api/categorias/estadisticas
```

## 🔄 Migración de Datos

### Automática
El sistema inicializa automáticamente las categorías por defecto al arrancar el servidor.

### Manual (si tienes servicios existentes)
```bash
node migrate-categories.js
```

## 📊 Estructura de Categoría

```javascript
{
  "nombre": "Desarrollo",           // Único, requerido
  "descripcion": "...",            // Opcional
  "slug": "desarrollo",            // Auto-generado
  "icono": "💻",                   // Emoji, URL o nombre de icono
  "color": "#3B82F6",             // Código hexadecimal
  "orden": 1,                     // Para ordenamiento
  "activo": true,                 // Estado activo/inactivo
  "totalServicios": 5             // Contador automático
}
```

## 🔧 Cambios Realizados

1. **Modelo Servicio**: Campo `categoria` cambió de `String` (enum) a `ObjectId` (referencia)
2. **Nuevo Modelo**: `Categoria.js` con todas las funcionalidades
3. **Controlador**: `categoriaController.js` con CRUD completo
4. **Rutas**: `/api/categorias` disponibles
5. **Inicialización**: Auto-creación de categorías por defecto
6. **Migración**: Script para servicios existentes

## 🎯 Categorías por Defecto

- 💻 **Desarrollo** - Aplicaciones web, móviles y software personalizado
- 🎨 **Diseño** - Diseño gráfico, UI/UX y branding
- 📈 **Marketing** - Estrategias de marketing digital y publicidad online  
- 🧠 **Consultoría** - Asesoramiento técnico y estratégico
- 🔧 **Mantenimiento** - Soporte y mantenimiento de sistemas
- ⚡ **Otro** - Otros servicios especializados

## 💡 Ejemplos de Uso

### Crear servicio con categoría
```javascript
// Obtener ID de categoría primero
const categoria = await Categoria.findOne({ slug: 'desarrollo' });

// Crear servicio
const servicio = new Servicio({
  titulo: "Desarrollo Web",
  descripcion: "...",
  categoria: categoria._id  // Usar ObjectId
});
```

### Buscar servicios por categoría
```javascript
// Por slug
const categoria = await Categoria.findOne({ slug: 'diseño' });
const servicios = await Servicio.find({ categoria: categoria._id })
  .populate('categoria');

// Directamente por ID
const servicios = await Servicio.find({ categoria: categoriaId })
  .populate('categoria', 'nombre slug icono');
```

## ⚠️ Consideraciones

- **No eliminar categorías con servicios**: El sistema previene eliminación accidental
- **Slugs únicos**: Se generan automáticamente y son únicos
- **Migración segura**: Los servicios existentes se migran automáticamente
- **Retrocompatibilidad**: El sistema maneja la transición suavemente

## 🔍 Troubleshooting

### Error: "Categoría es obligatoria"
- Asegúrate de que los servicios tengan una categoría válida asignada
- Ejecuta el script de migración si tienes datos existentes

### Servicios sin mostrar
- Verifica que la categoría esté activa (`activo: true`)
- Confirma que el servicio tenga una categoría válida poblada

### Duplicados en slugs
- El sistema los previene automáticamente agregando sufijos únicos