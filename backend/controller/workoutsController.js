import { supabase } from "../database/supabaseClient.js";
import { getClientToken } from "../database/supabaseClient.js";

export async function createWorkout(req, res) {
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

    // Get user data from Supabase
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const { name, date_performed, duration } = req.body;

    // Basic validation
    if (!name || !date_performed) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Insert into workouts table
    const { data: workout, error: insertError } = await supabase
      .from("workouts")
      .insert([
        {
          user_id: user.id,
          name,
          date_performed,
          duration: duration || 0,
        },
      ])
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return res.status(500).json({ error: "Failed to create workout" });
    }

    return res.status(201).json({
      success: true,
      message: "Workout created successfully",
      workout: workout[0],
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getWorkouts(req, res) {
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

    // Get user data from Supabase
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Query the workouts table for the user's workouts
    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", user.id)
      .order("date_performed", { ascending: false });

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

export async function getWorkoutById(req, res) {
  try {
    const { id } = req.params;

    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Get user data from Supabase
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Query the workouts table for the specific workout
    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .select("*")
      .eq("workout_id", id)
      .eq("user_id", user.id)
      .single();

    if (workoutError) {
      console.error("Database query error:", workoutError);
      return res.status(500).json({ error: workoutError.message });
    }

    if (!workout) {
      return res.status(404).json({ error: "Workout not found" });
    }

    // Get the exercises for this workout
    const { data: workoutExercises, error: exercisesError } = await supabase
      .from("workout_exercises")
      .select(
        `
        workout_exercises_id,
        notes,
        created_at,
        exercises (*)
      `
      )
      .eq("workout_id", id);

    if (exercisesError) {
      console.error("Database query error:", exercisesError);
      return res.status(500).json({ error: exercisesError.message });
    }

    // Get the sets for each exercise in this workout
    const { data: sets, error: setsError } = await supabase
      .from("sets")
      .select("*")
      .eq("workout_id", id);

    if (setsError) {
      console.error("Database query error:", setsError);
      return res.status(500).json({ error: setsError.message });
    }

    // Organize sets by workout_exercises_id
    const setsByExercise = {};
    sets.forEach((set) => {
      if (!setsByExercise[set.workout_exercises_id]) {
        setsByExercise[set.workout_exercises_id] = [];
      }
      setsByExercise[set.workout_exercises_id].push(set);
    });

    // Add sets to each workout exercise
    const exercisesWithSets = workoutExercises.map((we) => ({
      ...we,
      sets: setsByExercise[we.workout_exercises_id] || [],
    }));

    // Combine all data
    const workoutWithDetails = {
      ...workout,
      exercises: exercisesWithSets,
    };

    res.json(workoutWithDetails);
  } catch (err) {
    console.error("Network or unexpected error:", err);
    res.status(500).json({
      error: "Failed to connect to Supabase API",
      message: err.message,
    });
  }
}

export async function finishWorkout(req, res) {
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
    // Get user data from Supabase
    const supabase = getClientToken(token);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    const { name, date_performed, duration, exercises } = req.body;
    if (
      !name ||
      !date_performed ||
      !Array.isArray(exercises) ||
      exercises.length === 0
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    // 1. Insert workout
    console.log("User ID from token:", user.id);
    console.log("Workout insert payload:", {
      user_id: user.id,
      name,
      date_performed,
      duration: duration || 0,
    });
    const { data: workoutData, error: workoutError } = await supabase
      .from("workouts")
      .insert([
        {
          user_id: user.id,
          name,
          date_performed,
          duration: duration || 0,
        },
      ])
      .select();

    if (workoutError || !workoutData || !workoutData[0]) {
      console.error("Supabase insert error:", workoutError);
      return res.status(500).json({
        error: "Failed to create workout",
        details: workoutError?.message || "Unknown error",
        data: workoutData,
      });
    }
    const workout = workoutData[0];
    // 2. Insert workout_exercises
    const workoutExercisesToInsert = exercises.map((ex) => ({
      workout_id: workout.workout_id,
      exercise_id: ex.exercise_id,
      notes: ex.notes || "",
    }));
    const { data: workoutExercisesData, error: workoutExercisesError } =
      await supabase
        .from("workout_exercises")
        .insert(workoutExercisesToInsert)
        .select();
    if (workoutExercisesError || !workoutExercisesData) {
      return res.status(500).json({
        error: "Failed to create workout exercises",
        details: workoutExercisesError?.message || "Unknown error",
        data: workoutExercisesData,
      });
    }

    // 3. Insert sets
    let setsToInsert = [];
    workoutExercisesData.forEach((we, idx) => {
      const sets = exercises[idx].sets || [];
      sets.forEach((set) => {
        setsToInsert.push({
          workout_id: workout.workout_id,
          workout_exercises_id: we.workout_exercises_id,
          weight: set.weight,
          reps: set.reps,
          set_order: set.set_order,
        });
      });
    });
    let insertedSets = [];
    if (setsToInsert.length > 0) {
      const { data: setsData, error: setsError } = await supabase
        .from("sets")
        .insert(setsToInsert)
        .select();
      if (setsError) {
        return res
          .status(500)
          .json({
            error: "Failed to create sets",
            details: setsError?.message || "Unknown Error",
          });
      }
      insertedSets = setsData;
    }
    return res.status(201).json({
      success: true,
      message: "Workout, exercises, and sets created successfully",
      workout,
      workout_exercises: workoutExercisesData,
      sets: insertedSets,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
