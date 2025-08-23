import { MediaService } from '../media/mediaService.js';
import { supabase } from '../database/supabaseClient.js';
import { getClientToken } from '../database/supabaseClient.js';

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
        // Extract filename from URL for deletion
        const urlParts = existingProfile.avatar_url.split('/');
        const bucketPath = urlParts[urlParts.length - 1];
        const fileName = `${userId}/${bucketPath.split('?')[0]}`;
        
        // Delete old avatar
        await supabaseWithToken.storage
          .from('avatars')
          .remove([fileName]);
        
        console.log('Deleted old avatar:', fileName);
      } catch (deleteError) {
        console.error('Error deleting old avatar:', deleteError);
        // Continue with upload even if deletion fails
      }
    }

    const fileName = MediaService.generateFileName(req.file.originalname, userId, 'avatar');
    
    // Compress the image
    const compressedBuffer = await MediaService.compressImage(req.file, { isAvatar: true });
    
    // Upload to Supabase
    const uploadResult = await MediaService.uploadMedia(compressedBuffer, fileName, 'avatars', supabaseWithToken);
    
    // Get the public URL
    const signedUrl = await MediaService.getSignedUrl('avatars', fileName, supabaseWithToken);

    // Update the user's profile with the new avatar URL
    const { data, error } = await supabaseWithToken
      .from('profiles')
      .update({ avatar_url: signedUrl })
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ url: signedUrl });
  } catch (error) {
    console.error('Error uploading avatar:', error);
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
      .select('created_by, media_url')
      .eq('exercise_id', exerciseId)
      .single();

    if (exerciseError || !exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // Only allow image uploads for user exercises
    if (exercise.created_by === userId && !req.file.mimetype.startsWith('image')) {
      return res.status(400).json({ error: 'Only images are allowed for user exercises' });
    }

    // Delete existing media if it exists
    if (exercise.media_url) {
      try {
        // Extract filename from URL for deletion
        const urlParts = exercise.media_url.split('/');
        const bucketPath = urlParts[urlParts.length - 1];
        const fileName = `${userId}/${bucketPath.split('?')[0]}`;
        
        // Delete old media
        await supabaseWithToken.storage
          .from('exercise-media')
          .remove([fileName]);
        
        console.log('Deleted old exercise media:', fileName);
      } catch (deleteError) {
        console.error('Error deleting old exercise media:', deleteError);
        // Continue with upload even if deletion fails
      }
    }

    const fileName = MediaService.generateFileName(req.file.originalname, userId, 'exercise');
    
    // Compress image
    const processedBuffer = await MediaService.compressImage(req.file);

    // Upload to Supabase
    const uploadResult = await MediaService.uploadMedia(processedBuffer, fileName, 'exercise-media', supabaseWithToken);
    
    // Get the public URL
    const signedUrl = await MediaService.getSignedUrl('exercise-media', fileName, supabaseWithToken);

    // Update the exercise with the new media URL
    const { error } = await supabaseWithToken
      .from('exercises')
      .update({ media_url: signedUrl })
      .eq('exercise_id', exerciseId)
      .eq('created_by', userId);

    if (error) throw error;

    res.json({ url: signedUrl });
  } catch (error) {
    console.error('Error uploading exercise media:', error);
    res.status(500).json({ error: 'Failed to upload exercise media' });
  }
};

export const getAvatar = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.id;
    
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

    // Extract the file path from the avatar URL
    const urlParts = profile.avatar_url.split('/');
    const avatarsIndex = urlParts.findIndex(part => part === 'avatars');
    if (avatarsIndex === -1) {
      return res.status(404).json({ error: 'Invalid avatar URL format' });
    }
    
    // Get the path after 'avatars/' (e.g., "userId/timestamp.jpg")
    const filePath = urlParts.slice(avatarsIndex + 1).join('/').split('?')[0]; // Remove query params

    console.log('Fetching avatar file:', filePath);

    // Download the file from Supabase storage
    const { data: fileData, error: downloadError } = await supabaseWithToken.storage
      .from('avatars')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('Error downloading avatar:', downloadError);
      return res.status(404).json({ error: 'Avatar file not found' });
    }

    // Convert the blob to buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Set appropriate headers
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'ETag': `"${userId}-avatar"`,
    });

    // Send the image data
    res.send(buffer);

  } catch (error) {
    console.error('Error serving avatar:', error);
    res.status(500).json({ error: 'Failed to serve avatar', details: error.message });
  }
};

