import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { IRole } from './Role.js';
import { IPermission } from './Permission.js';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  roles: Types.ObjectId[] | IRole[];
  directPermissions: Types.ObjectId[] | IPermission[];
  sessionTokens: string[];
  isEmailVerified: boolean;
  emailVerifiedAt?: Date;
  lastEmailVerificationSent?: Date;
  isActive: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  hasRole(role: string | Types.ObjectId): Promise<boolean>;
  hasAnyRole(roles: Array<string | Types.ObjectId>): Promise<boolean>;
  hasAllRoles(roles: Array<string | Types.ObjectId>): Promise<boolean>;
  assignRole(role: string | Types.ObjectId): Promise<IUser>;
  removeRole(role: string | Types.ObjectId): Promise<IUser>;
  syncRoles(roles: Array<string | Types.ObjectId>): Promise<IUser>;
  hasPermission(permission: string | Types.ObjectId): Promise<boolean>;
  hasPermissionTo(resource: string, action: string): Promise<boolean>;
  hasAnyPermission(permissions: Array<string | Types.ObjectId>): Promise<boolean>;
  hasAllPermissions(permissions: Array<string | Types.ObjectId>): Promise<boolean>;
  givePermissionTo(permission: string | Types.ObjectId): Promise<IUser>;
  revokePermissionTo(permission: string | Types.ObjectId): Promise<IUser>;
  syncPermissions(permissions: Array<string | Types.ObjectId>): Promise<IUser>;
  getAllPermissions(): Promise<IPermission[]>;
  getRoleNames(): Promise<string[]>;
  getPermissionNames(): Promise<string[]>;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email'],
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  roles: [{
    type: Schema.Types.ObjectId,
    ref: 'Role'
  }],
  directPermissions: [{
    type: Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  sessionTokens: [{
    type: String
  }],
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerifiedAt: {
    type: Date
  },
  lastEmailVerificationSent: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

// Additional indexes for faster queries
UserSchema.index({ roles: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ directPermissions: 1 });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Role methods
UserSchema.methods.hasRole = async function(role: string | Types.ObjectId): Promise<boolean> {
  await this.populate('roles');
  
  if (typeof role === 'string') {
    return this.roles.some((r: IRole) => r.name === role);
  } else {
    return this.roles.some((r: IRole) => r._id.equals(role));
  }
};

UserSchema.methods.hasAnyRole = async function(roles: Array<string | Types.ObjectId>): Promise<boolean> {
  for (const role of roles) {
    if (await this.hasRole(role)) {
      return true;
    }
  }
  return false;
};

UserSchema.methods.hasAllRoles = async function(roles: Array<string | Types.ObjectId>): Promise<boolean> {
  for (const role of roles) {
    if (!(await this.hasRole(role))) {
      return false;
    }
  }
  return true;
};

UserSchema.methods.assignRole = async function(role: string | Types.ObjectId): Promise<IUser> {
  const Role = mongoose.model('Role');
  let roleDoc: IRole | null;

  if (typeof role === 'string') {
    roleDoc = await Role.findOne({ name: role, isActive: true });
  } else {
    roleDoc = await Role.findOne({ _id: role, isActive: true });
  }

  if (!roleDoc) {
    throw new Error('Role not found or inactive');
  }

  if (!this.roles.some((r: Types.ObjectId) => r.equals(roleDoc!._id))) {
    this.roles.push(roleDoc._id);
    await this.save();
  }

  return this;
};

UserSchema.methods.removeRole = async function(role: string | Types.ObjectId): Promise<IUser> {
  const Role = mongoose.model('Role');
  let roleDoc: IRole | null;

  if (typeof role === 'string') {
    roleDoc = await Role.findOne({ name: role });
  } else {
    roleDoc = await Role.findById(role);
  }

  if (!roleDoc) {
    throw new Error('Role not found');
  }

  this.roles = this.roles.filter((r: Types.ObjectId) => !r.equals(roleDoc!._id));
  await this.save();
  return this;
};

UserSchema.methods.syncRoles = async function(roles: Array<string | Types.ObjectId>): Promise<IUser> {
  const Role = mongoose.model('Role');
  const roleIds: Types.ObjectId[] = [];

  for (const role of roles) {
    let roleDoc: IRole | null;

    if (typeof role === 'string') {
      roleDoc = await Role.findOne({ name: role, isActive: true });
    } else {
      roleDoc = await Role.findOne({ _id: role, isActive: true });
    }

    if (roleDoc) {
      roleIds.push(roleDoc._id);
    }
  }

  this.roles = roleIds;
  await this.save();
  return this;
};

// Permission methods
UserSchema.methods.hasPermission = async function(permission: string | Types.ObjectId): Promise<boolean> {
  // Check direct permissions
  await this.populate('directPermissions');
  
  if (typeof permission === 'string') {
    const hasDirectPermission = this.directPermissions.some((p: IPermission) => p.name === permission);
    if (hasDirectPermission) return true;
  } else {
    const hasDirectPermission = this.directPermissions.some((p: IPermission) => p._id.equals(permission));
    if (hasDirectPermission) return true;
  }

  // Check role permissions
  await this.populate({
    path: 'roles',
    populate: {
      path: 'permissions'
    }
  });

  for (const role of this.roles as IRole[]) {
    if (await role.hasPermission(permission)) {
      return true;
    }
  }

  return false;
};

UserSchema.methods.hasPermissionTo = async function(resource: string, action: string): Promise<boolean> {
  // Check direct permissions
  await this.populate('directPermissions');
  
  const hasDirectPermission = this.directPermissions.some((p: IPermission) => p.allows(resource, action));
  if (hasDirectPermission) return true;

  // Check role permissions
  await this.populate({
    path: 'roles',
    populate: {
      path: 'permissions'
    }
  });

  for (const role of this.roles as IRole[]) {
    if (await role.hasPermissionTo(resource, action)) {
      return true;
    }
  }

  return false;
};

UserSchema.methods.hasAnyPermission = async function(permissions: Array<string | Types.ObjectId>): Promise<boolean> {
  for (const permission of permissions) {
    if (await this.hasPermission(permission)) {
      return true;
    }
  }
  return false;
};

UserSchema.methods.hasAllPermissions = async function(permissions: Array<string | Types.ObjectId>): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await this.hasPermission(permission))) {
      return false;
    }
  }
  return true;
};

