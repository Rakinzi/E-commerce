import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';
import Permission from '../models/Permission.js';
import User from '../models/User.js';

const router = Router();

// Get all permissions
router.get('/', authenticate, requirePermission('view-users'), async (req, res) => {
  try {
    const { resource, action } = req.query;
    const filter: any = {};

    if (resource) filter.resource = resource;
    if (action) filter.action = action;

    const permissions = await Permission.find(filter).sort({ resource: 1, action: 1 });

    // Group permissions by resource for better organization
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    }, {} as Record<string, any[]>);

    res.json({
      success: true,
      data: { 
        permissions,
        groupedPermissions,
        total: permissions.length
      },
      message: 'Permissions retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve permissions',
      code: 'PERMISSIONS_FETCH_ERROR'
    });
  }
});

// Get permission by ID
router.get('/:id', authenticate, requirePermission('view-users'), async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);

    if (!permission) {
      return res.status(404).json({
        success: false,
        error: 'Permission not found',
        code: 'PERMISSION_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { permission },
      message: 'Permission retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve permission',
      code: 'PERMISSION_FETCH_ERROR'
    });
  }
});

// Create new permission
router.post('/', authenticate, requirePermission('manage-permissions'), async (req, res) => {
  try {
    const { name, description, resource, action, conditions } = req.body;

    // Validate action
    const validActions = ['create', 'read', 'update', 'delete', 'manage'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: `Invalid action. Must be one of: ${validActions.join(', ')}`,
        code: 'INVALID_ACTION'
      });
    }

    const permission = new Permission({
      name,
      description,
      resource: resource.toLowerCase(),
      action: action.toLowerCase(),
      conditions
    });

    await permission.save();

    res.status(201).json({
      success: true,
      data: { permission },
      message: 'Permission created successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Permission with this resource and action already exists',
        code: 'DUPLICATE_PERMISSION'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create permission',
      code: 'PERMISSION_CREATE_ERROR'
    });
  }
});

// Update permission
router.put('/:id', authenticate, requirePermission('manage-permissions'), async (req, res) => {
  try {
    const { name, description, resource, action, conditions } = req.body;
    const permission = await Permission.findById(req.params.id);

    if (!permission) {
      return res.status(404).json({
        success: false,
        error: 'Permission not found',
        code: 'PERMISSION_NOT_FOUND'
      });
    }

    // Validate action if provided
    if (action) {
      const validActions = ['create', 'read', 'update', 'delete', 'manage'];
      if (!validActions.includes(action)) {
        return res.status(400).json({
          success: false,
          error: `Invalid action. Must be one of: ${validActions.join(', ')}`,
          code: 'INVALID_ACTION'
        });
      }
    }

    // Update permission
    if (name !== undefined) permission.name = name;
    if (description !== undefined) permission.description = description;
    if (resource !== undefined) permission.resource = resource.toLowerCase();
    if (action !== undefined) permission.action = action.toLowerCase();
    if (conditions !== undefined) permission.conditions = conditions;

    await permission.save();

    res.json({
      success: true,
      data: { permission },
      message: 'Permission updated successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Permission with this resource and action already exists',
        code: 'DUPLICATE_PERMISSION'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update permission',
      code: 'PERMISSION_UPDATE_ERROR'
    });
  }
});

// Delete permission
router.delete('/:id', authenticate, requirePermission('manage-permissions'), async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);

    if (!permission) {
      return res.status(404).json({
        success: false,
        error: 'Permission not found',
        code: 'PERMISSION_NOT_FOUND'
      });
    }

    await Permission.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Permission deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete permission',
      code: 'PERMISSION_DELETE_ERROR'
    });
  }
});

// Get available resources
router.get('/resources/list', authenticate, requirePermission('view-users'), async (req, res) => {
  try {
    const resources = await Permission.distinct('resource');
    
    res.json({
      success: true,
      data: { resources },
      message: 'Resources retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve resources',
      code: 'RESOURCES_FETCH_ERROR'
    });
  }
});

// Grant permission to user
router.post('/:permissionId/grant/:userId', authenticate, requirePermission('manage-permissions'), async (req, res) => {
  try {
    const { permissionId, userId } = req.params;

    const permission = await Permission.findById(permissionId);
    const user = await User.findById(userId);

    if (!permission) {
      return res.status(404).json({
        success: false,
        error: 'Permission not found',
        code: 'PERMISSION_NOT_FOUND'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    await user.givePermissionTo(permissionId);

    res.json({
      success: true,
      message: `Permission '${permission.name}' granted to user successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to grant permission',
      code: 'PERMISSION_GRANT_ERROR'
    });
  }
});

// Revoke permission from user
router.delete('/:permissionId/revoke/:userId', authenticate, requirePermission('manage-permissions'), async (req, res) => {
  try {
    const { permissionId, userId } = req.params;

    const permission = await Permission.findById(permissionId);
    const user = await User.findById(userId);

    if (!permission) {
      return res.status(404).json({
        success: false,
        error: 'Permission not found',
        code: 'PERMISSION_NOT_FOUND'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    await user.revokePermissionTo(permissionId);

    res.json({
      success: true,
      message: `Permission '${permission.name}' revoked from user successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to revoke permission',
      code: 'PERMISSION_REVOKE_ERROR'
    });
  }
});

export default router;