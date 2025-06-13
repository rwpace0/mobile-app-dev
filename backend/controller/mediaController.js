import { MediaService } from '../media/mediaService.js';
import { supabase } from '../database/supabaseClient.js';
import { getClientToken } from '../database/supabaseClient.js';

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const fileName = MediaService.generateFileName(req.file.originalname, userId, 'avatar');
    
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    const supabaseWithToken = getClientToken(token);
    
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

    // Verify exercise ownership
    const { data: exercise, error: exerciseError } = await supabaseWithToken
      .from('exercises')
      .select('created_by')
      .eq('exercise_id', exerciseId)
      .single();

    if (exerciseError || !exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // Only allow image uploads for user exercises
    if (exercise.created_by === userId && !req.file.mimetype.startsWith('image')) {
      return res.status(400).json({ error: 'Only images are allowed for user exercises' });
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