UserSchema.methods.givePermissionTo = async function(permission: string | Types.ObjectId): Promise<IUser> {
  const Permission = mongoose.model('Permission');
  let permissionDoc: IPermission | null;

  if (typeof permission === 'string') {
    permissionDoc = await Permission.findOne({ name: permission });
  } else {
    permissionDoc = await Permission.findById(permission);
  }

  if (!permissionDoc) {
    throw new Error('Permission not found');
  }

  if (!this.directPermissions.some((p: Types.ObjectId) => p.equals(permissionDoc!._id))) {
    this.directPermissions.push(permissionDoc._id);
    await this.save();
  }

  return this;
};

UserSchema.methods.revokePermissionTo = async function(permission: string | Types.ObjectId): Promise<IUser> {
  const Permission = mongoose.model('Permission');
  let permissionDoc: IPermission | null;

  if (typeof permission === 'string') {
    permissionDoc = await Permission.findOne({ name: permission });
  } else {
    permissionDoc = await Permission.findById(permission);
  }

  if (!permissionDoc) {
    throw new Error('Permission not found');
  }

  this.directPermissions = this.directPermissions.filter(
    (p: Types.ObjectId) => !p.equals(permissionDoc!._id)
  );
  
  await this.save();
  return this;
};

UserSchema.methods.syncPermissions = async function(permissions: Array<string | Types.ObjectId>): Promise<IUser> {
  const Permission = mongoose.model('Permission');
  const permissionIds: Types.ObjectId[] = [];

  for (const permission of permissions) {
    let permissionDoc: IPermission | null;

    if (typeof permission === 'string') {
      permissionDoc = await Permission.findOne({ name: permission });
    } else {
      permissionDoc = await Permission.findById(permission);
    }

    if (permissionDoc) {
      permissionIds.push(permissionDoc._id);
    }
  }

  this.directPermissions = permissionIds;
  await this.save();
  return this;
};

UserSchema.methods.getAllPermissions = async function(): Promise<IPermission[]> {
  const allPermissions: IPermission[] = [];
  
  // Get direct permissions
  await this.populate('directPermissions');
  allPermissions.push(...this.directPermissions as IPermission[]);

  // Get role permissions
  await this.populate({
    path: 'roles',
    populate: {
      path: 'permissions'
    }
  });

  for (const role of this.roles as IRole[]) {
    if (role.permissions) {
      allPermissions.push(...role.permissions as IPermission[]);
    }
  }

  // Remove duplicates
  const uniquePermissions = allPermissions.filter((permission, index, self) =>
    index === self.findIndex(p => p._id.equals(permission._id))
  );

  return uniquePermissions;
};

UserSchema.methods.getRoleNames = async function(): Promise<string[]> {
  await this.populate('roles');
  return (this.roles as IRole[]).map(role => role.name);
};

UserSchema.methods.getPermissionNames = async function(): Promise<string[]> {
  const allPermissions = await this.getAllPermissions();
  return allPermissions.map(permission => permission.name);
};

// Remove password from JSON output and include role/permission info
UserSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.sessionTokens;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  return userObject;
};

// Auto-assign default role on user creation
UserSchema.pre('save', async function(next) {
  if (this.isNew && this.roles.length === 0) {
    try {
      const Role = mongoose.model('Role');
      const defaultRole = await Role.findOne({ isDefault: true, isActive: true });
      if (defaultRole) {
        this.roles = [defaultRole._id];
      }
    } catch (error) {
      // Continue without assigning role if there's an error
    }
  }
  next();
});

export default mongoose.model<IUser>('User', UserSchema);