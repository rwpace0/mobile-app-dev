import { supabase, supabaseAdmin } from "../database/supabaseClient.js";
import { deleteAllUserData } from "./deleteUserData.js";

export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (signInError) {
      return res.status(401).json({ error: "Invalid password" });
    }

    try {
      await deleteAllUserData(user.id);
    } catch (dataError) {
      console.error("Account data deletion failed for user:", user.id, dataError);
      return res.status(500).json({ error: "Failed to delete account data" });
    }

    const { error: deleteUserError } =
      await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      console.error(
        "CRITICAL: Auth user deletion failed after data wipe. userId:",
        user.id,
        deleteUserError,
      );
      return res.status(500).json({ error: "Failed to delete account" });
    }

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
