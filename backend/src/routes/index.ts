import { Router } from 'express';
import authRoutes from './authRoutes.js';
import productRoutes from './productRoutes.js';
import cartRoutes from './cartRoutes.js';
import orderRoutes from './orderRoutes.js';
import adminRoutes from './adminRoutes.js';
import roleRoutes from './roleRoutes.js';
import permissionRoutes from './permissionRoutes.js';
import vendorRoutes from './vendorRoutes.js';

const router = Router();

// Mount all route modules
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/vendor', vendorRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'E-commerce API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      products: '/api/v1/products',
      cart: '/api/v1/cart',
      orders: '/api/v1/orders',
      admin: '/api/v1/admin',
      roles: '/api/v1/roles',
      permissions: '/api/v1/permissions',
      vendor: '/api/v1/vendor'
    },
    documentation: 'https://your-docs-url.com',
    status: 'online'
  });
});

export default router;