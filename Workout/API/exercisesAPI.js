import 'react-native-get-random-values';
import getBaseUrl from "./getBaseUrl";
import APIBase from './utils/APIBase';
import { dbManager } from "./local/dbManager";
import { v4 as uuid } from 'uuid';
import { storage } from './tokenStorage';
import { syncManager } from './local/syncManager';

class ExercisesAPI extends APIBase {
  constructor() {
    super(`${getBaseUrl()}/exercises`, dbManager, {
      cacheConfig: {
        maxSize: 1000,
        ttl: 30 * 60 * 1000 // 30 minutes for exercise cache
      }
    });

    // Register sync function with sync manager  
    syncManager.registerSyncFunction('exercises', async () => {
      try {
        const pendingExercises = await this.db.query(
          `SELECT * FROM exercises WHERE sync_status IN ('pending_sync', 'pending_delete')`
        );

        for (const exercise of pendingExercises) {
          try {
            if (exercise.sync_status === 'pending_delete') {
              await this.makeAuthenticatedRequest({
                method: 'DELETE',
                url: `${this.baseUrl}/${exercise.exercise_id}`
              });
            } else {
              // Skip immediate priority exercises that should have been synced already
              // Only sync background priority exercises during bulk sync
              const syncPriority = exercise.sync_priority || 'background';
              if (syncPriority === 'immediate') {
                console.log(`[ExercisesAPI] Skipping immediate priority exercise ${exercise.exercise_id} - should already be synced`);
                continue;
              }

              const response = await this.makeAuthenticatedRequest({
                method: 'POST',
                url: `${this.baseUrl}/create`,
                data: exercise
              });

              // Update sync status to synced
              await this.db.execute(
                `UPDATE exercises 
                 SET sync_status = 'synced',
                     sync_priority = NULL,
                     last_synced_at = ?
                 WHERE exercise_id = ?`,
                [new Date().toISOString(), exercise.exercise_id]
              );
            }
          } catch (error) {
            console.error(`[ExercisesAPI] Failed to sync exercise ${exercise.exercise_id}:`, error);
          }
        }
      } catch (error) {
        console.error('[ExercisesAPI] Exercise sync error:', error);
        throw error;
      }
    });
  }

  getTableName() {
    return 'exercises';
  }

  clearExerciseCache(exerciseId) {
    this.cache.clearPattern(`^exercise:${exerciseId}`);
  }

  async storeLocally(exercise, syncStatus = "synced") {
    console.log('[ExercisesAPI] Storing exercise locally:', exercise);
    const result = await this.storage.storeEntity(exercise, {
      table: 'exercises',
      fields: [
        'exercise_id',
        'name',
        'instruction',
        'muscle_group',
        'equipment',
        'media_url',
        'is_public',
        'created_by',
        'created_at',
        'updated_at',
        'sync_priority'
      ],
      syncStatus
    });
    console.log('[ExercisesAPI] Store result:', result);
    return result;
  }

  async getExercises() {
    try {
      await this.ensureInitialized();
      console.log('[ExercisesAPI] Fetching all exercises');
      
      return this.handleOfflineFirst('exercises:all', async () => {
        const exercises = await this.db.query(
          `SELECT * FROM exercises WHERE sync_status NOT IN ('pending_delete') ORDER BY name ASC`
        );
        console.log('[ExercisesAPI] Found', exercises.length, 'exercises in database');
        return exercises.length > 0 ? exercises : null;
      });
    } catch (error) {
      console.error("[ExercisesAPI] Get exercises error:", error);
      throw error;
    }
  }

