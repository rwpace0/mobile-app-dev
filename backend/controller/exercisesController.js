import { supabase } from "../database/supabaseClient.js";
import { getClientToken } from "../database/supabaseClient.js";

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

export async function getExerciseById(req, res) {
  try {
    const { exerciseId } = req.params;
    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .eq("exercise_id", exerciseId)
      .single();

    if (error) {
      console.error("Database query error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("Network or unexpected error:", err);
    res.status(500).json({ error: "Failed to connect to Supabase API" });
  }
}

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
     const supabaseWithAuth = getClientToken(token);
    // Get user data from Supabase
    const { data: { user }, error: userError } = await supabaseWithAuth.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    const { name, equipment, muscle_group } = req.body;
    // Basic validation
    if (!name || !equipment || !muscle_group) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    console.log('Creating exercise with data:', {
      name,
      equipment,
      muscle_group,
      created_by: user.id
    });

    // Insert into exercises table and return the inserted row
    const { data, error: insertError } = await supabaseWithAuth
      .from('exercises')
      .insert([
        {
          name,
          equipment,
          muscle_group,
          media_url: '',
          is_public: false,
          created_by: user.id,
          instruction: null,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error details:', insertError);
      return res.status(500).json({ 
        error: 'Failed to create exercise',
        details: insertError.message || insertError
      });
    }

    return res.status(201).json({ 
      success: true, 
      message: 'Exercise created successfully',
      exercise_id: data.exercise_id
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateExercise(req, res) {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Create authenticated client
    const supabaseWithAuth = getClientToken(token);

    // Get user data from Supabase using authenticated client
    const {
      data: { user },
      error: userError,
    } = await supabaseWithAuth.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const { exerciseId } = req.params;
    const { name, equipment, muscle_group, instruction } = req.body;

    if (!exerciseId) {
      return res.status(400).json({ error: "Exercise ID is required" });
    }

    // Basic validation
    if (!name || !equipment || !muscle_group) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if exercise exists and belongs to the user
    const { data: exercise, error: exerciseCheckError } = await supabaseWithAuth
      .from("exercises")
      .select("exercise_id, created_by")
      .eq("exercise_id", exerciseId)
      .single();

    if (exerciseCheckError || !exercise) {
      return res.status(404).json({ error: "Exercise not found" });
    }

    // Verify ownership
    if (exercise.created_by !== user.id) {
      return res.status(403).json({ error: "You don't have permission to update this exercise" });
    }

    // Update the exercise
    const { data: updatedExercise, error: updateError } = await supabaseWithAuth
      .from("exercises")
      .update({
        name,
        equipment,
        muscle_group,
        instruction: instruction || null,
        updated_at: new Date().toISOString(),
      })
      .eq("exercise_id", exerciseId)
      .select()
      .single();

    if (updateError) {
      console.error("Exercise update error:", updateError);
      return res.status(500).json({
        error: "Failed to update exercise",
        details: updateError.message,
      });
    }

    return res.json({
      success: true,
      message: "Exercise updated successfully",
      exercise: updatedExercise,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteExercise(req, res) {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Create authenticated client
    const supabaseWithAuth = getClientToken(token);

    // Get user data from Supabase using authenticated client
    const {
      data: { user },
      error: userError,
    } = await supabaseWithAuth.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const { exerciseId } = req.params;

    if (!exerciseId) {
      return res.status(400).json({ error: "Exercise ID is required" });
    }

    // Check if exercise exists and belongs to the user
    const { data: exercise, error: exerciseCheckError } = await supabaseWithAuth
      .from("exercises")
      .select("exercise_id, created_by")
      .eq("exercise_id", exerciseId)
      .single();

    if (exerciseCheckError || !exercise) {
      return res.status(404).json({ error: "Exercise not found" });
    }

    // Verify ownership
    if (exercise.created_by !== user.id) {
      return res.status(403).json({ error: "You don't have permission to delete this exercise" });
    }

    // Delete related records first (due to foreign key constraints)
    // Delete template_exercises that reference this exercise
    const { error: templateExercisesError } = await supabaseWithAuth
      .from("template_exercises")
      .delete()
      .eq("exercise_id", exerciseId);

    if (templateExercisesError) {
      console.error("Template exercises delete error:", templateExercisesError);
      return res.status(500).json({
        error: "Failed to delete related template exercises",
        details: templateExercisesError.message,
      });
    }

    // Delete workout_exercises that reference this exercise (sets will be CASCADE deleted)
    const { error: workoutExercisesError } = await supabaseWithAuth
      .from("workout_exercises")
      .delete()
      .eq("exercise_id", exerciseId);

    if (workoutExercisesError) {
      console.error("Workout exercises delete error:", workoutExercisesError);
      return res.status(500).json({
        error: "Failed to delete related workout exercises",
        details: workoutExercisesError.message,
      });
    }

    // Delete the exercise
    const { error: exerciseError } = await supabaseWithAuth
      .from("exercises")
      .delete()
      .eq("exercise_id", exerciseId);

    if (exerciseError) {
      console.error("Exercise delete error:", exerciseError);
      return res.status(500).json({
        error: "Failed to delete exercise",
        details: exerciseError.message,
      });
    }

    return res.json({
      success: true,
      message: "Exercise deleted successfully",
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
