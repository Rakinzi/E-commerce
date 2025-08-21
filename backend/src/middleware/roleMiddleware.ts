import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware.js';

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions. Access denied.' 
      });
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireVendor = requireRole('admin', 'vendor');
export const requireCustomer = requireRole('admin', 'vendor', 'customer');