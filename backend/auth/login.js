import dotenv from 'dotenv';
import { supabase } from '../database/supabaseClient.js';

dotenv.config();

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Call Supabase Auth signIn
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // Check if email is verified
    if (!data.user.email_confirmed_at) {
      return res.status(401).json({ 
        error: 'Please verify your email before logging in',
        needsVerification: true
      });
    }

    // Return success response with user data and session (including refresh token)
    return res.status(200).json({
      message: 'Login successful',
      user: data.user,
      session: data.session,
      refresh_token: data.session.refresh_token
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
