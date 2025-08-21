import mongoose, { Document, Schema } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  code: string;
  type: 'email_verification' | 'password_reset';
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  used: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OTPSchema = new Schema<IOTP>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    index: true
  },
  code: {
    type: String,
    required: [true, 'OTP code is required'],
    length: 6
  },
  type: {
    type: String,
    enum: ['email_verification', 'password_reset'],
    required: [true, 'OTP type is required'],
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  },
  attempts: {
    type: Number,
    default: 0,
    min: 0
  },
  maxAttempts: {
    type: Number,
    default: 5,
    min: 1
  },
  used: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
OTPSchema.index({ email: 1, type: 1 });
OTPSchema.index({ email: 1, type: 1, used: 1 });
OTPSchema.index({ code: 1, email: 1, type: 1 });

// Instance methods
OTPSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt;
};

OTPSchema.methods.isMaxAttemptsReached = function(): boolean {
  return this.attempts >= this.maxAttempts;
};

OTPSchema.methods.incrementAttempts = function(): Promise<IOTP> {
  this.attempts += 1;
  return this.save();
};

OTPSchema.methods.markAsUsed = function(): Promise<IOTP> {
  this.used = true;
  return this.save();
};

// Static methods
OTPSchema.statics.findValidOTP = function(email: string, code: string, type: string) {
  return this.findOne({
    email: email.toLowerCase(),
    code,
    type,
    used: false,
    expiresAt: { $gt: new Date() }
  });
};

OTPSchema.statics.invalidateOTPs = function(email: string, type: string) {
  return this.updateMany(
    {
      email: email.toLowerCase(),
      type,
      used: false
    },
    {
      used: true
    }
  );
};

OTPSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { used: true, createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Delete used OTPs older than 24 hours
    ]
  });
};

export default mongoose.model<IOTP>('OTP', OTPSchema);