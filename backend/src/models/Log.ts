import mongoose, { Document, Schema } from 'mongoose';

export interface ILog extends Document {
  userId?: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  method: string;
  endpoint: string;
  statusCode: number;
  userAgent?: string;
  ipAddress: string;
  responseTime: number;
  timestamp: Date;
  metadata?: Record<string, any>;
  level: 'info' | 'warn' | 'error' | 'debug';
}

const LogSchema = new Schema<ILog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  action: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Action cannot exceed 100 characters']
  },
  resource: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'Resource cannot exceed 50 characters']
  },
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    uppercase: true
  },
  endpoint: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Endpoint cannot exceed 200 characters']
  },
  statusCode: {
    type: Number,
    required: true,
    min: [100, 'Status code must be at least 100'],
    max: [599, 'Status code cannot exceed 599']
  },
  userAgent: {
    type: String,
    trim: true,
    maxlength: [500, 'User agent cannot exceed 500 characters']
  },
  ipAddress: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(ip: string) {
        // Basic IP validation (IPv4 and IPv6)
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip === '::1' || ip === 'localhost';
      },
      message: 'Invalid IP address format'
    }
  },
  responseTime: {
    type: Number,
    required: true,
    min: [0, 'Response time cannot be negative']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  level: {
    type: String,
    enum: ['info', 'warn', 'error', 'debug'],
    default: 'info',
    index: true
  }
}, {
  timestamps: false, // We're using our own timestamp field
  collection: 'logs'
});

// Compound indexes for common queries
LogSchema.index({ timestamp: -1, level: 1 });
LogSchema.index({ userId: 1, timestamp: -1 });
LogSchema.index({ action: 1, timestamp: -1 });
LogSchema.index({ statusCode: 1, timestamp: -1 });

// TTL index to automatically delete old logs (30 days)
LogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model<ILog>('Log', LogSchema);