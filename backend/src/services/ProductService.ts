import Product, { IProduct } from '../models/Product.js';
import { z } from 'zod';
import logger from '../utils/logger.js';
import redis from '../config/redis.js';

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  stock: number;
  images: string[];
  sku: string;
  vendor: string;
  tags?: string[];
}

export interface UpdateProductData extends Partial<CreateProductData> {
  isActive?: boolean;
}

export interface ProductQuery {
  category?: string;
  subcategory?: string;
  vendor?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ProductService {
  
  static async createProduct(data: CreateProductData): Promise<IProduct> {
    try {
      // Check if SKU already exists
      const existingProduct = await Product.findOne({ sku: data.sku });
      if (existingProduct) {
        throw new Error('Product with this SKU already exists');
      }

      const product = new Product(data);
      await product.save();
      
      // Clear cache
      await this.clearProductCache();
      
      logger.info(`Product created successfully: ${product.name} (${product.sku})`);
      return product;
      
    } catch (error) {
      logger.error('Product creation error:', error);
      throw error;
    }
  }

  static async getProductById(id: string): Promise<IProduct | null> {
    try {
      // Try cache first
      const cacheKey = `product:${id}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const product = await Product.findById(id).populate('vendor', 'name email');
      
      if (product) {
        // Cache for 1 hour
        await redis.setex(cacheKey, 3600, JSON.stringify(product));
      }
      
      return product;
      
    } catch (error) {
      logger.error('Get product error:', error);
      throw error;
    }
  }

  static async getProductBySku(sku: string): Promise<IProduct | null> {
    try {
      const cacheKey = `product:sku:${sku}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const product = await Product.findOne({ sku }).populate('vendor', 'name email');
      
      if (product) {
        await redis.setex(cacheKey, 3600, JSON.stringify(product));
      }
      
      return product;
      
    } catch (error) {
      logger.error('Get product by SKU error:', error);
      throw error;
    }
  }

  static async updateProduct(id: string, data: UpdateProductData, vendorId?: string): Promise<IProduct | null> {
    try {
      // Build query
      const query: any = { _id: id };
      if (vendorId) {
        query.vendor = vendorId;
      }

      const product = await Product.findOneAndUpdate(
        query,
        { ...data, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('vendor', 'name email');

      if (product) {
        // Clear cache
        await this.clearProductCache(id);
        logger.info(`Product updated successfully: ${product.name} (${product.sku})`);
      }
      
      return product;
      
    } catch (error) {
      logger.error('Product update error:', error);
      throw error;
    }
  }

  static async deleteProduct(id: string, vendorId?: string): Promise<boolean> {
    try {
      const query: any = { _id: id };
      if (vendorId) {
        query.vendor = vendorId;
      }

      const result = await Product.deleteOne(query);
      
      if (result.deletedCount > 0) {
        await this.clearProductCache(id);
        logger.info(`Product deleted successfully: ${id}`);
        return true;
      }
      
      return false;
      
    } catch (error) {
      logger.error('Product deletion error:', error);
      throw error;
    }
  }

  static async getProducts(query: ProductQuery): Promise<{
    products: IProduct[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        category,
        subcategory,
        vendor,
        isActive = true,
        minPrice,
        maxPrice,
        search,
        tags,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = query;

      // Build filter
      const filter: any = { isActive };
      
      if (category) filter.category = category;
      if (subcategory) filter.subcategory = subcategory;
      if (vendor) filter.vendor = vendor;
      if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined) filter.price.$gte = minPrice;
        if (maxPrice !== undefined) filter.price.$lte = maxPrice;
      }
      if (tags && tags.length > 0) {
        filter.tags = { $in: tags };
      }
      if (search) {
        filter.$text = { $search: search };
      }

      // Build sort
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries
      const [products, total] = await Promise.all([
        Product.find(filter)
          .populate('vendor', 'name email')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Product.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        products,
        total,
        page,
        totalPages
      };
      
    } catch (error) {
      logger.error('Get products error:', error);
      throw error;
    }
  }

  static async updateStock(id: string, quantity: number, operation: 'add' | 'subtract' = 'subtract'): Promise<IProduct | null> {
    try {
      const updateValue = operation === 'add' ? quantity : -quantity;
      
      const product = await Product.findByIdAndUpdate(
        id,
        { $inc: { stock: updateValue } },
        { new: true }
      );

      if (product) {
        // Ensure stock doesn't go negative
        if (product.stock < 0) {
          product.stock = 0;
          await product.save();
        }
        
        await this.clearProductCache(id);
        logger.info(`Stock updated for product: ${product.name} (${product.sku}), new stock: ${product.stock}`);
      }
      
      return product;
      
    } catch (error) {
      logger.error('Stock update error:', error);
      throw error;
    }
  }

  static async getCategories(): Promise<string[]> {
    try {
      const cacheKey = 'categories';
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const categories = await Product.distinct('category', { isActive: true });
      
      // Cache for 1 hour
      await redis.setex(cacheKey, 3600, JSON.stringify(categories));
      
      return categories;
      
    } catch (error) {
      logger.error('Get categories error:', error);
      throw error;
    }
  }

  static async getSubcategories(category?: string): Promise<string[]> {
    try {
      const cacheKey = category ? `subcategories:${category}` : 'subcategories';
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const filter: any = { isActive: true };
      if (category) {
        filter.category = category;
      }

      const subcategories = await Product.distinct('subcategory', filter);
      
      // Cache for 1 hour
      await redis.setex(cacheKey, 3600, JSON.stringify(subcategories));
      
      return subcategories;
      
    } catch (error) {
      logger.error('Get subcategories error:', error);
      throw error;
    }
  }

  private static async clearProductCache(productId?: string): Promise<void> {
    try {
      const keys = ['categories', 'subcategories'];
      
      if (productId) {
        keys.push(`product:${productId}`);
        
        // Also need to clear SKU cache, but we'd need to fetch the product first
        const product = await Product.findById(productId);
        if (product) {
          keys.push(`product:sku:${product.sku}`);
        }
      }
      
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }
}