  async getExerciseById(exerciseId) {
    try {
      await this.ensureInitialized();
      
      return this.handleOfflineFirst(`exercise:${exerciseId}`, async () => {
        const [exercise] = await this.db.query(
          'SELECT * FROM exercises WHERE exercise_id = ? AND sync_status NOT IN ("pending_delete")',
          [exerciseId]
        );
        return exercise || null;
      });
    } catch (error) {
      console.error("[ExercisesAPI] Get exercise by id error:", error);
      // Return a default exercise object instead of throwing
      return {
        exercise_id: exerciseId,
        name: "Error Loading Exercise",
        muscle_group: "",
        equipment: "",
        instruction: "",
        is_public: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  }

  async getExerciseHistory(exerciseId) {
    try {
      await this.ensureInitialized();
      
      return this.handleOfflineFirst(`exercise:${exerciseId}:history`, async () => {
        // Get all workouts containing this exercise with their sets
        const history = await this.db.query(`
          SELECT 
            w.workout_id,
            w.name,
            w.date_performed,
            w.created_at,
            we.workout_exercises_id,
            s.set_id,
            s.weight,
            s.reps,
            s.rir,
            s.set_order
          FROM workouts w
          JOIN workout_exercises we ON w.workout_id = we.workout_id
          LEFT JOIN sets s ON we.workout_exercises_id = s.workout_exercises_id
          WHERE we.exercise_id = ?
            AND w.sync_status != 'pending_delete'
            AND we.sync_status != 'pending_delete'
          ORDER BY 
            COALESCE(w.date_performed, w.created_at) DESC,
            we.exercise_order ASC,
            s.set_order ASC
        `, [exerciseId]);

        // Group sets by workout
        const workoutMap = new Map();
        
        history.forEach(row => {
          if (!workoutMap.has(row.workout_exercises_id)) {
            workoutMap.set(row.workout_exercises_id, {
              workout_exercises_id: row.workout_exercises_id,
              workout_id: row.workout_id,
              name: row.name,
              date_performed: row.date_performed,
              created_at: row.created_at,
              sets: []
            });
          }
          
          if (row.set_id) {
            const workout = workoutMap.get(row.workout_exercises_id);
            workout.sets.push({
              set_id: row.set_id,
              weight: row.weight,
              reps: row.reps,
              rir: row.rir,
              set_order: row.set_order
            });
          }
        });

        return Array.from(workoutMap.values());
      });
    } catch (error) {
      console.error("[ExercisesAPI] Get exercise history error:", error);
      return [];
    }
  }

  async createExercise({ name, equipment, muscle_group, instruction = null }, syncImmediately = false) {
    try {
      console.log('[ExercisesAPI] Starting exercise creation with data:', { name, equipment, muscle_group, instruction, syncImmediately });
      const userId = await this.getUserId();
      const exercise_id = uuid();
      const now = new Date().toISOString();

      const exercise = {
        exercise_id,
        name: name.trim(),
        equipment,
        muscle_group,
        instruction,
        created_by: userId,
        created_at: now,
        updated_at: now
      };

      console.log('[ExercisesAPI] Created exercise object:', exercise);
      
      // Use 'pending_sync' but add a flag to distinguish immediate vs background sync
      const syncStatus = "pending_sync";
      console.log('[ExercisesAPI] Storing exercise locally with sync status:', syncStatus);
      
      // Add a custom field to track sync priority
      exercise.sync_priority = syncImmediately ? 'immediate' : 'background';
      await this.storeLocally(exercise, syncStatus);

      // Only sync immediately if explicitly requested (e.g., when uploading media)
      if (syncImmediately) {
        console.log('[ExercisesAPI] Attempting to sync exercise with server');
        const response = await this.makeAuthenticatedRequest({
          method: 'POST',
          url: `${this.baseUrl}/create`,
          data: exercise
        }).catch(async (error) => {
          console.warn("[ExercisesAPI] Server sync failed, updating to pending_sync for later:", error);
          // If immediate sync fails, mark as pending_sync with background priority for later retry
          await this.db.execute(
            `UPDATE exercises SET sync_status = 'pending_sync', sync_priority = 'background' WHERE exercise_id = ?`,
            [exercise_id]
          );
          return { data: exercise };
        });

        // Only update the sync status and server-provided ID if sync was successful
        if (response.data.exercise_id && response.data.exercise_id !== exercise_id) {
          console.log('[ExercisesAPI] Server sync successful, updating sync status');
          await this.db.execute(
            `UPDATE exercises 
             SET sync_status = 'synced',
                 exercise_id = ?,
                 sync_priority = NULL,
                 last_synced_at = ?
             WHERE exercise_id = ?`,
            [response.data.exercise_id, now, exercise_id]
          );
        } else {
          // Just update sync status if using same ID
          await this.db.execute(
            `UPDATE exercises 
             SET sync_status = 'synced',
                 sync_priority = NULL,
                 last_synced_at = ?
             WHERE exercise_id = ?`,
            [now, exercise_id]
          );
        }
      } else {
        console.log('[ExercisesAPI] Exercise stored locally only, no immediate sync');
      }

      console.log('[ExercisesAPI] Exercise creation complete, clearing cache');
      this.cache.clearPattern('^exercises:');

      return exercise;
    } catch (error) {
      console.error("[ExercisesAPI] Create exercise error:", error);
      throw error;
    }
  }

  async _fetchFromServer() {
    console.log('[ExercisesAPI] Fetching exercises from server');
    const response = await this.makeAuthenticatedRequest({
      method: 'GET',
      url: this.baseUrl
    });
    console.log('[ExercisesAPI] Server fetch complete');
    return response.data;
  }

  async syncExerciseWithMedia(exerciseId) {
    try {
      console.log('[ExercisesAPI] Force syncing exercise with media:', exerciseId);
      
      // Get the exercise from local storage
      const [exercise] = await this.db.query(
        'SELECT * FROM exercises WHERE exercise_id = ?',
        [exerciseId]
      );
      
      if (!exercise) {
        throw new Error(`Exercise ${exerciseId} not found locally`);
      }
      
      console.log('[ExercisesAPI] Exercise sync_status before sync:', exercise.sync_status);
      
      // If it's already synced, no need to sync again
      if (exercise.sync_status === 'synced') {
        console.log('[ExercisesAPI] Exercise already synced, skipping server call');
        return exercise;
      }
      
      // Prepare exercise data for server (remove local-only fields)
      const exerciseForServer = {
        exercise_id: exercise.exercise_id,
        name: exercise.name,
        equipment: exercise.equipment,
        muscle_group: exercise.muscle_group,
        instruction: exercise.instruction,
        created_by: exercise.created_by,
        created_at: exercise.created_at,
        updated_at: exercise.updated_at
      };
      
      console.log('[ExercisesAPI] Making server request to create exercise:', exerciseForServer);
      
      // Sync to server
      const response = await this.makeAuthenticatedRequest({
        method: 'POST',
        url: `${this.baseUrl}/create`,
        data: exerciseForServer
      });
      
      console.log('[ExercisesAPI] Server response:', response.data);
      
      // Update sync status and use server's exercise_id if different
      const now = new Date().toISOString();
      const serverExerciseId = response.data.exercise_id;
      
      if (serverExerciseId && serverExerciseId !== exerciseId) {
        console.log(`[ExercisesAPI] Server assigned new ID: ${serverExerciseId}, updating from ${exerciseId}`);
        await this.db.execute(
          `UPDATE exercises 
           SET exercise_id = ?,
               sync_status = 'synced',
               sync_priority = NULL,
               last_synced_at = ?
           WHERE exercise_id = ?`,
          [serverExerciseId, now, exerciseId]
        );
      } else {
        await this.db.execute(
          `UPDATE exercises 
           SET sync_status = 'synced',
               sync_priority = NULL,
               last_synced_at = ?
           WHERE exercise_id = ?`,
          [now, exerciseId]
        );
      }
      
      console.log('[ExercisesAPI] Exercise synced successfully with server');
      this.cache.clearPattern('^exercises:');
      
      return {
        ...exercise,
        exercise_id: serverExerciseId || exerciseId,
        sync_status: 'synced',
        last_synced_at: now
      };
    } catch (error) {
      console.error('[ExercisesAPI] Failed to sync exercise with media:', error);
      console.error('[ExercisesAPI] Error details:', error.response?.data || error.message);
      // Mark as pending_sync for later retry with background priority
      await this.db.execute(
        `UPDATE exercises SET sync_status = 'pending_sync', sync_priority = 'background' WHERE exercise_id = ?`,
        [exerciseId]
      );
      throw error;
    }
  }

  async getUserId() {
    const token = await storage.getItem("auth_token");
    if (!token) throw new Error("No auth token found");
    return JSON.parse(atob(token.split(".")[1])).sub;
  }
}

export default new ExercisesAPI();
