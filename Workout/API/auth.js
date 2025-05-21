import axios from 'axios';
import { storage } from '../utils/storage';

const API_URL = 'http://localhost:3000/auth';

// default axios 
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// add token to requests if it exists
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    if (!error.response) {
      throw new Error('Network error - please check your connection');
    }
    throw error.response.data || error.message;
  }
);

export const authAPI = {
  // sign up new user
  signup: async (email, password) => {
    try {
      console.log('Sending signup request to:', `${API_URL}/signup`);
      const response = await api.post('/signup', { email, password });
      console.log('Signup response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  // login user
  login: async (email, password) => {
    try {
      console.log('Sending login request to:', `${API_URL}/login`);
      const response = await api.post('/login', { email, password });
      console.log('Login response:', response.data);
      if (response.data.session?.access_token) {
        await storage.setItem('auth_token', response.data.session.access_token);
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // logout user
  logout: async () => {
    try {
      await api.post('/logout');
      await storage.removeItem('auth_token');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // reset password
  resetPassword: async (email) => {
    try {
      const response = await api.post('/reset-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // verify email
  verifyEmail: async (token) => {
    try {
      const response = await api.get(`/verify-email?token=${token}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // check if user is authenticated
  isAuthenticated: async () => {
    try {
      const token = await storage.getItem('auth_token');
      return !!token;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  },
}; 