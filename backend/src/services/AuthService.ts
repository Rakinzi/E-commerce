import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import User, { IUser } from '../models/User.js';
import { OTPService } from './OTPService.js';
import { env } from '../config/env.js';
import redis from '../config/redis.js';
import logger from '../utils/logger.js';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: IUser;
  token: string;
  sessionId: string;
}

export class AuthService {
  
  static async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Create new user - roles will be auto-assigned by pre-save hook
      const user = new User({
        name: data.name,
        email: data.email,
        password: data.password
      });

      await user.save();

      // Generate session
      const authResponse = await this.generateSession(user);
      
      logger.info(`User registered successfully: ${user.email}`);
      return authResponse;
      
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Find user and include password for comparison
      const user = await User.findOne({ email: credentials.email }).select('+password');
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check password
      const isMatch = await user.comparePassword(credentials.password);
      if (!isMatch) {
        throw new Error('Invalid email or password');
      }

      // Generate session
      const authResponse = await this.generateSession(user);
      
      logger.info(`User logged in successfully: ${user.email}`);
      return authResponse;
      
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  static async logout(userId: string, sessionId: string): Promise<void> {
    try {
      // Remove session from Redis
      await redis.del(`session:${sessionId}`);

      // Remove session token from user's active sessions
      await User.findByIdAndUpdate(userId, {
        $pull: { sessionTokens: sessionId }
      });

      logger.info(`User logged out successfully: ${userId}`);
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  static async logoutAll(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Remove all sessions from Redis
      const pipeline = redis.pipeline();
      user.sessionTokens.forEach(sessionId => {
        pipeline.del(`session:${sessionId}`);
      });
      await pipeline.exec();

      // Clear all session tokens from user
      user.sessionTokens = [];
      await user.save();

      logger.info(`All sessions logged out for user: ${userId}`);
    } catch (error) {
      logger.error('Logout all error:', error);
      throw error;
    }
  }

  static async refreshSession(userId: string, currentSessionId: string): Promise<AuthResponse> {
    try {
      const user = await User.findById(userId).populate('roles', 'name description permissions isDefault isActive');
      if (!user) {
        throw new Error('User not found');
      }

      // Check if current session exists
      const sessionExists = await redis.get(`session:${currentSessionId}`);
      if (!sessionExists) {
        throw new Error('Session not found');
      }

      // Remove old session
      await this.logout(userId, currentSessionId);

      // Generate new session
      const authResponse = await this.generateSession(user);
      
      logger.info(`Session refreshed for user: ${user.email}`);
      return authResponse;
      
    } catch (error) {
      logger.error('Session refresh error:', error);
      throw error;
    }
  }

  static async validateSession(userId: string, sessionId: string): Promise<boolean> {
    try {
      const sessionExists = await redis.get(`session:${sessionId}`);
      if (!sessionExists) {
        return false;
      }

      const user = await User.findById(userId);
      if (!user || !user.sessionTokens.includes(sessionId)) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Session validation error:', error);
      return false;
    }
  }

  private static async generateSession(user: IUser): Promise<AuthResponse> {
    try {
      // Generate session ID
      const sessionId = randomBytes(32).toString('hex');
      
      // Create JWT token
      const token = jwt.sign(
        { 
          userId: user._id, 
          sessionId
        },
        env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Store session in Redis (24 hours)  
      await redis.setex(`session:${sessionId}`, 24 * 60 * 60, JSON.stringify({
        userId: user._id,
        email: user.email,
        createdAt: new Date().toISOString()
      }));

      // Add session token to user's active sessions
      await User.findByIdAndUpdate(user._id, {
        $addToSet: { sessionTokens: sessionId }
      });

      // Get user with populated roles for the response
      const populatedUser = await User.findById(user._id).populate('roles', 'name description permissions isDefault isActive');

      return {
        user: populatedUser || user,
        token,
        sessionId
      };
      
    } catch (error) {
      logger.error('Session generation error:', error);
      throw error;
    }
  }
}