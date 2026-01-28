import { apiClient } from './client';
import { PermissionId } from '../constants/permissions';

// Auth Types
export interface Role {
  id: number;
  name: string;
  description: string | null;
  permission_ids: number[];
  created_at: string;
  updated_at: string;
}

export interface UserPublic {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number | null;
  role?: Role;
  permissions?: PermissionId[];
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateUserDto {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role_id: number;
}

export interface LoginResponse {
  user: UserPublic;
  token: string;
  expiresAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Auth storage keys
const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

// Auth API Service
export const authApi = {
  /**
   * Login user
   */
  async login(data: LoginDto): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/api/auth/login', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Login failed');
    }

    // Store auth data
    const { token, user } = response.data.data;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

    return response.data.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post<ApiResponse<void>>('/api/auth/logout');
    } catch {
      // Even if API fails, clear local storage
    }

    // Clear auth data
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  },

  /**
   * Register new user
   */
  async register(data: CreateUserDto): Promise<UserPublic> {
    const response = await apiClient.post<ApiResponse<UserPublic>>('/api/auth/register', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Registration failed');
    }
    return response.data.data;
  },

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<UserPublic> {
    const response = await apiClient.get<ApiResponse<UserPublic>>('/api/auth/me');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get user info');
    }
    return response.data.data;
  },

  /**
   * Get all roles
   */
  async getRoles(): Promise<Role[]> {
    const response = await apiClient.get<ApiResponse<Role[]>>('/api/auth/roles');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get roles');
    }
    return response.data.data;
  },

  /**
   * Get all users (admin)
   */
  async getUsers(): Promise<UserPublic[]> {
    const response = await apiClient.get<ApiResponse<UserPublic[]>>('/api/auth/users');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get users');
    }
    return response.data.data;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  },

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  /**
   * Get stored user
   */
  getStoredUser(): UserPublic | null {
    const userStr = localStorage.getItem(AUTH_USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Check if user has specific permission by ID
   */
  hasPermission(permissionId: PermissionId): boolean {
    const user = this.getStoredUser();
    return user?.permissions?.includes(permissionId) || false;
  },

  /**
   * Check if user has any of the specified permissions by IDs
   */
  hasAnyPermission(permissionIds: PermissionId[]): boolean {
    const user = this.getStoredUser();
    if (!user?.permissions) return false;
    return permissionIds.some(id => user.permissions!.includes(id));
  },

  /**
   * Check if user has all of the specified permissions by IDs
   */
  hasAllPermissions(permissionIds: PermissionId[]): boolean {
    const user = this.getStoredUser();
    if (!user?.permissions) return false;
    return permissionIds.every(id => user.permissions!.includes(id));
  },

  /**
   * Get user's role name
   */
  getUserRole(): string | null {
    const user = this.getStoredUser();
    return user?.role?.name || null;
  },
};
