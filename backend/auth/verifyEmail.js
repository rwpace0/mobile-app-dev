import dotenv from 'dotenv';
import { supabase } from '../database/supabaseClient.js';

dotenv.config();

export const verifyEmail = async (req, res) => {
  try {
    const { token_hash, type } = req.query;

    if (!token_hash || !type) {
      return res.status(400).json({ error: 'Missing verification parameters' });
    }

    // Verify the email using Supabase
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'email',
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Return success response
    return res.status(200).json({
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 