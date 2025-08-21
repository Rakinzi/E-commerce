import { Request, Response } from 'express';
import { z } from 'zod';
import { ProductService, CreateProductData, UpdateProductData, ProductQuery } from '../services/ProductService.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Name cannot exceed 200 characters'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description cannot exceed 2000 characters'),
  price: z.number().min(0, 'Price cannot be negative'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().min(1, 'Subcategory is required'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  images: z.array(z.string()).optional(), // Make images optional for MVP
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU cannot exceed 50 characters'),
  tags: z.array(z.string()).optional(),
  active: z.boolean().optional()
});

const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional()
});

const querySchema = z.object({
  category: z.string().optional(),
  subcategory: z.string().optional(),
  vendor: z.string().optional(),
  isActive: z.boolean().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['name', 'price', 'createdAt', 'rating.average', 'stock']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

export class ProductController {
  
  static async createProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = createProductSchema.parse(req.body);
      
      const productData: CreateProductData = {
        ...validatedData,
        vendor: req.user._id.toString()
      };

      const product = await ProductService.createProduct(productData);
      
      res.status(201).json({
        message: 'Product created successfully',
        product
      });
      
    } catch (error) {
      logger.error('Create product error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }
      
      if (error instanceof Error) {
        if (error.message === 'Product with this SKU already exists') {
          res.status(409).json({ error: error.message });
          return;
        }
      }
      
      res.status(500).json({ error: 'Product creation failed' });
    }
  }

  static async getProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Product ID is required' });
        return;
      }

      const product = await ProductService.getProductById(id);
      
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.status(200).json({ product });
      
    } catch (error) {
      logger.error('Get product error:', error);
      res.status(500).json({ error: 'Failed to get product' });
    }
  }

  static async getProducts(req: Request, res: Response): Promise<void> {
    try {
      // Parse query parameters
      const query: ProductQuery = {
        category: req.query.category as string,
        subcategory: req.query.subcategory as string,
        vendor: req.query.vendor as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : true,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        search: req.query.search as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
      };

      const validatedQuery = querySchema.parse(query);
      const result = await ProductService.getProducts(validatedQuery);
      
      res.status(200).json(result);
      
    } catch (error) {
      logger.error('Get products error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Invalid query parameters',
          details: error.errors
        });
        return;
      }
      
      res.status(500).json({ error: 'Failed to get products' });
    }
  }

  static async updateProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Product ID is required' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = updateProductSchema.parse(req.body);
      
      // Only allow vendor to update their own products (unless admin)
      const isAdmin = await req.user.hasRole('admin');
      const vendorId = isAdmin ? undefined : req.user._id.toString();
      
      const product = await ProductService.updateProduct(id, validatedData as UpdateProductData, vendorId);
      
      if (!product) {
        res.status(404).json({ error: 'Product not found or access denied' });
        return;
      }

      res.status(200).json({
        message: 'Product updated successfully',
        product
      });
      
    } catch (error) {
      logger.error('Update product error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }
      
      res.status(500).json({ error: 'Product update failed' });
    }
  }

  static async deleteProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Product ID is required' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Only allow vendor to delete their own products (unless admin)
      const isAdmin = await req.user.hasRole('admin');
      const vendorId = isAdmin ? undefined : req.user._id.toString();
      
      const success = await ProductService.deleteProduct(id, vendorId);
      
      if (!success) {
        res.status(404).json({ error: 'Product not found or access denied' });
        return;
      }

      res.status(200).json({ message: 'Product deleted successfully' });
      
    } catch (error) {
      logger.error('Delete product error:', error);
      res.status(500).json({ error: 'Product deletion failed' });
    }
  }

  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await ProductService.getCategories();
      
      res.status(200).json({ categories });
      
    } catch (error) {
      logger.error('Get categories error:', error);
      res.status(500).json({ error: 'Failed to get categories' });
    }
  }

  static async getSubcategories(req: Request, res: Response): Promise<void> {
    try {
      const category = req.query.category as string;
      const subcategories = await ProductService.getSubcategories(category);
      
      res.status(200).json({ subcategories });
      
    } catch (error) {
      logger.error('Get subcategories error:', error);
      res.status(500).json({ error: 'Failed to get subcategories' });
    }
  }

  static async getProductBySku(req: Request, res: Response): Promise<void> {
    try {
      const { sku } = req.params;
      
      if (!sku) {
        res.status(400).json({ error: 'SKU is required' });
        return;
      }

      const product = await ProductService.getProductBySku(sku);
      
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.status(200).json({ product });
      
    } catch (error) {
      logger.error('Get product by SKU error:', error);
      res.status(500).json({ error: 'Failed to get product' });
    }
  }

  static async getVendorProducts(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Parse and validate query parameters
      const query = querySchema.parse({
        ...req.query,
        vendor: req.user._id.toString(), // Force vendor to be the authenticated user
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        tags: req.query.tags ? (Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags]) : undefined
      });

      const result = await ProductService.getProducts(query);
      
      res.status(200).json({
        products: result.products,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
        return;
      }
      
      logger.error('Get vendor products error:', error);
      res.status(500).json({ error: 'Failed to get products' });
    }
  }

  static async createProductWithImages(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Log the incoming data for debugging
      logger.info('Creating product with request data:', {
        body: req.body,
        files: req.files ? (req.files as any[]).map(f => f.filename) : 'No files'
      });

      // Handle uploaded images
      const imageUrls = req.files && Array.isArray(req.files) 
        ? req.files.map(file => `/uploads/products/${file.filename}`)
        : [];

      // Handle tags - they come as 'tags[]' from FormData
      let tags = [];
      if (req.body['tags[]']) {
        tags = Array.isArray(req.body['tags[]']) ? req.body['tags[]'] : [req.body['tags[]']];
      } else if (req.body.tags) {
        if (Array.isArray(req.body.tags)) {
          tags = req.body.tags;
        } else if (typeof req.body.tags === 'string' && req.body.tags.trim()) {
          tags = req.body.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
        }
      }

      const productData = {
        name: req.body.name?.trim(),
        description: req.body.description?.trim(),
        price: parseFloat(req.body.price) || 0,
        category: req.body.category?.trim(),
        subcategory: req.body.subcategory?.trim(),
        stock: parseInt(req.body.stock) || 0,
        sku: req.body.sku?.trim(),
        images: imageUrls.length > 0 ? imageUrls : undefined,
        tags: tags.length > 0 ? tags : undefined,
        active: req.body.active === 'true'
      };

      logger.info('Processed product data for validation:', productData);

      // Validate request data
      const validatedData = createProductSchema.parse(productData);
      
      const createData: CreateProductData = {
        ...validatedData,
        vendor: req.user._id.toString()
      };

      const product = await ProductService.createProduct(createData);
      
      res.status(201).json({ product });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      
      logger.error('Create product with images error:', error);
      res.status(500).json({ error: 'Product creation failed' });
    }
  }

  static async updateProductWithImages(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Handle uploaded images
      const newImageUrls = req.files && Array.isArray(req.files) 
        ? req.files.map(file => `/uploads/products/${file.filename}`)
        : [];

      // Prepare update data
      const updateData = { ...req.body };
      
      // Handle numeric fields
      if (updateData.price) updateData.price = parseFloat(updateData.price);
      if (updateData.stock) updateData.stock = parseInt(updateData.stock);

      if (updateData.tags && typeof updateData.tags === 'string') {
        updateData.tags = updateData.tags.split(',');
      }

      // Handle images - add new images to existing ones unless replacing all
      if (newImageUrls.length > 0) {
        if (req.body.replaceImages === 'true') {
          updateData.images = newImageUrls;
        } else {
          // Get existing product to merge images
          const existingProduct = await ProductService.getProduct(id);
          if (existingProduct) {
            updateData.images = [...(existingProduct.images || []), ...newImageUrls];
          } else {
            updateData.images = newImageUrls;
          }
        }
      }

      // Validate request data
      const validatedData = updateProductSchema.parse(updateData);
      
      // Only allow vendor to update their own products (unless admin)
      const isAdmin = await req.user.hasRole('admin');
      const vendorId = isAdmin ? undefined : req.user._id.toString();
      
      const product = await ProductService.updateProduct(id, validatedData, vendorId);
      
      if (!product) {
        res.status(404).json({ error: 'Product not found or access denied' });
        return;
      }

      res.status(200).json({ product });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      
      logger.error('Update product with images error:', error);
      res.status(500).json({ error: 'Product update failed' });
    }
  }
}