import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  name: string;
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  status: 'active' | 'abandoned' | 'converted';
  totalItems: number;
  totalPrice: number;
  lastModified: Date;
  createdAt: Date;
  updatedAt: Date;
  calculateTotals(): void;
}

const CartItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    max: [100, 'Quantity cannot exceed 100']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  name: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const CartSchema = new Schema<ICart>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  items: [CartItemSchema],
  status: {
    type: String,
    enum: ['active', 'abandoned', 'converted'],
    default: 'active'
  },
  totalItems: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      // Convert ObjectId fields to strings
      ret.userId = ret.userId?.toString();
      if (ret.items) {
        ret.items = ret.items.map((item: any) => ({
          ...item,
          productId: item.productId?.toString()
        }));
      }
      return ret;
    }
  }
});

// Calculate totals method
CartSchema.methods.calculateTotals = function() {
  this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
  this.totalPrice = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  this.lastModified = new Date();
};

// Update totals before saving
CartSchema.pre('save', function(next) {
  this.calculateTotals();
  next();
});

// Additional indexes
CartSchema.index({ status: 1 });
CartSchema.index({ lastModified: 1 });

export default mongoose.model<ICart>('Cart', CartSchema);