import { MediaService } from '../media/mediaService.js';
import { R2Service } from '../media/r2Service.js';
import { supabase } from '../database/supabaseClient.js';
import { getClientToken } from '../database/supabaseClient.js';
import fs from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    const supabaseWithToken = getClientToken(token);
    
    // Check for existing avatar and delete it
    const { data: existingProfile } = await supabaseWithToken
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', userId)
      .single();

    if (existingProfile?.avatar_url) {
      try {
        // Extract bucket and key from URL
        const { bucket, key } = R2Service.extractBucketAndKey(existingProfile.avatar_url);
        
        // Delete old avatar from R2
        await R2Service.deleteFile(bucket, key);
        
        console.log('[uploadAvatar] Deleted old avatar:', key);
      } catch (deleteError) {
        console.error('[uploadAvatar] Error deleting old avatar:', deleteError);
        // Continue with upload even if deletion fails
      }
    }
    
    // Compress the image
    const compressedBuffer = await MediaService.compressImage(req.file, { isAvatar: true });
    
    // Upload to R2
    const { bucket, key, signedUrl } = await R2Service.uploadAvatar(userId, compressedBuffer, req.file.originalname);

    // Update the user's profile with the new avatar URL
    const { error } = await supabaseWithToken
      .from('profiles')
      .update({ avatar_url: signedUrl })
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ url: signedUrl, bucket, key });
  } catch (error) {
    console.error('[uploadAvatar] Error:', error);
    res.status(500).json({ error: 'Failed to upload avatar', details: error.message });
  }
};

export const uploadExerciseMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const exerciseId = req.body.exerciseId;

    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    const supabaseWithToken = getClientToken(token);

    // Verify exercise ownership and get existing media
    const { data: exercise, error: exerciseError } = await supabaseWithToken
      .from('exercises')
      .select('created_by, is_public, image_url')
      .eq('exercise_id', exerciseId)
      .single();

    if (exerciseError || !exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // Verify ownership for user exercises
    const isPublicExercise = exercise.is_public || exercise.created_by === null;
    if (!isPublicExercise && exercise.created_by !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this exercise' });
    }

    // Only allow image uploads for user exercises
    if (!isPublicExercise && !req.file.mimetype.startsWith('image')) {
      return res.status(400).json({ error: 'Only images are allowed for user exercises' });
    }

    // Delete existing image if it exists
    if (exercise.image_url) {
      try {
        const { bucket, key } = R2Service.extractBucketAndKey(exercise.image_url);
        await R2Service.deleteFile(bucket, key);
        console.log('[uploadExerciseMedia] Deleted old exercise image:', key);
      } catch (deleteError) {
        console.error('[uploadExerciseMedia] Error deleting old image:', deleteError);
        // Continue with upload even if deletion fails
      }
    }
    
    // Compress image
    const compressedBuffer = await MediaService.compressImage(req.file);

    // Upload to R2
    const { bucket, key, signedUrl } = await R2Service.uploadExerciseImage(
      isPublicExercise ? exerciseId : userId, 
      compressedBuffer, 
      req.file.originalname,
      isPublicExercise
    );

    // Update the exercise with the new image URL
    const { error } = await supabaseWithToken
      .from('exercises')
      .update({ image_url: signedUrl })
      .eq('exercise_id', exerciseId);

    if (error) throw error;

    res.json({ url: signedUrl, bucket, key });
  } catch (error) {
    console.error('[uploadExerciseMedia] Error:', error);
    res.status(500).json({ error: 'Failed to upload exercise media', details: error.message });
  }
};

export const uploadExerciseVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const exerciseId = req.body.exerciseId;

    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    const supabaseWithToken = getClientToken(token);

    // Verify exercise is public/default
    const { data: exercise, error: exerciseError } = await supabaseWithToken
      .from('exercises')
      .select('created_by, is_public, video_url')
      .eq('exercise_id', exerciseId)
      .single();

    if (exerciseError || !exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // Only allow videos for public/default exercises
    const isPublicExercise = exercise.is_public || exercise.created_by === null;
    if (!isPublicExercise) {
      return res.status(403).json({ error: 'Videos are only allowed for default/public exercises' });
    }

    // Delete existing video if it exists
    if (exercise.video_url) {
      try {
        const { bucket, key } = R2Service.extractBucketAndKey(exercise.video_url);
        await R2Service.deleteFile(bucket, key);
        console.log('[uploadExerciseVideo] Deleted old exercise video:', key);
      } catch (deleteError) {
        console.error('[uploadExerciseVideo] Error deleting old video:', deleteError);
        // Continue with upload even if deletion fails
      }
    }

    // Compress video to 720p
    const compressedBuffer = await MediaService.compressVideo(req.file);

    // Upload to R2
    const { bucket, key, signedUrl } = await R2Service.uploadExerciseVideo(
      exerciseId,
      compressedBuffer,
      req.file.originalname
    );

    // Clean up temporary file
    if (req.file.path) {
      try {
        await unlinkAsync(req.file.path);
      } catch (cleanupError) {
        console.error('[uploadExerciseVideo] Failed to cleanup temp file:', cleanupError);
      }
    }

    // Update the exercise with the new video URL
    const { error } = await supabaseWithToken
      .from('exercises')
      .update({ video_url: signedUrl })
      .eq('exercise_id', exerciseId);

    if (error) throw error;

    res.json({ url: signedUrl, bucket, key });
  } catch (error) {
    console.error('[uploadExerciseVideo] Error:', error);
    
    // Clean up temporary file on error
    if (req.file && req.file.path) {
      try {
        await unlinkAsync(req.file.path);
      } catch (cleanupError) {
        console.error('[uploadExerciseVideo] Failed to cleanup temp file:', cleanupError);
      }
    }
    
    res.status(500).json({ error: 'Failed to upload exercise video', details: error.message });
  }
};

