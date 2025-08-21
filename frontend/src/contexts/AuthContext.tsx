import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI, roleAPI, type User, type Permission, type Role } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  
  // Permission helpers
  hasPermission: (permission: string) => boolean;
  hasPermissionTo: (resource: string, action: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  getAllPermissions: () => Permission[];
  getRoleNames: () => string[];
  getPermissionNames: () => string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [roleMap, setRoleMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!hasCheckedAuth) {
      checkAuth();
    }
  }, [hasCheckedAuth]);

  const checkAuth = async () => {
    if (hasCheckedAuth) return;
    
    try {
      const response = await authAPI.getProfile();
      const userData = response.data.user;
      setUser(userData);
      
      // If roles are strings (IDs), fetch role names
      if (userData && userData.roles.length > 0 && typeof userData.roles[0] === 'string') {
        try {
          const rolesResponse = await roleAPI.getRolesByIds(userData.roles as string[]);
          const newRoleMap: Record<string, string> = {};
          rolesResponse.data.roles.forEach((role: Role) => {
            newRoleMap[role._id] = role.name;
          });
          setRoleMap(newRoleMap);
        } catch (error) {
          console.error('Failed to fetch role names:', error);
        }
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
      setHasCheckedAuth(true);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authAPI.login(email, password);
    setUser(response.data.user);
  };

  const register = async (name: string, email: string, password: string, role: string = 'customer') => {
    const response = await authAPI.register(name, email, password, role);
    // With email verification, user won't be logged in immediately
    // They need to verify their email first
    // setUser(response.data.user);
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
    setHasCheckedAuth(false);
  };

  const updateProfile = async (name: string) => {
    const response = await authAPI.updateProfile(name);
    setUser(response.data.user);
  };

  // Permission helper functions
  const getAllPermissions = (): Permission[] => {
    if (!user) return [];
    
    const allPermissions: Permission[] = [];
    
    // Get permissions from roles
    user.roles.forEach(role => {
      allPermissions.push(...role.permissions);
    });
    
    // Get direct permissions
    allPermissions.push(...user.directPermissions);
    
    // Remove duplicates
    const uniquePermissions = allPermissions.filter((permission, index, self) =>
      index === self.findIndex(p => p._id === permission._id)
    );
    
    return uniquePermissions;
  };

  const hasPermission = (permission: string): boolean => {
    const allPermissions = getAllPermissions();
    return allPermissions.some(p => p.name === permission);
  };

  const hasPermissionTo = (resource: string, action: string): boolean => {
    const allPermissions = getAllPermissions();
    return allPermissions.some(p => 
      (p.resource === resource && p.action === action) ||
      (p.resource === resource && p.action === 'manage')
    );
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.roles.some(r => {
      if (typeof r === 'string') {
        // Use the roleMap to get the role name
        return roleMap[r] === role;
      }
      return r.name === role;
    });
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const getRoleNames = (): string[] => {
    if (!user) return [];
    return user.roles.map(role => {
      if (typeof role === 'string') {
        return roleMap[role] || 'Unknown';
      }
      return role.name;
    });
  };

  const getPermissionNames = (): string[] => {
    return getAllPermissions().map(permission => permission.name);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateProfile,
      hasPermission,
      hasPermissionTo,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
      hasAnyRole,
      getAllPermissions,
      getRoleNames,
      getPermissionNames,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}