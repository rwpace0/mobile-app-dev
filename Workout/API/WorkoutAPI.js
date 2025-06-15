import 'react-native-get-random-values';
import axios from 'axios';
import { storage } from './tokenStorage';
import getBaseUrl from './getBaseUrl';
import { dbManager } from './local/dbManager';
import { syncManager } from './local/syncManager';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuid } from 'uuid';

class WorkoutAPI {
  constructor() {
    this.baseUrl = `${getBaseUrl()}/workouts`;
    this.db = dbManager;
    this.isInitialized = false;
    this.setupSync();
  }

  setupSync() {
    syncManager.registerSyncFunction("workouts", async () => {
      await this.syncWorkouts();
    });
  }

  async ensureInitialized() {
    if (this.isInitialized) return;
    
    try {
      // Check if we have any workouts in local db
      const localCount = await this.db.query("SELECT COUNT(*) as count FROM workouts");
      
      console.log("Local workout count:", localCount[0].count);
      
      if (localCount[0].count === 0) {
        // If empty, try to fetch initial data from server
        const netInfo = await NetInfo.fetch();
        console.log("Network connected:", netInfo.isConnected);
        
        if (netInfo.isConnected) {
          const token = await storage.getItem("auth_token");
          if (token) {
            console.log("Fetching initial workouts from server...");
            const response = await axios.get(this.baseUrl, {
              headers: { Authorization: `Bearer ${token}` }
            });

            console.log("Server returned", response.data.length, "workouts");
            if (response.data.length > 0) {
              console.log("First server workout:", JSON.stringify(response.data[0], null, 2));
              console.log("Server workout structure - has exercises?", !!response.data[0].exercises);
              console.log("Server workout exercises count:", response.data[0].exercises?.length || 0);
            }

            // Store ALL workouts and try to fetch complete data if needed
            for (const workout of response.data) {
              console.log(`Processing workout ${workout.workout_id}:`);
              console.log(`- Has exercises: ${!!workout.exercises}`);
              console.log(`- Exercise count: ${workout.exercises?.length || 0}`);
              
              if (workout.exercises && workout.exercises.length > 0) {
                console.log("- Storing workout with exercises");
                await this.storeWorkoutLocally(workout);
              } else {
                console.log("- Trying to fetch complete workout data from server");
                try {
                  // Try to fetch complete workout data
                  const completeResponse = await axios.get(`${this.baseUrl}/${workout.workout_id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  
                  if (completeResponse.data.exercises && completeResponse.data.exercises.length > 0) {
                    console.log(`- Found ${completeResponse.data.exercises.length} exercises for workout ${workout.workout_id}`);
                    await this.storeWorkoutLocally(completeResponse.data);
                  } else {
                    console.log("- No exercises found even in detailed fetch, storing basic workout");
                    await this.storeWorkoutLocally({
                      ...workout,
                      exercises: []
                    });
                  }
                } catch (error) {
                  console.log("- Failed to fetch detailed workout, storing basic version:", error.message);
                  await this.storeWorkoutLocally({
                    ...workout,
                    exercises: []
                  });
                }
              }
            }
          } else {
            console.log("No auth token found");
          }
        }
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error("Database initialization error:", error);
      this.isInitialized = true;
    }
  }

  async storeWorkoutLocally(workout, syncStatus = "synced") {
    const now = new Date().toISOString();
    
    console.log("Storing workout locally:", workout.workout_id, "with", workout.exercises?.length || 0, "exercises");
    
    // Check if workout already exists locally and has more exercises than the new data
    const [existingWorkout] = await this.db.query(
      "SELECT workout_id FROM workouts WHERE workout_id = ?",
      [workout.workout_id]
    );
    
    if (existingWorkout) {
      const existingExercises = await this.db.query(
        "SELECT COUNT(*) as count FROM workout_exercises WHERE workout_id = ?",
        [workout.workout_id]
      );
      
      const existingCount = existingExercises[0]?.count || 0;
      const newCount = workout.exercises?.length || 0;
      
      if (existingCount > 0 && newCount === 0) {
        console.log(`Skipping overwrite of workout ${workout.workout_id} - existing has ${existingCount} exercises, new has ${newCount}`);
        return;
      }
    }
    
    // Store workout
    await this.db.execute(
      `INSERT OR REPLACE INTO workouts (
        workout_id, user_id, name, date_performed, duration,
        created_at, updated_at, sync_status, version, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        workout.workout_id,
        workout.user_id,
        workout.name,
        workout.date_performed,
        workout.duration,
        workout.created_at || now,
        workout.updated_at || now,
        syncStatus,
        workout.version || 1,
        now
      ]
    );

    // Store workout exercises
    if (workout.exercises && Array.isArray(workout.exercises)) {
      
      
      for (const exercise of workout.exercises) {
        // Handle nested exercise structure from server
        let exerciseData;
        let exerciseId;
        let exerciseName;
        
        if (exercise.exercises && exercise.exercises.exercise_id) {
          // Server returns nested structure: { exercises: { exercise_id, name, ... }, sets: [...] }
          exerciseData = exercise.exercises;
          exerciseId = exerciseData.exercise_id;
          exerciseName = exerciseData.name;
          console.log("Found nested exercise structure");
        } else if (exercise.exercise_id) {
          // Direct structure: { exercise_id, name, ... }
          exerciseData = exercise;
          exerciseId = exercise.exercise_id;
          exerciseName = exercise.name;
          console.log("Found direct exercise structure");
        } else {
          console.log("Skipping invalid exercise - no exercise_id found:", exercise);
          continue;
        }
        
        console.log("Processing exercise:", exerciseId, exerciseName);
        
        // First, ensure the exercise definition exists in the exercises table
        if (exerciseData.name) {
          await this.db.execute(
            `INSERT OR REPLACE INTO exercises (
              exercise_id, name, muscle_group, instruction, equipment,
              media_url, is_public, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              exerciseId,
              exerciseData.name,
              exerciseData.muscle_group || null,
              exerciseData.instruction || null,
              exerciseData.equipment || null,
              exerciseData.media_url || null,
              exerciseData.is_public || 0,
              exerciseData.created_by || null,
              exerciseData.created_at || now,
              exerciseData.updated_at || now
            ]
          );
        }
        
        const workoutExerciseId = exercise.workout_exercises_id || uuid();
        await this.db.execute(
          `INSERT OR REPLACE INTO workout_exercises (
            workout_exercises_id, workout_id, exercise_id,
            exercise_order, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            workoutExerciseId,
            workout.workout_id,
            exerciseId,
            exercise.exercise_order || 0,
            exercise.notes || null,
            exercise.created_at || now,
            exercise.updated_at || now
          ]
        );

        console.log("Stored workout_exercise:", workoutExerciseId, "with", exercise.sets?.length || 0, "sets");

        // Store sets if they exist
        if (exercise.sets && Array.isArray(exercise.sets)) {
          for (const set of exercise.sets) {
            if (!set) continue;
            
            console.log("Storing set:", set);
            
            await this.db.execute(
              `INSERT OR REPLACE INTO sets (
                set_id, workout_id, workout_exercises_id,
                weight, reps, rir, set_order, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                set.set_id || uuid(),
                workout.workout_id,
                workoutExerciseId,
                set.weight || 0,
                set.reps || 0,
                set.rir || null,
                set.set_order || 0,
                set.created_at || now,
                set.updated_at || now
              ]
            );
          }
        }
      }
    }
    
    console.log("Finished storing workout locally:", workout.workout_id);
  }

  async getWorkouts() {
    try {
      await this.ensureInitialized();

      // Debug: Check what's in the tables
      const allWorkoutExercises = await this.db.query("SELECT * FROM workout_exercises LIMIT 5");
      const allExercises = await this.db.query("SELECT * FROM exercises LIMIT 5");
      const allSets = await this.db.query("SELECT * FROM sets LIMIT 5");
      
      console.log("Sample workout_exercises in DB:", allWorkoutExercises);
      console.log("Sample exercises in DB:", allExercises);
      console.log("Sample sets in DB:", allSets);
      
      // Additional debugging - count all entries
      const workoutCount = await this.db.query("SELECT COUNT(*) as count FROM workouts");
      const exerciseCount = await this.db.query("SELECT COUNT(*) as count FROM exercises");
      const workoutExerciseCount = await this.db.query("SELECT COUNT(*) as count FROM workout_exercises");
      const setCount = await this.db.query("SELECT COUNT(*) as count FROM sets");
      
      console.log("Table counts:");
      console.log(`- workouts: ${workoutCount[0].count}`);
      console.log(`- exercises: ${exerciseCount[0].count}`);
      console.log(`- workout_exercises: ${workoutExerciseCount[0].count}`);
      console.log(`- sets: ${setCount[0].count}`);

      // Get workouts first
      const workouts = await this.db.query(
        `SELECT * FROM workouts 
         WHERE sync_status != 'pending_delete'
         ORDER BY date_performed DESC`
      );

      // Get exercises and sets for each workout
      const workoutsWithExercises = await Promise.all(
        workouts.map(async (workout) => {
          console.log(`Fetching exercises for workout: ${workout.workout_id}`);
          
          // Debug: Check raw workout_exercises entries
          const rawWorkoutExercises = await this.db.query(
            "SELECT * FROM workout_exercises WHERE workout_id = ?",
            [workout.workout_id]
          );
          console.log(`Raw workout_exercises for ${workout.workout_id}:`, rawWorkoutExercises);
          
          // Get workout exercises
          const workoutExercises = await this.db.query(
            `SELECT we.*, e.name, e.muscle_group
             FROM workout_exercises we
             LEFT JOIN exercises e ON we.exercise_id = e.exercise_id
             WHERE we.workout_id = ?
             ORDER BY we.exercise_order`,
            [workout.workout_id]
          );

          console.log(`Found ${workoutExercises.length} exercises for workout ${workout.workout_id}:`, workoutExercises);

          // Get sets for each exercise
          const exercisesWithSets = await Promise.all(
            workoutExercises.map(async (exercise) => {
              console.log(`Fetching sets for exercise: ${exercise.workout_exercises_id}`);
              
              const sets = await this.db.query(
                `SELECT * FROM sets 
                 WHERE workout_exercises_id = ?
                 ORDER BY set_order`,
                [exercise.workout_exercises_id]
              );

              console.log(`Found ${sets.length} sets for exercise ${exercise.workout_exercises_id}:`, sets);

              return {
                ...exercise,
                sets: sets || []
              };
            })
          );

          return {
            ...workout,
            exercises: exercisesWithSets
          };
        })
      );

      // Try to sync in background if needed
      syncManager.syncIfNeeded("workouts").catch(console.error);

      // Debug logging
      console.log("Workouts fetched:", workoutsWithExercises.length);
      if (workoutsWithExercises.length > 0) {
        console.log("First workout:", JSON.stringify(workoutsWithExercises[0], null, 2));
      }

      return workoutsWithExercises;
    } catch (error) {
      console.error("Get workouts error:", error);
      throw error;
    }
  }

  async getWorkoutById(workoutId) {
    try {
      // Get workout
      const [workout] = await this.db.query(
        `SELECT * FROM workouts 
         WHERE workout_id = ? AND sync_status != 'pending_delete'`,
        [workoutId]
      );

      if (workout) {
        // Get workout exercises
        const workoutExercises = await this.db.query(
          `SELECT we.*, e.name, e.muscle_group
           FROM workout_exercises we
           LEFT JOIN exercises e ON we.exercise_id = e.exercise_id
           WHERE we.workout_id = ?
           ORDER BY we.exercise_order`,
          [workout.workout_id]
        );

        // Get sets for each exercise
        const exercisesWithSets = await Promise.all(
          workoutExercises.map(async (exercise) => {
            const sets = await this.db.query(
              `SELECT * FROM sets 
               WHERE workout_exercises_id = ?
               ORDER BY set_order`,
              [exercise.workout_exercises_id]
            );

            return {
              ...exercise,
              sets: sets || []
            };
          })
        );

        return {
          ...workout,
          exercises: exercisesWithSets
        };
      }

      // If not found locally, try server
      const token = await storage.getItem("auth_token");
      if (!token) throw new Error("No auth token found");

      const response = await axios.get(`${this.baseUrl}/${workoutId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Store in local db
      await this.storeWorkoutLocally(response.data);

      return response.data;
    } catch (error) {
      console.error("Get workout by id error:", error);
      throw error;
    }
  }

  async finishWorkout(workoutData) {
    try {
      const token = await storage.getItem("auth_token");
      if (!token) throw new Error("No auth token found");

      const userId = JSON.parse(atob(token.split(".")[1])).sub;
      const workoutId = uuid();
      const now = new Date().toISOString();

      // Ensure required fields are present
      if (!workoutData.date_performed) {
        throw new Error("date_performed is required for workout");
      }

      const workout = {
        workout_id: workoutId,
        user_id: userId,
        name: workoutData.name,
        date_performed: workoutData.date_performed,
        duration: workoutData.duration || 0,
        exercises: workoutData.exercises || [],
        created_at: now,
        updated_at: now
      };

      // Save to local db first
      await this.storeWorkoutLocally(workout, "pending_sync");

      // Try to sync if online
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        try {
          const response = await axios.post(
            `${this.baseUrl}/finish`,
            workout,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          // Update sync status
          await this.db.execute(
            `UPDATE workouts 
            SET sync_status = 'synced',
                version = ?,
                last_synced_at = ?
            WHERE workout_id = ?`,
            [response.data.version || 1, now, workoutId]
          );

          return response.data;
        } catch (error) {
          console.error("Server sync failed, but local save succeeded:", error);
          return workout;
        }
      }

      return workout;
    } catch (error) {
      console.error("Finish workout error:", error);
      throw error;
    }
  }

  async getWorkoutCountsByWeek() {
    try {
      // Get local counts first
      const localCounts = await this.db.query(`
        SELECT 
          strftime('%Y-%W', date_performed) as week,
          COUNT(*) as count
        FROM workouts
        WHERE sync_status != 'pending_delete'
        GROUP BY week
        ORDER BY week DESC
      `);

      // Try to sync in background if needed
      syncManager.syncIfNeeded("workouts").catch(console.error);

      return localCounts;
    } catch (error) {
      console.error("Get workout counts error:", error);
      throw error;
    }
  }

  async syncWorkouts() {
    try {
      const token = await storage.getItem("auth_token");
      if (!token) return;

      // Get pending workouts
      const pendingWorkouts = await this.db.query(
        `SELECT * FROM workouts WHERE sync_status != 'synced'`
      );

      // Process each pending workout
      for (const workout of pendingWorkouts) {
        if (workout.sync_status === "pending_delete") {
          await this.syncDeleteWorkout(workout, token);
        } else if (workout.sync_status === "pending_sync") {
          await this.syncCreateWorkout(workout, token);
        }
      }

      // Get all server workouts
      const response = await axios.get(this.baseUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local database with server data
      for (const serverWorkout of response.data) {
        const [localWorkout] = await this.db.query(
          "SELECT * FROM workouts WHERE workout_id = ?",
          [serverWorkout.workout_id]
        );

        if (!localWorkout || localWorkout.sync_status === "synced") {
          await this.storeWorkoutLocally(serverWorkout);
        }
      }
    } catch (error) {
      console.error("Sync workouts error:", error);
    }
  }

  async syncCreateWorkout(workout, token) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/finish`,
        workout,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      await this.db.execute(
        `UPDATE workouts 
        SET sync_status = 'synced',
            version = ?,
            last_synced_at = ?
        WHERE workout_id = ?`,
        [response.data.version || 1, new Date().toISOString(), workout.workout_id]
      );
    } catch (error) {
      console.error("Sync create workout error:", error);
    }
  }

  async syncDeleteWorkout(workout, token) {
    try {
      await axios.delete(`${this.baseUrl}/${workout.workout_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await this.db.execute(
        "DELETE FROM workouts WHERE workout_id = ?",
        [workout.workout_id]
      );
    } catch (error) {
      console.error("Sync delete workout error:", error);
    }
  }
}

export default new WorkoutAPI(); 