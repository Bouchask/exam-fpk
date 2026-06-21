// Auth Context for FPK Exam Guard

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  hasRole: (role: 'admin' | 'professor' | ('admin' | 'professor')[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
          // Set user and token from storage
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Only verify token if we can reach the backend
          // Skip verification for now to prevent app from breaking if backend is down
          // The token will be verified on the first API call that requires auth
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        // If there's any error, just continue - backend might be down
        // but we can still use the app with existing stored data
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Listen for storage changes (useful for multi-tab scenarios)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!storedToken || !storedUser) {
        setToken(null);
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login({ username, password });
      
      if (response.success && response.data) {
        setToken(response.data.access_token);
        setUser(response.data.user);
        
        // Store in localStorage
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        if (response.data.professor_quota) {
          localStorage.setItem(
            'professor_quota',
            JSON.stringify(response.data.professor_quota)
          );
        }
        
        setIsLoading(false);
        return true;
      }
      
      setError(response.message || 'Login failed');
      setIsLoading(false);
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear state
      setToken(null);
      setUser(null);
      authService.clearAuth();
      setIsLoading(false);
    }
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await authService.refreshToken();
      if (response.access_token) {
        setToken(response.access_token);
        localStorage.setItem('token', response.access_token);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Token refresh failed:', err);
      return false;
    }
  }, []);

  const getCurrentUser = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } catch (err) {
      console.error('Failed to get current user:', err);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const hasRole = useCallback(
    (role: 'admin' | 'professor' | ('admin' | 'professor')[]): boolean => {
      if (!user) return false;
      
      if (Array.isArray(role)) {
        return role.includes(user.role as 'admin' | 'professor');
      }
      
      return user.role === role;
    },
    [user]
  );

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    error,
    login,
    logout,
    refreshToken,
    getCurrentUser,
    clearError,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };
export default AuthProvider;
