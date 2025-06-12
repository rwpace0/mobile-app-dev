import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { supabase } from '../database/supabaseClient.js';
import fs from 'fs';
import { promisify } from 'util';
import path from 'path';

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

  static async uploadMedia(fileBuffer, fileName, bucket, supabaseClient) {
    // Add content type detection based on file extension
    const ext = path.extname(fileName).toLowerCase();
    const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                       ext === '.png' ? 'image/png' :
                       ext === '.gif' ? 'image/gif' :
                       'application/octet-stream';

    const { data, error } = await (supabaseClient || supabase).storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType
      });

    if (error) throw error;
    return data;
  }

  static async deleteMedia(fileName, bucket, supabaseClient) {
    const { data, error } = await (supabaseClient || supabase).storage
      .from(bucket)
      .remove([fileName]);

    if (error) throw error;
    return data;
  }

  static generateFileName(originalName, userId, type) {
    const timestamp = Date.now();
    const extension = path.extname(originalName).toLowerCase();
    // Ensure we always save jpegs for images (except gifs)
    const finalExtension = extension !== '.gif' ? '.jpg' : extension;
    return `${userId}/${timestamp}${finalExtension}`;
  }

  static async getPublicUrl(bucket, fileName, supabaseClient) {
    console.log('Getting public URL for:', { bucket, fileName });
    
    // Try to get a signed URL first
    try {
      const { data: signedData, error: signedError } = await (supabaseClient || supabase).storage
        .from(bucket)
        .createSignedUrl(fileName, 60 * 60); // 1 hour expiry
      
      if (signedData?.signedUrl) {
        console.log('Generated signed URL:', signedData.signedUrl);
        return signedData.signedUrl;
      }
      
      console.log('Signed URL error:', signedError);
    } catch (error) {
      console.log('Error generating signed URL:', error);
    }
    
    // Fallback to public URL if signed URL fails
    const { data } = (supabaseClient || supabase).storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    console.log('Fallback public URL:', data?.publicUrl);
    return data?.publicUrl;
  }
} 