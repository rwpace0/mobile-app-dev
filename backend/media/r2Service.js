import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Validate R2 credentials
const requiredEnvVars = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Bucket names (hardcoded - these don't change)
const BUCKETS = {
  DEFAULT_EXERCISES: 'default-exercises',
  USER_MEDIA: 'user-media'
};

// Initialize S3 client for Cloudflare R2
const r2Client = new S3Client({
  region: 'auto', // R2 always uses 'auto'
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export class R2Service {
  /**
   * Upload a file to R2
   * @param {string} bucket - Bucket name
   * @param {string} key - File path/key in bucket
   * @param {Buffer} buffer - File buffer
   * @param {string} contentType - MIME type
   * @returns {Promise<Object>} Upload result
   */
  static async uploadFile(bucket, key, buffer, contentType) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000', // 1 year cache
      });

      const result = await r2Client.send(command);
      console.log(`[R2Service] Uploaded file to ${bucket}/${key}`);
      return result;
    } catch (error) {
      console.error(`[R2Service] Upload error:`, error);
      throw new Error(`Failed to upload file to R2: ${error.message}`);
    }
  }

  /**
   * Delete a file from R2
   * @param {string} bucket - Bucket name
   * @param {string} key - File path/key in bucket
   * @returns {Promise<Object>} Delete result
   */
  static async deleteFile(bucket, key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const result = await r2Client.send(command);
      console.log(`[R2Service] Deleted file from ${bucket}/${key}`);
      return result;
    } catch (error) {
      console.error(`[R2Service] Delete error:`, error);
      throw new Error(`Failed to delete file from R2: ${error.message}`);
    }
  }

  /**
   * Generate a signed URL for private file access
   * @param {string} bucket - Bucket name
   * @param {string} key - File path/key in bucket
   * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
   * @returns {Promise<string>} Signed URL
   */
  static async getSignedUrl(bucket, key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
      console.log(`[R2Service] Generated signed URL for ${bucket}/${key}`);
      return signedUrl;
    } catch (error) {
      console.error(`[R2Service] Signed URL error:`, error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * Upload exercise image to appropriate bucket
   * @param {string} userId - User ID (for user exercises)
   * @param {Buffer} buffer - Image buffer
   * @param {string} filename - Original filename
   * @param {boolean} isPublic - Whether exercise is public/default
   * @returns {Promise<Object>} { key, signedUrl }
   */
  static async uploadExerciseImage(userId, buffer, filename, isPublic = false) {
    try {
      const timestamp = Date.now();
      const extension = path.extname(filename).toLowerCase();
      const finalExtension = extension !== '.gif' ? '.jpg' : extension;
      
      let bucket, key;

      if (isPublic) {
        // Default/public exercises go to default-exercises bucket
        bucket = BUCKETS.DEFAULT_EXERCISES;
        key = `images/${userId}_${timestamp}${finalExtension}`;
      } else {
        // User exercises go to user-media bucket
        bucket = BUCKETS.USER_MEDIA;
        key = `exercise-images/${userId}/${timestamp}${finalExtension}`;
      }

      const contentType = finalExtension === '.gif' ? 'image/gif' : 'image/jpeg';
      
      await this.uploadFile(bucket, key, buffer, contentType);
      const signedUrl = await this.getSignedUrl(bucket, key);

      return { bucket, key, signedUrl };
    } catch (error) {
      console.error('[R2Service] Exercise image upload error:', error);
      throw error;
    }
  }

  /**
   * Upload exercise video (only for public/default exercises)
   * @param {string} exerciseId - Exercise ID
   * @param {Buffer} buffer - Video buffer
   * @param {string} filename - Original filename
   * @returns {Promise<Object>} { key, signedUrl }
   */
  static async uploadExerciseVideo(exerciseId, buffer, filename) {
    try {
      const timestamp = Date.now();
      const bucket = BUCKETS.DEFAULT_EXERCISES;
      const key = `videos/${exerciseId}_${timestamp}.mp4`;
      const contentType = 'video/mp4';

      await this.uploadFile(bucket, key, buffer, contentType);
      const signedUrl = await this.getSignedUrl(bucket, key);

      return { bucket, key, signedUrl };
    } catch (error) {
      console.error('[R2Service] Exercise video upload error:', error);
      throw error;
    }
  }

  /**
   * Upload user avatar
   * @param {string} userId - User ID
   * @param {Buffer} buffer - Image buffer
   * @param {string} filename - Original filename
   * @returns {Promise<Object>} { key, signedUrl }
   */
  static async uploadAvatar(userId, buffer, filename) {
    try {
      const timestamp = Date.now();
      const extension = path.extname(filename).toLowerCase();
      const finalExtension = extension !== '.gif' ? '.jpg' : extension;
      
      const bucket = BUCKETS.USER_MEDIA;
      const key = `avatars/${userId}/${timestamp}${finalExtension}`;
      const contentType = finalExtension === '.gif' ? 'image/gif' : 'image/jpeg';

      await this.uploadFile(bucket, key, buffer, contentType);
      const signedUrl = await this.getSignedUrl(bucket, key);

      return { bucket, key, signedUrl };
    } catch (error) {
      console.error('[R2Service] Avatar upload error:', error);
      throw error;
    }
  }

  /**
   * Delete media from R2
   * @param {string} bucket - Bucket name
   * @param {string} key - File path/key
   * @returns {Promise<Object>} Delete result
   */
  static async deleteMedia(bucket, key) {
    try {
      return await this.deleteFile(bucket, key);
    } catch (error) {
      console.error('[R2Service] Delete media error:', error);
      throw error;
    }
  }

  /**
   * Extract bucket and key from a signed URL
   * @param {string} url - Signed URL
   * @returns {Object} { bucket, key }
   */
  static extractBucketAndKey(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      
      // R2 URLs format: https://account-id.r2.cloudflarestorage.com/bucket/key
      // Path parts should be: [bucket, key-part1, key-part2, ...]
      if (pathParts.length >= 2) {
        const firstPart = pathParts[0];
        
        // If first part is a known bucket name, use it
        if (firstPart === BUCKETS.USER_MEDIA || firstPart === BUCKETS.DEFAULT_EXERCISES) {
          const bucket = firstPart;
          const key = pathParts.slice(1).join('/');
          return { bucket, key };
        }
        
        // Otherwise, infer bucket from key path
        // avatars/* and exercise-images/* -> user-media
        // images/* and videos/* -> default-exercises
        const key = pathParts.join('/');
        let bucket;
        
        if (key.startsWith('avatars/') || key.startsWith('exercise-images/')) {
          bucket = BUCKETS.USER_MEDIA;
        } else if (key.startsWith('images/') || key.startsWith('videos/')) {
          bucket = BUCKETS.DEFAULT_EXERCISES;
        } else {
          throw new Error(`Cannot determine bucket for key: ${key}`);
        }
        
        return { bucket, key };
      }
      
      throw new Error('Invalid R2 URL format');
    } catch (error) {
      console.error('[R2Service] URL parsing error:', error);
      throw new Error(`Failed to extract bucket and key from URL: ${error.message}`);
    }
  }
}
