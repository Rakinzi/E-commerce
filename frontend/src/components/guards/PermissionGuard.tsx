import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  role?: string;
  resource?: string;
  action?: string;
  anyPermissions?: string[];
  allPermissions?: string[];
  anyRoles?: string[];
  fallback?: ReactNode;
  requireAuth?: boolean;
}

/**
 * Permission-based component guard that conditionally renders children
 * based on user permissions, roles, or authentication status.
 */
export default function PermissionGuard({
  children,
  permission,
  role,
  resource,
  action,
  anyPermissions,
  allPermissions,
  anyRoles,
  fallback = null,
  requireAuth = true,
}: PermissionGuardProps) {
  const auth = useAuth();

  // If authentication is required but user is not authenticated
  if (requireAuth && !auth.user) {
    return <>{fallback}</>;
  }

  // If user is loading, show fallback
  if (auth.loading) {
    return <>{fallback}</>;
  }

  let hasAccess = true;

  // Check specific permission
  if (permission && !auth.hasPermission(permission)) {
    hasAccess = false;
  }

  // Check resource-action permission
  if (resource && action && !auth.hasPermissionTo(resource, action)) {
    hasAccess = false;
  }

  // Check specific role
  if (role && !auth.hasRole(role)) {
    hasAccess = false;
  }

  // Check any of the specified permissions
  if (anyPermissions && !auth.hasAnyPermission(anyPermissions)) {
    hasAccess = false;
  }

  // Check all specified permissions
  if (allPermissions && !auth.hasAllPermissions(allPermissions)) {
    hasAccess = false;
  }

  // Check any of the specified roles
  if (anyRoles && !auth.hasAnyRole(anyRoles)) {
    hasAccess = false;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Convenience components for common use cases

interface RequirePermissionProps {
  children: ReactNode;
  permission: string;
  fallback?: ReactNode;
}

export function RequirePermission({ children, permission, fallback }: RequirePermissionProps) {
  return (
    <PermissionGuard permission={permission} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

interface RequireRoleProps {
  children: ReactNode;
  role: string;
  fallback?: ReactNode;
}

export function RequireRole({ children, role, fallback }: RequireRoleProps) {
  return (
    <PermissionGuard role={role} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

interface RequireResourcePermissionProps {
  children: ReactNode;
  resource: string;
  action: string;
  fallback?: ReactNode;
}

export function RequireResourcePermission({ 
  children, 
  resource, 
  action, 
  fallback 
}: RequireResourcePermissionProps) {
  return (
    <PermissionGuard resource={resource} action={action} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

interface RequireAnyPermissionProps {
  children: ReactNode;
  permissions: string[];
  fallback?: ReactNode;
}

export function RequireAnyPermission({ children, permissions, fallback }: RequireAnyPermissionProps) {
  return (
    <PermissionGuard anyPermissions={permissions} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

interface RequireAdminProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireAdmin({ children, fallback }: RequireAdminProps) {
  return (
    <PermissionGuard role="admin" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

interface RequireVendorProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireVendor({ children, fallback }: RequireVendorProps) {
  return (
    <PermissionGuard anyRoles={['admin', 'vendor']} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}