import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { OrderService } from '../services/OrderService.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Role from '../models/Role.js';
import logger from '../utils/logger.js';

export class AdminController {
  
  static async getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const [
        totalUsers,
        totalProducts,
        activeProducts,
        orderStats
      ] = await Promise.all([
        User.countDocuments(),
        Product.countDocuments(),
        Product.countDocuments({ isActive: true }),
        OrderService.getOrderStats()
      ]);

      const stats = {
        users: {
          total: totalUsers,
          breakdown: await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
          ])
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          inactive: totalProducts - activeProducts
        },
        orders: orderStats,
        systemHealth: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          nodeVersion: process.version
        }
      };

      res.status(200).json({ stats });
      
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to get dashboard statistics' });
    }
  }

  static async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const createUserSchema = z.object({
        name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
        email: z.string().email('Invalid email format'),
        password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password cannot exceed 128 characters'),
        role: z.enum(['vendor', 'admin'], {
          errorMap: () => ({ message: 'Role must be either vendor or admin' })
        })
      });

      const validatedData = createUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await User.findOne({ email: validatedData.email });
      if (existingUser) {
        res.status(409).json({ error: 'User already exists with this email' });
        return;
      }

      // Find the role by name
      const role = await Role.findOne({ name: validatedData.role });
      if (!role) {
        res.status(400).json({ error: `Role '${validatedData.role}' not found` });
        return;
      }

      // Create user (email verified by default for admin-created users)
      const user = new User({
        name: validatedData.name,
        email: validatedData.email,
        password: validatedData.password,
        roles: [role._id],
        isEmailVerified: true, // Admin-created users are pre-verified
        emailVerifiedAt: new Date()
      });

      await user.save();

      // Remove sensitive data from response
      const userResponse = await User.findById(user._id)
        .select('-password -sessionTokens -resetPasswordToken -resetPasswordExpires')
        .populate('roles', 'name');

      res.status(201).json({
        message: 'User created successfully',
        user: userResponse
      });

      logger.info(`User created by admin: ${validatedData.email} (${validatedData.role}) by ${req.user.email}`);
      
    } catch (error) {
      logger.error('Admin create user error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }
      
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  static async getUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const role = req.query.role as string;
      const search = req.query.search as string;

      // Build filter
      const filter: any = {};
      if (role) filter.role = role;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find(filter)
          .select('-sessionTokens -resetPasswordToken -resetPasswordExpires')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        users,
        total,
        page,
        totalPages
      });
      
    } catch (error) {
      logger.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  }

  static async updateUserRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!userId || !role) {
        res.status(400).json({ error: 'User ID and role are required' });
        return;
      }

      if (!['admin', 'vendor', 'customer'].includes(role)) {
        res.status(400).json({ error: 'Invalid role' });
        return;
      }

      // Prevent admin from changing their own role
      if (userId === req.user._id.toString()) {
        res.status(400).json({ error: 'Cannot change your own role' });
        return;
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true, runValidators: true }
      ).select('-sessionTokens -resetPasswordToken -resetPasswordExpires');

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      logger.info(`User role updated: ${user.email} -> ${role} by ${req.user.email}`);

      res.status(200).json({
        message: 'User role updated successfully',
        user
      });
      
    } catch (error) {
      logger.error('Update user role error:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  }

  static async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      // Prevent admin from deleting themselves
      if (userId === req.user._id.toString()) {
        res.status(400).json({ error: 'Cannot delete your own account' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Check if user has orders
      const hasOrders = await OrderService.getOrders({ userId, limit: 1 });
      if (hasOrders.total > 0) {
        res.status(400).json({ 
          error: 'Cannot delete user with existing orders. Consider deactivating instead.' 
        });
        return;
      }

      await User.findByIdAndDelete(userId);

      logger.info(`User deleted: ${user.email} by ${req.user.email}`);

      res.status(200).json({ message: 'User deleted successfully' });
      
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  static async getSystemLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // This would typically read from your logging system
      // For now, return a placeholder response
      res.status(200).json({
        message: 'System logs endpoint - implementation depends on your logging setup',
        suggestion: 'Integrate with your logging service (e.g., Winston files, ELK stack, etc.)'
      });
      
    } catch (error) {
      logger.error('Get system logs error:', error);
      res.status(500).json({ error: 'Failed to get system logs' });
    }
  }

  static async getProductStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const [
        totalProducts,
        activeProducts,
        categoryStats,
        lowStockProducts,
        topVendors
      ] = await Promise.all([
        Product.countDocuments(),
        Product.countDocuments({ isActive: true }),
        Product.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]),
        Product.find({ stock: { $lte: 10 }, isActive: true })
          .select('name sku stock')
          .limit(20),
        Product.aggregate([
          { $group: { _id: '$vendor', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
          { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'vendor' } },
          { $unwind: '$vendor' },
          { $project: { vendorName: '$vendor.name', vendorEmail: '$vendor.email', productCount: '$count' } }
        ])
      ]);

      const stats = {
        overview: {
          total: totalProducts,
          active: activeProducts,
          inactive: totalProducts - activeProducts
        },
        categories: categoryStats,
        lowStock: lowStockProducts,
        topVendors
      };

      res.status(200).json({ stats });
      
    } catch (error) {
      logger.error('Get product stats error:', error);
      res.status(500).json({ error: 'Failed to get product statistics' });
    }
  }
}