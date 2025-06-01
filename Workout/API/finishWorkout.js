import axios from 'axios';
import { storage } from './tokenStorage';
import getBaseUrl from './getBaseUrl';

const API_URL = `${getBaseUrl()}`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach token to requests
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const finishWorkout = {
  finishWorkout: async (workoutData) => {
    try {
      const response = await api.post('/workouts/finish', workoutData);
      return response.data;
    } catch (error) {
      console.error('Workout submission error:', error.response?.data || error.message);
      throw error.response?.data || error.message;
    }
  },
}; 