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

export const signup = async (req, res) => {
  try {
    console.log('Received signup request body:', req.body);
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (checkError) {
      console.log('Error checking existing user:', checkError);
      return res.status(500).json({ error: 'Error checking existing user' });
    }

    if (existingUser) {
      console.log('Email already exists:', email);
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      console.log('Invalid password:', passwordValidation.message);
      return res.status(400).json({ error: passwordValidation.message });
    }

    console.log('Attempting Supabase signup with email:', email);
    // Call Supabase Auth signup with email verification
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL}/auth/verify-email`,
        data: {
          email_verified: false
        }
      },
    });

    if (error) {
      console.log('Supabase signup error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Return success response with user data
    return res.status(200).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: data.user,
      session: data.session
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
