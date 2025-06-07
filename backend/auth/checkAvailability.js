import { supabase } from '../database/supabaseClient.js';

export const checkAvailability = async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username && !email) {
      return res.status(400).json({ error: 'Username or email is required' });
    }

    let existingUser = null;

    // Check username if provided
    if (username) {
      const { data: usernameCheck, error: usernameError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (usernameError && !usernameError.message.includes('No rows found')) {
        console.error('Username check error:', usernameError);
        return res.status(500).json({ error: 'Failed to check username availability' });
      }

      if (usernameCheck) {
        return res.status(200).json({ 
          available: false,
          message: 'Username is already taken'
        });
      }
    }

    // Check email if provided
    if (email) {
      const { data: emailCheck, error: emailError } = await supabase.auth
        .admin.listUsers({
          filter: `email eq "${email}"`
        });

      if (emailError) {
        console.error('Email check error:', emailError);
        return res.status(500).json({ error: 'Failed to check email availability' });
      }

      if (emailCheck && emailCheck.users && emailCheck.users.length > 0) {
        return res.status(200).json({ 
          available: false,
          message: 'Email is already registered'
        });
      }
    }

    // If we get here, both username and email are available
    return res.status(200).json({
      available: true,
      message: 'Username and email are available'
    });

  } catch (error) {
    console.error('Check availability error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 