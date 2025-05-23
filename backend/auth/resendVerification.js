import { supabase } from '../database/supabaseClient.js';

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Resend verification email
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL}/auth/verify-email`,
        // Set longer expiration time (24 hours)
        expiresIn: 86400
      },
    });

    if (resendError) {
      console.error('Error resending verification email:', resendError);
      // Check if error is due to already verified email
      if (resendError.message.includes('already confirmed')) {
        return res.status(400).json({ error: 'Email is already verified' });
      }
      return res.status(500).json({ error: 'Failed to resend verification email' });
    }

    return res.status(200).json({
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 