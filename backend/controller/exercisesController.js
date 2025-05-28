import { supabase } from "../database/supabaseClient.js";

export async function getExercises(req, res) {
  try {
    // query the exercises table
    const { data, error } = await supabase
      .from("exercises")
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

export async function createExercise(req, res) {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    // Get user data from Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    const { name, equipment, muscle_group } = req.body;
    // Basic validation
    if (!name || !equipment || !muscle_group) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Insert into exercises table
    const { error: insertError } = await supabase.from('exercises').insert([
      {
        name,
        equipment,
        muscle_group,
        media_url: '',
        is_public: false,
        created_by: user.id,
        instruction: null,
      },
    ]);
    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({ error: 'Failed to create exercise' });
    }
    return res.status(201).json({ success: true, message: 'Exercise created successfully' });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
