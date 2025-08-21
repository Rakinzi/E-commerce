import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware.js';

/**
 * Middleware to check if user has specific permission
 */
export const requirePermission = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required.',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    try {
      const hasPermission = await req.user.hasPermission(permission);
      
      if (!hasPermission) {
        return res.status(403).json({ 
          success: false,
          error: `Permission '${permission}' is required for this action.`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error checking permissions.',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware to check if user has permission to perform action on resource
 */
export const requirePermissionTo = (resource: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required.',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    try {
      const hasPermission = await req.user.hasPermissionTo(resource, action);
      
      if (!hasPermission) {
        return res.status(403).json({ 
          success: false,
          error: `Permission to '${action}' on '${resource}' is required.`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error checking permissions.',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware to check if user has any of the specified permissions
 */
export const requireAnyPermission = (...permissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required.',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    try {
      const hasAnyPermission = await req.user.hasAnyPermission(permissions);
      
      if (!hasAnyPermission) {
        return res.status(403).json({ 
          success: false,
          error: `One of the following permissions is required: ${permissions.join(', ')}.`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error checking permissions.',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware to check if user has all specified permissions
 */
export const requireAllPermissions = (...permissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required.',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    try {
      const hasAllPermissions = await req.user.hasAllPermissions(permissions);
      
      if (!hasAllPermissions) {
        return res.status(403).json({ 
          success: false,
          error: `All of the following permissions are required: ${permissions.join(', ')}.`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error checking permissions.',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware to check if user has specific role
 */
export const requireRole = (...roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required.',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    try {
      const hasRole = await req.user.hasAnyRole(roles);
      
      if (!hasRole) {
        return res.status(403).json({ 
          success: false,
          error: `One of the following roles is required: ${roles.join(', ')}.`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error checking roles.',
        code: 'ROLE_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware to check if user has all specified roles
 */
export const requireAllRoles = (...roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required.',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    try {
      const hasAllRoles = await req.user.hasAllRoles(roles);
      
      if (!hasAllRoles) {
        return res.status(403).json({ 
          success: false,
          error: `All of the following roles are required: ${roles.join(', ')}.`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error checking roles.',
        code: 'ROLE_CHECK_ERROR'
      });
    }
  };
};

/**
 * Resource ownership middleware - checks if user owns the resource
 */
export const requireOwnership = (resourceIdParam: string = 'id', userField: string = 'userId') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required.',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    try {
      const resourceId = req.params[resourceIdParam];
      const userId = req.user._id.toString();

      // This would typically involve checking the resource in the database
      // For now, we'll assume the resource has a userId field
      // Implementation would depend on your specific models
      
      // Example for cart ownership
      if (req.route?.path?.includes('/cart')) {
        // Cart ownership is automatically handled by user association
        return next();
      }

      // Example for order ownership
      if (req.route?.path?.includes('/orders')) {
        const Order = req.app.get('models').Order;
        const order = await Order.findById(resourceId);
        
        if (!order) {
          return res.status(404).json({
            success: false,
            error: 'Resource not found.',
            code: 'RESOURCE_NOT_FOUND'
          });
        }

        if (order.userId?.toString() !== userId) {
          return res.status(403).json({
            success: false,
            error: 'You do not have permission to access this resource.',
            code: 'OWNERSHIP_REQUIRED'
          });
        }
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error checking resource ownership.',
        code: 'OWNERSHIP_CHECK_ERROR'
      });
    }
  };
};

/**
 * Combined permission and ownership check
 */
export const requirePermissionOrOwnership = (permission: string, resourceIdParam: string = 'id') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required.',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    try {
      // Check if user has the required permission
      const hasPermission = await req.user.hasPermission(permission);
      
      if (hasPermission) {
        return next(); // User has permission, allow access
      }

      // If no permission, check ownership
      return requireOwnership(resourceIdParam)(req, res, next);
      
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error checking permissions and ownership.',
        code: 'PERMISSION_OWNERSHIP_CHECK_ERROR'
      });
    }
  };
};