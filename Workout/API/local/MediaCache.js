import * as FileSystem from 'expo-file-system';
import Cache from '../utils/Cache';
import { dbManager } from './dbManager';

class MediaCache {
  constructor() {
    this.cache = new Cache('media', 50);
    this.baseDir = `${FileSystem.cacheDirectory}app_media/`;
    this.init();
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
    const ext = url.split('.').pop().toLowerCase();
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
      await dbManager.execute(
        'UPDATE profiles SET avatar_url = ?, local_avatar_path = ?, updated_at = datetime("now") WHERE user_id = ?',
        [avatarUrl, localPath, userId]
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
      
      // Remove from LRU cache
      this.cache.removeByValue(localPath);
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
}

export const mediaCache = new MediaCache(); 