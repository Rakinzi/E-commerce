import { Router } from 'express';
import { OrderController } from '../controllers/OrderController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermissionTo, requirePermission } from '../middleware/permissionMiddleware.js';

const router = Router();

// Customer routes
router.post('/', authenticate, requirePermissionTo('orders', 'create'), OrderController.createOrder);
router.get('/my', authenticate, requirePermissionTo('orders', 'read'), OrderController.getOrders);
router.get('/number/:orderNumber', authenticate, requirePermissionTo('orders', 'read'), OrderController.getOrderByNumber);
router.get('/:id', authenticate, requirePermissionTo('orders', 'read'), OrderController.getOrder);
router.patch('/:id/cancel', authenticate, requirePermissionTo('orders', 'delete'), OrderController.cancelOrder);

// Vendor/Admin routes  
router.patch('/:id/status', authenticate, requirePermissionTo('orders', 'update'), OrderController.updateOrderStatus);
router.get('/', authenticate, requirePermissionTo('orders', 'manage'), OrderController.getOrders);

// Admin only routes
router.patch('/:id/payment', authenticate, requirePermission('manage-payments'), OrderController.updatePaymentStatus);
router.get('/stats/overview', authenticate, requirePermission('view-dashboard'), OrderController.getOrderStats);

export default router;