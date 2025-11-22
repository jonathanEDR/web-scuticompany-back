import express from 'express';
import { syncUser, getUserProfile } from '../controllers/userController.js';
import { 
  getEligibleUsers, 
  promoteToClient, 
  updateUserRole,
  getRoleStatistics 
} from '../controllers/userRoleController.js';
import { requireAuth } from '../middleware/clerkAuth.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/roleAuth.js';

const router = express.Router();

// @route   POST /api/users/sync
// @desc    Sincronizar usuario de Clerk con MongoDB
// @access  Private
router.post('/sync', syncUser);

// @route   GET /api/users/profile/:clerkId
// @desc    Obtener perfil de usuario desde MongoDB
// @access  Private  
router.get('/profile/:clerkId', getUserProfile);

// ========================================
// 🎯 GESTIÓN DE ROLES Y PROMOCIONES
// ========================================

// @route   GET /api/users/eligible-for-promotion
// @desc    Obtener usuarios USER elegibles para promoción a CLIENT
// @access  Private (Admin/SuperAdmin)
router.get('/eligible-for-promotion', requireAdmin, getEligibleUsers);

// @route   POST /api/users/promote-to-client
// @desc    Promover usuario de USER a CLIENT
// @access  Private (Admin/SuperAdmin)
router.post('/promote-to-client', requireAdmin, promoteToClient);

// @route   PATCH /api/users/:userId/role
// @desc    Cambiar rol de un usuario (solo SuperAdmin)
// @access  Private (SuperAdmin only)
router.patch('/:userId/role', requireSuperAdmin, updateUserRole);

// @route   GET /api/users/role-stats
// @desc    Obtener estadísticas de usuarios por rol
// @access  Private (Admin/SuperAdmin)
router.get('/role-stats', requireAdmin, getRoleStatistics);

export default router;