import Order, { IOrder, IShippingAddress } from '../models/Order.js';
import { CartService } from './CartService.js';
import { ProductService } from './ProductService.js';
import logger from '../utils/logger.js';

export interface CreateOrderData {
  paymentMethod: string;
  shippingAddress: IShippingAddress;
  billingAddress: IShippingAddress;
  notes?: string;
}

export interface OrderQuery {
  userId?: string;
  orderStatus?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: Date;
  endDate?: Date;
}

export class OrderService {
  
  static async createOrder(userId: string, data: CreateOrderData): Promise<IOrder> {
    try {
      // Validate and get cart
      const cartValidation = await CartService.validateCartItems(userId);
      if (!cartValidation.cart || cartValidation.cart.items.length === 0) {
        throw new Error('Cart is empty or invalid');
      }

      if (!cartValidation.valid) {
        throw new Error(`Cart validation failed: ${cartValidation.issues.join(', ')}`);
      }

      const cart = cartValidation.cart;

      // Calculate totals
      const subtotal = cart.totalPrice;
      const tax = subtotal * 0.08; // 8% tax rate
      const shipping = subtotal > 50 ? 0 : 10; // Free shipping over $50
      const totalAmount = subtotal + tax + shipping;

      // Create order items from cart
      const orderItems = cart.items.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        sku: '' // Will be populated from product data
      }));

      // Get SKUs for order items
      for (const item of orderItems) {
        const product = await ProductService.getProductById(item.productId.toString());
        if (product) {
          item.sku = product.sku;
        }
      }

      // Create order
      const order = new Order({
        userId,
        products: orderItems,
        totalAmount,
        subtotal,
        tax,
        shipping,
        paymentMethod: data.paymentMethod,
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress,
        notes: data.notes
      });

      await order.save();

      // Reserve stock for ordered products
      for (const item of cart.items) {
        await ProductService.updateStock(item.productId.toString(), item.quantity, 'subtract');
      }

      // Convert cart to order status
      await CartService.convertCartToOrder(userId);
      
      logger.info(`Order created successfully: ${order.orderNumber} for user ${userId}`);
      return order;
      
    } catch (error) {
      logger.error('Order creation error:', error);
      throw error;
    }
  }

  static async getOrderById(orderId: string, userId?: string): Promise<IOrder | null> {
    try {
      const query: any = { _id: orderId };
      if (userId) {
        query.userId = userId;
      }

      const order = await Order.findOne(query)
        .populate('userId', 'name email')
        .populate('products.productId', 'name images');
      
      return order;
      
    } catch (error) {
      logger.error('Get order error:', error);
      throw error;
    }
  }

  static async getOrderByNumber(orderNumber: string, userId?: string): Promise<IOrder | null> {
    try {
      const query: any = { orderNumber };
      if (userId) {
        query.userId = userId;
      }

      const order = await Order.findOne(query)
        .populate('userId', 'name email')
        .populate('products.productId', 'name images');
      
      return order;
      
    } catch (error) {
      logger.error('Get order by number error:', error);
      throw error;
    }
  }

  static async getOrders(query: OrderQuery): Promise<{
    orders: IOrder[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        userId,
        orderStatus,
        paymentStatus,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        startDate,
        endDate
      } = query;

      // Build filter
      const filter: any = {};
      if (userId) filter.userId = userId;
      if (orderStatus) filter.orderStatus = orderStatus;
      if (paymentStatus) filter.paymentStatus = paymentStatus;
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = startDate;
        if (endDate) filter.createdAt.$lte = endDate;
      }

      // Build sort
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries
      const [orders, total] = await Promise.all([
        Order.find(filter)
          .populate('userId', 'name email')
          .populate('products.productId', 'name images')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Order.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        orders,
        total,
        page,
        totalPages
      };
      
    } catch (error) {
      logger.error('Get orders error:', error);
      throw error;
    }
  }

  static async updateOrderStatus(
    orderId: string, 
    orderStatus: string, 
    trackingNumber?: string
  ): Promise<IOrder | null> {
    try {
      const updateData: any = { orderStatus };
      if (trackingNumber) {
        updateData.trackingNumber = trackingNumber;
      }

      const order = await Order.findByIdAndUpdate(
        orderId,
        updateData,
        { new: true, runValidators: true }
      ).populate('userId', 'name email');

      if (order) {
        logger.info(`Order status updated: ${order.orderNumber} -> ${orderStatus}`);
      }
      
      return order;
      
    } catch (error) {
      logger.error('Update order status error:', error);
      throw error;
    }
  }

  static async updatePaymentStatus(
    orderId: string, 
    paymentStatus: string, 
    paymentIntentId?: string
  ): Promise<IOrder | null> {
    try {
      const updateData: any = { paymentStatus };
      if (paymentIntentId) {
        updateData.paymentIntentId = paymentIntentId;
      }

      const order = await Order.findByIdAndUpdate(
        orderId,
        updateData,
        { new: true, runValidators: true }
      ).populate('userId', 'name email');

      if (order) {
        logger.info(`Payment status updated: ${order.orderNumber} -> ${paymentStatus}`);
        
        // If payment failed, restore stock
        if (paymentStatus === 'failed' && order.orderStatus === 'pending') {
          for (const item of order.products) {
            await ProductService.updateStock(item.productId.toString(), item.quantity, 'add');
          }
          logger.info(`Stock restored for failed order: ${order.orderNumber}`);
        }
      }
      
      return order;
      
    } catch (error) {
      logger.error('Update payment status error:', error);
      throw error;
    }
  }

  static async cancelOrder(orderId: string, userId?: string): Promise<IOrder | null> {
    try {
      const query: any = { _id: orderId };
      if (userId) {
        query.userId = userId;
      }

      const order = await Order.findOne(query);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.orderStatus === 'shipped' || order.orderStatus === 'delivered') {
        throw new Error('Cannot cancel shipped or delivered orders');
      }

      if (order.orderStatus === 'cancelled') {
        throw new Error('Order is already cancelled');
      }

      // Update order status
      order.orderStatus = 'cancelled';
      await order.save();

      // Restore stock if payment was successful
      if (order.paymentStatus === 'paid') {
        for (const item of order.products) {
          await ProductService.updateStock(item.productId.toString(), item.quantity, 'add');
        }
      }
      
      logger.info(`Order cancelled: ${order.orderNumber}`);
      return order;
      
    } catch (error) {
      logger.error('Cancel order error:', error);
      throw error;
    }
  }

  static async getOrderStats(startDate?: Date, endDate?: Date): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: { [key: string]: number };
    paymentsByStatus: { [key: string]: number };
  }> {
    try {
      const dateFilter: any = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = startDate;
        if (endDate) dateFilter.createdAt.$lte = endDate;
      }

      const [
        totalOrders,
        totalRevenue,
        ordersByStatus,
        paymentsByStatus
      ] = await Promise.all([
        Order.countDocuments(dateFilter),
        Order.aggregate([
          { $match: { ...dateFilter, paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        Order.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
        ]),
        Order.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
        ])
      ]);

      const revenue = totalRevenue[0]?.total || 0;
      const averageOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

      const orderStatusMap: { [key: string]: number } = {};
      ordersByStatus.forEach((item: any) => {
        orderStatusMap[item._id] = item.count;
      });

      const paymentStatusMap: { [key: string]: number } = {};
      paymentsByStatus.forEach((item: any) => {
        paymentStatusMap[item._id] = item.count;
      });

      return {
        totalOrders,
        totalRevenue: revenue,
        averageOrderValue,
        ordersByStatus: orderStatusMap,
        paymentsByStatus: paymentStatusMap
      };
      
    } catch (error) {
      logger.error('Get order stats error:', error);
      throw error;
    }
  }
}