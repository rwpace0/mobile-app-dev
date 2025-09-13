import axios from 'axios';
import { storage } from './local/tokenStorage';
import { tokenManager } from './utils/tokenManager';
import getBaseUrl from './utils/getBaseUrl';
import { mediaCache } from './local/MediaCache';
import * as FileSystem from 'expo-file-system/legacy';

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
      const accessToken = await tokenManager.getValidToken();
      if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
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
      
      // Get file info for size validation
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024;
      if (fileInfo.size > maxSize) {
        throw new Error('Image size must be less than 5MB');
      }
      
      // Append the file with correct field name
      formData.append('exerciseMedia', {
        uri: imageUri,
        name: filename,
        type: `image/${filename.split('.').pop().toLowerCase()}`
      });
      
      // Append exercise ID
      formData.append('exerciseId', exerciseId);
      formData.append('isUserExercise', 'true');

      const response = await api.post('/exercise', formData);
      const { url: mediaUrl } = response.data;

      // Download and cache the file
      const localPath = await mediaCache.downloadAndCacheFile(mediaUrl, 'exercises', exerciseId);
      
      // Update local database
      await mediaCache.updateExerciseMedia(exerciseId, mediaUrl, localPath);

      return { mediaUrl, localPath };
    } catch (error) {
      console.error('Upload exercise media error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  uploadProfileAvatar: async (userId, imageUri) => {
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop();

      // Get file info for size validation
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024;
      if (fileInfo.size > maxSize) {
        throw new Error('Image size must be less than 5MB');
      }

      formData.append('avatar', {
        uri: imageUri,
        name: filename,
        type: `image/${filename.split('.').pop().toLowerCase()}`
      });

      const response = await api.post('/avatar', formData);
      const { url: avatarUrl } = response.data;

      // Download and cache the file
      const localPath = await mediaCache.downloadAndCacheFile(avatarUrl, 'avatars', userId);
      
      // Update local database
      await mediaCache.updateProfileAvatar(userId, avatarUrl, localPath);

      return { avatarUrl, localPath };
    } catch (error) {
      console.error('Upload avatar error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  deleteExerciseMedia: async (exerciseId) => {
    try {
      await mediaCache.clearExerciseMedia(exerciseId);
      await api.delete('/', { data: { type: 'exercise', id: exerciseId } });
    } catch (error) {
      console.error('Delete exercise media error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  deleteProfileAvatar: async (userId) => {
    try {
      await mediaCache.clearProfileAvatar(userId);
      await api.delete('/', { data: { type: 'avatar', id: userId } });
    } catch (error) {
      console.error('Delete avatar error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  downloadUserAvatar: async (userId, avatarUrl) => {
    try {
      // Download and cache the avatar
      const localPath = await mediaCache.downloadUserAvatarIfNeeded(userId, avatarUrl);
      return localPath;
    } catch (error) {
      console.error('Download avatar error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  downloadExerciseMedia: async (exerciseId, mediaUrl) => {
    try {
      // Download and cache the exercise media
      const localPath = await mediaCache.downloadExerciseMediaIfNeeded(exerciseId, mediaUrl);
      return localPath;
    } catch (error) {
      console.error('Download exercise media error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  getUserAvatarPath: async (userId) => {
    try {
      return await mediaCache.getProfileAvatar(userId);
    } catch (error) {
      console.error('Get user avatar path error:', error);
      return null;
    }
  },

  cleanupOldFiles: async () => {
    try {
      await mediaCache.cleanupOldFiles();
    } catch (error) {
      console.error('Cleanup old files error:', error);
      // Don't throw error for cleanup failures
    }
  }
}; 