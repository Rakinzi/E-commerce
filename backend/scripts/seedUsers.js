import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.ts';
import User from '../src/models/User.ts';
import Role from '../src/models/Role.ts';

const testUsers = [
  {
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin',
    isEmailVerified: true,
    isActive: true
  },
  {
    name: 'Vendor User', 
    email: 'vendor@test.com',
    password: 'vendor123',
    role: 'vendor',
    isEmailVerified: true,
    isActive: true
  },
  {
    name: 'Customer User',
    email: 'customer@test.com', 
    password: 'customer123',
    role: 'customer',
    isEmailVerified: true,
    isActive: true
  }
];

async function seedUsers() {
  try {
    console.log('🌱 Starting user seeding...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Get roles
    const adminRole = await Role.findOne({ name: 'admin' });
    const vendorRole = await Role.findOne({ name: 'vendor' });
    const customerRole = await Role.findOne({ name: 'customer' });

    if (!adminRole || !vendorRole || !customerRole) {
      console.error('❌ Required roles not found. Please run role seeding first.');
      process.exit(1);
    }

    // Clear existing test users
    await User.deleteMany({ 
      email: { $in: testUsers.map(u => u.email) } 
    });
    console.log('🗑️  Cleared existing test users');

    // Create users
    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      let roleId;
      switch (userData.role) {
        case 'admin':
          roleId = adminRole._id;
          break;
        case 'vendor':
          roleId = vendorRole._id;
          break;
        case 'customer':
          roleId = customerRole._id;
          break;
        default:
          roleId = customerRole._id;
      }

      const user = new User({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        roles: [roleId],
        isEmailVerified: userData.isEmailVerified,
        isActive: userData.isActive,
        emailVerifiedAt: new Date()
      });

      await user.save();
      console.log(`✅ Created ${userData.role}: ${userData.email}`);
    }

    console.log('\n🎉 User seeding completed successfully!');
    console.log('\n📝 Test User Credentials:');
    console.log('┌──────────────────────────────────────────────────────────┐');
    console.log('│                    TEST USERS                            │');
    console.log('├──────────────────────────────────────────────────────────┤');
    console.log('│ ADMIN USER                                               │');
    console.log('│ Email: admin@test.com                                    │');
    console.log('│ Password: admin123                                       │');
    console.log('├──────────────────────────────────────────────────────────┤');
    console.log('│ VENDOR USER                                              │');
    console.log('│ Email: vendor@test.com                                   │');
    console.log('│ Password: vendor123                                      │');
    console.log('├──────────────────────────────────────────────────────────┤');
    console.log('│ CUSTOMER USER                                            │');
    console.log('│ Email: customer@test.com                                 │');
    console.log('│ Password: customer123                                    │');
    console.log('└──────────────────────────────────────────────────────────┘');
    console.log('\n✨ All users are EMAIL VERIFIED and ACTIVE');
    console.log('🔐 You can now login with any of these credentials');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Run the seeder
seedUsers();