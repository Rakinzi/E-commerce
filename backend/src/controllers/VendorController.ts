import { Request, Response } from 'express';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { parseCsvData } from '../utils/csvParser.js';
import fs from 'fs';
import path from 'path';

export class VendorController {
  static async getDashboard(req: Request, res: Response) {
    try {
      const vendorId = req.user!._id;

      // Get all product IDs that belong to this vendor
      const vendorProducts = await Product.find({ vendor: vendorId }).select('_id').lean();
      const vendorProductIds = vendorProducts.map(p => p._id);

      // Get vendor stats
      const [
        totalProducts,
        totalOrders,
        totalRevenue,
        activeProducts,
        outOfStockProducts,
        recentOrders
      ] = await Promise.all([
        Product.countDocuments({ vendor: vendorId }),
        Order.countDocuments({ 'products.productId': { $in: vendorProductIds } }),
        Order.aggregate([
          { $match: { 'products.productId': { $in: vendorProductIds }, paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        Product.countDocuments({ vendor: vendorId, isActive: true, stock: { $gt: 0 } }),
        Product.countDocuments({ vendor: vendorId, stock: 0 }),
        Order.find({ 'products.productId': { $in: vendorProductIds } })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('userId', 'name email')
      ]);

      const stats = {
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        activeProducts,
        outOfStockProducts,
        recentOrders
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard data'
      });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const vendorId = req.user!._id;
      const { period = '7d' } = req.query;

      let dateFilter: Date;
      switch (period) {
        case '1d':
          dateFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }

      // Get all product IDs that belong to this vendor
      const vendorProducts = await Product.find({ vendor: vendorId }).select('_id').lean();
      const vendorProductIds = vendorProducts.map(p => p._id);

      const [salesData, topProducts, categoryBreakdown] = await Promise.all([
        Order.aggregate([
          { $match: { 'products.productId': { $in: vendorProductIds }, createdAt: { $gte: dateFilter } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              sales: { $sum: '$totalAmount' },
              orders: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]),
        Product.find({ vendor: vendorId })
          .sort({ 'rating.average': -1, 'rating.count': -1 })
          .limit(5)
          .select('name price rating stock'),
        Product.aggregate([
          { $match: { vendor: vendorId } },
          { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$stock' } } },
          { $sort: { count: -1 } }
        ])
      ]);

      res.json({
        success: true,
        data: {
          salesData,
          topProducts,
          categoryBreakdown,
          period
        }
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch stats'
      });
    }
  }

  static async importProductsFromCSV(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No CSV file uploaded'
        });
      }

      const csvPath = req.file.path;
      const csvData = fs.readFileSync(csvPath, 'utf8');
      
      const result = await parseCsvData(csvData, req.user!._id);

      // Clean up uploaded file
      fs.unlinkSync(csvPath);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      // Clean up uploaded file if it exists
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          console.error('Failed to clean up uploaded file:', e);
        }
      }

      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import CSV'
      });
    }
  }

  static async exportProductsToCSV(req: Request, res: Response) {
    try {
      const vendorId = req.user!._id;
      const products = await Product.find({ vendor: vendorId }).lean();

      // Convert products to CSV format
      const headers = [
        'Name', 'Description', 'Price', 'Category', 'Subcategory', 'Stock', 'SKU', 'Tags', 'Active'
      ];

      const csvRows = products.map(product => [
        product.name,
        product.description,
        product.price,
        product.category,
        product.subcategory || '',
        product.stock,
        product.sku,
        product.tags?.join(';') || '',
        product.active
      ]);

      const csvContent = [headers, ...csvRows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to export products'
      });
    }
  }

  static async downloadCSVTemplate(req: Request, res: Response) {
    try {
      const headers = [
        'Name', 'Description', 'Price', 'Category', 'Subcategory', 'Stock', 'SKU', 'Tags', 'Active'
      ];

      const sampleRow = [
        'Sample Product', 'This is a sample product description', '29.99', 'Electronics',
        'Audio Devices', '100', 'SAMPLE-001', 'tag1;tag2;tag3', 'true'
      ];

      const csvContent = [headers, sampleRow]
        .map(row => row.map(field => `"${String(field)}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=product-template.csv');
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to download template'
      });
    }
  }

  static async addProductImages(req: Request, res: Response) {
    try {
      const productId = req.params.id;
      const vendorId = req.user!._id;

      const product = await Product.findOne({ _id: productId, vendor: vendorId });
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No images uploaded'
        });
      }

      const imageUrls = req.files.map(file => `/uploads/products/${file.filename}`);
      product.images = [...(product.images || []), ...imageUrls];
      
      await product.save();

      res.json({
        success: true,
        data: {
          product: product.toObject(),
          newImages: imageUrls
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to add product images'
      });
    }
  }

  static async removeProductImage(req: Request, res: Response) {
    try {
      const { id: productId, imageIndex } = req.params;
      const vendorId = req.user!._id;

      const product = await Product.findOne({ _id: productId, vendor: vendorId });
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      const index = parseInt(imageIndex);
      if (isNaN(index) || index < 0 || index >= (product.images?.length || 0)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid image index'
        });
      }

      // Remove the image file
      const imageUrl = product.images![index];
      const imagePath = path.join(process.cwd(), 'uploads/products', path.basename(imageUrl));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      // Remove from product
      product.images!.splice(index, 1);
      await product.save();

      res.json({
        success: true,
        data: product.toObject()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to remove product image'
      });
    }
  }

  static async getVendorOrders(req: Request, res: Response) {
    try {
      const vendorId = req.user!._id;
      const { page = 1, limit = 10, status } = req.query;

      console.log('VendorOrders - vendorId:', vendorId);
      console.log('VendorOrders - query params:', { page, limit, status });

      // First, get all product IDs that belong to this vendor
      const vendorProducts = await Product.find({ vendor: vendorId }).select('_id').lean();
      const vendorProductIds = vendorProducts.map(p => p._id);

      console.log('VendorOrders - vendor products found:', vendorProducts.length);
      console.log('VendorOrders - vendor product IDs:', vendorProductIds.map(id => id.toString()));

      if (vendorProductIds.length === 0) {
        console.log('VendorOrders - no products found for vendor, returning empty');
        return res.json({
          success: true,
          data: {
            orders: [],
            totalOrders: 0,
            totalPages: 0,
            currentPage: Number(page)
          }
        });
      }

      // Build query to find orders containing vendor's products
      const query: any = {
        'products.productId': { $in: vendorProductIds }
      };
      
      if (status && status !== 'all') {
        query.orderStatus = status;
      }

      console.log('VendorOrders - final query:', JSON.stringify(query));

      const orders = await Order.find(query)
        .populate('userId', 'name email')
        .populate({
          path: 'products.productId',
          select: 'name price vendor images sku',
          populate: {
            path: 'vendor',
            select: 'name'
          }
        })
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .lean();

      const totalOrders = await Order.countDocuments(query);

      console.log('VendorOrders - orders found:', orders.length);
      console.log('VendorOrders - total orders:', totalOrders);

      // Transform orders to match frontend expectations and filter to only vendor's items
      const transformedOrders = orders.map(order => {
        // Filter products to only include vendor's products
        const vendorItems = order.products.filter(item => 
          item.productId && 
          typeof item.productId === 'object' && 
          item.productId.vendor && 
          item.productId.vendor._id.toString() === vendorId.toString()
        );

        return {
          _id: order._id,
          orderNumber: order.orderNumber,
          user: {
            _id: order.userId._id,
            name: order.userId.name,
            email: order.userId.email
          },
          status: order.orderStatus,
          totalAmount: order.totalAmount,
          items: vendorItems.map(item => ({
            product: {
              _id: item.productId._id,
              name: item.productId.name,
              price: item.productId.price,
              vendor: item.productId.vendor._id
            },
            quantity: item.quantity,
            price: item.price
          })),
          shippingAddress: {
            street: order.shippingAddress.street,
            city: order.shippingAddress.city,
            state: order.shippingAddress.province,
            zipCode: order.shippingAddress.postalCode,
            country: order.shippingAddress.country
          },
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        };
      });

      const responseData = {
        success: true,
        data: {
          orders: transformedOrders,
          totalOrders,
          totalPages: Math.ceil(totalOrders / Number(limit)),
          currentPage: Number(page)
        }
      };

      console.log('VendorOrders - sending response:', JSON.stringify(responseData, null, 2));
      res.json(responseData);
    } catch (error) {
      console.error('Get vendor orders error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch vendor orders'
      });
    }
  }

  static async updateOrderStatus(req: Request, res: Response) {
    try {
      const orderId = req.params.id;
      const { status } = req.body;
      const vendorId = req.user!._id;

      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid order status'
        });
      }

      // First, get all product IDs that belong to this vendor
      const vendorProducts = await Product.find({ vendor: vendorId }).select('_id').lean();
      const vendorProductIds = vendorProducts.map(p => p._id);

      // Find order that contains vendor's products
      const order = await Order.findOne({
        _id: orderId,
        'products.productId': { $in: vendorProductIds }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found or access denied'
        });
      }

      order.orderStatus = status;
      await order.save();

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update order status'
      });
    }
  }

  static async uploadProductImage(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No image file provided'
        });
      }

      const { productId } = req.body;
      if (!productId) {
        return res.status(400).json({
          success: false,
          error: 'Product ID is required'
        });
      }

      const vendorId = req.user!._id;

      // Find the product and verify it belongs to the vendor
      const product = await Product.findOne({ 
        _id: productId, 
        vendor: vendorId 
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found or access denied'
        });
      }

      // Generate the image URL
      const imageUrl = `/uploads/products/${req.file.filename}`;
      
      // Add the image URL to the product's images array
      product.images.push(imageUrl);
      await product.save();
      
      res.json({
        success: true,
        data: {
          imageUrl,
          filename: req.file.filename,
          originalname: req.file.originalname,
          size: req.file.size,
          productId: product._id,
          totalImages: product.images.length
        }
      });
    } catch (error) {
      console.error('Upload image error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload image'
      });
    }
  }
}