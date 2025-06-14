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
      
      if (localCount[0].count === 0) {
        // If empty, try to fetch initial data from server
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
          const token = await storage.getItem("auth_token");
          if (token) {
            const response = await axios.get(this.baseUrl, {
              headers: { Authorization: `Bearer ${token}` }
            });

            // Store workouts and their exercises locally
            for (const workout of response.data) {
              await this.storeWorkoutLocally(workout);
            }
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
        if (!exercise || !exercise.exercise_id) continue;
        
        const workoutExerciseId = exercise.workout_exercises_id || uuid();
        await this.db.execute(
          `INSERT OR REPLACE INTO workout_exercises (
            workout_exercises_id, workout_id, exercise_id,
            exercise_order, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            workoutExerciseId,
            workout.workout_id,
            exercise.exercise_id,
            exercise.exercise_order || 0,
            exercise.notes || null,
            exercise.created_at || now,
            exercise.updated_at || now
          ]
        );

        // Store sets if they exist
        if (exercise.sets && Array.isArray(exercise.sets)) {
          for (const set of exercise.sets) {
            if (!set) continue;
            
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
  }

  async getWorkouts() {
    try {
      await this.ensureInitialized();

      // Get local workouts first
      const workouts = await this.db.query(
        `SELECT 
          w.*,
          json_group_array(
            CASE 
              WHEN we.workout_exercises_id IS NULL THEN json_object()
              ELSE json_object(
                'workout_exercises_id', we.workout_exercises_id,
                'exercise_id', we.exercise_id,
                'name', COALESCE(e.name, 'Unknown Exercise'),
                'muscle_group', e.muscle_group,
                'exercise_order', we.exercise_order,
                'notes', we.notes,
                'sets', (
                  SELECT json_group_array(
                    json_object(
                      'set_id', s.set_id,
                      'weight', s.weight,
                      'reps', s.reps,
                      'rir', s.rir,
                      'set_order', s.set_order
                    )
                  )
                  FROM sets s
                  WHERE s.workout_exercises_id = we.workout_exercises_id
                  ORDER BY s.set_order
                )
              )
            END
          ) as exercises
        FROM workouts w
        LEFT JOIN workout_exercises we ON w.workout_id = we.workout_id
        LEFT JOIN exercises e ON we.exercise_id = e.exercise_id
        WHERE w.sync_status != 'pending_delete'
        GROUP BY w.workout_id
        ORDER BY w.date_performed DESC`
      );

      // Parse exercises JSON for each workout and handle empty arrays
      const processedWorkouts = workouts.map(workout => {
        let exercises = [];
        try {
          const parsedExercises = JSON.parse(workout.exercises);
          exercises = parsedExercises
            .filter(ex => ex && Object.keys(ex).length > 0)
            .map(ex => ({
              ...ex,
              sets: ex.sets ? JSON.parse(ex.sets) : []
            }));
        } catch (e) {
          console.error('Error parsing exercises:', e);
        }
        return {
          ...workout,
          exercises
        };
      });

      // Try to sync in background if needed
      syncManager.syncIfNeeded("workouts").catch(console.error);

      return processedWorkouts;
    } catch (error) {
      console.error("Get workouts error:", error);
      throw error;
    }
  }

  async getWorkoutById(workoutId) {
    try {
      const [workout] = await this.db.query(
        `SELECT 
          w.*,
          json_group_array(
            CASE 
              WHEN we.workout_exercises_id IS NULL THEN json_object()
              ELSE json_object(
                'workout_exercises_id', we.workout_exercises_id,
                'exercise_id', we.exercise_id,
                'name', COALESCE(e.name, 'Unknown Exercise'),
                'muscle_group', e.muscle_group,
                'exercise_order', we.exercise_order,
                'notes', we.notes,
                'sets', (
                  SELECT json_group_array(
                    json_object(
                      'set_id', s.set_id,
                      'weight', s.weight,
                      'reps', s.reps,
                      'rir', s.rir,
                      'set_order', s.set_order
                    )
                  )
                  FROM sets s
                  WHERE s.workout_exercises_id = we.workout_exercises_id
                  ORDER BY s.set_order
                )
              )
            END
          ) as exercises
        FROM workouts w
        LEFT JOIN workout_exercises we ON w.workout_id = we.workout_id
        LEFT JOIN exercises e ON we.exercise_id = e.exercise_id
        WHERE w.workout_id = ? AND w.sync_status != 'pending_delete'
        GROUP BY w.workout_id`,
        [workoutId]
      );

      if (workout) {
        let exercises = [];
        try {
          const parsedExercises = JSON.parse(workout.exercises);
          exercises = parsedExercises
            .filter(ex => ex && Object.keys(ex).length > 0)
            .map(ex => ({
              ...ex,
              sets: ex.sets ? JSON.parse(ex.sets) : []
            }));
        } catch (e) {
          console.error('Error parsing exercises:', e);
        }
        return {
          ...workout,
          exercises
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