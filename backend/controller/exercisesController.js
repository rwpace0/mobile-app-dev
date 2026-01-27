import { supabase } from "../database/supabaseClient.js";
import { getClientToken } from "../database/supabaseClient.js";
import { R2Service } from "../media/r2Service.js";

/**
 * Transform exercise data by generating URLs from stored paths
 * @param {Object} exercise - Exercise object with image_url and video_url paths
 * @returns {Promise<Object>} Exercise object with generated URLs
 */
async function transformExerciseWithUrls(exercise) {
  if (!exercise) return exercise;

  const transformed = { ...exercise };

  // Generate image URL if path exists
  if (exercise.image_url) {
    try {
      const { bucket, key } = R2Service.extractBucketAndKey(exercise.image_url);
      transformed.image_url = await R2Service.getMediaUrl(bucket, key);
    } catch (error) {
      console.error(`[transformExerciseWithUrls] Error generating image URL:`, error);
      // Keep original path if URL generation fails
    }
  }

  // Generate video URL if path exists
  if (exercise.video_url) {
    try {
      const { bucket, key } = R2Service.extractBucketAndKey(exercise.video_url);
      transformed.video_url = await R2Service.getMediaUrl(bucket, key);
    } catch (error) {
      console.error(`[transformExerciseWithUrls] Error generating video URL:`, error);
      // Keep original path if URL generation fails
    }
  }

  return transformed;
}

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

    // Transform exercises to include generated URLs
    const exercisesWithUrls = await Promise.all(
      data.map(exercise => transformExerciseWithUrls(exercise))
    );

    res.json(exercisesWithUrls);
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

    // Transform exercise to include generated URLs
    const exerciseWithUrls = await transformExerciseWithUrls(data);

    res.json(exerciseWithUrls);
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
          image_url: null,
          video_url: null,
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
      .select("exercise_id, created_by, is_public, image_url, video_url")
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

    // Update the exercise - preserve existing image_url and video_url if not provided
    const updateData = {
      name,
      equipment,
      muscle_group,
      instruction: instruction || null,
      // Preserve existing image_url if not explicitly provided
      image_url:
        req.body.image_url !== undefined
          ? req.body.image_url
          : exercise.image_url,
      // Preserve existing video_url if not explicitly provided
      video_url:
        req.body.video_url !== undefined
          ? req.body.video_url
          : exercise.video_url,
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

    // Transform exercise to include generated URLs
    const exerciseWithUrls = await transformExerciseWithUrls(updatedExercise);

    return res.json({
      success: true,
      message: "Exercise updated successfully",
      exercise: exerciseWithUrls,
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
      .select("exercise_id, created_by, is_public, image_url, video_url")
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

    // Note: Media deletion (images/videos in R2) is handled by the MediaController
    // when the user explicitly deletes media through the media endpoints.
    // We don't delete media here to avoid orphaning files if the exercise deletion fails.

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
