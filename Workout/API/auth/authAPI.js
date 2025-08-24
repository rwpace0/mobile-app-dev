import axios from 'axios';
import { storage } from '../local/tokenStorage';
import { tokenManager } from '../utils/tokenManager';
import getBaseUrl from "../utils/getBaseUrl";

const API_URL = `${getBaseUrl()}/auth`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add token to requests if it exists
api.interceptors.request.use(async (config) => {
  const accessToken = await tokenManager.getValidToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Add response interceptor for better error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error:', error.response?.data || error.message);
    if (!error.response) {
      throw new Error('Network error - please check your connection');
    }
    
    // Handle 401 errors with token refresh
    if (error.response.status === 401) {
      try {
        // Try to get a valid token (this will attempt refresh if needed)
        const accessToken = await tokenManager.getValidToken();
        if (accessToken) {
          // Retry the original request with new token
          const originalRequest = error.config;
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear all tokens if refresh fails
        await tokenManager.clearTokens();
        throw new Error('Session expired. Please login again.');
      }
    }
    
    // Handle specific error codes
    if (error.response.data?.code === 'EXPIRED_LINK') {
      throw new Error('Verification link has expired. Please request a new one.');
    }
    if (error.response.data?.code === 'VERIFICATION_FAILED') {
      throw new Error('Email verification failed. Please try again.');
    }
    throw error.response.data || error.message;
  }
);

export const authAPI = {
  // Sign up new user
  signup: async (email, password, username) => {
    try {
      const response = await api.post('/signup', { email, password, username });
      
      return response.data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      
      if (response.data.session?.access_token) {
        await storage.setTokens(
          response.data.session.access_token,
          response.data.session.refresh_token,
          response.data.session.expires_in
        );
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      await api.post('/logout');
      await storage.clearTokens();
    } catch (error) {
      console.error('Logout error:', error);
      // Still remove tokens even if logout fails
      await storage.clearTokens();
      throw error;
    }
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/request-password-reset', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Reset password with token
  resetPasswordWithToken: async (token_hash, type, password) => {
    try {
      const response = await api.post('/reset-password', { token_hash, type, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Verify email
  verifyEmail: async (token_hash, type) => {
    try {
      const response = await api.get('/verify-email', {
        params: { token_hash, type }
      });
      // If verification is successful, store the session tokens
      if (response.data.session?.access_token) {
        await storage.setTokens(
          response.data.session.access_token,
          response.data.session.refresh_token,
          response.data.session.expires_in
        );
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      return await tokenManager.isAuthenticated();
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  },

  // Update username
  updateUsername: async (username) => {
    try {
      const response = await api.post('/auth/update-username', { username });
      return response.data;
    } catch (error) {
      console.error('Update username error:', error);
      throw error;
    }
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post('/refresh', { refresh_token: refreshToken });
      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  },

  checkAvailability: async (username, email) => {
    try {
      const response = await fetch(`${getBaseUrl()}/auth/check-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to check availability');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

}; 