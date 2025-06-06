import axios from 'axios';
import { storage } from './tokenStorage';
import getBaseUrl from './getBaseUrl';


const API_URL = `${getBaseUrl()}/workouts`;

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

export const WorkoutAPI = {
  finishWorkout: async (workoutData) => {
    try {
      const response = await api.post('/finish', workoutData);
      return response.data;
    } catch (error) {
      console.error('Workout submission error:', error.response?.data || error.message);
      throw error.response?.data || error.message;
    }
  },
  getWorkouts: async () => {
    try {
      const response = await api.get('/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch workouts:', error.response?.data || error.message);
      throw error.response?.data || error.message;
    }
  },
  getWorkoutById: async (workoutId) => {
    try {
      const response = await api.get(`/${workoutId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch workout details:', error.response?.data || error.message);
      throw error.response?.data || error.message;
    }
  },
  getWorkoutCountsByWeek: async () => {
    try {
      const response = await api.get('/weekly-counts');
      return response.data;
    } catch (error) {
      console.error('Workout counts error:', error.response?.data || error.message);
      throw error.response?.data || error.message;
    }
  },
}; 