import Product from '../../models/Product.js';
import User from '../../models/User.js';
import Role from '../../models/Role.js';
import logger from '../../utils/logger.js';

export interface SeedProduct {
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  stock: number;
  images: string[];
  sku: string;
  tags: string[];
}

const defaultProducts: SeedProduct[] = [
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.',
    price: 199.99,
    category: 'Electronics',
    subcategory: 'Audio Devices',
    stock: 50,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500'
    ],
    sku: 'WBH001',
    tags: ['wireless', 'bluetooth', 'headphones', 'audio']
  },
  {
    name: 'Smartphone Case - Premium Leather',
    description: 'Handcrafted genuine leather case for smartphones. Provides excellent protection while maintaining a sleek profile.',
    price: 49.99,
    category: 'Accessories',
    subcategory: 'Phone Cases',
    stock: 100,
    images: [
      'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=500',
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500'
    ],
    sku: 'SPC001',
    tags: ['smartphone', 'case', 'leather', 'protection']
  },
  {
    name: 'Organic Cotton T-Shirt',
    description: '100% organic cotton t-shirt, sustainably sourced and ethically manufactured. Comfortable fit for everyday wear.',
    price: 24.99,
    category: 'Clothing',
    subcategory: 'T-Shirts',
    stock: 200,
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
      'https://images.unsplash.com/photo-1583743814966-8936f37f4036?w=500'
    ],
    sku: 'OCT001',
    tags: ['organic', 'cotton', 'tshirt', 'sustainable']
  },
  {
    name: 'Stainless Steel Water Bottle',
    description: 'Double-walled insulated water bottle that keeps drinks cold for 24 hours and hot for 12 hours. BPA-free and eco-friendly.',
    price: 34.99,
    category: 'Home & Garden',
    subcategory: 'Drinkware',
    stock: 75,
    images: [
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500',
      'https://images.unsplash.com/photo-1594214582629-7f85e2ac3b4e?w=500'
    ],
    sku: 'SWB001',
    tags: ['water bottle', 'insulated', 'stainless steel', 'eco-friendly']
  },
  {
    name: 'Fitness Tracker Watch',
    description: 'Advanced fitness tracker with heart rate monitoring, GPS, and 7-day battery life. Track your workouts and health metrics.',
    price: 159.99,
    category: 'Electronics',
    subcategory: 'Wearables',
    stock: 30,
    images: [
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500',
      'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=500'
    ],
    sku: 'FTW001',
    tags: ['fitness', 'tracker', 'watch', 'health', 'gps']
  }
];

export class ProductSeeder {
  
  static async seed(products: SeedProduct[] = defaultProducts): Promise<void> {
    try {
      logger.info('Starting product seeding...');

      // Get a vendor user to assign as the product owner
      const vendorRole = await Role.findOne({ name: 'vendor' });
      if (!vendorRole) {
        throw new Error('Vendor role not found. Please seed roles first.');
      }
      
      const vendor = await User.findOne({ roles: vendorRole._id });
      if (!vendor) {
        throw new Error('No vendor user found. Please seed users first.');
      }

      for (const productData of products) {
        // Check if product already exists
        const existingProduct = await Product.findOne({ sku: productData.sku });
        
        if (existingProduct) {
          logger.info(`Product ${productData.sku} already exists, skipping...`);
          continue;
        }

        // Create product
        const product = new Product({
          ...productData,
          vendor: vendor._id
        });

        await product.save();
        logger.info(`Product seeded successfully: ${productData.name} (${productData.sku})`);
      }

      logger.info('Product seeding completed successfully');
      
    } catch (error) {
      logger.error('Product seeding failed:', error);
      throw error;
    }
  }

  static async clear(): Promise<void> {
    try {
      logger.info('Clearing all products...');
      
      const result = await Product.deleteMany({});
      logger.info(`Cleared ${result.deletedCount} products`);
      
    } catch (error) {
      logger.error('Product clearing failed:', error);
      throw error;
    }
  }

  static async reseed(products: SeedProduct[] = defaultProducts): Promise<void> {
    try {
      await this.clear();
      await this.seed(products);
    } catch (error) {
      logger.error('Product reseeding failed:', error);
      throw error;
    }
  }

  static async seedByCategory(category: string, count: number = 10): Promise<void> {
    try {
      logger.info(`Seeding ${count} products for category: ${category}`);

      const vendor = await User.findOne({ role: 'vendor' });
      if (!vendor) {
        throw new Error('No vendor user found. Please seed users first.');
      }

      for (let i = 1; i <= count; i++) {
        const sku = `${category.toUpperCase().slice(0, 3)}${String(i).padStart(3, '0')}`;
        
        const existingProduct = await Product.findOne({ sku });
        if (existingProduct) continue;

        const product = new Product({
          name: `${category} Product ${i}`,
          description: `Sample ${category.toLowerCase()} product #${i} for testing and demonstration purposes.`,
          price: Math.round((Math.random() * 200 + 10) * 100) / 100,
          category,
          subcategory: 'General',
          stock: Math.floor(Math.random() * 100) + 1,
          images: [
            'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500',
            'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500'
          ],
          sku,
          vendor: vendor._id,
          tags: [category.toLowerCase(), 'sample', 'demo']
        });

        await product.save();
      }

      logger.info(`Successfully seeded ${count} products for category: ${category}`);
      
    } catch (error) {
      logger.error(`Category seeding failed for ${category}:`, error);
      throw error;
    }
  }
}