import { supabase } from '../database/supabaseClient.js';

export const getMe = async (req, res) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      // Get user data from Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error) {
        console.error('Error getting user data:', error);
        return res.status(401).json({ error: 'Invalid token' });
      }

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      console.log('User data retrieved:', user);
      console.log(token);

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error getting profile data:', profileError);
        return res.status(500).json({ error: 'Failed to get profile data' });
      }

      // Return user data including verification status and profile
      return res.status(200).json({
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
        ...profile
      });
    } catch (error) {
      console.error('Token validation error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 