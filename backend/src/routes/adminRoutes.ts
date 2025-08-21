import { Router } from 'express';
import { AdminController } from '../controllers/AdminController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const router = Router();

// All admin routes require authentication and specific permissions
router.get('/dashboard', authenticate, requirePermission('view-dashboard'), AdminController.getDashboardStats);
router.post('/users', authenticate, requirePermission('create-users'), AdminController.createUser);
router.get('/users', authenticate, requirePermission('view-users'), AdminController.getUsers);
router.patch('/users/:userId/role', authenticate, requirePermission('manage-roles'), AdminController.updateUserRole);
router.delete('/users/:userId', authenticate, requirePermission('delete-users'), AdminController.deleteUser);
router.get('/products/stats', authenticate, requirePermission('view-dashboard'), AdminController.getProductStats);
router.get('/logs', authenticate, requirePermission('view-logs'), AdminController.getSystemLogs);

export default router;