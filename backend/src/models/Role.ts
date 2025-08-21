import mongoose, { Document, Schema, Types } from 'mongoose';
import { IPermission } from './Permission.js';

export interface IRole extends Document {
  name: string;
  description?: string;
  permissions: Types.ObjectId[] | IPermission[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  hasPermission(permission: string | Types.ObjectId): Promise<boolean>;
  hasPermissionTo(resource: string, action: string): Promise<boolean>;
  givePermissionTo(permission: string | Types.ObjectId): Promise<IRole>;
  revokePermissionTo(permission: string | Types.ObjectId): Promise<IRole>;
  syncPermissions(permissions: Array<string | Types.ObjectId>): Promise<IRole>;
}

const RoleSchema = new Schema<IRole>({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Role name cannot exceed 50 characters'],
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [255, 'Description cannot exceed 255 characters']
  },
  permissions: [{
    type: Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Additional indexes
RoleSchema.index({ isDefault: 1 });
RoleSchema.index({ isActive: 1 });

// Ensure only one default role
RoleSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await mongoose.model('Role').updateMany(
      { _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// Check if role has specific permission
RoleSchema.methods.hasPermission = async function(permission: string | Types.ObjectId): Promise<boolean> {
  await this.populate('permissions');
  
  if (typeof permission === 'string') {
    return this.permissions.some((p: IPermission) => p.name === permission);
  } else {
    return this.permissions.some((p: IPermission) => p._id.equals(permission));
  }
};

// Check if role has permission to perform action on resource
RoleSchema.methods.hasPermissionTo = async function(resource: string, action: string): Promise<boolean> {
  await this.populate('permissions');
  
  return this.permissions.some((p: IPermission) => {
    return p.allows(resource, action);
  });
};

// Give permission to role
RoleSchema.methods.givePermissionTo = async function(permission: string | Types.ObjectId): Promise<IRole> {
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

  if (!this.permissions.includes(permissionDoc._id)) {
    this.permissions.push(permissionDoc._id);
    await this.save();
  }

  return this;
};

// Revoke permission from role
RoleSchema.methods.revokePermissionTo = async function(permission: string | Types.ObjectId): Promise<IRole> {
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

  this.permissions = this.permissions.filter(
    (p: Types.ObjectId) => !p.equals(permissionDoc!._id)
  );
  
  await this.save();
  return this;
};

// Sync permissions (replace all permissions)
RoleSchema.methods.syncPermissions = async function(permissions: Array<string | Types.ObjectId>): Promise<IRole> {
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

  this.permissions = permissionIds;
  await this.save();
  return this;
};

// Static method to find role with permissions
RoleSchema.statics.findWithPermissions = function(name: string) {
  return this.findOne({ name }).populate('permissions');
};

export default mongoose.model<IRole>('Role', RoleSchema);