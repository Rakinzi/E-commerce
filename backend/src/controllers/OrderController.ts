import { Response } from 'express';
import { z } from 'zod';
import { OrderService, CreateOrderData, OrderQuery } from '../services/OrderService.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';

const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  province: z.string().min(1, 'Province is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required')
});

const createOrderSchema = z.object({
  paymentMethod: z.string().min(1, 'Payment method is required'),
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
});

const updateOrderStatusSchema = z.object({
  orderStatus: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  trackingNumber: z.string().optional()
});

const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']),
  paymentIntentId: z.string().optional()
});

export class OrderController {
  
  static async createOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = createOrderSchema.parse(req.body);
      
      const order = await OrderService.createOrder(
        req.user._id.toString(),
        validatedData as CreateOrderData
      );
      
      res.status(201).json({
        message: 'Order created successfully',
        order
      });
      
    } catch (error) {
      logger.error('Create order error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }
      
      if (error instanceof Error) {
        if (error.message.includes('Cart is empty') || error.message.includes('Cart validation failed')) {
          res.status(400).json({ error: error.message });
          return;
        }
      }
      
      res.status(500).json({ error: 'Order creation failed' });
    }
  }

  static async getOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Order ID is required' });
        return;
      }

      // Only allow users to see their own orders unless admin
      const isAdmin = await req.user?.hasRole('admin');
      const userId = isAdmin ? undefined : req.user?._id.toString();
      
      const order = await OrderService.getOrderById(id, userId);
      
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      res.status(200).json({ order });
      
    } catch (error) {
      logger.error('Get order error:', error);
      res.status(500).json({ error: 'Failed to get order' });
    }
  }

  static async getOrderByNumber(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { orderNumber } = req.params;
      
      if (!orderNumber) {
        res.status(400).json({ error: 'Order number is required' });
        return;
      }

      // Only allow users to see their own orders unless admin
      const isAdmin = await req.user?.hasRole('admin');
      const userId = isAdmin ? undefined : req.user?._id.toString();
      
      const order = await OrderService.getOrderByNumber(orderNumber, userId);
      
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      res.status(200).json({ order });
      
    } catch (error) {
      logger.error('Get order by number error:', error);
      res.status(500).json({ error: 'Failed to get order' });
    }
  }

  static async getOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Parse query parameters
      const query: OrderQuery = {
        orderStatus: req.query.orderStatus as string,
        paymentStatus: req.query.paymentStatus as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: req.query.sortBy as string || 'createdAt',
        sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc',
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      };

      // Only allow users to see their own orders unless admin
      if (req.user?.role !== 'admin') {
        query.userId = req.user?._id.toString();
      } else if (req.query.userId) {
        query.userId = req.query.userId as string;
      }

      const result = await OrderService.getOrders(query);
      
      res.status(200).json(result);
      
    } catch (error) {
      logger.error('Get orders error:', error);
      res.status(500).json({ error: 'Failed to get orders' });
    }
  }

  static async updateOrderStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Order ID is required' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = updateOrderStatusSchema.parse(req.body);
      
      const order = await OrderService.updateOrderStatus(
        id,
        validatedData.orderStatus,
        validatedData.trackingNumber
      );
      
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      res.status(200).json({
        message: 'Order status updated successfully',
        order
      });
      
    } catch (error) {
      logger.error('Update order status error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }
      
      res.status(500).json({ error: 'Failed to update order status' });
    }
  }

  static async updatePaymentStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Order ID is required' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = updatePaymentStatusSchema.parse(req.body);
      
      const order = await OrderService.updatePaymentStatus(
        id,
        validatedData.paymentStatus,
        validatedData.paymentIntentId
      );
      
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      res.status(200).json({
        message: 'Payment status updated successfully',
        order
      });
      
    } catch (error) {
      logger.error('Update payment status error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }
      
      res.status(500).json({ error: 'Failed to update payment status' });
    }
  }

  static async cancelOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Order ID is required' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Only allow users to cancel their own orders unless admin
      const isAdmin = await req.user.hasRole('admin');
      const userId = isAdmin ? undefined : req.user._id.toString();
      
      const order = await OrderService.cancelOrder(id, userId);
      
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      res.status(200).json({
        message: 'Order cancelled successfully',
        order
      });
      
    } catch (error) {
      logger.error('Cancel order error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Cannot cancel') || error.message.includes('already cancelled')) {
          res.status(400).json({ error: error.message });
          return;
        }
      }
      
      res.status(500).json({ error: 'Failed to cancel order' });
    }
  }

  static async getOrderStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const stats = await OrderService.getOrderStats(startDate, endDate);
      
      res.status(200).json({ stats });
      
    } catch (error) {
      logger.error('Get order stats error:', error);
      res.status(500).json({ error: 'Failed to get order statistics' });
    }
  }
}