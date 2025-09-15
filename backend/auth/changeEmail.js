import dotenv from "dotenv";
import { supabase, supabaseAdmin, getClientToken } from "../database/supabaseClient.js";
import { getEmailVerificationUrl } from "../config/urls.js";

dotenv.config();

// Email validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      message: "Invalid email format",
    };
  }
  return { valid: true };
};

export const changeEmail = async (req, res) => {
  try {
    console.log("Received change email request body:", req.body);
    const { newEmail } = req.body;

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

    // Validate new email
    if (!newEmail) {
      console.log("New email is required");
      return res.status(400).json({ error: "New email is required" });
    }

    // Convert email to lowercase
    const lowercaseEmail = newEmail.toLowerCase();

    const emailValidation = validateEmail(lowercaseEmail);
    if (!emailValidation.valid) {
      console.log("Invalid email format:", lowercaseEmail);
      return res.status(400).json({ error: emailValidation.message });
    }

    // Check if email is already in use by another user
    const { data: emailCheck, error: emailCheckError } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("user_email", lowercaseEmail)
      .neq("user_id", user.id)
      .maybeSingle();

    if (emailCheckError) {
      console.error("Error checking email availability:", emailCheckError);
      return res.status(500).json({ error: "Failed to check email availability" });
    }

    if (emailCheck) {
      console.log("Email already in use:", lowercaseEmail);
      return res.status(400).json({ error: "Email is already in use" });
    }

    console.log("Attempting to change email for user:", user.id);

    // Create Supabase client with user's token
    const supabaseWithToken = getClientToken(token);

    // First, check if the profile exists
    const { data: userProfile, error: profileCheckError } = await supabaseWithToken
      .from("profiles")
      .select("user_id, user_email")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileCheckError) {
      console.error("Error checking profile:", profileCheckError);
      return res.status(500).json({ error: "Failed to check user profile" });
    }

    if (!userProfile) {
      console.log("No profile found for user:", user.id);
      return res.status(404).json({ error: "User profile not found. Please contact support." });
    }

    console.log("Found existing profile:", userProfile);

    // Get email verification URL from config
    const emailVerificationUrl = getEmailVerificationUrl();

    // Update email in Supabase Auth using admin client (no session required)
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email: lowercaseEmail
    });

    if (updateError) {
      console.error("Error updating email:", updateError);
      return res.status(400).json({ error: updateError.message });
    }

    // Update email in profiles table
    const { data: profile, error: profileError } = await supabaseWithToken
      .from("profiles")
      .update({
        user_email: lowercaseEmail,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (profileError) {
      console.error("Profile email update error:", profileError);
      return res.status(500).json({ error: "Failed to update profile email" });
    }

    console.log("Email change successful for user:", user.id);

    // Return success response
    return res.status(200).json({
      message: "Email updated successfully",
      user: updateData.user,
      profile,
    });
  } catch (error) {
    console.error("Change email error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
