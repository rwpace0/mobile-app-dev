import dotenv from 'dotenv';
import { supabase } from '../database/supabaseClient.js';

dotenv.config();

export const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    // Validate input
    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Refresh the session using Supabase
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refresh_token
    });

    if (error) {
      console.error('Token refresh error:', error);
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    if (!data.session) {
      return res.status(401).json({ error: 'Failed to refresh session' });
    }

    // Return new session data
    return res.status(200).json({
      message: 'Token refreshed successfully',
      session: data.session,
      user: data.user
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 