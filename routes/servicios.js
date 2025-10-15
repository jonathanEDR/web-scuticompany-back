import express from 'express';
import {
  getServicios,
  getServicio,
  createServicio,
  updateServicio,
  deleteServicio,
  getServiciosDestacados
} from '../controllers/servicioController.js';

const router = express.Router();

// Rutas especiales primero (antes de las rutas con parámetros)
router.get('/destacados', getServiciosDestacados);

// Rutas CRUD
router.route('/')
  .get(getServicios)      // GET /api/servicios - Obtener todos
  .post(createServicio);  // POST /api/servicios - Crear nuevo

router.route('/:id')
  .get(getServicio)       // GET /api/servicios/:id - Obtener uno
  .put(updateServicio)    // PUT /api/servicios/:id - Actualizar
  .delete(deleteServicio); // DELETE /api/servicios/:id - Eliminar

export default router;
