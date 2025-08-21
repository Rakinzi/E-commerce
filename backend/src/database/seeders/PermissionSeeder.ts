import Permission from '../../models/Permission.js';
import Role from '../../models/Role.js';
import User from '../../models/User.js';

interface PermissionData {
  name: string;
  description: string;
  resource: string;
  action: string;
}

interface RoleData {
  name: string;
  description: string;
  permissions: string[];
  isDefault?: boolean;
}

export class PermissionSeeder {
  private permissions: PermissionData[] = [
    // User Management Permissions
    {
      name: 'view-users',
      description: 'View user profiles and information',
      resource: 'users',
      action: 'read'
    },
    {
      name: 'create-users',
      description: 'Create new user accounts',
      resource: 'users',
      action: 'create'
    },
    {
      name: 'update-users',
      description: 'Update user profiles and information',
      resource: 'users',
      action: 'update'
    },
    {
      name: 'delete-users',
      description: 'Delete user accounts',
      resource: 'users',
      action: 'delete'
    },
    {
      name: 'manage-users',
      description: 'Full control over user management',
      resource: 'users',
      action: 'manage'
    },

    // Product Management Permissions
    {
      name: 'view-products',
      description: 'View product listings and details',
      resource: 'products',
      action: 'read'
    },
    {
      name: 'create-products',
      description: 'Create new products',
      resource: 'products',
      action: 'create'
    },
    {
      name: 'update-products',
      description: 'Update existing products',
      resource: 'products',
      action: 'update'
    },
    {
      name: 'delete-products',
      description: 'Delete products',
      resource: 'products',
      action: 'delete'
    },
    {
      name: 'manage-products',
      description: 'Full control over product management',
      resource: 'products',
      action: 'manage'
    },

    // Order Management Permissions
    {
      name: 'view-orders',
      description: 'View order information',
      resource: 'orders',
      action: 'read'
    },
    {
      name: 'create-orders',
      description: 'Create new orders',
      resource: 'orders',
      action: 'create'
    },
    {
      name: 'update-orders',
      description: 'Update order status and information',
      resource: 'orders',
      action: 'update'
    },
    {
      name: 'cancel-orders',
      description: 'Cancel orders',
      resource: 'orders',
      action: 'delete'
    },
    {
      name: 'manage-orders',
      description: 'Full control over order management',
      resource: 'orders',
      action: 'manage'
    },

    // Cart Management Permissions
    {
      name: 'view-cart',
      description: 'View shopping cart contents',
      resource: 'cart',
      action: 'read'
    },
    {
      name: 'manage-cart',
      description: 'Add, update, and remove items from cart',
      resource: 'cart',
      action: 'manage'
    },

    // Admin Permissions
    {
      name: 'view-dashboard',
      description: 'Access admin dashboard and analytics',
      resource: 'dashboard',
      action: 'read'
    },
    {
      name: 'view-logs',
      description: 'View system logs and audit trails',
      resource: 'logs',
      action: 'read'
    },
    {
      name: 'manage-roles',
      description: 'Create, update, and assign roles',
      resource: 'roles',
      action: 'manage'
    },
    {
      name: 'manage-permissions',
      description: 'Create and update permissions',
      resource: 'permissions',
      action: 'manage'
    },

    // Payment Management
    {
      name: 'view-payments',
      description: 'View payment information',
      resource: 'payments',
      action: 'read'
    },
    {
      name: 'manage-payments',
      description: 'Process and manage payments',
      resource: 'payments',
      action: 'manage'
    },

    // Inventory Management
    {
      name: 'view-inventory',
      description: 'View inventory levels and stock',
      resource: 'inventory',
      action: 'read'
    },
    {
      name: 'manage-inventory',
      description: 'Update inventory levels and stock',
      resource: 'inventory',
      action: 'manage'
    },

    // Category Management
    {
      name: 'view-categories',
      description: 'View product categories',
      resource: 'categories',
      action: 'read'
    },
    {
      name: 'manage-categories',
      description: 'Create, update, and delete categories',
      resource: 'categories',
      action: 'manage'
    }
  ];

  private roles: RoleData[] = [
    {
      name: 'customer',
      description: 'Regular customer with basic shopping permissions',
      permissions: [
        'view-products',
        'view-categories',
        'view-cart',
        'manage-cart',
        'create-orders',
        'view-orders'
      ],
      isDefault: true
    },
    {
      name: 'vendor',
      description: 'Product vendor with product and order management permissions',
      permissions: [
        'view-products',
        'create-products',
        'update-products',
        'delete-products',
        'view-categories',
        'manage-categories',
        'view-orders',
        'update-orders',
        'view-inventory',
        'manage-inventory',
        'view-cart',
        'manage-cart',
        'create-orders'
      ]
    },
    {
      name: 'admin',
      description: 'System administrator with full permissions',
      permissions: [
        'view-users',
        'create-users',
        'update-users',
        'delete-users',
        'manage-users',
        'manage-products',
        'manage-orders',
        'manage-cart',
        'view-dashboard',
        'view-logs',
        'manage-roles',
        'manage-permissions',
        'manage-payments',
        'manage-inventory',
        'manage-categories'
      ]
    }
  ];

