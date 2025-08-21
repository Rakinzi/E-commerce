import { Router } from 'express';
import { ProductController } from '../controllers/ProductController.js';
import { VendorController } from '../controllers/VendorController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermissionTo } from '../middleware/permissionMiddleware.js';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Image upload configuration
const imageUpload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// CSV upload configuration
const csvUpload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for CSV files
  fileFilter: (req, file, cb) => {
    const allowedTypes = /csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'text/csv' || file.mimetype === 'application/csv';
    
    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// All vendor routes require authentication
router.use(authenticate);

// Dashboard and stats
router.get('/dashboard', VendorController.getDashboard);
router.get('/stats', VendorController.getStats);

// Vendor's own products
router.get('/products', requirePermissionTo('products', 'read'), ProductController.getVendorProducts);
router.post('/products', requirePermissionTo('products', 'create'), imageUpload.array('images', 5), ProductController.createProductWithImages);
router.put('/products/:id', requirePermissionTo('products', 'update'), imageUpload.array('images', 5), ProductController.updateProductWithImages);
router.delete('/products/:id', requirePermissionTo('products', 'delete'), ProductController.deleteProduct);

// Bulk import/export
router.post('/products/import-csv', requirePermissionTo('products', 'create'), csvUpload.single('csvFile'), VendorController.importProductsFromCSV);
router.get('/products/export-csv', requirePermissionTo('products', 'read'), VendorController.exportProductsToCSV);
router.get('/products/csv-template', VendorController.downloadCSVTemplate);

// Image management
router.post('/products/:id/images', requirePermissionTo('products', 'update'), imageUpload.array('images', 5), VendorController.addProductImages);
router.post('/products/upload-image', requirePermissionTo('products', 'update'), imageUpload.single('image'), VendorController.uploadProductImage);
router.delete('/products/:id/images/:imageIndex', requirePermissionTo('products', 'update'), VendorController.removeProductImage);

// Vendor orders
router.get('/orders', VendorController.getVendorOrders);
router.put('/orders/:id/status', VendorController.updateOrderStatus);

export default router;