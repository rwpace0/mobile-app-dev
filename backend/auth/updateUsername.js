import { supabase } from "../database/supabaseClient.js";

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

export const updateUsername = async (req, res) => {
  try {
    const { username } = req.body;

    // Get user ID from auth token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Get user from token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Validate username
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return res.status(400).json({ error: usernameValidation.message });
    }

    // Update username in profiles table
    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update({
        username,
        display_name: username, // Also update display_name if it was same as username
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating username:", updateError);
      // If username is taken
      if (updateError.code === "23505") {
        return res.status(400).json({ error: "Username is already taken" });
      }
      return res.status(500).json({
        error: "Failed to update username",
        details: updateError.message,
      });
    }

    return res.status(200).json({
      message: "Username updated successfully",
      profile,
    });
  } catch (error) {
    console.error("Update username error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

