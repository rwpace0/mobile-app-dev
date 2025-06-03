import { supabase } from "../database/supabaseClient.js";

export async function createSets(req, res) {
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

    const { workout_id, workout_exercises_id, sets } = req.body;

    // Basic validation
    if (
      !workout_id ||
      !workout_exercises_id ||
      !sets ||
      !Array.isArray(sets) ||
      sets.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "Missing required fields or invalid sets data" });
    }

    // Verify the workout belongs to the user
    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .select("*")
      .eq("workout_id", workout_id)
      .eq("user_id", user.id)
      .single();

    if (workoutError || !workout) {
      return res
        .status(403)
        .json({ error: "Unauthorized access to this workout" });
    }

    // Prepare sets data for insertion
    const setsToInsert = sets.map((set, index) => ({
      workout_id,
      workout_exercises_id,
      weight: set.weight || 0,
      reps: set.reps || 0,
      set_order: set.set_order || index + 1,
    }));

    // Insert sets into the sets table
    const { data: insertedSets, error: insertError } = await supabase
      .from("sets")
      .insert(setsToInsert)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return res.status(500).json({ error: "Failed to create sets" });
    }

    return res.status(201).json({
      success: true,
      message: "Sets created successfully",
      sets: insertedSets,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getSetsForExercise(req, res) {
  try {
    const { exercise_id } = req.params;

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
      console.log("Authentication error:", userError);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Diagnostic query to check workout_exercises
    const { data: diagnosticWE, error: diagnosticError } = await supabase
      .from("workout_exercises")
      .select("*")
      .eq("exercise_id", exercise_id);

    console.log("Diagnostic workout_exercises check:", {
      count: diagnosticWE?.length || 0,
      error: diagnosticError,
      data: diagnosticWE,
    });

    // Step 1: Get workout_exercises for this exercise that belong to the user
    const workoutExercisesQuery = supabase
      .from("workout_exercises")
      .select(
        `
        workout_exercises_id,
        workout_id,
        exercise_id,
        notes,
        workouts!inner (
          workout_id,
          name,
          date_performed,
          user_id,
          created_at
        )
      `
      )
      .eq("exercise_id", exercise_id)
      .eq("workouts.user_id", user.id);

    const { data: workoutExercises, error: workoutExercisesError } =
      await workoutExercisesQuery;

    if (workoutExercisesError) {
      console.error("Workout exercises lookup error:", workoutExercisesError);
      return res.status(500).json({ error: workoutExercisesError.message });
    }

    if (!workoutExercises || workoutExercises.length === 0) {
      return res.json([]);
    }

    // Step 2: Get sets for these workout_exercises
    const workoutExerciseIds = workoutExercises.map(
      (we) => we.workout_exercises_id
    );

    const { data: sets, error: setsError } = await supabase
      .from("sets")
      .select("*")
      .in("workout_exercises_id", workoutExerciseIds)
      .order("created_at", { ascending: false });

    if (setsError) {
      console.error("Sets lookup error:", setsError);
      return res.status(500).json({ error: setsError.message });
    }

    if (!sets || sets.length === 0) {
      return res.json([]);
    }

    // Step 3: Create a map of workout_exercises for easy lookup
    const workoutExercisesMap = {};
    workoutExercises.forEach((we) => {
      workoutExercisesMap[we.workout_exercises_id] = we;
    });

    // Step 4: Group sets by workout_exercises_id
    const historyMap = {};
    sets.forEach((set) => {
      const workoutExercise = workoutExercisesMap[set.workout_exercises_id];

      if (!workoutExercise) {
        console.warn("No workout_exercise found for set:", set.set_id);
        return;
      }

      const workoutExerciseId = set.workout_exercises_id;

      if (!historyMap[workoutExerciseId]) {
        historyMap[workoutExerciseId] = {
          workout_exercises_id: workoutExerciseId,
          workout_id: workoutExercise.workout_id,
          name: workoutExercise.workouts.name,
          date_performed: workoutExercise.workouts.date_performed,
          created_at: workoutExercise.workouts.created_at,
          sets: [],
        };
      }

      historyMap[workoutExerciseId].sets.push({
        set_id: set.set_id,
        weight: set.weight,
        reps: set.reps,
        set_order: set.set_order,
        created_at: set.created_at,
        rir: set.rir,
      });
    });

    // Step 5: Convert map to array and sort sets by set_order
    const history = Object.values(historyMap).map((workout) => ({
      ...workout,
      sets: workout.sets.sort(
        (a, b) => (a.set_order || 0) - (b.set_order || 0)
      ),
    }));

    // Step 6: Sort workouts by date, most recent first
    history.sort((a, b) => {
      const dateA = new Date(a.date_performed || a.created_at);
      const dateB = new Date(b.date_performed || b.created_at);
      return dateB - dateA;
    });

    res.json(history);
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({
      error: "Failed to connect to Supabase API",
      message: err.message,
    });
  }
}
