import dotenv from 'dotenv';
import { supabase } from '../database/supabaseClient.js';

dotenv.config();

export const resetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Call Supabase Auth resetPassword
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'yourapp://reset-password', // Replace with your app's reset password URL
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Return success response
    return res.status(200).json({
      message: 'Password reset email sent'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 