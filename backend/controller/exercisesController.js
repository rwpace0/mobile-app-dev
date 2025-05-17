import { supabase } from "../database/supabaseClient.js";

// eventually have to merge public db with user db somehow

export async function getExercises(req, res) {
  try {
    // Query the exercises table
    const { data, error } = await supabase
      .from("public_exercises")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Database query error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("Network or unexpected error:", err);
    res.status(500).json({
      error: "Failed to connect to Supabase API",
      message: err.message,
    });
  }
}

export async function searchExercises(req, res) {}
