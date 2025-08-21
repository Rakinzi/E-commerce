import { connectDB } from '../config/db.js';
import { UserSeeder } from './seeders/userSeeder.js';
import { ProductSeeder } from './seeders/productSeeder.js';
import { PermissionSeeder } from './seeders/PermissionSeeder.js';
import logger from '../utils/logger.js';
import { exit } from 'process';

const runSeeders = async () => {
  try {
    logger.info('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Get command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    
    const permissionSeeder = new PermissionSeeder();
    
    switch (command) {
      case 'permissions':
        await permissionSeeder.seedAll();
        break;
        
      case 'users':
        await UserSeeder.seed();
        break;
        
      case 'products':
        await ProductSeeder.seed();
        break;
        
      case 'all':
        await permissionSeeder.seedAll();
        await UserSeeder.seed();
        await ProductSeeder.seed();
        break;
        
      case 'clear':
        logger.info('🧹 Clearing all data...');
        await ProductSeeder.clear();
        await UserSeeder.clear();
        await permissionSeeder.clear();
        logger.info('✅ All data cleared');
        break;
        
      case 'reset':
        logger.info('🔄 Resetting all data...');
        await permissionSeeder.clear();
        await UserSeeder.reseed();
        await ProductSeeder.reseed();
        await permissionSeeder.seedAll();
        logger.info('✅ All data reset');
        break;
        
      default:
        logger.info(`
Available commands:
  permissions - Seed permissions and roles only
  users       - Seed users only
  products    - Seed products only (requires users to exist first)
  all         - Seed all data (permissions, users, products)
  clear       - Clear all data
  reset       - Clear and reseed all data

Usage: bun run src/database/seed.ts <command>
        `);
        exit(0);
    }
    
    logger.info('🎉 Seeding completed successfully');
    exit(0);
    
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    exit(1);
  }
};

runSeeders();