export const getExerciseMedia = async (req, res) => {
  try {
    const { exerciseId } = req.params;
    const requestingUserId = req.user.id;
    
    console.log(`[getExerciseMedia] Request for exercise ID: ${exerciseId} from user: ${requestingUserId}`);
    
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    const supabaseWithToken = getClientToken(token);

    // Get the exercise to find its media
    const { data: exercise, error: exerciseError } = await supabaseWithToken
      .from('exercises')
      .select('media_url, name, created_by')
      .eq('exercise_id', exerciseId)
      .single();

    console.log(`[getExerciseMedia] Database query result:`, { exercise, exerciseError });

    if (exerciseError) {
      console.error(`[getExerciseMedia] Database error for exercise ${exerciseId}:`, exerciseError);
      return res.status(404).json({ error: 'Exercise not found', details: exerciseError.message });
    }

    if (!exercise) {
      console.error(`[getExerciseMedia] Exercise ${exerciseId} not found in database`);
      return res.status(404).json({ error: 'Exercise not found' });
    }

    if (!exercise.media_url) {
      console.error(`[getExerciseMedia] Exercise ${exerciseId} has no media_url`);
      return res.status(404).json({ error: 'Exercise media not found' });
    }

    console.log(`[getExerciseMedia] Exercise found:`, {
      exerciseId,
      name: exercise.name,
      mediaUrl: exercise.media_url,
      createdBy: exercise.created_by
    });

    // Extract the file path from the media URL
    const urlParts = exercise.media_url.split('/');
    const mediaIndex = urlParts.findIndex(part => part === 'exercise-media');
    if (mediaIndex === -1) {
      console.error(`[getExerciseMedia] Invalid media URL format for exercise ${exerciseId}:`, exercise.media_url);
      return res.status(404).json({ error: 'Invalid exercise media URL format' });
    }
    
    // Get the path after 'exercise-media/' (e.g., "userId/timestamp.jpg")
    const filePath = urlParts.slice(mediaIndex + 1).join('/').split('?')[0]; // Remove query params

    console.log(`[getExerciseMedia] Fetching exercise media file: ${filePath}`);

    // Download the file from Supabase storage
    const { data: fileData, error: downloadError } = await supabaseWithToken.storage
      .from('exercise-media')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error(`[getExerciseMedia] Error downloading exercise media for ${exerciseId}:`, downloadError);
      return res.status(404).json({ error: 'Exercise media file not found', details: downloadError?.message });
    }

    // Convert the blob to buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Determine content type based on file extension
    const fileExtension = filePath.split('.').pop().toLowerCase();
    let contentType = 'image/jpeg'; // default
    if (fileExtension === 'png') contentType = 'image/png';
    else if (fileExtension === 'gif') contentType = 'image/gif';
    else if (fileExtension === 'webp') contentType = 'image/webp';

    console.log(`[getExerciseMedia] Successfully serving media for exercise ${exerciseId}:`, {
      fileSize: buffer.length,
      contentType,
      filePath
    });

    // Set appropriate headers
    res.set({
      'Content-Type': contentType,
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'ETag': `"${exerciseId}-media"`,
      'X-Exercise-Name': exercise.name,
      'X-Created-By': exercise.created_by,
      'X-Local-Path': `exercise-media/${filePath}`,
    });

    // Send the image data
    res.send(buffer);

  } catch (error) {
    console.error(`[getExerciseMedia] Error serving exercise media for ${req.params.exerciseId}:`, error);
    res.status(500).json({ error: 'Failed to serve exercise media', details: error.message });
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const { bucket, fileName } = req.body;
    const userId = req.user.id;
    
    if (!bucket || !fileName) {
      return res.status(400).json({ error: 'Missing required fields: bucket and fileName' });
    }

    // Check if the file belongs to the user by verifying the userId prefix
    const fileUserId = fileName.split('/')[0];
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

    // Delete the file from storage using authenticated client
    const { data, error } = await supabaseWithAuth.storage
      .from(bucket)
      .remove([fileName]);

    if (error) {
      console.error('Error deleting from storage:', error);
      return res.status(500).json({ error: 'Failed to delete file from storage', details: error.message });
    }

    // If it was an avatar, also update the profile
    if (bucket === 'avatars') {
      const { error: profileError } = await supabaseWithAuth
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        // Don't return error since file was already deleted
      }
    }

    res.json({ 
      message: 'File deleted successfully',
      filename: fileName,
      bucket: bucket
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
};      