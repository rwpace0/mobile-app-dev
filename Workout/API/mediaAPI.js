import axios from 'axios';
import { storage } from './tokenStorage';
import getBaseUrl from './getBaseUrl';

const API_URL = `${getBaseUrl()}/media`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  timeout: 30000, // 30 second timeout for uploads
});

// Add token to requests if it exists
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const mediaAPI = {
  uploadExerciseMedia: async (exerciseId, imageUri) => {
    try {
      // Create form data
      const formData = new FormData();
      
      // Get the filename from the URI
      const filename = imageUri.split('/').pop();
      
      // Append the file with correct field name
      formData.append('exerciseMedia', {
        uri: imageUri,
        name: filename,
        type: `image/${filename.split('.').pop().toLowerCase()}`
      });
      
      // Append exercise ID and user exercise flag
      formData.append('exerciseId', exerciseId);
      formData.append('isUserExercise', 'true');

      const response = await api.post('/exercise', formData);
      return response.data;
    } catch (error) {
      console.error('Upload exercise media error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }
}; 