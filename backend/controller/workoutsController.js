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

    // Create authenticated client
    const supabaseWithAuth = getClientToken(token);

    // Insert into workouts table
    const { data: workout, error: insertError } = await supabaseWithAuth
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
      console.log("Authentication error:", userError);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Create a client with the user's token
    const supabaseWithAuth = getClientToken(token);

    // Diagnostic query to check all workouts with detailed logging
    const { data: allWorkouts, error: allWorkoutsError } =
      await supabaseWithAuth
        .from("workouts")
        .select("workout_id, user_id, name, date_performed")
        .limit(5);

    // Query the workouts table for the user's workouts with explicit user check
    const { data, error } = await supabaseWithAuth
      .from("workouts")
      .select("workout_id, user_id, name, date_performed, duration")
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

    // Create authenticated client
    const supabaseWithAuth = getClientToken(token);

    // Query the workouts table for the specific workout
    const { data: workouts, error: workoutError } = await supabaseWithAuth
      .from("workouts")
      .select("*")
      .eq("workout_id", id)
      .eq("user_id", user.id);

    if (workoutError) {
      console.error("Database query error:", workoutError);
      return res.status(500).json({ error: workoutError.message });
    }

    if (!workouts || workouts.length === 0) {
      return res.status(404).json({ error: "Workout not found" });
    }

    const workout = workouts[0]; // Get the first (and should be only) workout

    // Get the exercises for this workout
    const { data: workoutExercises, error: exercisesError } =
      await supabaseWithAuth
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
    const { data: sets, error: setsError } = await supabaseWithAuth
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

