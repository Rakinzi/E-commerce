import bcrypt from 'bcrypt';
import User from '../../models/User.js';
import Role from '../../models/Role.js';
import logger from '../../utils/logger.js';

export interface SeedUser {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'vendor' | 'customer';
  isEmailVerified: boolean;
}

const defaultUsers: SeedUser[] = [
  {
    name: 'Admin User',
    email: 'admin@ecommerce.com',
    password: 'Admin123!@#',
    role: 'admin',
    isEmailVerified: true
  },
  {
    name: 'Vendor Demo',
    email: 'vendor@ecommerce.com',
    password: 'Vendor123!@#',
    role: 'vendor',
    isEmailVerified: true
  },
  {
    name: 'Customer Demo',
    email: 'customer@ecommerce.com',
    password: 'Customer123!@#',
    role: 'customer',
    isEmailVerified: true
  }
];

export class UserSeeder {
  
  static async seed(users: SeedUser[] = defaultUsers): Promise<void> {
    try {
      logger.info('Starting user seeding...');

      for (const userData of users) {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          logger.info(`User ${userData.email} already exists, skipping...`);
          continue;
        }

        // Find the role by name
        const role = await Role.findOne({ name: userData.role });
        if (!role) {
          logger.error(`Role '${userData.role}' not found for user ${userData.email}`);
          continue;
        }

        // Create user - let the model handle password hashing via pre-save hook
        const user = new User({
          name: userData.name,
          email: userData.email,
          password: userData.password, // Let the model's pre-save hook hash this
          isEmailVerified: userData.isEmailVerified,
          roles: [role._id] // Assign the role ObjectId
        });

        await user.save();

        logger.info(`User seeded successfully: ${userData.email} (${userData.role})`);
      }

      logger.info('User seeding completed successfully');
      
    } catch (error) {
      logger.error('User seeding failed:', error);
      throw error;
    }
  }

  static async clear(): Promise<void> {
    try {
      logger.info('Clearing all users...');
      
      const result = await User.deleteMany({});
      logger.info(`Cleared ${result.deletedCount} users`);
      
    } catch (error) {
      logger.error('User clearing failed:', error);
      throw error;
    }
  }

  static async reseed(users: SeedUser[] = defaultUsers): Promise<void> {
    try {
      await this.clear();
      await this.seed(users);
    } catch (error) {
      logger.error('User reseeding failed:', error);
      throw error;
    }
  }
}