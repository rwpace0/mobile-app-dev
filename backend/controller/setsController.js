import { supabase } from "../database/supabaseClient.js";

export async function createSets(req, res) {
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
    
    const { workout_id, workout_exercises_id, sets } = req.body;
    
    // Basic validation
    if (!workout_id || !workout_exercises_id || !sets || !Array.isArray(sets) || sets.length === 0) {
      return res.status(400).json({ error: 'Missing required fields or invalid sets data' });
    }
    
    // Verify the workout belongs to the user
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select('*')
      .eq('workout_id', workout_id)
      .eq('user_id', user.id)
      .single();
    
    if (workoutError || !workout) {
      return res.status(403).json({ error: 'Unauthorized access to this workout' });
    }
    
    // Prepare sets data for insertion
    const setsToInsert = sets.map((set, index) => ({
      workout_id,
      workout_exercises_id,
      weight: set.weight || 0,
      reps: set.reps || 0,
      set_order: set.set_order || index + 1
    }));
    
    // Insert sets into the sets table
    const { data: insertedSets, error: insertError } = await supabase
      .from('sets')
      .insert(setsToInsert)
      .select();
    
    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({ error: 'Failed to create sets' });
    }
    
    return res.status(201).json({ 
      success: true, 
      message: 'Sets created successfully',
      sets: insertedSets
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSetsForExercise(req, res) {
  try {
    const { exercise_id } = req.params;
    
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
    
    // First, get all workout_exercises entries for this exercise
    const { data: workoutExercises, error: weError } = await supabase
      .from('workout_exercises')
      .select(`
        workout_exercises_id,
        workout_id,
        created_at
      `)
      .eq('exercise_id', exercise_id);
    
    if (weError) {
      console.error('Database query error:', weError);
      return res.status(500).json({ error: weError.message });
    }
    
    if (!workoutExercises || workoutExercises.length === 0) {
      return res.json([]);
    }
    
    // Get all workout IDs to verify user ownership
    const workoutIds = workoutExercises.map(we => we.workout_id);
    
    // Verify the workouts belong to the user
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('workout_id, date_performed')
      .in('workout_id', workoutIds)
      .eq('user_id', user.id);
    
    if (workoutsError) {
      console.error('Database query error:', workoutsError);
      return res.status(500).json({ error: workoutsError.message });
    }
    
    // Create a map of workout_id to date_performed for easy lookup
    const workoutDates = {};
    workouts.forEach(w => {
      workoutDates[w.workout_id] = w.date_performed;
    });
    
    // Filter workout_exercises to only include those from the user's workouts
    const userWorkoutExercises = workoutExercises.filter(we => 
      workoutDates[we.workout_id] !== undefined
    );
    
    if (userWorkoutExercises.length === 0) {
      return res.json([]);
    }
    
    // Get all workout_exercises_ids
    const workoutExercisesIds = userWorkoutExercises.map(we => we.workout_exercises_id);
    
    // Get all sets for these workout_exercises
    const { data: sets, error: setsError } = await supabase
      .from('sets')
      .select('*')
      .in('workout_exercises_id', workoutExercisesIds)
      .order('created_at', { ascending: false });
    
    if (setsError) {
      console.error('Database query error:', setsError);
      return res.status(500).json({ error: setsError.message });
    }
    
    // Group sets by workout_exercises_id
    const setsByWorkoutExercise = {};
    sets.forEach(set => {
      if (!setsByWorkoutExercise[set.workout_exercises_id]) {
        setsByWorkoutExercise[set.workout_exercises_id] = [];
      }
      setsByWorkoutExercise[set.workout_exercises_id].push(set);
    });
    
    // Combine data: for each workout_exercise, include the workout date and its sets
    const exerciseHistory = userWorkoutExercises.map(we => ({
      workout_exercises_id: we.workout_exercises_id,
      workout_id: we.workout_id,
      date_performed: workoutDates[we.workout_id],
      created_at: we.created_at,
      sets: setsByWorkoutExercise[we.workout_exercises_id] || []
    }));
    
    // Sort by date_performed (most recent first)
    exerciseHistory.sort((a, b) => 
      new Date(b.date_performed) - new Date(a.date_performed)
    );
    
    res.json(exerciseHistory);
  } catch (err) {
    console.error('Network or unexpected error:', err);
    res.status(500).json({
      error: 'Failed to connect to Supabase API',
      message: err.message,
    });
  }
}
