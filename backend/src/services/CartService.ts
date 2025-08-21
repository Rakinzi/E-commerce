import Cart, { ICart, ICartItem } from '../models/Cart.js';
import Product from '../models/Product.js';
import logger from '../utils/logger.js';

export interface AddToCartData {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemData {
  quantity: number;
}

export class CartService {
  
  static async getCart(userId: string): Promise<ICart | null> {
    try {
      // Always fetch from database to ensure we get a proper Mongoose document with methods
      let cart = await Cart.findOne({ userId }).populate('items.productId', 'name price images stock isActive');
      
      if (!cart) {
        // Create new cart if doesn't exist
        cart = new Cart({ userId, items: [] });
        await cart.save();
      }

      // Clean up duplicates and filter out inactive products
      if (cart.items.length > 0) {
        // Remove duplicates by combining quantities
        const uniqueItems = new Map();
        
        cart.items.forEach((item: any) => {
          // Only filter out if we have populated product data and it's definitely inactive
          const isProductInactive = item.productId && 
                                   typeof item.productId === 'object' && 
                                   item.productId.isActive === false;
          
          if (!isProductInactive) {
            const productId = typeof item.productId === 'object' ? 
                             item.productId._id.toString() : 
                             item.productId.toString();
            
            if (uniqueItems.has(productId)) {
              // Combine quantities if duplicate found
              const existingItem = uniqueItems.get(productId);
              existingItem.quantity += item.quantity;
            } else {
              uniqueItems.set(productId, {
                productId: typeof item.productId === 'object' ? item.productId._id : item.productId,
                quantity: item.quantity,
                price: (typeof item.productId === 'object' && item.productId.price) ? item.productId.price : item.price,
                name: (typeof item.productId === 'object' && item.productId.name) ? item.productId.name : item.name
              });
            }
          }
        });
        
        // Only update if we have items after filtering
        if (uniqueItems.size > 0) {
          cart.items = Array.from(uniqueItems.values());
          cart.calculateTotals();
          await cart.save();
        }
      }
      
      return cart;
      
    } catch (error) {
      logger.error('Get cart error:', error);
      throw error;
    }
  }

  static async addToCart(userId: string, data: AddToCartData): Promise<ICart> {
    try {
      const { productId, quantity } = data;
      
      // Validate product exists and is active
      const product = await Product.findById(productId);
      if (!product || !product.isActive) {
        throw new Error('Product not found or is not available');
      }

      // Check stock availability
      if (product.stock < quantity) {
        throw new Error(`Insufficient stock. Available: ${product.stock}`);
      }

      let cart = await this.getCart(userId);
      if (!cart) {
        cart = new Cart({ userId, items: [] });
      }

      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId
      );

      if (existingItemIndex >= 0) {
        // Update existing item
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        
        if (newQuantity > product.stock) {
          throw new Error(`Insufficient stock. Available: ${product.stock}, requested total: ${newQuantity}`);
        }
        
        cart.items[existingItemIndex].quantity = newQuantity;
      } else {
        // Add new item
        const newItem: ICartItem = {
          productId: product._id,
          quantity,
          price: product.price,
          name: product.name
        };
        cart.items.push(newItem);
      }

      await cart.save();

      
      logger.info(`Added to cart: User ${userId}, Product ${productId}, Quantity ${quantity}`);
      return cart;
      
    } catch (error) {
      logger.error('Add to cart error:', error);
      throw error;
    }
  }

  static async updateCartItem(userId: string, productId: string, data: UpdateCartItemData): Promise<ICart | null> {
    try {
      const { quantity } = data;
      
      if (quantity <= 0) {
        return this.removeFromCart(userId, productId);
      }

      // Validate product exists and check stock
      const product = await Product.findById(productId);
      if (!product || !product.isActive) {
        throw new Error('Product not found or is not available');
      }

      if (product.stock < quantity) {
        throw new Error(`Insufficient stock. Available: ${product.stock}`);
      }

      const cart = await Cart.findOne({ userId });
      if (!cart) {
        throw new Error('Cart not found');
      }

      const itemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId
      );

      if (itemIndex === -1) {
        throw new Error('Item not found in cart');
      }

      // Update item
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].price = product.price; // Update price in case it changed
      cart.items[itemIndex].name = product.name; // Update name in case it changed
      
      cart.calculateTotals();
      await cart.save();

      
      logger.info(`Updated cart item: User ${userId}, Product ${productId}, Quantity ${quantity}`);
      return cart;
      
    } catch (error) {
      logger.error('Update cart item error:', error);
      throw error;
    }
  }

  static async removeFromCart(userId: string, productId: string): Promise<ICart | null> {
    try {
      const cart = await Cart.findOne({ userId });
      if (!cart) {
        throw new Error('Cart not found');
      }

      const itemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId
      );

      if (itemIndex === -1) {
        throw new Error('Item not found in cart');
      }

      cart.items.splice(itemIndex, 1);
      cart.calculateTotals();
      await cart.save();

      
      logger.info(`Removed from cart: User ${userId}, Product ${productId}`);
      return cart;
      
    } catch (error) {
      logger.error('Remove from cart error:', error);
      throw error;
    }
  }

  static async clearCart(userId: string): Promise<ICart | null> {
    try {
      const cart = await Cart.findOne({ userId });
      if (!cart) {
        throw new Error('Cart not found');
      }

      cart.items = [];
      cart.calculateTotals();
      await cart.save();

      
      logger.info(`Cart cleared: User ${userId}`);
      return cart;
      
    } catch (error) {
      logger.error('Clear cart error:', error);
      throw error;
    }
  }

  static async validateCartItems(userId: string): Promise<{
    valid: boolean;
    issues: string[];
    cart: ICart | null;
  }> {
    try {
      const cart = await this.getCart(userId);
      if (!cart || cart.items.length === 0) {
        return { valid: true, issues: [], cart };
      }

      const issues: string[] = [];
      const validItems: ICartItem[] = [];

      for (const item of cart.items) {
        const product = await Product.findById(item.productId);
        
        if (!product) {
          issues.push(`Product "${item.name}" is no longer available`);
          continue;
        }

        if (!product.isActive) {
          issues.push(`Product "${product.name}" is currently unavailable`);
          continue;
        }

        if (product.stock < item.quantity) {
          issues.push(`Insufficient stock for "${product.name}". Available: ${product.stock}, in cart: ${item.quantity}`);
          // Adjust quantity to available stock
          item.quantity = product.stock;
        }

        // Update price if it has changed
        if (item.price !== product.price) {
          issues.push(`Price changed for "${product.name}". Old: $${item.price}, New: $${product.price}`);
          item.price = product.price;
        }

        validItems.push(item);
      }

      // Update cart with valid items
      if (validItems.length !== cart.items.length || issues.length > 0) {
        cart.items = validItems;
        cart.calculateTotals();
        await cart.save();
      }

      return {
        valid: issues.length === 0,
        issues,
        cart
      };
      
    } catch (error) {
      logger.error('Validate cart items error:', error);
      throw error;
    }
  }

  static async convertCartToOrder(userId: string): Promise<ICart | null> {
    try {
      const cart = await Cart.findOne({ userId });
      if (!cart) {
        return null;
      }

      // Instead of creating a new cart, just clear the current cart and reset status
      cart.items = [];
      cart.status = 'active';
      cart.totalItems = 0;
      cart.totalPrice = 0;
      cart.lastModified = new Date();
      await cart.save();
      
      logger.info(`Cart converted to order and cleared: User ${userId}`);
      return cart;
      
    } catch (error) {
      logger.error('Convert cart to order error:', error);
      throw error;
    }
  }

}