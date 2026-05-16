import * as FileSystem from 'expo-file-system/legacy';
import Cache from '../utils/Cache';
import { dbManager } from './dbManager';
import { syncManager } from './syncManager';

class MediaCache {
  constructor() {
    this.cache = new Cache({ maxSize: 250 });
    this.baseDir = `${FileSystem.cacheDirectory}app_media/`;
    this.maxFileSize = 10 * 1024 * 1024; // 10MB ceiling for images
    this.maxVideoFileSize = 5 * 1024 * 1024; // 5MB ceiling for video clips
    this.init();

    // Register sync function with sync manager
    syncManager.registerSyncFunction('media', async (isInitialSync = false) => {
      try {
        await this.cleanupOldFiles();
      } catch (error) {
        console.error('[MediaCache] Media sync error:', error);
        // Don't throw error as media sync is not critical
      }
    });
  }

  async init() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.baseDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.baseDir, { intermediates: true });
      }
      
      // Create subdirectories
      await FileSystem.makeDirectoryAsync(`${this.baseDir}exercises/`, { intermediates: true });
      await FileSystem.makeDirectoryAsync(`${this.baseDir}avatars/`, { intermediates: true });
      await FileSystem.makeDirectoryAsync(`${this.baseDir}exercise-videos/`, { intermediates: true });
    } catch (error) {
      console.error('Failed to initialize media cache directories:', error);
    }
  }

  generateLocalPath(type, id, url) {
    // Clean URL first to remove query parameters
    const cleanUrl = url.split('?')[0];
    const ext = cleanUrl.split('.').pop().toLowerCase();
    const timestamp = Date.now();
    return `${this.baseDir}${type}/${id}_${timestamp}.${ext}`;
  }

  async downloadAndCacheFile(url, type, id, isAvatar = false, isExerciseMedia = false, isExerciseVideo = false) {
    try {
      const localPath = this.generateLocalPath(type, id, url);

      let downloadResult;

      if (isAvatar) {
        // For avatars, use the backend endpoint to get the URL, then download the image
        const { tokenManager } = await import('../utils/tokenManager');
        const accessToken = await tokenManager.getValidToken();

        if (!accessToken) {
          throw new Error('No access token available for avatar download');
        }

        // Convert the URL or userId to backend avatar endpoint
        let avatarUserId = id;

        // If we have a Supabase URL, extract the user ID from it
        if (url.includes('supabase.co') && url.includes('avatars/')) {
          const urlParts = url.split('/');
          const avatarsIndex = urlParts.findIndex(part => part === 'avatars');
          if (avatarsIndex !== -1 && urlParts[avatarsIndex + 1]) {
            avatarUserId = urlParts[avatarsIndex + 1];
          }
        }

        const backendEndpoint = `${await import('../utils/getBaseUrl').then(m => m.default())}/media/avatar/${avatarUserId}`;

        const response = await fetch(backendEndpoint, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Backend returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const imageUrl = data.url;

        if (!imageUrl) {
          throw new Error('Backend did not return an image URL');
        }

        downloadResult = await FileSystem.downloadAsync(imageUrl, localPath);
      } else if (isExerciseVideo) {
        // For exercise videos, use the backend ?type=video resolver (same auth pattern as images)
        const { tokenManager } = await import('../utils/tokenManager');
        const accessToken = await tokenManager.getValidToken();

        if (!accessToken) {
          throw new Error('No access token available for exercise video download');
        }

        const backendEndpoint = `${await import('../utils/getBaseUrl').then(m => m.default())}/media/exercise/${id}`;

        const response = await fetch(`${backendEndpoint}?type=video`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Backend returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const videoUrl = data.url;

        if (!videoUrl) {
          throw new Error('Backend did not return a video URL');
        }

        downloadResult = await FileSystem.downloadAsync(videoUrl, localPath);
      } else if (isExerciseMedia) {
        // For exercise images, use the backend ?type=image resolver
        const { tokenManager } = await import('../utils/tokenManager');
        const accessToken = await tokenManager.getValidToken();

        if (!accessToken) {
          throw new Error('No access token available for exercise media download');
        }

        let exerciseId = id;

        // If we have a Supabase URL, extract the exercise ID from it
        if (url.includes('supabase.co') && url.includes('exercise-media/')) {
          const urlParts = url.split('/');
          const mediaIndex = urlParts.findIndex(part => part === 'exercise-media');
          if (mediaIndex !== -1 && urlParts[mediaIndex + 1]) {
            exerciseId = id;
          }
        }

        const backendEndpoint = `${await import('../utils/getBaseUrl').then(m => m.default())}/media/exercise/${exerciseId}`;

        const response = await fetch(`${backendEndpoint}?type=image`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Backend returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const mediaUrl = data.url;

        if (!mediaUrl) {
          throw new Error('Backend did not return a media URL');
        }

        downloadResult = await FileSystem.downloadAsync(mediaUrl, localPath);
      } else {
        downloadResult = await FileSystem.downloadAsync(url, localPath);
      }

      // Check if download failed with HTTP error
      if (downloadResult.status >= 400) {
        try {
          await FileSystem.deleteAsync(localPath);
        } catch (e) {
          // Ignore deletion errors
        }

        const errorType = isAvatar ? 'Backend avatar endpoint'
          : isExerciseVideo ? 'Backend exercise video endpoint'
          : isExerciseMedia ? 'Backend exercise media endpoint'
          : 'URL';
        throw new Error(`Download failed with HTTP ${downloadResult.status}. ${errorType} may be unavailable.`);
      }

      // Verify the downloaded file
      const fileInfo = await FileSystem.getInfoAsync(localPath);

      if (!fileInfo.exists) {
        throw new Error('Downloaded file does not exist');
      }

      // Validate file size, too small means corrupted/error body; too large is rejected
      if (fileInfo.size < 100) {
        await FileSystem.deleteAsync(localPath);
        throw new Error(`Downloaded file is too small (${fileInfo.size} bytes), likely corrupted or error response`);
      }

      const sizeLimit = isExerciseVideo ? this.maxVideoFileSize : this.maxFileSize;
      if (fileInfo.size > sizeLimit) {
        await FileSystem.deleteAsync(localPath);
        console.warn(`[MediaCache] File too large (${(fileInfo.size / 1024 / 1024).toFixed(2)}MB), discarding`);
        return null;
      }

      // For images, validate JPEG or PNG magic bytes
      if (isAvatar || isExerciseMedia) {
        try {
          const base64Content = await FileSystem.readAsStringAsync(localPath, {
            encoding: FileSystem.EncodingType.Base64,
            length: 20
          });

          const binaryString = atob(base64Content);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const isJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
          const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;

          if (!isJPEG && !isPNG) {
            await FileSystem.deleteAsync(localPath);
            throw new Error('Downloaded file is not a valid JPEG or PNG image');
          }
        } catch (validationError) {
          console.error(`[MediaCache] Error validating image file:`, validationError);
          try {
            await FileSystem.deleteAsync(localPath);
          } catch (e) {
            // Ignore deletion errors
          }
          throw validationError;
        }
      }

      // Add to LRU cache
      this.cache.set(url, localPath);

      return localPath;
    } catch (error) {
      console.error('Failed to download and cache file:', error);
      throw error;
    }
  }

  async getRemoteFileSize(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      return contentLength ? parseInt(contentLength, 10) : 0;
    } catch (error) {
      console.warn('[MediaCache] Could not determine file size, proceeding with download');
      return 0;
    }
  }

  async updateExerciseMedia(exerciseId, mediaUrl, localPath) {
    try {
      // Get existing media info to clean up old files
      const [existingExercise] = await dbManager.query(
        'SELECT local_media_path FROM exercises WHERE exercise_id = ?',
        [exerciseId]
      );

      // Delete old local file if it exists
      if (existingExercise?.local_media_path) {
        const oldLocalPath = `${this.baseDir}exercises/${existingExercise.local_media_path}`;
        await this.deleteFile(oldLocalPath);
      }

      // Extract just the filename from the local path
      const filename = localPath.split('/').pop();

      // Clean up the media URL to prevent SQL injection
      const cleanMediaUrl = mediaUrl.split('?')[0]; // Remove query parameters

      await dbManager.execute(
        'UPDATE exercises SET image_url = ?, local_media_path = ?, updated_at = datetime("now") WHERE exercise_id = ?',
        [cleanMediaUrl, filename, exerciseId]
      );

      // Invalidate the in-memory path cache so next getExerciseMedia call reflects the new file
      this.cache.delete(`media_path_${exerciseId}`);
    } catch (error) {
      console.error('Failed to update exercise media:', error);
      throw error;
    }
  }

  async updateExerciseVideo(exerciseId, videoUrl, filename) {
    try {
      const cleanVideoUrl = videoUrl.split('?')[0]; // Remove query parameters
      
      await dbManager.execute(
        'UPDATE exercises SET video_url = ?, local_video_path = ?, updated_at = datetime("now") WHERE exercise_id = ?',
        [cleanVideoUrl, filename, exerciseId]
      );
    } catch (error) {
      console.error('Failed to update exercise video:', error);
      throw error;
    }
  }

  async updateProfileAvatar(userId, avatarUrl, localPath) {
    try {
      // Get existing profile info to clean up old files
      const [existingProfile] = await dbManager.query(
        'SELECT local_avatar_path FROM profiles WHERE user_id = ?',
        [userId]
      );

      // Delete old local file if it exists
      if (existingProfile?.local_avatar_path) {
        const oldLocalPath = `${this.baseDir}avatars/${existingProfile.local_avatar_path}`;
        await this.deleteFile(oldLocalPath);
      }

      // Extract just the filename from the local path
      const filename = localPath.split('/').pop();
      
      // Clean up the avatar URL to prevent SQL injection
      const cleanAvatarUrl = avatarUrl.split('?')[0]; // Remove query parameters
      
      // Use INSERT OR IGNORE first, then UPDATE if needed to handle username conflicts
      await dbManager.execute(
        'INSERT OR IGNORE INTO profiles (user_id, avatar_url, local_avatar_path, display_name, sync_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime("now"), datetime("now"))',
        [userId, cleanAvatarUrl, filename, '', 'pending_sync']
      );
      
      // Then always update to ensure the avatar data is set correctly
      await dbManager.execute(
        'UPDATE profiles SET avatar_url = ?, local_avatar_path = ?, sync_status = ?, updated_at = datetime("now") WHERE user_id = ?',
        [cleanAvatarUrl, filename, 'pending_sync', userId]
      );
    } catch (error) {
      console.error('Failed to update profile avatar:', error);
      throw error;
    }
  }

  async deleteFile(localPath) {
    try {
      if (!localPath) return;

      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(localPath);
      }
      
      // Remove from cache by finding the key that maps to this local path
      for (const [key, cachedPath] of this.cache.cache.entries()) {
        if (cachedPath.value === localPath) {
          this.cache.delete(key);
          break;
        }
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      // Don't throw error for deletion failures
    }
  }

  async clearExerciseMedia(exerciseId) {
    try {
      const [exercise] = await dbManager.query(
        'SELECT local_media_path FROM exercises WHERE exercise_id = ?',
        [exerciseId]
      );

      if (exercise?.local_media_path) {
        await this.deleteFile(exercise.local_media_path);
        await dbManager.execute(
          'UPDATE exercises SET image_url = NULL, local_media_path = NULL, updated_at = datetime("now") WHERE exercise_id = ?',
          [exerciseId]
        );
        this.cache.delete(`media_path_${exerciseId}`);
      }
    } catch (error) {
      console.error('Failed to clear exercise media:', error);
      throw error;
    }
  }

  async clearExerciseVideo(exerciseId) {
    try {
      const [exercise] = await dbManager.query(
        'SELECT local_video_path FROM exercises WHERE exercise_id = ?',
        [exerciseId]
      );

      if (exercise?.local_video_path) {
        await this.deleteFile(exercise.local_video_path);
        await dbManager.execute(
          'UPDATE exercises SET video_url = NULL, local_video_path = NULL, updated_at = datetime("now") WHERE exercise_id = ?',
          [exerciseId]
        );
      }
    } catch (error) {
      console.error('Failed to clear exercise video:', error);
      throw error;
    }
  }

  async clearProfileAvatar(userId) {
    try {
      const [profile] = await dbManager.query(
        'SELECT local_avatar_path FROM profiles WHERE user_id = ?',
        [userId]
      );

      if (profile?.local_avatar_path) {
        await this.deleteFile(profile.local_avatar_path);
        await dbManager.execute(
          'UPDATE profiles SET avatar_url = NULL, local_avatar_path = NULL, updated_at = datetime("now") WHERE user_id = ?',
          [userId]
        );
      }
    } catch (error) {
      console.error('Failed to clear profile avatar:', error);
      throw error;
    }
  }

  async getProfileAvatar(userId) {
    try {
      const [profile] = await dbManager.query(
        'SELECT local_avatar_path FROM profiles WHERE user_id = ?',
        [userId]
      );

      if (!profile?.local_avatar_path) {
        return null;
      }

      const localPath = `${this.baseDir}avatars/${profile.local_avatar_path}`;
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      
      if (fileInfo.exists && fileInfo.size > 100) {
        return localPath.startsWith('file://') ? localPath : `file://${localPath}`;
      }
      return null;
    } catch (error) {
      console.error('Failed to get profile avatar:', error);
      return null;
    }
  }

  async getExerciseMedia(exerciseId) {
    try {
      const cacheKey = `media_path_${exerciseId}`;
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;

      const [exercise] = await dbManager.query(
        'SELECT local_media_path FROM exercises WHERE exercise_id = ?',
        [exerciseId]
      );

      if (!exercise?.local_media_path) {
        return null;
      }

      const localPath = `${this.baseDir}exercises/${exercise.local_media_path}`;
      const fileInfo = await FileSystem.getInfoAsync(localPath);

      if (fileInfo.exists && fileInfo.size > 100) {
        const result = `file://${localPath}`;
        // Cache for 24 hours, the file lives on disk until explicitly deleted
        this.cache.set(cacheKey, result, 24 * 60 * 60 * 1000);
        return result;
      }

      return null;
    } catch (error) {
      console.error('Failed to get exercise media:', error);
      return null;
    }
  }

  async getLocalProfile(userId) {
    try {
      const [profile] = await dbManager.query(
        'SELECT display_name, username, avatar_url, local_avatar_path, sync_status FROM profiles WHERE user_id = ?',
        [userId]
      );

      if (!profile) {
        // Return default profile if doesn't exist
        return {
          user_id: userId,
          display_name: '',
          username: null,
          avatar_url: null,
          local_avatar_path: null,
          sync_status: 'synced'
        };
      }

      return {
        user_id: userId,
        display_name: profile.display_name || '',
        username: profile.username || null,
        avatar_url: profile.avatar_url,
        local_avatar_path: profile.local_avatar_path,
        sync_status: profile.sync_status || 'synced'
      };
    } catch (error) {
      console.error('Failed to get local profile:', error);
      return {
        user_id: userId,
        display_name: '',
        username: null,
        avatar_url: null,
        local_avatar_path: null,
        sync_status: 'synced'
      };
    }
  }

  async updateLocalProfile(userId, profileData) {
    try {
      const updateData = {
        display_name: profileData.display_name || '',
        username: profileData.username || null,
        sync_status: profileData.username ? 'synced' : 'pending_sync' // If we have username from backend, it's synced
      };

      // If username is provided, clear any existing profiles with the same username first
      if (updateData.username) {
        await dbManager.execute(
          'UPDATE profiles SET username = NULL WHERE username = ? AND user_id != ?',
          [updateData.username, userId]
        );
      }

      // Use INSERT OR IGNORE first, then UPDATE to handle all cases properly
      await dbManager.execute(
        'INSERT OR IGNORE INTO profiles (user_id, display_name, username, sync_status, created_at, updated_at) VALUES (?, ?, ?, ?, datetime("now"), datetime("now"))',
        [userId, updateData.display_name, updateData.username, updateData.sync_status]
      );
      
      // Then always update to ensure the profile data is set correctly
      const updateFields = ['display_name = ?', 'sync_status = ?', 'updated_at = datetime("now")'];
      const updateValues = [updateData.display_name, updateData.sync_status];
      
      // Only update username if it's provided (don't overwrite existing username with null)
      if (updateData.username) {
        updateFields.push('username = ?');
        updateValues.push(updateData.username);
      }
      
      updateValues.push(userId);
      
      await dbManager.execute(
        `UPDATE profiles SET ${updateFields.join(', ')} WHERE user_id = ?`,
        updateValues
      );

      return this.getLocalProfile(userId);
    } catch (error) {
      console.error('Failed to update local profile:', error);
      throw error;
    }
  }

  async markProfileSynced(userId) {
    try {
      await dbManager.execute(
        'UPDATE profiles SET sync_status = ?, last_synced_at = datetime("now") WHERE user_id = ?',
        ['synced', userId]
      );
    } catch (error) {
      console.error('Failed to mark profile as synced:', error);
      throw error;
    }
  }

  async downloadUserAvatarIfNeeded(userId, avatarUrl) {
    try {
      if (!userId) {
        return null;
      }

      // Check if we already have a local copy of this avatar
      const [existingProfile] = await dbManager.query(
        'SELECT local_avatar_path FROM profiles WHERE user_id = ?',
        [userId]
      );
      
      if (existingProfile?.local_avatar_path) {
        const localPath = `${this.baseDir}avatars/${existingProfile.local_avatar_path}`;
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists && fileInfo.size > 100) {
          // Return path with file:// prefix for React Native Image component
          return `file://${localPath}`;
        } else if (fileInfo.exists && fileInfo.size <= 100) {
          // Delete corrupted file
          try {
            await FileSystem.deleteAsync(localPath);
          } catch (e) {
            // Ignore deletion errors
          }
        }
      }
      
      // Check if download is already in progress
      const cacheKey = `downloading_${userId}`;
      if (this.cache.get(cacheKey)) {
        return null;
      }
      
      // Set download in progress flag
      this.cache.set(cacheKey, true, 300);
      
      try {
        const urlToUse = avatarUrl || `backend://avatar/${userId}`;
        const localPath = await this.downloadAndCacheFile(urlToUse, 'avatars', userId, true);
        
        if (localPath) {
          const fileName = localPath.split('/').pop();
          
          // Verify the file exists before updating database
          const fileInfo = await FileSystem.getInfoAsync(localPath);
          if (!fileInfo.exists || fileInfo.size < 100) {
            return null;
          }
          
          if (avatarUrl) {
            await this.updateProfileAvatar(userId, avatarUrl, fileName);
          } else {
            // Fetch the profile from backend to get the actual avatar URL
            try {
              const { profileAPI } = await import('../../API/profileAPI');
              const profile = await profileAPI.getProfile(true, userId);
              if (profile?.avatar_url) {
                await this.updateProfileAvatar(userId, profile.avatar_url, fileName);
              } else {
                await dbManager.execute(
                  'UPDATE profiles SET local_avatar_path = ?, updated_at = datetime("now") WHERE user_id = ?',
                  [fileName, userId]
                );
              }
            } catch (fetchError) {
              await dbManager.execute(
                'UPDATE profiles SET local_avatar_path = ?, updated_at = datetime("now") WHERE user_id = ?',
                [fileName, userId]
              );
            }
          }
          
          return localPath;
        }
        
        return null;
      } finally {
        // Clear download in progress flag
        this.cache.delete(cacheKey);
      }
    } catch (error) {
      console.error(`[MediaCache] Failed to download avatar for user ${userId}:`, error);
      // Don't throw error - avatar download is not critical
      return null;
    }
  }

  async downloadExerciseMediaIfNeeded(exerciseId, mediaUrl) {
    try {
      if (!exerciseId || !mediaUrl) {
        return null;
      }

      // Check if we already have a local copy of this exercise media
      const [existingExercise] = await dbManager.query(
        'SELECT local_media_path FROM exercises WHERE exercise_id = ?',
        [exerciseId]
      );
      
      if (existingExercise?.local_media_path) {
        const localPath = `${this.baseDir}exercises/${existingExercise.local_media_path}`;
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists && fileInfo.size > 100) {
          // Return path with file:// prefix for React Native Image component
          return `file://${localPath}`;
        } else if (fileInfo.exists && fileInfo.size <= 100) {
          // Delete corrupted file
          try {
            await FileSystem.deleteAsync(localPath);
          } catch (e) {
            // Ignore deletion errors
          }
        }
      }
      
      // Check if download is already in progress
      const cacheKey = `downloading_exercise_${exerciseId}`;
      if (this.cache.get(cacheKey)) {
        return null;
      }
      
      // Set download in progress flag
      this.cache.set(cacheKey, true, 300); // 5 minute timeout
      
      try {
        // Download the exercise media using the backend endpoint
        const localPath = await this.downloadAndCacheFile(mediaUrl, 'exercises', exerciseId, false, true);
        
        if (localPath) {
          // Update local exercise with the new media path
          const fileName = localPath.split('/').pop();
          await this.updateExerciseMedia(exerciseId, mediaUrl, fileName);
          return localPath;
        }
        
        return null;
      } finally {
        // Clear download in progress flag
        this.cache.delete(cacheKey);
      }
    } catch (error) {
      console.error(`[MediaCache] Failed to download exercise media for exercise ${exerciseId}:`, error);
      // Don't throw error - exercise media download is not critical
      return null;
    }
  }

  async downloadExerciseVideoIfNeeded(exerciseId, videoUrl) {
    try {
      if (!exerciseId || !videoUrl) {
        return null;
      }

      // Check if we already have a local copy of this exercise video
      const [existingExercise] = await dbManager.query(
        'SELECT local_video_path FROM exercises WHERE exercise_id = ?',
        [exerciseId]
      );

      if (existingExercise?.local_video_path) {
        const localPath = `${this.baseDir}exercise-videos/${existingExercise.local_video_path}`;
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists && fileInfo.size > 1000) {
          return `file://${localPath}`;
        } else if (fileInfo.exists && fileInfo.size <= 1000) {
          try {
            await FileSystem.deleteAsync(localPath);
          } catch (e) {
            // Ignore deletion errors
          }
        }
      }

      // Check if download is already in progress
      const cacheKey = `downloading_video_${exerciseId}`;
      if (this.cache.get(cacheKey)) {
        return null;
      }

      this.cache.set(cacheKey, true, 600); // 10 minute timeout for videos

      try {
        // For public CDN URLs (no /media/ path), download directly.
        // For private R2 keys, resolve through the backend ?type=video endpoint.
        let resolvedUrl = videoUrl;
        const isPublicCdn = videoUrl.startsWith('https://') && !videoUrl.includes('/media/');

        if (!isPublicCdn) {
          const { tokenManager } = await import('../utils/tokenManager');
          const accessToken = await tokenManager.getValidToken();

          if (!accessToken) {
            throw new Error('No access token available for exercise video download');
          }

          const baseUrl = await import('../utils/getBaseUrl').then(m => m.default());
          const response = await fetch(`${baseUrl}/media/exercise/${exerciseId}?type=video`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });

          if (!response.ok) {
            throw new Error(`Backend returned ${response.status} for video URL`);
          }

          const data = await response.json();
          if (!data.url) {
            throw new Error('Backend did not return a video URL');
          }
          resolvedUrl = data.url;
        }

        const localPath = this.generateLocalPath('exercise-videos', exerciseId, videoUrl);

        const downloadResult = await FileSystem.downloadAsync(resolvedUrl, localPath);

        if (downloadResult.status === 200) {
          const fileInfo = await FileSystem.getInfoAsync(localPath);
          if (!fileInfo.exists || fileInfo.size < 1000) {
            try { await FileSystem.deleteAsync(localPath); } catch (e) {}
            return null;
          }
          if (fileInfo.size > this.maxVideoFileSize) {
            try { await FileSystem.deleteAsync(localPath); } catch (e) {}
            console.warn(`[MediaCache] Video too large (${(fileInfo.size / 1024 / 1024).toFixed(2)}MB), discarding`);
            return null;
          }
          const fileName = localPath.split('/').pop();
          await this.updateExerciseVideo(exerciseId, videoUrl, fileName);
          return localPath;
        }

        return null;
      } finally {
        this.cache.delete(cacheKey);
      }
    } catch (error) {
      console.error(`[MediaCache] Failed to download exercise video for exercise ${exerciseId}:`, error);
      return null;
    }
  }

  async cleanupOldFiles() {
    try {
      // Clean up orphaned files that are no longer referenced in the database
      const exerciseFiles = await FileSystem.readDirectoryAsync(`${this.baseDir}exercises/`);
      const avatarFiles = await FileSystem.readDirectoryAsync(`${this.baseDir}avatars/`);
      const videoFiles = await FileSystem.readDirectoryAsync(`${this.baseDir}exercise-videos/`).catch(() => []);

      // Get all referenced files from database
      const exercises = await dbManager.query(
        'SELECT local_media_path, local_video_path FROM exercises WHERE local_media_path IS NOT NULL OR local_video_path IS NOT NULL'
      );
      const profiles = await dbManager.query(
        'SELECT local_avatar_path FROM profiles WHERE local_avatar_path IS NOT NULL'
      );

      const referencedFiles = new Set([
        ...(exercises || []).map(e => e.local_media_path).filter(Boolean),
        ...(exercises || []).map(e => e.local_video_path).filter(Boolean),
        ...(profiles || []).map(p => p.local_avatar_path).filter(Boolean)
      ]);

      // Delete orphaned exercise files
      for (const file of exerciseFiles) {
        const filePath = `${this.baseDir}exercises/${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        if (!fileInfo.exists) continue;
        
        // Delete any orphaned file immediately, no age requirement
        if (!referencedFiles.has(file)) {
          await this.deleteFile(filePath);
        }
      }

      // Delete unreferenced video files (orphaned files are removed regardless of age)
      for (const file of videoFiles) {
        const filePath = `${this.baseDir}exercise-videos/${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);

        if (!fileInfo.exists) continue;

        if (!referencedFiles.has(file)) {
          await FileSystem.deleteAsync(filePath);
        }
      }

      // Delete unreferenced avatar files (orphaned files are removed regardless of age)
      for (const file of avatarFiles) {
        const filePath = `${this.baseDir}avatars/${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);

        if (!fileInfo.exists) continue;

        if (!referencedFiles.has(file)) {
          await this.deleteFile(filePath);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old files:', error);
      // Don't throw error for cleanup failures
    }
  }
}

export const mediaCache = new MediaCache(); 