  async seedPermissions(): Promise<void> {
    console.log('🔐 Seeding permissions...');
    
    try {
      // Clear existing permissions
      await Permission.deleteMany({});
      console.log('  ✓ Cleared existing permissions');

      // Create permissions
      const createdPermissions = await Permission.insertMany(this.permissions);
      console.log(`  ✓ Created ${createdPermissions.length} permissions`);

      // Log created permissions
      for (const permission of createdPermissions) {
        console.log(`    - ${permission.name} (${permission.resource}:${permission.action})`);
      }

    } catch (error) {
      console.error('❌ Error seeding permissions:', error);
      throw error;
    }
  }

  async seedRoles(): Promise<void> {
    console.log('👥 Seeding roles...');
    
    try {
      // Clear existing roles
      await Role.deleteMany({});
      console.log('  ✓ Cleared existing roles');

      // Create roles with permissions
      for (const roleData of this.roles) {
        // Find permission IDs
        const permissions = await Permission.find({
          name: { $in: roleData.permissions }
        });

        const role = new Role({
          name: roleData.name,
          description: roleData.description,
          permissions: permissions.map(p => p._id),
          isDefault: roleData.isDefault || false,
          isActive: true
        });

        await role.save();
        console.log(`  ✓ Created role: ${role.name} with ${permissions.length} permissions`);
      }

    } catch (error) {
      console.error('❌ Error seeding roles:', error);
      throw error;
    }
  }

  async migrateExistingUsers(): Promise<void> {
    console.log('👤 Migrating existing users to new role system...');
    
    try {
      const users = await User.find({});
      let migratedCount = 0;

      for (const user of users) {
        // Check if user already has roles assigned
        if (user.roles && user.roles.length > 0) {
          continue; // Skip users who already have roles
        }

        // Get the old role from the user (if it exists)
        const oldRole = (user as any).role;
        let targetRoleName = 'customer'; // default

        if (oldRole === 'admin') {
          targetRoleName = 'admin';
        } else if (oldRole === 'vendor') {
          targetRoleName = 'vendor';
        }

        // Find the role and assign it
        const role = await Role.findOne({ name: targetRoleName, isActive: true });
        if (role) {
          user.roles = [role._id];
          await user.save();
          migratedCount++;
          console.log(`  ✓ Migrated user ${user.email} to role: ${targetRoleName}`);
        }
      }

      console.log(`  ✓ Migrated ${migratedCount} users`);

    } catch (error) {
      console.error('❌ Error migrating users:', error);
      throw error;
    }
  }

  async createSuperAdmin(): Promise<void> {
    console.log('🦸 Creating super admin user...');
    
    try {
      // Check if super admin already exists
      const existingSuperAdmin = await User.findOne({ email: 'admin@ecommerce.local' });
      
      if (existingSuperAdmin) {
        console.log('  ✓ Super admin already exists');
        return;
      }

      // Find admin role
      const adminRole = await Role.findOne({ name: 'admin' });
      if (!adminRole) {
        throw new Error('Admin role not found');
      }

      // Create super admin user
      const superAdmin = new User({
        name: 'Super Admin',
        email: 'admin@ecommerce.local',
        password: 'SuperSecurePassword123!',
        roles: [adminRole._id],
        isEmailVerified: true,
        isActive: true
      });

      await superAdmin.save();
      console.log('  ✓ Created super admin user (admin@ecommerce.local)');
      console.log('  ⚠️  Password: SuperSecurePassword123! (change this immediately!)');

    } catch (error) {
      console.error('❌ Error creating super admin:', error);
      throw error;
    }
  }

  async seedAll(): Promise<void> {
    console.log('🌱 Starting permission and role seeding...\n');
    
    await this.seedPermissions();
    console.log('');
    
    await this.seedRoles();
    console.log('');
    
    await this.migrateExistingUsers();
    console.log('');
    
    await this.createSuperAdmin();
    console.log('');
    
    console.log('✅ Permission and role seeding completed successfully!');
  }

  async clear(): Promise<void> {
    console.log('🧹 Clearing permissions and roles...');
    
    try {
      await Permission.deleteMany({});
      await Role.deleteMany({});
      
      // Clear roles from users
      await User.updateMany({}, { 
        $set: { 
          roles: [],
          directPermissions: []
        }
      });
      
      console.log('  ✓ Cleared all permissions, roles, and user assignments');
    } catch (error) {
      console.error('❌ Error clearing permissions and roles:', error);
      throw error;
    }
  }
}