export async function updateWorkout(req, res) {
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

    const { name, date_performed, duration, exercises } = req.body;

    // Basic validation
    if (!name || !date_performed) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create authenticated client
    const supabaseWithAuth = getClientToken(token);

    // Check if workout exists and belongs to user
    const { data: existingWorkout, error: checkError } = await supabaseWithAuth
      .from("workouts")
      .select("workout_id")
      .eq("workout_id", id)
      .eq("user_id", user.id)
      .single();

    if (checkError || !existingWorkout) {
      return res
        .status(404)
        .json({ error: "Workout not found or access denied" });
    }

    // Update the workout
    const { data: updatedWorkout, error: updateError } = await supabaseWithAuth
      .from("workouts")
      .update({
        name,
        date_performed,
        duration: duration || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("workout_id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return res.status(500).json({ error: "Failed to update workout" });
    }

    // Delete existing exercises and sets for this workout
    await supabaseWithAuth.from("sets").delete().eq("workout_id", id);

    await supabaseWithAuth
      .from("workout_exercises")
      .delete()
      .eq("workout_id", id);

    // Insert new exercises and sets if provided
    if (exercises && exercises.length > 0) {
      for (const exercise of exercises) {
        // Insert exercise
        const { data: workoutExercise, error: exerciseError } =
          await supabaseWithAuth
            .from("workout_exercises")
            .insert({
              workout_id: id,
              exercise_id: exercise.exercise_id,
              exercise_order: exercise.exercise_order || 1,
              notes: exercise.notes || "",
            })
            .select()
            .single();

        if (exerciseError) {
          console.error("Exercise insert error:", exerciseError);
          continue;
        }

        // Insert sets for this exercise
        if (exercise.sets && exercise.sets.length > 0) {
          const setsToInsert = exercise.sets.map((set) => ({
            workout_id: id,
            workout_exercises_id: workoutExercise.workout_exercises_id,
            set_order: set.set_order || 1,
            weight: set.weight || 0,
            reps: set.reps || 0,
            rir: set.rir ? Number(set.rir) : null,
          }));

          const { error: setsError } = await supabaseWithAuth
            .from("sets")
            .insert(setsToInsert);

          if (setsError) {
            console.error("Sets insert error:", setsError);
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Workout updated successfully",
      workout: updatedWorkout,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
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
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    // Create authenticated client
    const supabaseWithAuth = getClientToken(token);
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    const { name, date_performed, duration, template_id, exercises } = req.body;
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
      template_id: template_id || null,
    });
    const { data: workoutData, error: workoutError } = await supabaseWithAuth
      .from("workouts")
      .insert([
        {
          user_id: user.id,
          name,
          date_performed,
          duration: duration || 0,
          template_id: template_id || null, // Store template_id to link workout to template
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
      await supabaseWithAuth
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
      const { data: setsData, error: setsError } = await supabaseWithAuth
        .from("sets")
        .insert(setsToInsert)
        .select();
      if (setsError) {
        return res.status(500).json({
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

export async function getWorkoutCountsByWeek(req, res) {
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

    // Create authenticated client
    const supabaseWithAuth = getClientToken(token);
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Create a client with the user's token

    // Calculate date range (8 weeks ago from now)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 8 * 7); // 8 weeks ago

    // Query workouts within date range
    const { data: workouts, error } = await supabaseWithAuth
      .from("workouts")
      .select("date_performed")
      .eq("user_id", user.id)
      .gte("date_performed", startDate.toISOString())
      .lte("date_performed", endDate.toISOString())
      .order("date_performed", { ascending: true });

    if (error) {
      console.error("Database query error:", error);
      return res.status(500).json({ error: error.message });
    }

    // Initialize weeks array with dates and counts
    const weeks = [];
    for (let i = 0; i < 8; i++) {
      const weekStart = new Date(endDate);
      weekStart.setDate(weekStart.getDate() - 7 * (7 - i));
      weeks.push({
        weekStart: weekStart.toISOString().split("T")[0],
        count: 0,
      });
    }

    // Count workouts per week
    workouts.forEach((workout) => {
      const workoutDate = new Date(workout.date_performed);
      for (let i = 0; i < weeks.length; i++) {
        const weekStart = new Date(weeks[i].weekStart);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        if (workoutDate >= weekStart && workoutDate < weekEnd) {
          weeks[i].count++;
          break;
        }
      }
    });

    // Format response
    const response = {
      weeks: weeks.map((w) => w.weekStart),
      counts: weeks.map((w) => w.count),
    };

    res.json(response);
  } catch (err) {
    console.error("Network or unexpected error:", err);
    res.status(500).json({
      error: "Failed to fetch workout counts",
      message: err.message,
    });
  }
}

export async function getWorkoutsBatch(req, res) {
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

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Create a client with the user's token
    const supabaseWithAuth = getClientToken(token);

    // Get total count for pagination
    const { count: totalCount } = await supabaseWithAuth
      .from("workouts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Query workouts with pagination
    const { data: workouts, error: workoutsError } = await supabaseWithAuth
      .from("workouts")
      .select("*")
      .eq("user_id", user.id)
      .order("date_performed", { ascending: false })
      .range(offset, offset + limit - 1);

    if (workoutsError) {
      console.error("Database query error:", workoutsError);
      return res.status(500).json({ error: workoutsError.message });
    }

    if (!workouts || workouts.length === 0) {
      return res.json({
        workouts: [],
        page,
        limit,
        total: totalCount,
        hasMore: false,
      });
    }

    // Get all workout IDs for this batch
    const workoutIds = workouts.map((w) => w.workout_id);

    // Get exercises for all workouts in this batch in a single query
    const { data: workoutExercises, error: exercisesError } =
      await supabaseWithAuth
        .from("workout_exercises")
        .select(
          `
        workout_exercises_id,
        workout_id,
        notes,
        created_at,
        exercises (*)
      `
        )
        .in("workout_id", workoutIds);

    if (exercisesError) {
      console.error("Database query error:", exercisesError);
      return res.status(500).json({ error: exercisesError.message });
    }

    // Get all sets for these workouts in a single query
    const { data: sets, error: setsError } = await supabaseWithAuth
      .from("sets")
      .select("*")
      .in("workout_id", workoutIds)
      .order("set_order", { ascending: true });

    if (setsError) {
      console.error("Database query error:", setsError);
      return res.status(500).json({ error: setsError.message });
    }

    // Organize exercises and sets by workout_id
    const exercisesByWorkout = {};
    workoutExercises.forEach((we) => {
      if (!exercisesByWorkout[we.workout_id]) {
        exercisesByWorkout[we.workout_id] = [];
      }
      exercisesByWorkout[we.workout_id].push(we);
    });

    const setsByExercise = {};
    sets.forEach((set) => {
      if (!setsByExercise[set.workout_exercises_id]) {
        setsByExercise[set.workout_exercises_id] = [];
      }
      setsByExercise[set.workout_exercises_id].push(set);
    });

    // Combine all data
    const workoutsWithDetails = workouts.map((workout) => {
      const exercises = (exercisesByWorkout[workout.workout_id] || []).map(
        (we) => ({
          ...we,
          sets: setsByExercise[we.workout_exercises_id] || [],
        })
      );

      return {
        ...workout,
        exercises,
      };
    });

    res.json({
      workouts: workoutsWithDetails,
      page,
      limit,
      total: totalCount,
      hasMore: offset + workouts.length < totalCount,
    });
  } catch (err) {
    console.error("Network or unexpected error:", err);
    res.status(500).json({
      error: "Failed to connect to Supabase API",
      message: err.message,
    });
  }
}

export async function upsertWorkout(req, res) {
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

    const { workout_id, name, date_performed, duration, template_id, exercises } = req.body;

    // Basic validation
    if (!workout_id || !name || !date_performed) {
      return res
        .status(400)
        .json({
          error: "Missing required fields: workout_id, name, date_performed",
        });
    }

    // Create authenticated client
    const supabaseWithAuth = getClientToken(token);

    // 1. Upsert the main workout record
    const { data: workoutData, error: workoutError } = await supabaseWithAuth
      .from("workouts")
      .upsert(
        [
          {
            workout_id,
            user_id: user.id,
            name,
            date_performed,
            duration: duration || 0,
            template_id: template_id || null, // Store template_id to link workout to template
            updated_at: new Date().toISOString(),
          },
        ],
        {
          onConflict: "workout_id",
          ignoreDuplicates: false,
        }
      )
      .select();

    if (workoutError || !workoutData || !workoutData[0]) {
      console.error("Workout upsert error:", workoutError);
      return res.status(500).json({
        error: "Failed to upsert workout",
        details: workoutError?.message || "Unknown error",
      });
    }

    const workout = workoutData[0];

    // 2. Handle exercises if provided
    let workoutExercisesData = [];
    let setsData = [];

    if (exercises && Array.isArray(exercises) && exercises.length > 0) {
      // First, clear existing sets and exercises for this workout
      // IMPORTANT: Delete sets first, then exercises (foreign key constraint order)

      const { error: deleteSetsError } = await supabaseWithAuth
        .from("sets")
        .delete()
        .eq("workout_id", workout_id);

      if (deleteSetsError) {
        console.error("Error deleting existing sets:", deleteSetsError);
        return res.status(500).json({
          error: "Failed to clear existing sets",
          details: deleteSetsError.message,
        });
      }

      const { error: deleteExercisesError } = await supabaseWithAuth
        .from("workout_exercises")
        .delete()
        .eq("workout_id", workout_id);

      if (deleteExercisesError) {
        console.error(
          "Error deleting existing exercises:",
          deleteExercisesError
        );
        return res.status(500).json({
          error: "Failed to clear existing exercises",
          details: deleteExercisesError.message,
        });
      }

      // Insert new workout_exercises
      const workoutExercisesToInsert = exercises.map((ex, index) => ({
        workout_exercises_id: ex.workout_exercises_id || undefined, // Let DB generate if not provided
        workout_id: workout_id,
        exercise_id: ex.exercise_id,
        exercise_order: ex.exercise_order || index + 1,
        notes: ex.notes || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { data: insertedExercises, error: exercisesError } =
        await supabaseWithAuth
          .from("workout_exercises")
          .insert(workoutExercisesToInsert)
          .select();

      if (exercisesError || !insertedExercises) {
        console.error("Error inserting exercises:", exercisesError);
        return res.status(500).json({
          error: "Failed to insert workout exercises",
          details: exercisesError?.message || "Unknown error",
        });
      }

      workoutExercisesData = insertedExercises;

      // 3. Insert sets for each exercise
      let setsToInsert = [];
      workoutExercisesData.forEach((we, idx) => {
        const sets = exercises[idx]?.sets || [];
        sets.forEach((set, setIndex) => {
          setsToInsert.push({
            workout_id: workout_id,
            workout_exercises_id: we.workout_exercises_id,
            weight: Number(set.weight) || 0,
            reps: Number(set.reps) || 0,
            rir: set.rir != null ? Number(set.rir) : null,
            set_order: set.set_order || setIndex + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
      });

      if (setsToInsert.length > 0) {
        const { data: insertedSets, error: setsError } = await supabaseWithAuth
          .from("sets")
          .insert(setsToInsert)
          .select();

        if (setsError) {
          console.error("Error inserting sets:", setsError);
          return res.status(500).json({
            error: "Failed to insert sets",
            details: setsError.message,
          });
        }

        setsData = insertedSets || [];
      }
    }

    return res.status(200).json({
      success: true,
      message: "Workout upserted successfully",
      workout,
      workout_exercises: workoutExercisesData,
      sets: setsData,
    });
  } catch (err) {
    console.error("Unexpected error in upsertWorkout:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getWorkoutsWithDetails(req, res) {
  try {
    //console.log("getWorkoutsWithDetails: Starting request");
    
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

    //console.log(`getWorkoutsWithDetails: Fetching complete data for user ${user.id}`);

    // Create a client with the user's token
    const supabaseWithAuth = getClientToken(token);

    // Get all workouts for the user with their exercises and sets
    const { data: workouts, error: workoutsError } = await supabaseWithAuth
      .from("workouts")
      .select(`
        *,
        workout_exercises (
          workout_exercises_id,
          exercise_order,
          notes,
          exercises (
            exercise_id,
            name,
            muscle_group
          )
        ),
        sets (
          set_id,
          workout_exercises_id,
          weight,
          reps,
          rir,
          set_order
        )
      `)
      .eq("user_id", user.id)
      .order("date_performed", { ascending: false });

    if (workoutsError) {
      console.error("Database query error:", workoutsError);
      return res.status(500).json({ error: workoutsError.message });
    }

    //console.log(`getWorkoutsWithDetails: Retrieved ${workouts?.length || 0} workouts from database`);

    // Process the data to match the expected format
    const processedWorkouts = workouts.map(workout => {
      // Group sets by workout_exercises_id
      const setsByExercise = {};
      if (workout.sets) {
        workout.sets.forEach(set => {
          if (!setsByExercise[set.workout_exercises_id]) {
            setsByExercise[set.workout_exercises_id] = [];
          }
          setsByExercise[set.workout_exercises_id].push(set);
        });
      }

      // Process exercises with their sets
      const exercises = (workout.workout_exercises || []).map(we => ({
        workout_exercises_id: we.workout_exercises_id,
        exercise_id: we.exercises?.exercise_id,
        exercise_order: we.exercise_order,
        notes: we.notes,
        name: we.exercises?.name,
        muscle_group: we.exercises?.muscle_group,
        sets: setsByExercise[we.workout_exercises_id] || []
      }));

      // Sort exercises by order
      exercises.sort((a, b) => a.exercise_order - b.exercise_order);

      return {
        workout_id: workout.workout_id,
        user_id: workout.user_id,
        name: workout.name,
        date_performed: workout.date_performed,
        duration: workout.duration,
        template_id: workout.template_id,
        created_at: workout.created_at,
        updated_at: workout.updated_at,
        exercises: exercises
      };
    });

    //console.log(`getWorkoutsWithDetails: Returning ${processedWorkouts.length} processed workouts`);
    res.json(processedWorkouts);
  } catch (err) {
    console.error("Network or unexpected error:", err);
    res.status(500).json({
      error: "Failed to connect to Supabase API",
      message: err.message,
    });
  }
}
