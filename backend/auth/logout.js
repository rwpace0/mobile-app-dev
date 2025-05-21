import dotenv from 'dotenv';
import { supabase } from '../database/supabaseClient.js';

dotenv.config();

export const logout = async (req, res) => {
  try {
    // Call Supabase Auth signOut
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Return success response
    return res.status(200).json({
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 