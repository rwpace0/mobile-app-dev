import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import { promisify } from 'util';
import path from 'path';
import { R2Service } from './r2Service.js';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
const unlinkAsync = promisify(fs.unlink);

export class MediaService {

  
  static async compressImage(file, options = {}) {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 80,
      isAvatar = false
    } = options;

    if (isAvatar) {
      // For avatars, create a smaller square image
      return sharp(file.buffer)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toBuffer();
    }

    // For exercise images, maintain aspect ratio but limit size
    return sharp(file.buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality })
      .toBuffer();
  }

  static async compressVideo(file) {
    const outputPath = `${file.path}_compressed.mp4`;
    
    return new Promise((resolve, reject) => {
      ffmpeg(file.path)
        .size('?x720')  // Scale to 720p height while maintaining aspect ratio
        .videoBitrate('2000k')  // 2 Mbps bitrate
        .videoCodec('libx264')
        .audioCodec('aac')
        .audioBitrate('128k')
        .outputOptions([
          '-preset medium',  // Compression preset
          '-movflags faststart'  // Enable fast start for web playback
        ])
        .on('end', async () => {
          try {
            // Read the compressed file
            const buffer = await fs.promises.readFile(outputPath);
            // Clean up temporary files
            await unlinkAsync(file.path);
            await unlinkAsync(outputPath);
            resolve(buffer);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (err) => {
          reject(err);
        })
        .save(outputPath);
    });
  }

  static async uploadMedia(fileBuffer, fileName, bucket, metadata = {}) {
    // Add content type detection based on file extension
    const ext = path.extname(fileName).toLowerCase();
    const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                       ext === '.png' ? 'image/png' :
                       ext === '.gif' ? 'image/gif' :
                       ext === '.mp4' ? 'video/mp4' :
                       ext === '.mov' ? 'video/quicktime' :
                       'application/octet-stream';

    // Upload to R2
    await R2Service.uploadFile(bucket, fileName, fileBuffer, contentType);
    
    // Generate and return signed URL
    const signedUrl = await R2Service.getSignedUrl(bucket, fileName);
    
    return { path: fileName, signedUrl };
  }

  static async deleteMedia(fileName, bucket) {
    // Delete from R2
    const result = await R2Service.deleteFile(bucket, fileName);
    return result;
  }

  static generateFileName(originalName, userId, type, prefix = '') {
    const timestamp = Date.now();
    const extension = path.extname(originalName).toLowerCase();
    
    // For images: always save as jpeg (except gifs)
    // For videos: keep original extension
    let finalExtension;
    if (type === 'video') {
      finalExtension = extension === '.mov' ? '.mp4' : extension;
    } else {
      finalExtension = extension !== '.gif' ? '.jpg' : extension;
    }
    
    if (prefix) {
      return `${prefix}/${userId}/${timestamp}${finalExtension}`;
    }
    return `${userId}/${timestamp}${finalExtension}`;
  }

  static async getSignedUrl(bucket, fileName) {
    console.log('Getting signed URL for:', { bucket, fileName });
    
    try {
      const signedUrl = await R2Service.getSignedUrl(bucket, fileName);
      
      if (!signedUrl) {
        throw new Error('No signed URL generated');
      }
      
      console.log('Generated signed URL successfully');
      return signedUrl;
    } catch (error) {
      console.error('Error in getSignedUrl:', error);
      throw error;
    }
  }

  static async compressAndUploadImage(fileBuffer, fileName, bucket) {
    // Compress the image first
    const compressedBuffer = await this.compressImage({ buffer: fileBuffer });
    
    // Upload to R2
    const result = await this.uploadMedia(compressedBuffer, fileName, bucket);
    return result;
  }

  static async compressAndUploadVideo(filePath, fileName, bucket) {
    // Compress the video
    const compressedBuffer = await this.compressVideo({ path: filePath });
    
    // Upload to R2
    const result = await this.uploadMedia(compressedBuffer, fileName, bucket);
    return result;
  }
} 