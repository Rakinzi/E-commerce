import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.js';
import { env } from '../config/env.js';
import redis from '../config/redis.js';
import logger from '../utils/logger.js';

export interface AuthRequest extends Request {
  user?: IUser;
  sessionToken?: string;
}

export interface JWTPayload {
  userId: string;
  sessionId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies.authToken || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    
    // Check if session exists in Redis
    const sessionExists = await redis.get(`session:${decoded.sessionId}`);
    if (!sessionExists) {
      return res.status(401).json({ 
        error: 'Session expired. Please login again.' 
      });
    }

    // Get user from database with populated roles
    const user = await User.findById(decoded.userId).populate('roles', 'name description permissions isDefault isActive');
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token. User not found.' 
      });
    }

    // Check if session token is in user's active sessions
    if (!user.sessionTokens.includes(decoded.sessionId)) {
      return res.status(401).json({ 
        error: 'Session revoked. Please login again.' 
      });
    }

    // Extend session in Redis (sliding expiration)
    await redis.expire(`session:${decoded.sessionId}`, 24 * 60 * 60); // 24 hours

    req.user = user;
    req.sessionToken = decoded.sessionId;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Invalid token.' 
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: 'Token expired. Please login again.' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Authentication failed.' 
    });
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies.authToken || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    const sessionExists = await redis.get(`session:${decoded.sessionId}`);
    
    if (sessionExists) {
      const user = await User.findById(decoded.userId).populate('roles', 'name description permissions isDefault isActive');
      if (user && user.sessionTokens.includes(decoded.sessionId)) {
        req.user = user;
        req.sessionToken = decoded.sessionId;
        // Extend session
        await redis.expire(`session:${decoded.sessionId}`, 24 * 60 * 60);
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we don't return errors, just continue without user
    next();
  }
};