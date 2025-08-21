import { Router } from 'express';
import { ProductController } from '../controllers/ProductController.js';
import { authenticate, optionalAuth } from '../middleware/authMiddleware.js';
import { requirePermissionTo, requirePermission } from '../middleware/permissionMiddleware.js';

const router = Router();

// Public routes
router.get('/', ProductController.getProducts);
router.get('/categories', ProductController.getCategories);
router.get('/subcategories', ProductController.getSubcategories);
router.get('/sku/:sku', ProductController.getProductBySku);
router.get('/:id', ProductController.getProduct);

// Protected routes (require specific permissions)
router.post('/', authenticate, requirePermissionTo('products', 'create'), ProductController.createProduct);
router.put('/:id', authenticate, requirePermissionTo('products', 'update'), ProductController.updateProduct);
router.delete('/:id', authenticate, requirePermissionTo('products', 'delete'), ProductController.deleteProduct);

export default router;