export const getAvatar = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    const supabaseWithToken = getClientToken(token);

    // Get the user's profile to find their avatar
    const { data: profile, error: profileError } = await supabaseWithToken
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile?.avatar_url) {
      return res.status(404).json({ error: 'Avatar not found' });
    }

    // R2 signed URLs are already accessible, just return it
    // Or redirect to the signed URL
    res.json({ url: profile.avatar_url });

  } catch (error) {
    console.error('[getAvatar] Error:', error);
    res.status(500).json({ error: 'Failed to serve avatar', details: error.message });
  }
};

export const getExerciseMedia = async (req, res) => {
  try {
    const { exerciseId } = req.params;
    const mediaType = req.query.type || 'image'; // 'image' or 'video'
    
    console.log(`[getExerciseMedia] Request for exercise ID: ${exerciseId}, type: ${mediaType}`);
    
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    const supabaseWithToken = getClientToken(token);

    // Get the exercise to find its media
    const { data: exercise, error: exerciseError } = await supabaseWithToken
      .from('exercises')
      .select('image_url, video_url, name, created_by')
      .eq('exercise_id', exerciseId)
      .single();

    console.log(`[getExerciseMedia] Database query result:`, { exercise, exerciseError });

    if (exerciseError || !exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    const mediaUrl = mediaType === 'video' ? exercise.video_url : exercise.image_url;

    if (!mediaUrl) {
      return res.status(404).json({ error: `Exercise ${mediaType} not found` });
    }

    // R2 signed URLs are already accessible, return it or redirect
    res.json({ url: mediaUrl, type: mediaType });

  } catch (error) {
    console.error(`[getExerciseMedia] Error:`, error);
    res.status(500).json({ error: 'Failed to serve exercise media', details: error.message });
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const { bucket, fileName, type } = req.body; // type: 'avatar', 'exercise-image', 'exercise-video'
    const userId = req.user.id;
    
    if (!bucket || !fileName) {
      return res.status(400).json({ error: 'Missing required fields: bucket and fileName' });
    }

    // Check if the file belongs to the user by verifying the userId prefix
    const fileUserId = fileName.split('/')[1]; // R2 paths: avatars/{userId}/file or exercise-images/{userId}/file
    if (fileUserId !== userId) {
      return res.status(403).json({ 
        error: 'Not authorized to delete this file',
        filename: fileName,
        bucket: bucket
      });
    }

    // Get the authenticated client using the user's token
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    const supabaseWithAuth = getClientToken(token);

    // Delete the file from R2
    await R2Service.deleteFile(bucket, fileName);

    // If it was an avatar, also update the profile
    if (type === 'avatar') {
      const { error: profileError } = await supabaseWithAuth
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', userId);

      if (profileError) {
        console.error('[deleteMedia] Error updating profile:', profileError);
        // Don't return error since file was already deleted
      }
    }

    // If it was exercise media, update the exercise
    if (type === 'exercise-image' || type === 'exercise-video') {
      const exerciseId = req.body.exerciseId;
      if (exerciseId) {
        const updateField = type === 'exercise-video' ? 'video_url' : 'image_url';
        const { error: exerciseError } = await supabaseWithAuth
          .from('exercises')
          .update({ [updateField]: null })
          .eq('exercise_id', exerciseId)
          .eq('created_by', userId);

        if (exerciseError) {
          console.error('[deleteMedia] Error updating exercise:', exerciseError);
          // Don't return error since file was already deleted
        }
      }
    }

    res.json({ 
      message: 'File deleted successfully',
      filename: fileName,
      bucket: bucket
    });
  } catch (error) {
    console.error('[deleteMedia] Error:', error);
    res.status(500).json({ error: 'Failed to delete media', details: error.message });
  }
};
