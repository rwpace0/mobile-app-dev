import dotenv from 'dotenv';
import { supabase } from '../database/supabaseClient.js';

dotenv.config();

export const verifyEmail = async (req, res) => {
  try {
    const { token_hash, type, error, error_description } = req.query;
    console.log('Received verification request:', { token_hash, type, error, error_description });

    // Handle error cases from the URL
    if (error) {
      console.log('Verification error from URL:', { error, error_description });
      if (error === 'access_denied' && error_description?.includes('expired')) {
        return res.status(400).json({ 
          error: 'Verification link has expired',
          code: 'EXPIRED_LINK',
          message: 'Please request a new verification email'
        });
      }
      return res.status(400).json({ 
        error: 'Verification failed',
        code: error,
        message: error_description
      });
    }

    if (!token_hash || !type) {
      console.log('Missing verification parameters');
      return res.status(400).json({ error: 'Missing verification parameters' });
    }

    // Verify the email using Supabase
    console.log('Attempting to verify email with Supabase');
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'email',
    });

    if (verifyError) {
      console.error('Email verification error:', verifyError);
      if (verifyError.message.includes('expired')) {
        return res.status(400).json({ 
          error: 'Verification link has expired',
          code: 'EXPIRED_LINK',
          message: 'Please request a new verification email'
        });
      }
      return res.status(400).json({ 
        error: verifyError.message,
        code: 'VERIFICATION_FAILED'
      });
    }

    console.log('Email verified successfully:', data);

    // Return success response with session data for automatic login
    return res.status(200).json({
      message: 'Email verified successfully',
      session: data.session,
      user: data.user
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 