import { MediaService } from '../media/mediaService.js';
import { supabase } from '../database/supabaseClient.js';

async function deleteOldFile(url) {
  if (!url) return;
  
  // Extract bucket and filename from URL
  const urlParts = url.split('/');
  const bucket = urlParts.find(part => part === 'avatars' || part === 'exercise-media');
  if (!bucket) return;

  // The filename will be everything after the bucket name
  const bucketIndex = urlParts.indexOf(bucket);
  const fileName = urlParts.slice(bucketIndex).join('/');
  
  try {
    await MediaService.deleteMedia(fileName, bucket);
  } catch (error) {
    console.error('Error deleting old file:', error);
    // Don't throw error here, as we want to continue with the new upload
  }
}

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    
    // Get current avatar URL before updating
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', userId)
      .single();

    const fileName = MediaService.generateFileName(req.file.originalname, userId, 'avatar');
    
    // Compress the image
    const compressedBuffer = await MediaService.compressImage(req.file, { isAvatar: true });
    
    // Upload to Supabase
    const uploadResult = await MediaService.uploadMedia(compressedBuffer, fileName, 'avatars');
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update the user's profile with the new avatar URL
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('user_id', userId);

    if (error) throw error;

    // Delete old avatar after successful upload and database update
    if (currentProfile?.avatar_url) {
      await deleteOldFile(currentProfile.avatar_url);
    }

    res.json({ url: publicUrl });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};

export const uploadExerciseMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const exerciseId = req.body.exerciseId;

    // Verify exercise ownership and get current media URL
    const { data: exercise, error: exerciseError } = await supabase
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

    const fileName = MediaService.generateFileName(req.file.originalname, userId, 'exercise');
    
    // Compress image
    const processedBuffer = await MediaService.compressImage(req.file);

    // Upload to Supabase
    const uploadResult = await MediaService.uploadMedia(processedBuffer, fileName, 'exercise-media');
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('exercise-media')
      .getPublicUrl(fileName);

    // Update the exercise with the new media URL
    const { error } = await supabase
      .from('exercises')
      .update({ media_url: publicUrl })
      .eq('exercise_id', exerciseId)
      .eq('created_by', userId);

    if (error) throw error;

    // Delete old media after successful upload and database update
    if (exercise.media_url) {
      await deleteOldFile(exercise.media_url);
    }

    res.json({ url: publicUrl });
  } catch (error) {
    console.error('Error uploading exercise media:', error);
    res.status(500).json({ error: 'Failed to upload exercise media' });
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const { bucket, fileName } = req.body;
    const userId = req.user.id;

    // Verify ownership before deletion
    if (bucket === 'avatars') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', userId)
        .single();

      if (!profile?.avatar_url?.includes(fileName)) {
        return res.status(403).json({ error: 'Not authorized to delete this file' });
      }
    } else if (bucket === 'exercise-media') {
      const { data: exercise } = await supabase
        .from('exercises')
        .select('media_url')
        .eq('created_by', userId)
        .eq('media_url', fileName)
        .single();

      if (!exercise) {
        return res.status(403).json({ error: 'Not authorized to delete this file' });
      }
    }

    await MediaService.deleteMedia(fileName, bucket);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
}; 