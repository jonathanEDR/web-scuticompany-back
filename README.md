# 📡 Backend - Web Scuti

API REST construida con Node.js y Express para el proyecto Web Scuti.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Modo desarrollo (con auto-reload)
npm run dev

# Modo producción
npm start
```

## 📦 Dependencias

- **express** - Framework web
- **cors** - Middleware para CORS
- **dotenv** - Variables de entorno
- **nodemon** - Auto-reload en desarrollo

## 🛣️ Rutas API

- `GET /` - Info general de la API
- `GET /api/hello` - Mensaje de prueba
- `GET /api/info` - Información del proyecto

## ⚙️ Configuración

Archivo `.env`:
```
PORT=5000
NODE_ENV=development
```

## 📂 Estructura Sugerida para Expansión

```
backend/
├── controllers/     # Lógica de negocio
├── models/         # Modelos de datos
├── routes/         # Definición de rutas
├── middleware/     # Middlewares personalizados
├── config/         # Configuraciones
├── utils/          # Funciones auxiliares
└── server.js       # Punto de entrada
```
