import axios from 'axios';
import { storage } from './local/tokenStorage';
import { tokenManager } from './utils/tokenManager';
import getBaseUrl from './utils/getBaseUrl';
import { dbManager } from './local/dbManager';

const API_URL = `${getBaseUrl()}/profile`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(async (config) => {
      const accessToken = await tokenManager.getValidToken();
      if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  return config;
});

// Cache for profile data
let profileCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const profileAPI = {
  getProfile: async (forceRefresh = false, userId = null) => {
    try {
      // Check if we have valid cached data
      const now = Date.now();
      if (!forceRefresh && profileCache && (now - lastFetchTime) < CACHE_DURATION) {
        return profileCache;
      }

      // Check local database first
      try {
        if (userId) {
          const localProfile = await dbManager.query(
            'SELECT display_name, username, avatar_url, sync_status FROM profiles WHERE user_id = ?',
            [userId]
          );
          
          if (localProfile && localProfile.length > 0) {
            const profile = localProfile[0];
            // If local data is synced and recent, use it
            if (profile.sync_status === 'synced' && !forceRefresh) {
              profileCache = {
                display_name: profile.display_name || '',
                username: profile.username || null,
                avatar_url: profile.avatar_url || null
              };
              lastFetchTime = now;
              return profileCache;
            }
          }
        }
      } catch (localError) {
        // Local profile check failed, will fetch from server
      }

      // Fetch from server
      const response = await api.get('/');
      const profileData = response.data;
      
      // Cache the result
      profileCache = profileData;
      lastFetchTime = now;
      
      // Update local database
      try {
        if (userId) {
          await dbManager.execute(
            `INSERT OR REPLACE INTO profiles (user_id, display_name, username, avatar_url, sync_status, updated_at) 
             VALUES (?, ?, ?, ?, 'synced', datetime('now'))`,
            [userId, profileData.display_name || '', profileData.username || null, profileData.avatar_url || null]
          );
        }
      } catch (updateError) {
        // Failed to update local profile
      }
      
      return profileData;
    } catch (error) {
      console.error('Get profile error:', error.response?.data || error.message);
      
      // If server request fails, try to return cached data
      if (profileCache) {
        return profileCache;
      }
      
      throw error.response?.data || error;
    }
  },

  updateProfile: async (profileData, userId = null) => {
    try {
      // Only send display_name field
      const data = {
        display_name: profileData.display_name || ''
      };
      const response = await api.put('/', data);
      
      // Update local cache and database
      if (profileCache) {
        profileCache = { ...profileCache, ...data };
      }
      
      try {
        if (userId) {
          await dbManager.execute(
            `INSERT OR REPLACE INTO profiles (user_id, display_name, username, avatar_url, sync_status, updated_at) 
             VALUES (?, ?, ?, ?, 'synced', datetime('now'))`,
            [userId, data.display_name, profileCache?.username || null, profileCache?.avatar_url || null]
          );
        }
      } catch (updateError) {
        // Failed to update local profile
      }
      
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  // Clear cache (useful for logout or when data becomes stale)
  clearCache: () => {
    profileCache = null;
    lastFetchTime = 0;
  },

  // Get cached profile data without making API calls
  getCachedProfile: () => {
    return profileCache;
  }
}; 