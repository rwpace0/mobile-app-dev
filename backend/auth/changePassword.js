import { supabase, supabaseAdmin, getClientToken } from "../database/supabaseClient.js";

// Password validation
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

export const changePassword = async (req, res) => {
  try {
    console.log("Received change password request body:", req.body);
    const { newPassword, confirmPassword } = req.body;

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

    // Validate required fields
    if (!newPassword) {
      console.log("New password is required");
      return res.status(400).json({ error: "New password is required" });
    }

    if (!confirmPassword) {
      console.log("Password confirmation is required");
      return res.status(400).json({ error: "Password confirmation is required" });
    }

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      console.log("Passwords do not match");
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      console.log("Invalid password format:", passwordValidation.message);
      return res.status(400).json({ error: passwordValidation.message });
    }

    console.log("Attempting to change password for user:", user.id);

    // Update password using admin client (no session required)
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword
    });

    if (updateError) {
      console.error("Error updating password:", updateError);
      return res.status(400).json({ error: updateError.message });
    }

    console.log("Password change successful for user:", user.id);

    // Return success response
    return res.status(200).json({
      message: "Password updated successfully",
      user: updateData.user,
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
