import * as FileSystem from 'expo-file-system';
import Cache from '../utils/Cache';
import { dbManager } from './dbManager';
import { syncManager } from './syncManager';

class MediaCache {
  constructor() {
    this.cache = new Cache('media', 25); // Reduced from 50 to 25
    this.baseDir = `${FileSystem.cacheDirectory}app_media/`;
    this.maxFileSize = 10 * 1024 * 1024; // 10MB max file size
    this.init();

    // Register sync function with sync manager
    syncManager.registerSyncFunction('media', async (isInitialSync = false) => {
      try {
        console.log('[MediaCache] Performing media sync - cleanup old files');
        await this.cleanupOldFiles();
        console.log('[MediaCache] Media sync completed');
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

  async downloadAndCacheFile(url, type, id, isAvatar = false) {
    try {
      const localPath = this.generateLocalPath(type, id, url);
      
      let downloadResult;
      
      if (isAvatar) {
        // For avatars, use the backend endpoint instead of direct Supabase URL
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
        
        const backendUrl = `${await import('../utils/getBaseUrl').then(m => m.default())}/media/avatar/${avatarUserId}`;
        
        // Download file with authentication
        downloadResult = await FileSystem.downloadAsync(backendUrl, localPath, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
      } else {
        // For non-avatar files, use the original direct download
        const fileSize = await this.getRemoteFileSize(url);
        if (fileSize > this.maxFileSize) {
          console.warn(`[MediaCache] File too large (${(fileSize / 1024 / 1024).toFixed(2)}MB), skipping download`);
          return null;
        }
        
        downloadResult = await FileSystem.downloadAsync(url, localPath);
      }
      
      // Check if download failed with HTTP error
      if (downloadResult.status >= 400) {
        console.error(`[MediaCache] Download failed with HTTP ${downloadResult.status}`);
        console.error(`[MediaCache] Response headers:`, downloadResult.headers);
        
        // Delete the error response file
        try {
          await FileSystem.deleteAsync(localPath);
        } catch (e) {
          // Ignore deletion errors
        }
        
        throw new Error(`Download failed with HTTP ${downloadResult.status}. ${isAvatar ? 'Backend avatar endpoint may be unavailable.' : 'URL may be expired or invalid.'}`);
      }
      
      // Verify the downloaded file
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      
      if (!fileInfo.exists) {
        throw new Error('Downloaded file does not exist');
      }
      
      if (fileInfo.size < 100) {
        console.warn(`[MediaCache] Downloaded file is suspiciously small (${fileInfo.size} bytes), may be corrupted`);
        
        // Check if it's a JSON error response
        if (downloadResult.headers['Content-Type']?.includes('application/json')) {
          console.error(`[MediaCache] Downloaded file appears to be a JSON error response`);
          // Try to read the error for debugging
          try {
            const errorContent = await FileSystem.readAsStringAsync(localPath);
            console.error(`[MediaCache] Error response content:`, errorContent);
          } catch (e) {
            // Ignore read errors
          }
        }
        
        // Delete the corrupted file
        await FileSystem.deleteAsync(localPath);
        throw new Error(`Downloaded file is too small (${fileInfo.size} bytes), likely corrupted or error response`);
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
        'UPDATE exercises SET media_url = ?, local_media_path = ?, updated_at = datetime("now") WHERE exercise_id = ?',
        [cleanMediaUrl, filename, exerciseId]
      );
    } catch (error) {
      console.error('Failed to update exercise media:', error);
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
          'UPDATE exercises SET media_url = NULL, local_media_path = NULL, updated_at = datetime("now") WHERE exercise_id = ?',
          [exerciseId]
        );
      }
    } catch (error) {
      console.error('Failed to clear exercise media:', error);
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
      
      if (fileInfo.exists && fileInfo.size > 100) { // Basic validation that file exists and has content
        return localPath;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get profile avatar:', error);
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
      if (!userId || !avatarUrl) {
        console.log('[MediaCache] No userId or avatarUrl provided for avatar download');
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
          return localPath;
        } else if (fileInfo.exists && fileInfo.size <= 100) {
          console.log(`[MediaCache] Existing avatar file is corrupted (${fileInfo.size} bytes), will re-download`);
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
        console.log(`[MediaCache] Avatar download already in progress for user ${userId}`);
        return null;
      }
      
      // Set download in progress flag
      this.cache.set(cacheKey, true, 300); // 5 minute timeout
      
      try {
        // Download the avatar
        const localPath = await this.downloadAndCacheFile(avatarUrl, 'avatars', userId, true);
        
        if (localPath) {
          // Update local profile with the new avatar path
          const fileName = localPath.split('/').pop();
          await this.updateProfileAvatar(userId, avatarUrl, fileName);
          console.log(`[MediaCache] Successfully downloaded and cached avatar for user ${userId}`);
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

  async cleanupOldFiles() {
    try {
      // Clean up orphaned files that are no longer referenced in the database
      const exerciseFiles = await FileSystem.readDirectoryAsync(`${this.baseDir}exercises/`);
      const avatarFiles = await FileSystem.readDirectoryAsync(`${this.baseDir}avatars/`);

      // Get all referenced files from database
      const exercises = await dbManager.query(
        'SELECT local_media_path FROM exercises WHERE local_media_path IS NOT NULL'
      );
      const profiles = await dbManager.query(
        'SELECT local_avatar_path FROM profiles WHERE local_avatar_path IS NOT NULL'
      );

      const referencedFiles = new Set([
        ...(exercises || []).map(e => e.local_media_path),
        ...(profiles || []).map(p => p.local_avatar_path)
      ]);

      // Delete unreferenced exercise files
      for (const file of exerciseFiles) {
        if (!referencedFiles.has(file)) {
          await this.deleteFile(`${this.baseDir}exercises/${file}`);
          console.log('Cleaned up orphaned exercise file:', file);
        }
      }

      // Delete unreferenced avatar files
      for (const file of avatarFiles) {
        if (!referencedFiles.has(file)) {
          await this.deleteFile(`${this.baseDir}avatars/${file}`);
          console.log('Cleaned up orphaned avatar file:', file);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old files:', error);
      // Don't throw error for cleanup failures
    }
  }
}

export const mediaCache = new MediaCache(); 