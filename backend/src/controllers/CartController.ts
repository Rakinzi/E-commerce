import { Response } from 'express';
import { z } from 'zod';
import { CartService, AddToCartData, UpdateCartItemData } from '../services/CartService.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';

const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Quantity cannot exceed 100')
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity cannot be negative').max(100, 'Quantity cannot exceed 100')
});

export class CartController {
  
  static async getCart(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const cart = await CartService.getCart(req.user._id.toString());
      
      res.status(200).json({ cart });
      
    } catch (error) {
      logger.error('Get cart error:', error);
      res.status(500).json({ error: 'Failed to get cart' });
    }
  }

  static async addToCart(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = addToCartSchema.parse(req.body);
      
      const cart = await CartService.addToCart(
        req.user._id.toString(),
        validatedData as AddToCartData
      );
      
      res.status(200).json({
        message: 'Product added to cart successfully',
        cart
      });
      
    } catch (error) {
      logger.error('Add to cart error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }
      
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('not available')) {
          res.status(404).json({ error: error.message });
          return;
        }
        if (error.message.includes('Insufficient stock')) {
          res.status(400).json({ error: error.message });
          return;
        }
      }
      
      res.status(500).json({ error: 'Failed to add product to cart' });
    }
  }

  static async updateCartItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      
      if (!productId) {
        res.status(400).json({ error: 'Product ID is required' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = updateCartItemSchema.parse(req.body);
      
      const cart = await CartService.updateCartItem(
        req.user._id.toString(),
        productId,
        validatedData as UpdateCartItemData
      );
      
      if (!cart) {
        res.status(404).json({ error: 'Cart or item not found' });
        return;
      }

      res.status(200).json({
        message: 'Cart item updated successfully',
        cart
      });
      
    } catch (error) {
      logger.error('Update cart item error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ error: error.message });
          return;
        }
        if (error.message.includes('Insufficient stock')) {
          res.status(400).json({ error: error.message });
          return;
        }
      }
      
      res.status(500).json({ error: 'Failed to update cart item' });
    }
  }

  static async removeFromCart(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      
      if (!productId) {
        res.status(400).json({ error: 'Product ID is required' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const cart = await CartService.removeFromCart(
        req.user._id.toString(),
        productId
      );
      
      if (!cart) {
        res.status(404).json({ error: 'Cart or item not found' });
        return;
      }

      res.status(200).json({
        message: 'Product removed from cart successfully',
        cart
      });
      
    } catch (error) {
      logger.error('Remove from cart error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ error: error.message });
          return;
        }
      }
      
      res.status(500).json({ error: 'Failed to remove product from cart' });
    }
  }

  static async clearCart(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const cart = await CartService.clearCart(req.user._id.toString());
      
      if (!cart) {
        res.status(404).json({ error: 'Cart not found' });
        return;
      }

      res.status(200).json({
        message: 'Cart cleared successfully',
        cart
      });
      
    } catch (error) {
      logger.error('Clear cart error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ error: error.message });
          return;
        }
      }
      
      res.status(500).json({ error: 'Failed to clear cart' });
    }
  }

  static async validateCart(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const result = await CartService.validateCartItems(req.user._id.toString());
      
      res.status(200).json({
        valid: result.valid,
        issues: result.issues,
        cart: result.cart
      });
      
    } catch (error) {
      logger.error('Validate cart error:', error);
      res.status(500).json({ error: 'Failed to validate cart' });
    }
  }
}