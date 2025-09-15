import { supabase, getClientToken } from "../database/supabaseClient.js";

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

export const changeUsername = async (req, res) => {
  try {
    console.log("Received change username request body:", req.body);
    const { username } = req.body;

    // Get user ID from auth token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log("No authorization header");
      return res.status(401).json({ error: "No authorization header" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ error: "No token provided" });
    }

    // Get user from token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.log("Invalid token:", userError);
      return res.status(401).json({ error: "Invalid token" });
    }

    // Validate username
    if (!username) {
      console.log("Username is required");
      return res.status(400).json({ error: "Username is required" });
    }

    // Convert username to lowercase
    const lowercaseUsername = username.toLowerCase();
    

    const usernameValidation = validateUsername(lowercaseUsername);
    if (!usernameValidation.valid) {
      console.log("Invalid username:", usernameValidation.message);
      return res.status(400).json({ error: usernameValidation.message });
    }

    console.log("Attempting to change username for user:", user.id);

    // Create Supabase client with user's token
    const supabaseWithToken = getClientToken(token);

    // First, check if the profile exists
    const { data: existingProfile, error: checkError } = await supabaseWithToken
      .from("profiles")
      .select("user_id, username, display_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking profile:", checkError);
      return res.status(500).json({ error: "Failed to check user profile" });
    }

    if (!existingProfile) {
      console.log("No profile found for user:", user.id);
      return res.status(404).json({ error: "User profile not found. Please contact support." });
    }

    console.log("Found existing profile:", existingProfile);

    // Change username in profiles table
    const { data: profile, error: updateError } = await supabaseWithToken
      .from("profiles")
      .update({
        username: lowercaseUsername,
        display_name: lowercaseUsername, // Also change display_name if it was same as username
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error changing username:", updateError);
      // If username is taken
      if (updateError.code === "23505") {
        console.log("Username already taken:", lowercaseUsername);
        return res.status(400).json({ error: "Username is already taken" });
      }
      return res.status(500).json({
        error: "Failed to change username",
        details: updateError.message,
      });
    }

    console.log("Username change successful for user:", user.id);

    return res.status(200).json({
      message: "Username changed successfully",
      profile,
    });
  } catch (error) {
    console.error("Change username error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

