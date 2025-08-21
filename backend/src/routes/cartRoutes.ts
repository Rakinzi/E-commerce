import { Router } from 'express';
import { CartController } from '../controllers/CartController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermissionTo } from '../middleware/permissionMiddleware.js';

const router = Router();

// All cart routes require authentication and cart permissions
router.get('/', authenticate, requirePermissionTo('cart', 'read'), CartController.getCart);
router.post('/add', authenticate, requirePermissionTo('cart', 'manage'), CartController.addToCart);
router.put('/item/:productId', authenticate, requirePermissionTo('cart', 'manage'), CartController.updateCartItem);
router.delete('/item/:productId', authenticate, requirePermissionTo('cart', 'manage'), CartController.removeFromCart);
router.delete('/clear', authenticate, requirePermissionTo('cart', 'manage'), CartController.clearCart);
router.get('/validate', authenticate, requirePermissionTo('cart', 'read'), CartController.validateCart);

export default router;