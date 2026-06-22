// Authentication Service for FPK Exam Guard

import api, { getErrorMessage, setBackendAvailable, useMockData as globalUseMockData, setUseMockData as setGlobalUseMockData, isUsingMockData as isGlobalUsingMockData, resetToRealData } from './api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ChangePasswordRequest,
  User,
  ApiResponse,
} from '../types';
import { findMockUser, createSuccessResponse } from './mockData';

// Local flag can override global flag
export { setGlobalUseMockData as setUseMockData, isGlobalUsingMockData as isUsingMockData, globalUseMockData as useMockData, resetToRealData };

const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  ME: '/auth/me',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  CHANGE_PASSWORD: '/auth/change-password',
  UPDATE_USER: (userId: number) => `/auth/users/${userId}`,
};

export const authService = {
  /**
   * Login user with username and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // If using mock data, validate against mock users
    if (globalUseMockData) {
      const mockUser = findMockUser(credentials.username, credentials.password);
      
      if (mockUser) {
        // Create mock token
        const mockToken = `mock-token-${credentials.username}-${Date.now()}`;
        const mockQuota = mockUser.role === 'professor' ? {
          quota: '2/4',
          completed_guards: 2,
          max_guards: 4,
        } : undefined;
        
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        
        if (mockQuota) {
          localStorage.setItem('professor_quota', JSON.stringify(mockQuota));
        }
        
        return createSuccessResponse({
          access_token: mockToken,
          user: mockUser,
          professor_quota: mockQuota,
        }, 'Login successful') as LoginResponse;
      } else {
        throw new Error('Invalid credentials');
      }
    }
    
    try {
      const response = await api.post<LoginResponse>(AUTH_ENDPOINTS.LOGIN, credentials);
      
      if (response.data.success && response.data.data) {
        // Store token and user data
        localStorage.setItem('token', response.data.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        
        // Store professor quota if available
        if (response.data.data.professor_quota) {
          localStorage.setItem(
            'professor_quota',
            JSON.stringify(response.data.data.professor_quota)
          );
        }
      }
      
      return response.data;
    } catch (error) {
      // If backend fails, try mock data
      setBackendAvailable(false);
      console.warn('Backend not available, switching to mock data');
      setGlobalUseMockData(true);
      
      const mockUser = findMockUser(credentials.username, credentials.password);
      
      if (mockUser) {
        // For mock mode, accept any password for known users
        const mockToken = `mock-token-${credentials.username}-${Date.now()}`;
        const mockQuota = mockUser.role === 'professor' ? {
          quota: '2/4',
          completed_guards: 2,
          max_guards: 4,
        } : undefined;
        
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        
        if (mockQuota) {
          localStorage.setItem('professor_quota', JSON.stringify(mockQuota));
        }
        
        return createSuccessResponse({
          access_token: mockToken,
          user: mockUser,
          professor_quota: mockQuota,
        }, 'Login successful (mock mode)') as LoginResponse;
      } else {
        throw new Error('Invalid credentials');
      }
    }
  },

  /**
   * Register new user (admin only)
   */
  async register(userData: RegisterRequest): Promise<ApiResponse<User>> {
    try {
      const response = await api.post<ApiResponse<User>>(AUTH_ENDPOINTS.REGISTER, userData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<ApiResponse<{ user: User; professor?: any }>> {
    if (globalUseMockData) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser) as User;
        return createSuccessResponse({ user, professor: null });
      }
      throw new Error('No user found in mock mode');
    }
    
    try {
      const response = await api.get<ApiResponse<{ user: User; professor?: any }>>(AUTH_ENDPOINTS.ME);
      return response.data;
    } catch (error) {
      // Try mock data
      setGlobalUseMockData(true);
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser) as User;
        return createSuccessResponse({ user, professor: null });
      }
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ access_token: string }> {
    try {
      const response = await api.post<{ access_token: string }>(AUTH_ENDPOINTS.REFRESH);
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
      }
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<ApiResponse<null>> {
    try {
      // Clear local storage first
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('professor_quota');
      
      // Call logout endpoint (optional - backend doesn't require it)
      await api.post<ApiResponse<null>>(AUTH_ENDPOINTS.LOGOUT);
      
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      // Even if API call fails, we've cleared local storage
      return { success: true, message: 'Logged out successfully' };
    }
  },

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<null>> {
    try {
      const response = await api.post<ApiResponse<null>>(AUTH_ENDPOINTS.CHANGE_PASSWORD, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Update user information (admin only)
   */
  async updateUser(userId: number, userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await api.put<ApiResponse<User>>(AUTH_ENDPOINTS.UPDATE_USER(userId), userData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  },

  /**
   * Get stored user
   */
  getStoredUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  },

  /**
   * Get user role
   */
  getUserRole(): 'admin' | 'professor' | null {
    const user = this.getStoredUser();
    return user?.role || null;
  },

  /**
   * Clear all auth data
   */
  clearAuth(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('professor_quota');
  },
};

export default authService;
