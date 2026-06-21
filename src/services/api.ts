// Base API configuration for FPK Exam Guard Backend

import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Base URL - can be configured via environment variable
// Default to port 5006 which is where the backend runs (see backend/app.py line 155)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';

// Flag to check if backend is available
let backendAvailable = true;

// Flag to track if we're using mock data globally
export let useMockData = false;

// Create axios instance with default configuration
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Authorization header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      
      // Handle 401 Unauthorized - Token expired or invalid
      if (status === 401) {
        // Try to refresh token
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        
        if (!originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
                headers: {
                  Authorization: `Bearer ${refreshToken}`,
                },
              });
              
              if (response.data.success) {
                localStorage.setItem('token', response.data.data.access_token);
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${response.data.data.access_token}`;
                }
                return api(originalRequest);
              }
            }
          } catch (refreshError) {
            // Refresh failed - clear auth
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            // Don't redirect - the component will handle the error
          }
        }
        
        // No refresh token or refresh failed - clear auth
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        // Don't reload the page - just continue with the error
        // The component will handle the 401 error appropriately
      }
      
      // Handle other errors
      if (status === 403) {
        console.error('Access forbidden:', error.response.data);
      } else if (status === 404) {
        console.error('Resource not found:', error.response.data);
      } else if (status >= 500) {
        console.error('Server error:', error.response.data);
        backendAvailable = false;
        useMockData = true;
      }
    } else if (error.request) {
      // Network error - backend might be down
      console.error('Network error - backend may be down:', error.message);
      backendAvailable = false;
      useMockData = true;
    }
    
    return Promise.reject(error);
  }
);

// Helper function to extract error message
function getErrorMessage(error: AxiosError | Error | unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Function to check if backend is available
function isBackendAvailable(): boolean {
  return backendAvailable;
}

// Function to reset backend availability flag
function resetBackendAvailability(): void {
  backendAvailable = true;
}

// Function to set backend availability
function setBackendAvailable(available: boolean): void {
  backendAvailable = available;
}

// Function to enable/disable mock data globally
export function setUseMockData(enabled: boolean): void {
  useMockData = enabled;
}

// Function to check if using mock data globally
export function isUsingMockData(): boolean {
  return useMockData;
}

export { api, API_BASE_URL, getErrorMessage, isBackendAvailable, resetBackendAvailability, setBackendAvailable };
export default api;
