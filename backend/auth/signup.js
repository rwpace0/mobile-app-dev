import dotenv from 'dotenv';
import { supabase } from '../database/supabaseClient.js';

dotenv.config();

// Password strength validation
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!hasUpperCase) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!hasLowerCase) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!hasNumbers) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (!hasSpecialChar) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }

  return { valid: true };
};

// Username validation
const validateUsername = (username) => {
  const minLength = 3;
  const maxLength = 20;
  const validFormat = /^[a-zA-Z0-9_-]+$/;

  if (username.length < minLength) {
    return { valid: false, message: 'Username must be at least 3 characters long' };
  }
  if (username.length > maxLength) {
    return { valid: false, message: 'Username must be less than 20 characters' };
  }
  if (!validFormat.test(username)) {
    return { valid: false, message: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }

  return { valid: true };
};

export const signup = async (req, res) => {
  try {
    console.log('Received signup request body:', req.body);
    const { email, password, username } = req.body;

    // Validate input
    if (!email || !password || !username) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'Email, password, and username are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      console.log('Invalid password:', passwordValidation.message);
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      console.log('Invalid username:', usernameValidation.message);
      return res.status(400).json({ error: usernameValidation.message });
    }

    console.log('Attempting Supabase signup with email:', email);
    // Call Supabase Auth signup with email verification
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL}/auth/verify-email`, //need to fix redirect
        data: {
          email_verified: false
        },
        // Set longer expiration time (24 hours)
        expiresIn: 86400
      },
    });

    if (error) {
      console.log('Supabase signup error:', error);
      // Check if error is due to existing user
      if (error.message.includes('already registered')) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      return res.status(400).json({ error: error.message });
    }

    // Create profile entry
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([
        { 
          user_id: data.user.id,
          username,
          display_name: username,
          is_public: false
        }
      ])
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // If username is taken
      if (profileError.code === '23505') {
        return res.status(400).json({ error: 'Username is already taken' });
      }
      return res.status(500).json({ error: 'Failed to create profile' });
    }

    // Return success response with user data
    return res.status(200).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: { ...data.user, ...profile },
      session: data.session
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
