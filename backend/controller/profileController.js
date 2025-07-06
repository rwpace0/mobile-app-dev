import { supabase } from '../database/supabaseClient.js';
import { getClientToken } from '../database/supabaseClient.js';

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    const supabaseWithToken = getClientToken(token);

    const { data: profile, error } = await supabaseWithToken
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    // If no profile exists, return default values
    if (!profile) {
      return res.json({
        user_id: userId,
        display_name: '',
        avatar_url: null
      });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile', details: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { display_name } = req.body;
    
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    const supabaseWithToken = getClientToken(token);

    // Check if profile exists
    const { data: existingProfile } = await supabaseWithToken
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    const profileData = {
      display_name: display_name || '',
      updated_at: new Date().toISOString()
    };

    let result;
    if (existingProfile) {
      // Update existing profile
      result = await supabaseWithToken
        .from('profiles')
        .update(profileData)
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      // Create new profile
      result = await supabaseWithToken
        .from('profiles')
        .insert({
          user_id: userId,
          ...profileData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
    }

    if (result.error) throw result.error;

    res.json({ 
      message: 'Profile updated successfully',
      profile: result.data
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
}; 