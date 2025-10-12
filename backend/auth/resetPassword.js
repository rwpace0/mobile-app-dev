import dotenv from "dotenv";
import { supabase } from "../database/supabaseClient.js";
import { getResetPasswordUrl } from "../config/urls.js";

dotenv.config();

// Password strength validation (reusing from signup)
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

// Request password reset - sends email with reset link
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Send password reset email using Supabase
    const resetPasswordUrl = getResetPasswordUrl();
    console.log("resetPasswordUrl:", resetPasswordUrl);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: resetPasswordUrl,
        // Set expiration time (1 hour)
        expiresIn: 3600,
      }
    );

    if (resetError) {
      console.error("Password reset request error:", resetError);
      return res
        .status(500)
        .json({ error: "Failed to send password reset email" });
    }

    return res.status(200).json({
      message:
        "Password reset email sent successfully. Please check your email.",
      email: email,
    });
  } catch (error) {
    console.error("Request password reset error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Reset password - handles the actual password reset when user clicks the link
export const resetPassword = async (req, res) => {
  try {
    const { token_hash, type, password, error, error_description } = req.body;

    // Handle error cases from the URL
    if (error) {
      if (error === "access_denied" && error_description?.includes("expired")) {
        return res.status(400).json({
          error: "Password reset link has expired",
          code: "EXPIRED_LINK",
          message: "Please request a new password reset email",
        });
      }
      return res.status(400).json({
        error: "Password reset failed",
        code: error,
        message: error_description,
      });
    }

    if (!token_hash || !type || !password) {
      return res.status(400).json({
        error:
          "Missing required parameters: token_hash, type, and password are required",
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Reset the password using Supabase
    const { data, error: resetError } = await supabase.auth.verifyOtp({
      token_hash,
      type: "recovery",
      password: password,
    });

    if (resetError) {
      console.error("Password reset error:", resetError);
      if (resetError.message.includes("expired")) {
        return res.status(400).json({
          error: "Password reset link has expired",
          code: "EXPIRED_LINK",
          message: "Please request a new password reset email",
        });
      }
      return res.status(400).json({
        error: resetError.message,
        code: "RESET_FAILED",
      });
    }

    // Return success response with session data for automatic login
    return res.status(200).json({
      message: "Password reset successfully",
      session: data.session,
      user: data.user,
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Update user password using recovery session
export const updateUserPassword = async (req, res) => {
  try {
    const { password, access_token, refresh_token } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    if (!access_token || !refresh_token) {
      return res
        .status(400)
        .json({ error: "Recovery session tokens are required" });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // First, set the session with the recovery tokens
    const { data: sessionData, error: sessionError } =
      await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

    if (sessionError) {
      console.error("Failed to set recovery session:", sessionError);
      return res.status(400).json({
        error: "Invalid recovery session",
        code: "INVALID_SESSION",
        message: "The recovery link may be expired or invalid",
      });
    }

    // Now update the password using the authenticated session
    const { data, error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      console.error("Password update error:", updateError);
      if (updateError.message.includes("expired")) {
        return res.status(400).json({
          error: "Recovery session has expired",
          code: "EXPIRED_SESSION",
          message: "Please request a new password reset email",
        });
      }
      return res.status(400).json({
        error: updateError.message,
        code: "UPDATE_FAILED",
      });
    }

    // Return success response with session data for automatic login
    return res.status(200).json({
      message: "Password updated successfully",
      session: data.session,
      user: data.user,
    });
  } catch (error) {
    console.error("Password update error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
