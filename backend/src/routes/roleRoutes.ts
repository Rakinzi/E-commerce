import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import User from '../models/User.js';

const router = Router();

// Get all roles
router.get('/', authenticate, requirePermission('view-users'), async (req, res) => {
  try {
    const roles = await Role.find({ isActive: true })
      .populate('permissions')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: { roles },
      message: 'Roles retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve roles',
      code: 'ROLES_FETCH_ERROR'
    });
  }
});

// Get role by ID
router.get('/:id', authenticate, requirePermission('view-users'), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id)
      .populate('permissions');

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
        code: 'ROLE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { role },
      message: 'Role retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve role',
      code: 'ROLE_FETCH_ERROR'
    });
  }
});

// Create new role
router.post('/', authenticate, requirePermission('manage-roles'), async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    // Validate permissions exist
    if (permissions && permissions.length > 0) {
      const validPermissions = await Permission.find({
        _id: { $in: permissions }
      });

      if (validPermissions.length !== permissions.length) {
        return res.status(400).json({
          success: false,
          error: 'One or more permissions are invalid',
          code: 'INVALID_PERMISSIONS'
        });
      }
    }

    const role = new Role({
      name,
      description,
      permissions: permissions || [],
      isActive: true
    });

    await role.save();
    await role.populate('permissions');

    res.status(201).json({
      success: true,
      data: { role },
      message: 'Role created successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Role name already exists',
        code: 'DUPLICATE_ROLE_NAME'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create role',
      code: 'ROLE_CREATE_ERROR'
    });
  }
});

// Update role
router.put('/:id', authenticate, requirePermission('manage-roles'), async (req, res) => {
  try {
    const { name, description, permissions, isActive } = req.body;
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
        code: 'ROLE_NOT_FOUND'
      });
    }

    // Validate permissions if provided
    if (permissions && permissions.length > 0) {
      const validPermissions = await Permission.find({
        _id: { $in: permissions }
      });

      if (validPermissions.length !== permissions.length) {
        return res.status(400).json({
          success: false,
          error: 'One or more permissions are invalid',
          code: 'INVALID_PERMISSIONS'
        });
      }
    }

    // Update role
    if (name !== undefined) role.name = name;
    if (description !== undefined) role.description = description;
    if (permissions !== undefined) role.permissions = permissions;
    if (isActive !== undefined) role.isActive = isActive;

    await role.save();
    await role.populate('permissions');

    res.json({
      success: true,
      data: { role },
      message: 'Role updated successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Role name already exists',
        code: 'DUPLICATE_ROLE_NAME'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update role',
      code: 'ROLE_UPDATE_ERROR'
    });
  }
});

// Delete role
router.delete('/:id', authenticate, requirePermission('manage-roles'), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
        code: 'ROLE_NOT_FOUND'
      });
    }

    // Check if role is assigned to any users
    const usersWithRole = await User.countDocuments({ roles: role._id });
    
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete role. ${usersWithRole} users are assigned this role.`,
        code: 'ROLE_IN_USE'
      });
    }

    await Role.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete role',
      code: 'ROLE_DELETE_ERROR'
    });
  }
});

// Assign role to user
router.post('/:roleId/assign/:userId', authenticate, requirePermission('manage-roles'), async (req, res) => {
  try {
    const { roleId, userId } = req.params;

    const role = await Role.findById(roleId);
    const user = await User.findById(userId);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
        code: 'ROLE_NOT_FOUND'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    await user.assignRole(roleId);

    res.json({
      success: true,
      message: `Role '${role.name}' assigned to user successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to assign role',
      code: 'ROLE_ASSIGN_ERROR'
    });
  }
});

// Remove role from user
router.delete('/:roleId/remove/:userId', authenticate, requirePermission('manage-roles'), async (req, res) => {
  try {
    const { roleId, userId } = req.params;

    const role = await Role.findById(roleId);
    const user = await User.findById(userId);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
        code: 'ROLE_NOT_FOUND'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    await user.removeRole(roleId);

    res.json({
      success: true,
      message: `Role '${role.name}' removed from user successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to remove role',
      code: 'ROLE_REMOVE_ERROR'
    });
  }
});

export default router;