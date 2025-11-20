# 🔧 Corrección de Etiquetas HTML en Formulario de Contacto

## 🔍 Problema Identificado

Los textos del formulario de contacto mostraban etiquetas HTML visibles como `<p>`, `</p>`, `<P>TEST</P>` porque:

1. **Editor Rico (RichTextEditor)** guardaba HTML en los campos de texto
2. **Renderizado como texto plano** mostraba las etiquetas literalmente
3. **Sin sanitización** al mostrar el contenido

### Ejemplos del problema:
```
❌ ANTES: "<P>TEST</P>" "hol peurba" "<p>teist</p>"
✅ AHORA: "TEST" "hol peurba" "teist"
```

## ✅ Soluciones Implementadas

### 1. Cambio de Editor en el CMS (`TextsSection.tsx`)

**Reemplazado:**
- ❌ `RichTextEditor` (guardaba HTML)

**Por:**
- ✅ Inputs de texto plano (`<input>` y `<textarea>`)
- ✅ Función `stripHtml()` para limpiar HTML existente
- ✅ Auto-limpieza al cargar datos con HTML

### 2. Sanitización en el Frontend (`ContactSection.tsx`)

**Agregado:**
- ✅ Función `stripHtml()` para limpiar HTML al renderizar
- ✅ Protección contra inyección HTML
- ✅ Compatibilidad con datos antiguos

### 3. Script de Limpieza de Base de Datos

**Creado:** `backend/scripts/cleanContactFormHtml.js`

**Función:**
- 🧹 Limpia etiquetas HTML de datos existentes
- 📊 Muestra estadísticas de limpieza
- ✅ Actualiza automáticamente la BD

## 🚀 Cómo Aplicar la Corrección

### Paso 1: Ejecutar Script de Limpieza

```powershell
# Desde la raíz del proyecto
cd backend
node scripts/cleanContactFormHtml.js
```

**Salida esperada:**
```
🔌 Conectando a MongoDB...
✅ Conectado a MongoDB

🔍 Buscando páginas con formularios de contacto...
📄 Encontradas 1 páginas

📝 Procesando página: Home (home)
  🧹 Title: "<P>TEST</P>" → "TEST"
  🧹 Subtitle: "<p>hol peurba</p>" → "hol peurba"
  🧹 Description: "<p>teist</p>" → "teist"
  ✅ Página actualizada

============================================================
✨ Proceso completado!
📊 Páginas actualizadas: 1/1
============================================================
```

### Paso 2: Verificar en el CMS

1. Abrir el CMS → Editor de Formulario de Contacto
2. Verificar que los campos muestren texto limpio
3. Guardar cambios (el nuevo sistema evitará HTML)

### Paso 3: Verificar en el Frontend

1. Visitar la página pública
2. Verificar que los textos se muestren correctamente
3. ✅ Sin etiquetas HTML visibles

## 📝 Cambios Técnicos

### Archivos Modificados:

1. **`frontend/src/components/cms/sections/TextsSection.tsx`**
   - Removido `RichTextEditor`
   - Agregado inputs de texto plano
   - Función `stripHtml()` para auto-limpieza

2. **`frontend/src/components/public/ContactSection.tsx`**
   - Agregada función `stripHtml()`
   - Aplicada sanitización al renderizar:
     - `{stripHtml(data.title)}`
     - `{stripHtml(data.subtitle)}`
     - `{stripHtml(data.description)}`

3. **`backend/scripts/cleanContactFormHtml.js`** (NUEVO)
   - Script de limpieza de base de datos
   - Elimina HTML de datos existentes

## 🛡️ Prevención Futura

### El nuevo sistema previene HTML mediante:

1. **Inputs de texto plano** en el editor
2. **Sanitización automática** al cargar datos
3. **Limpieza en frontend** como capa extra de seguridad

### Si se detecta HTML en el futuro:

```typescript
// Auto-limpieza al detectar HTML
if (contactForm.title && contactForm.title.includes('<')) {
  updateContent('contactForm.title', stripHtml(contactForm.title));
}
```

## ⚠️ Notas Importantes

1. **Backup de BD**: El script modifica datos directamente
2. **Una sola ejecución**: Solo es necesario correr el script una vez
3. **Sin HTML enriquecido**: Los campos ahora son texto plano (sin negritas, cursivas, etc.)

## 🔄 Rollback (Si es necesario)

Si necesitas volver al editor rico:

1. Restaurar `TextsSection.tsx` del commit anterior
2. Usar `dangerouslySetInnerHTML` en `ContactSection.tsx`
3. ⚠️ Considerar riesgos de seguridad (XSS)

## ✅ Checklist de Verificación

- [ ] Script ejecutado exitosamente
- [ ] Datos limpiados en base de datos
- [ ] CMS muestra inputs de texto plano
- [ ] Frontend muestra textos sin HTML
- [ ] Guardar nuevos cambios funciona correctamente
- [ ] No aparecen etiquetas HTML en vista pública

---

**Fecha de corrección:** 2025-11-19  
**Afecta a:** Sección de Formulario de Contacto  
**Archivos involucrados:** 3 archivos modificados, 1 script nuevo
