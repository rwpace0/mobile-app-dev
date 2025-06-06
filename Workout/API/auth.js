import axios from 'axios';
import { storage } from './tokenStorage';
import getBaseUrl from "./getBaseUrl";

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
  const token = await storage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error:', error.response?.data || error.message);
    if (!error.response) {
      throw new Error('Network error - please check your connection');
    }
    // Handle specific error codes
    if (error.response.status === 401) {
      // Clear invalid token
      await storage.removeItem('auth_token');
    }
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
      console.log('Signup response:', response.data);
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
        await storage.setItem('auth_token', response.data.session.access_token);
      }
      console.log("Login response:", response.data);
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
      await storage.removeItem('auth_token');
    } catch (error) {
      console.error('Logout error:', error);
      // Still remove token even if logout fails
      await storage.removeItem('auth_token');
      throw error;
    }
  },

  // Reset password
  resetPassword: async (email) => {
    try {
      const response = await api.post('/reset-password', { email });
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
      // If verification is successful, store the session token
      if (response.data.session?.access_token) {
        await storage.setItem('auth_token', response.data.session.access_token);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      const token = await storage.getItem('auth_token');
      if (!token) return false;
      
      // Validate token by making a request to /me
      const response = await api.get('/me');
      return response.status === 200;
    } catch (error) {
      console.error('Auth check error:', error);
      // If token is invalid, remove it
      await storage.removeItem('auth_token');
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
}; 