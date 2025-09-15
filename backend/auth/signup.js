import dotenv from "dotenv";
import { supabase, supabaseAdmin } from "../database/supabaseClient.js";
import { getEmailVerificationUrl } from "../config/urls.js";

dotenv.config();

// Password strength validation
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);

  if (password.length < minLength) {
    return {
      valid: false,
      message: "Password must be at least 8 characters long",
    };
  }
  if (!hasUpperCase) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }
  if (!hasNumbers) {
    return {
      valid: false,
      message: "Password must contain at least one number",
    };
  }

  return { valid: true };
};

// Username validation
const validateUsername = (username) => {
  const minLength = 3;
  const maxLength = 20;
  const validFormat = /^[a-zA-Z0-9_-]+$/;

  if (username.length < minLength) {
    return {
      valid: false,
      message: "Username must be at least 3 characters long",
    };
  }
  if (username.length > maxLength) {
    return {
      valid: false,
      message: "Username must be less than 20 characters",
    };
  }
  if (!validFormat.test(username)) {
    return {
      valid: false,
      message:
        "Username can only contain letters, numbers, underscores, and hyphens",
    };
  }

  return { valid: true };
};

export const signup = async (req, res) => {
  try {
    console.log("Received signup request body:", req.body);
    const { email, password, username } = req.body;

    // Validate input
    if (!email || !password || !username) {
      console.log("Missing required fields");
      return res
        .status(400)
        .json({ error: "Email, password, and username are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("Invalid email format:", email);
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      console.log("Invalid password:", passwordValidation.message);
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Convert username to lowercase
    const lowercaseUsername = username.toLowerCase();
    console.log("Converting username to lowercase:", username, "->", lowercaseUsername);

    // Validate username
    const usernameValidation = validateUsername(lowercaseUsername);
    if (!usernameValidation.valid) {
      console.log("Invalid username:", usernameValidation.message);
      return res.status(400).json({ error: usernameValidation.message });
    }

    console.log("Attempting Supabase signup with email:", email);
    
    // Get the email verification URL from config
    const emailVerificationUrl = getEmailVerificationUrl();
    
    // Call Supabase Auth signup with email verification
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: emailVerificationUrl,
        data: {
          email_verified: false,
        },
        // Set longer expiration time (24 hours)
        expiresIn: 86400,
      },
    });

    if (error) {
      console.log("Supabase signup error:", error);
      // Check if error is due to existing user
      if (error.message.includes("already registered")) {
        return res.status(400).json({ error: "Email already in use" });
      }
      return res.status(400).json({ error: error.message });
    }

    // Create profile entry
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          user_id: data.user.id,
          username: lowercaseUsername,
          display_name: lowercaseUsername,
          is_public: false,
          user_email: email,
        },
      ])
      .select()
      .single();

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // If username is taken
      if (profileError.code === "23505") {
        return res.status(400).json({ error: "Username is already taken" });
      }
      return res.status(500).json({ error: "Failed to create profile" });
    }

    // Return success response with user data
    return res.status(200).json({
      message:
        "Registration successful. Please check your email to verify your account.",
      user: { ...data.user, ...profile },
      session: data.session,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const checkAvailability = async (req, res) => {
  try {
    const { username, email } = req.body;

    // Validate input
    if (!username && !email) {
      return res.status(400).json({ 
        error: "At least one of username or email is required" 
      });
    }

    const results = {
      username: { available: true },
      email: { available: true }
    };

    // Check username if provided
    if (username) {
      console.log('Checking username:', username);
      const { data: usernameData, error: usernameError } = await supabaseAdmin
        .from("profiles")
        .select("username")
        .eq("username", username)
        .maybeSingle();

      console.log('Username check result:', { data: usernameData, error: usernameError });

      if (usernameError) {
        console.error("Username check error:", usernameError);
        return res.status(500).json({
          error: "Failed to check username availability",
          details: usernameError.message
        });
      }

      if (usernameData?.username) {
        results.username = {
          available: false,
          message: "Username is already taken"
        };
      }
    }

    // Check email if provided
    if (email) {
      console.log('Checking email:', email);
      const { data: emailData, error: emailError } = await supabaseAdmin
        .from("profiles")
        .select(`
          user_id,
          user_email
        `)
        .eq("user_email", email)
        .maybeSingle();

      if (emailError && !emailError.message?.includes('No rows found')) {
        console.error("Email check error:", emailError);
        return res.status(500).json({
          error: "Failed to check email availability",
          details: emailError.message
        });
      }

      if (emailData?.user_id) {
        results.email = {
          available: false,
          message: "Email is already registered"
        };
      }
    }

    // Return comprehensive results
    const allAvailable = results.username.available && results.email.available;
    
    return res.status(200).json({
      available: allAvailable,
      results,
      message: allAvailable 
        ? "All provided credentials are available" 
        : "Some credentials are already taken"
    });

  } catch (error) {
    console.error("Check availability error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
