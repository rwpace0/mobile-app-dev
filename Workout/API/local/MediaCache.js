import * as FileSystem from 'expo-file-system';
import Cache from '../utils/Cache';
import { dbManager } from './dbManager';
import { syncManager } from './syncManager';

class MediaCache {
  constructor() {
    this.cache = new Cache('media', 50);
    this.baseDir = `${FileSystem.cacheDirectory}app_media/`;
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

  async downloadAndCacheFile(url, type, id) {
    try {
      const localPath = this.generateLocalPath(type, id, url);
      
      // Download file
      await FileSystem.downloadAsync(url, localPath);
      
      // Add to LRU cache
      this.cache.set(url, localPath);
      
      return localPath;
    } catch (error) {
      console.error('Failed to download and cache file:', error);
      throw error;
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
      
      // First, ensure the profile exists in the local database
      const [profileExists] = await dbManager.query(
        'SELECT user_id FROM profiles WHERE user_id = ?',
        [userId]
      );

      if (!profileExists) {
        // Create the profile if it doesn't exist using INSERT OR REPLACE to handle username conflicts
        await dbManager.execute(
          'INSERT OR REPLACE INTO profiles (user_id, avatar_url, local_avatar_path, display_name, sync_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime("now"), datetime("now"))',
          [userId, cleanAvatarUrl, filename, '', 'pending_sync']
        );
      } else {
        // Update existing profile
        await dbManager.execute(
          'UPDATE profiles SET avatar_url = ?, local_avatar_path = ?, sync_status = ?, updated_at = datetime("now") WHERE user_id = ?',
          [cleanAvatarUrl, filename, 'pending_sync', userId]
        );
      }
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
        'SELECT avatar_url, local_avatar_path FROM profiles WHERE user_id = ?',
        [userId]
      );

      if (!profile) {
        return null;
      }

      // Check if local file exists
      if (profile.local_avatar_path) {
        const localPath = `${this.baseDir}avatars/${profile.local_avatar_path}`;
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists) {
          return localPath;
        }
      }

      // If no local file or local file doesn't exist, try to download from remote URL
      if (profile.avatar_url) {
        try {
          const localPath = await this.downloadAndCacheFile(profile.avatar_url, 'avatars', userId);
          await this.updateProfileAvatar(userId, profile.avatar_url, localPath);
          return localPath;
        } catch (error) {
          console.error('Failed to download avatar:', error);
          return null;
        }
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
      // Check if profile exists
      const [existingProfile] = await dbManager.query(
        'SELECT user_id FROM profiles WHERE user_id = ?',
        [userId]
      );

      const updateData = {
        display_name: profileData.display_name || '',
        username: profileData.username || null,
        sync_status: profileData.username ? 'synced' : 'pending_sync' // If we have username from backend, it's synced
      };

      if (!existingProfile) {
        // Check if a profile with the same username already exists
        if (updateData.username) {
          const [existingUsernameProfile] = await dbManager.query(
            'SELECT user_id FROM profiles WHERE username = ?',
            [updateData.username]
          );
          
          if (existingUsernameProfile) {
            // A profile with this username already exists, update it instead of creating a new one
            await dbManager.execute(
              'UPDATE profiles SET user_id = ?, display_name = ?, sync_status = ?, updated_at = datetime("now") WHERE username = ?',
              [userId, updateData.display_name, updateData.sync_status, updateData.username]
            );
          } else {
            // Create new profile
            await dbManager.execute(
              'INSERT INTO profiles (user_id, display_name, username, sync_status, created_at, updated_at) VALUES (?, ?, ?, ?, datetime("now"), datetime("now"))',
              [userId, updateData.display_name, updateData.username, updateData.sync_status]
            );
          }
        } else {
          // Create new profile without username
          await dbManager.execute(
            'INSERT INTO profiles (user_id, display_name, username, sync_status, created_at, updated_at) VALUES (?, ?, ?, ?, datetime("now"), datetime("now"))',
            [userId, updateData.display_name, updateData.username, updateData.sync_status]
          );
        }
      } else {
        // Update existing profile
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
      }

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