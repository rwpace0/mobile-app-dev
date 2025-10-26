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
      return res.status(401).json({ error: "No authorization header" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    const supabaseWithAuth = getClientToken(token);
    // Get user data from Supabase
    const {
      data: { user },
      error: userError,
    } = await supabaseWithAuth.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    const { name, equipment, muscle_group, secondary_muscle_groups } = req.body;
    // Basic validation
    if (!name || !equipment || !muscle_group) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate secondary_muscle_groups if provided
    let validatedSecondaryMuscles = null;
    if (
      secondary_muscle_groups !== undefined &&
      secondary_muscle_groups !== null
    ) {
      if (Array.isArray(secondary_muscle_groups)) {
        validatedSecondaryMuscles = secondary_muscle_groups.filter(
          (m) => m && typeof m === "string"
        );
      } else if (typeof secondary_muscle_groups === "string") {
        // Handle case where frontend sends JSON string
        try {
          const parsed = JSON.parse(secondary_muscle_groups);
          validatedSecondaryMuscles = Array.isArray(parsed) ? parsed : [];
        } catch {
          validatedSecondaryMuscles = [];
        }
      }
    }

    console.log("Creating exercise with data:", {
      name,
      equipment,
      muscle_group,
      secondary_muscle_groups: validatedSecondaryMuscles,
      created_by: user.id,
    });

    // Insert into exercises table and return the inserted row
    const { data, error: insertError } = await supabaseWithAuth
      .from("exercises")
      .insert([
        {
          name,
          equipment,
          muscle_group,
          secondary_muscle_groups: validatedSecondaryMuscles,
          media_url: "",
          is_public: false,
          created_by: user.id,
          instruction: null,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Supabase insert error details:", insertError);
      return res.status(500).json({
        error: "Failed to create exercise",
        details: insertError.message || insertError,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Exercise created successfully",
      exercise_id: data.exercise_id,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
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
    const {
      name,
      equipment,
      muscle_group,
      instruction,
      secondary_muscle_groups,
    } = req.body;

    if (!exerciseId) {
      return res.status(400).json({ error: "Exercise ID is required" });
    }

    // Basic validation
    if (!name || !equipment || !muscle_group) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate secondary_muscle_groups if provided
    let validatedSecondaryMuscles = null;
    if (
      secondary_muscle_groups !== undefined &&
      secondary_muscle_groups !== null
    ) {
      if (Array.isArray(secondary_muscle_groups)) {
        validatedSecondaryMuscles = secondary_muscle_groups.filter(
          (m) => m && typeof m === "string"
        );
      } else if (typeof secondary_muscle_groups === "string") {
        // Handle case where frontend sends JSON string
        try {
          const parsed = JSON.parse(secondary_muscle_groups);
          validatedSecondaryMuscles = Array.isArray(parsed) ? parsed : [];
        } catch {
          validatedSecondaryMuscles = [];
        }
      }
    }

    // Check if exercise exists and belongs to the user
    const { data: exercise, error: exerciseCheckError } = await supabaseWithAuth
      .from("exercises")
      .select("exercise_id, created_by, is_public, media_url")
      .eq("exercise_id", exerciseId)
      .single();

    if (exerciseCheckError || !exercise) {
      return res.status(404).json({ error: "Exercise not found" });
    }

    // Check if exercise is public (public exercises cannot be edited)
    if (exercise.is_public) {
      return res
        .status(403)
        .json({ error: "Public exercises cannot be edited" });
    }

    // Verify ownership
    if (exercise.created_by !== user.id) {
      return res
        .status(403)
        .json({ error: "You don't have permission to update this exercise" });
    }

    // Update the exercise - preserve existing media_url if not provided
    const updateData = {
      name,
      equipment,
      muscle_group,
      instruction: instruction || null,
      // Preserve existing media_url if not explicitly provided
      media_url:
        req.body.media_url !== undefined
          ? req.body.media_url
          : exercise.media_url,
      updated_at: new Date().toISOString(),
    };

    // Only update secondary_muscle_groups if it was provided in the request
    if (secondary_muscle_groups !== undefined) {
      updateData.secondary_muscle_groups = validatedSecondaryMuscles;
    }

    const { data: updatedExercise, error: updateError } = await supabaseWithAuth
      .from("exercises")
      .update(updateData)
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
      .select("exercise_id, created_by, is_public, media_url")
      .eq("exercise_id", exerciseId)
      .single();

    if (exerciseCheckError || !exercise) {
      return res.status(404).json({ error: "Exercise not found" });
    }

    // Check if exercise is public (public exercises cannot be deleted)
    if (exercise.is_public) {
      return res
        .status(403)
        .json({ error: "Public exercises cannot be deleted" });
    }

    // Verify ownership
    if (exercise.created_by !== user.id) {
      return res
        .status(403)
        .json({ error: "You don't have permission to delete this exercise" });
    }

    // Delete related records first (due to foreign key constraints)
    // First, get all workout_exercises IDs that reference this exercise
    const { data: workoutExercises, error: workoutExercisesQueryError } =
      await supabaseWithAuth
        .from("workout_exercises")
        .select("workout_exercises_id")
        .eq("exercise_id", exerciseId);

    if (workoutExercisesQueryError) {
      console.error(
        "Workout exercises query error:",
        workoutExercisesQueryError
      );
      return res.status(500).json({
        error: "Failed to query related workout exercises",
        details: workoutExercisesQueryError.message,
      });
    }

    // Delete all sets that reference these workout_exercises
    if (workoutExercises && workoutExercises.length > 0) {
      const workoutExercisesIds = workoutExercises.map(
        (we) => we.workout_exercises_id
      );

      const { error: setsError } = await supabaseWithAuth
        .from("sets")
        .delete()
        .in("workout_exercises_id", workoutExercisesIds);

      if (setsError) {
        console.error("Sets delete error:", setsError);
        return res.status(500).json({
          error: "Failed to delete related sets",
          details: setsError.message,
        });
      }
    }

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

    // Now delete workout_exercises that reference this exercise
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

    // Delete the exercise image if it exists
    if (exercise.media_url) {
      try {
        // Extract filename from URL for deletion
        const urlParts = exercise.media_url.split("/");
        const bucketPath = urlParts[urlParts.length - 1];
        const fileName = `${exercise.created_by}/${bucketPath.split("?")[0]}`;

        // Delete the file from storage
        const { error: storageError } = await supabaseWithAuth.storage
          .from("exercise-media")
          .remove([fileName]);

        if (storageError) {
          console.error("Error deleting exercise media:", storageError);
          // Continue with exercise deletion even if media deletion fails
        } else {
          console.log("Successfully deleted exercise media:", fileName);
        }
      } catch (mediaError) {
        console.error("Error processing media deletion:", mediaError);
        // Continue with exercise deletion even if media deletion fails
      }
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
