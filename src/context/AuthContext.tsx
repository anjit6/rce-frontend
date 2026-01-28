import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, UserPublic } from '../api/auth.api';
import { PermissionId } from '../constants/permissions';

interface AuthContextType {
  user: UserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permissionId: PermissionId) => boolean;
  hasAnyPermission: (permissionIds: PermissionId[]) => boolean;
  hasAllPermissions: (permissionIds: PermissionId[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authApi.isAuthenticated()) {
          const storedUser = authApi.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            // Optionally refresh user data from server
            try {
              const freshUser = await authApi.getCurrentUser();
              setUser(freshUser);
              localStorage.setItem('auth_user', JSON.stringify(freshUser));
            } catch {
              // If refresh fails, use stored data
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        // Clear invalid auth data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    setUser(response.user);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const hasPermission = (permissionId: PermissionId): boolean => {
    return user?.permissions?.includes(permissionId) || false;
  };

  const hasAnyPermission = (permissionIds: PermissionId[]): boolean => {
    if (!user?.permissions) return false;
    return permissionIds.some(id => user.permissions!.includes(id));
  };

  const hasAllPermissions = (permissionIds: PermissionId[]): boolean => {
    if (!user?.permissions) return false;
    return permissionIds.every(id => user.permissions!.includes(id));
  };

  const refreshUser = async () => {
    if (authApi.isAuthenticated()) {
      const freshUser = await authApi.getCurrentUser();
      setUser(freshUser);
      localStorage.setItem('auth_user', JSON.stringify(freshUser));
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
