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
        // Handle exercises pending creation/update
        const pendingExercises = await this.db.query(
          `SELECT * FROM exercises WHERE sync_status = 'pending_sync'`
        );

        for (const exercise of pendingExercises) {
          try {
            // Skip immediate priority exercises that should have been synced already
            // Only sync background priority exercises during bulk sync
            const syncPriority = exercise.sync_priority || 'background';
            if (syncPriority === 'immediate') {
              console.log(`[ExercisesAPI] Skipping immediate priority exercise ${exercise.exercise_id} - should already be synced`);
              continue;
            }

            // Always use POST for pending_sync exercises (like template pattern)
            const response = await this.makeAuthenticatedRequest({
              method: 'POST',
              url: `${this.baseUrl}/create`,
              data: exercise
            });

            // Get server's exercise_id from response
            const serverExerciseId = response.data.exercise_id;
            const now = new Date().toISOString();

            if (serverExerciseId && serverExerciseId !== exercise.exercise_id) {
              console.log(`[ExercisesAPI] Server assigned new ID: ${serverExerciseId}, updating from ${exercise.exercise_id}`);
              // Update local database with server's ID
              await this.db.execute(
                `UPDATE exercises 
                 SET exercise_id = ?, sync_status = 'synced', sync_priority = NULL, last_synced_at = ?
                 WHERE exercise_id = ?`,
                [serverExerciseId, now, exercise.exercise_id]
              );
              
              // Also update any related records that might reference this exercise
              await this.db.execute(
                `UPDATE workout_exercises 
                 SET exercise_id = ?
                 WHERE exercise_id = ?`,
                [serverExerciseId, exercise.exercise_id]
              );
              
              await this.db.execute(
                `UPDATE template_exercises 
                 SET exercise_id = ?
                 WHERE exercise_id = ?`,
                [serverExerciseId, exercise.exercise_id]
              );
            } else {
              // Update sync status using existing ID
              await this.db.execute(
                `UPDATE exercises 
                 SET sync_status = 'synced',
                     sync_priority = NULL,
                     last_synced_at = ?
                 WHERE exercise_id = ?`,
                [now, exercise.exercise_id]
              );
            }

            console.log(`[ExercisesAPI] Successfully synced exercise ${exercise.exercise_id} -> ${serverExerciseId || exercise.exercise_id}`);
            
            // Clear cache to ensure fresh data with correct IDs
            this.cache.clearPattern('^exercises:');
          } catch (error) {
            console.error(`[ExercisesAPI] Failed to sync exercise ${exercise.exercise_id}:`, error);
          }
        }

        // Handle exercises pending deletion (following templateAPI pattern)
        const exercisesForDeletion = await this.db.query(
          `SELECT * FROM exercises WHERE sync_status = 'pending_delete'`
        );

        for (const exercise of exercisesForDeletion) {
          try {
            // Check if exercise was ever synced to server (has last_synced_at timestamp)
            if (exercise.last_synced_at) {
              console.log(`[ExercisesAPI] Syncing deletion of exercise ${exercise.exercise_id} (was previously synced)`);
              
              const deleteUrl = `${this.baseUrl}/${exercise.exercise_id}`;
              
              await this.makeAuthenticatedRequest({
                method: 'DELETE',
                url: deleteUrl
              });

              console.log(`[ExercisesAPI] Successfully deleted exercise ${exercise.exercise_id} from server`);
            } else {
              console.log(`[ExercisesAPI] Exercise ${exercise.exercise_id} was never synced to server, skipping server deletion`);
            }

            // Delete from local database regardless of server deletion
            await this.db.execute("BEGIN TRANSACTION");
            
            await this.db.execute(
              'DELETE FROM exercises WHERE exercise_id = ?',
              [exercise.exercise_id]
            );

            await this.db.execute("COMMIT");
            
            console.log(`[ExercisesAPI] Successfully deleted exercise ${exercise.exercise_id} from local database`);
          } catch (error) {
            if (error.response && error.response.status === 404) {
              // Exercise doesn't exist on server, just delete locally
              console.log(`[ExercisesAPI] Exercise ${exercise.exercise_id} not found on server (404) - deleting locally`);
              
              await this.db.execute("BEGIN TRANSACTION");
              
              await this.db.execute(
                'DELETE FROM exercises WHERE exercise_id = ?',
                [exercise.exercise_id]
              );

              await this.db.execute("COMMIT");
              
              console.log(`[ExercisesAPI] Successfully deleted exercise ${exercise.exercise_id} from local database`);
            } else {
              console.error(`[ExercisesAPI] Failed to delete exercise ${exercise.exercise_id} from server:`, error);
              // Leave it marked as pending_delete to retry next sync
            }
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
      await this.ensureInitialized();
      
      const exerciseId = uuid();
      const userId = await this.getUserId();
      const now = new Date().toISOString();

      const exerciseData = {
        exercise_id: exerciseId,
        name: name.trim(),
        equipment,
        muscle_group,
        instruction: instruction?.trim() || null,
        is_public: 0,
        created_by: userId,
        created_at: now,
        updated_at: now,
        sync_priority: syncImmediately ? 'immediate' : 'background'
      };

      console.log('[ExercisesAPI] Creating exercise:', exerciseData);

      // Store locally first
      const stored = await this.storeLocally(exerciseData, 'pending_sync');
      console.log('[ExercisesAPI] Stored locally, result:', stored);

      // Clear cache to ensure fresh data on next fetch
      this.clearExerciseCache(exerciseId);
      this.cache.clear('exercises:all');

      // If syncImmediately is true, try to sync to backend immediately
      if (syncImmediately) {
        try {
          console.log('[ExercisesAPI] Syncing exercise immediately');
          await this.syncSpecificExercise(exerciseId);
        } catch (syncError) {
          console.warn('[ExercisesAPI] Immediate sync failed, will sync later:', syncError);
          // Don't throw - exercise is still created locally
        }
      }

      return stored;
    } catch (error) {
      console.error("[ExercisesAPI] Create exercise error:", error);
      throw error;
    }
  }

  async updateExercise(exerciseId, { name, equipment, muscle_group, instruction = null }) {
    try {
      await this.ensureInitialized();
      
      const now = new Date().toISOString();
      const updateData = {
        name: name.trim(),
        equipment,
        muscle_group,
        instruction: instruction?.trim() || null,
        updated_at: now,
        sync_priority: 'immediate'
      };

      console.log('[ExercisesAPI] Updating exercise:', exerciseId, updateData);

      // Update locally first
      await this.db.execute(
        `UPDATE exercises 
         SET name = ?, equipment = ?, muscle_group = ?, instruction = ?, 
             updated_at = ?, sync_status = 'pending_sync', sync_priority = ?
         WHERE exercise_id = ?`,
        [
          updateData.name,
          updateData.equipment,
          updateData.muscle_group,
          updateData.instruction,
          updateData.updated_at,
          updateData.sync_priority,
          exerciseId
        ]
      );

      // Clear cache
      this.clearExerciseCache(exerciseId);
      this.cache.clear('exercises:all');

      // Try to sync immediately
      try {
        await this.syncSpecificExercise(exerciseId);
      } catch (syncError) {
        console.warn('[ExercisesAPI] Immediate sync failed, will sync later:', syncError);
      }

      // Return updated exercise
      return await this.getExerciseById(exerciseId);
    } catch (error) {
      console.error("[ExercisesAPI] Update exercise error:", error);
      throw error;
    }
  }

  async deleteExercise(exerciseId) {
    try {
      await this.ensureInitialized();
      
      console.log('[ExercisesAPI] Deleting exercise:', exerciseId);

      // Check if exercise exists and is not already marked for deletion
      const [existingExercise] = await this.db.query(
        `SELECT * FROM exercises WHERE exercise_id = ? AND sync_status != 'pending_delete'`,
        [exerciseId]
      );
      
      if (!existingExercise) {
        throw new Error("Exercise not found");
      }

      try {
        await this.db.execute("BEGIN TRANSACTION");
        
        // If exercise was never synced to server (pending_sync or no last_synced_at), delete immediately
        if (existingExercise.sync_status === 'pending_sync' || !existingExercise.last_synced_at) {
          console.log(`[ExercisesAPI] Exercise ${exerciseId} was never synced, deleting immediately`);
          
          // Delete related workout_exercises
          await this.db.execute(
            `DELETE FROM workout_exercises WHERE exercise_id = ?`,
            [exerciseId]
          );

          // Delete related template_exercises
          await this.db.execute(
            `DELETE FROM template_exercises WHERE exercise_id = ?`,
            [exerciseId]
          );

          // Delete exercise
          await this.db.execute(
            `DELETE FROM exercises WHERE exercise_id = ?`,
            [exerciseId]
          );
        } else {
          // Exercise was synced to server, mark for deletion to be handled by sync
          console.log(`[ExercisesAPI] Exercise ${exerciseId} was synced, marking for deletion`);
          
          await this.db.execute(
            `UPDATE exercises 
             SET sync_status = 'pending_delete',
                 updated_at = ?
             WHERE exercise_id = ?`,
            [new Date().toISOString(), exerciseId]
          );

          // Also mark related workout_exercises as pending deletion
          await this.db.execute(
            `UPDATE workout_exercises 
             SET sync_status = 'pending_delete',
                 updated_at = ?
             WHERE exercise_id = ?`,
            [new Date().toISOString(), exerciseId]
          );

          // Also mark related template_exercises as pending deletion
          await this.db.execute(
            `UPDATE template_exercises 
             SET sync_status = 'pending_delete',
                 updated_at = ?
             WHERE exercise_id = ?`,
            [new Date().toISOString(), exerciseId]
          );
        }

        await this.db.execute("COMMIT");
        
        console.log('[ExercisesAPI] Exercise deletion complete, clearing caches');
        this.clearExerciseCache(exerciseId);
        this.cache.clear('exercises:all');

        return { success: true, message: "Exercise deleted successfully" };
      } catch (error) {
        await this.db.execute("ROLLBACK");
        console.error('[ExercisesAPI] Error deleting exercise:', error);
        throw error;
      }
    } catch (error) {
      console.error("[ExercisesAPI] Delete exercise error:", error);
      throw error;
    }
  }

  async syncSpecificExercise(exerciseId) {
    try {
      const [exercise] = await this.db.query(
        'SELECT * FROM exercises WHERE exercise_id = ?',
        [exerciseId]
      );

      if (!exercise) {
        console.log('[ExercisesAPI] Exercise not found for sync:', exerciseId);
        return;
      }

      if (exercise.sync_status === 'pending_delete') {
        try {
          // Check if exercise was ever synced to server (has last_synced_at timestamp)
          if (exercise.last_synced_at) {
            console.log(`[ExercisesAPI] Syncing deletion of exercise ${exerciseId} (was previously synced)`);
            
            const deleteUrl = `${this.baseUrl}/${exerciseId}`;
            console.log(`[ExercisesAPI] syncSpecific DELETE URL: ${deleteUrl}`);
            console.log(`[ExercisesAPI] syncSpecific Base URL: ${this.baseUrl}`);
            console.log(`[ExercisesAPI] syncSpecific Exercise ID: ${exerciseId}`);
            
            // Send delete request to server
            await this.makeAuthenticatedRequest({
              method: 'DELETE',
              url: deleteUrl
            });
            
            console.log(`[ExercisesAPI] Successfully deleted exercise ${exerciseId} from server`);
          } else {
            console.log(`[ExercisesAPI] Exercise ${exerciseId} was never synced to server, skipping server deletion`);
          }

          // Delete from local database regardless of server deletion
          await this.db.execute("BEGIN TRANSACTION");
          
          await this.db.execute(
            'DELETE FROM exercises WHERE exercise_id = ?',
            [exerciseId]
          );
          
          await this.db.execute("COMMIT");
          console.log(`[ExercisesAPI] Successfully deleted exercise ${exerciseId} from local database`);
        } catch (error) {
          if (error.response && error.response.status === 404) {
            // Exercise doesn't exist on server, just delete locally
            console.log(`[ExercisesAPI] Exercise ${exerciseId} not found on server (404) - deleting locally`);
            
            await this.db.execute("BEGIN TRANSACTION");
            
            await this.db.execute(
              'DELETE FROM exercises WHERE exercise_id = ?',
              [exerciseId]
            );

            await this.db.execute("COMMIT");
          } else {
            await this.db.execute("ROLLBACK");
            console.error(`[ExercisesAPI] Failed to delete exercise ${exerciseId}:`, error);
            throw error;
          }
        }
      } else if (exercise.sync_status === 'pending_sync') {
        try {
          // Always use POST for pending_sync exercises (like template pattern)
          const response = await this.makeAuthenticatedRequest({
            method: 'POST',
            url: `${this.baseUrl}/create`,
            data: exercise
          });

          // Get server's exercise_id from response
          const serverExerciseId = response.data.exercise_id;
          const now = new Date().toISOString();

          if (serverExerciseId && serverExerciseId !== exerciseId) {
            console.log(`[ExercisesAPI] Server assigned new ID: ${serverExerciseId}, updating from ${exerciseId}`);
            // Update local database with server's ID
            await this.db.execute(
              `UPDATE exercises 
               SET exercise_id = ?, sync_status = 'synced', sync_priority = NULL, last_synced_at = ?
               WHERE exercise_id = ?`,
              [serverExerciseId, now, exerciseId]
            );
            
            // Also update any related records that might reference this exercise
            await this.db.execute(
              `UPDATE workout_exercises 
               SET exercise_id = ?
               WHERE exercise_id = ?`,
              [serverExerciseId, exerciseId]
            );
            
            await this.db.execute(
              `UPDATE template_exercises 
               SET exercise_id = ?
               WHERE exercise_id = ?`,
              [serverExerciseId, exerciseId]
            );
          } else {
            // Update sync status using existing ID
            await this.db.execute(
              `UPDATE exercises 
               SET sync_status = 'synced', sync_priority = NULL, last_synced_at = ?
               WHERE exercise_id = ?`,
              [now, exerciseId]
            );
          }
          
          console.log(`[ExercisesAPI] Successfully synced exercise ${exerciseId} -> ${serverExerciseId || exerciseId}`);
          
          // Clear cache to ensure fresh data with correct IDs
          this.cache.clearPattern('^exercises:');
        } catch (error) {
          console.error(`[ExercisesAPI] Failed to sync exercise ${exerciseId}:`, error);
          throw error;
        }
      }
    } catch (error) {
      console.error('[ExercisesAPI] Sync specific exercise error:', error);
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
