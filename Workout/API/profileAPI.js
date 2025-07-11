import axios from 'axios';
import { storage } from './local/tokenStorage';
import getBaseUrl from './utils/getBaseUrl';

const API_URL = `${getBaseUrl()}/profile`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const profileAPI = {
  getProfile: async () => {
    try {
      const response = await api.get('/');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      // Only send display_name field
      const data = {
        display_name: profileData.display_name || ''
      };
      const response = await api.put('/', data);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }
}; 