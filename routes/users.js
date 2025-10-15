import express from 'express';
import { syncUser, getUserProfile } from '../controllers/userController.js';

const router = express.Router();

// @route   POST /api/users/sync
// @desc    Sincronizar usuario de Clerk con MongoDB
// @access  Private
router.post('/sync', syncUser);

// @route   GET /api/users/profile/:clerkId
// @desc    Obtener perfil de usuario desde MongoDB
// @access  Private  
router.get('/profile/:clerkId', getUserProfile);

export default router;