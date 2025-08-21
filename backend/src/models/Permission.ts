import mongoose, { Document, Schema } from 'mongoose';

export interface IPermission extends Document {
  name: string;
  description?: string;
  resource: string; // e.g., 'products', 'orders', 'users'
  action: string;   // e.g., 'create', 'read', 'update', 'delete'
  conditions?: any; // Additional conditions (JSON object)
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new Schema<IPermission>({
  name: {
    type: String,
    required: [true, 'Permission name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Permission name cannot exceed 100 characters'],
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [255, 'Description cannot exceed 255 characters']
  },
  resource: {
    type: String,
    required: [true, 'Resource is required'],
    trim: true,
    lowercase: true,
    index: true
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: ['create', 'read', 'update', 'delete', 'manage'],
    lowercase: true,
    index: true
  },
  conditions: {
    type: Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for unique resource-action combinations
PermissionSchema.index({ resource: 1, action: 1 }, { unique: true });

// Helper method to check if permission allows action on resource
PermissionSchema.methods.allows = function(resource: string, action: string): boolean {
  if (this.action === 'manage') return this.resource === resource;
  return this.resource === resource && this.action === action;
};

// Static method to find permissions by resource and action
PermissionSchema.statics.findByResourceAction = function(resource: string, action: string) {
  return this.find({
    $or: [
      { resource, action },
      { resource, action: 'manage' }
    ]
  });
};

export default mongoose.model<IPermission>('Permission', PermissionSchema);