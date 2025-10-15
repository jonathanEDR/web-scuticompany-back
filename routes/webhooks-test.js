import express from 'express';
import { clerkWebhookTest } from '../controllers/webhookTestController.js';

const router = express.Router();

// Ruta de prueba para webhooks (sin verificación Svix)
router.post('/clerk', clerkWebhookTest);

export default router;