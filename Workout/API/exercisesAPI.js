import 'react-native-get-random-values';
import getBaseUrl from "./utils/getBaseUrl";
import APIBase from './utils/APIBase';
import { dbManager } from "./local/dbManager";
import { v4 as uuid } from 'uuid';
import { storage } from './local/tokenStorage';
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
    syncManager.registerSyncFunction('exercises', async (isInitialSync = false) => {
      // If this is an initial sync and local table is empty, fetch from server first
      if (isInitialSync) {
        const [localCount] = await this.db.query(
          `SELECT COUNT(*) as count FROM exercises WHERE sync_status != 'pending_delete'`
        );
        
        if (localCount.count === 0) {
          console.log('[ExercisesAPI] Local table empty, fetching initial data from server');
          try {
            await this._fetchFromServer();
            console.log('[ExercisesAPI] Initial data fetch completed');
            return; // Skip the normal sync process since we just fetched everything
          } catch (error) {
            console.error('[ExercisesAPI] Initial data fetch failed:', error);
            // Continue with normal sync process
          }
        }
      }
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

            // Determine if this is a new exercise or an update
            const isUpdate = exercise.last_synced_at && exercise.sync_status === 'pending_sync';
            const method = isUpdate ? 'PUT' : 'POST';
            const url = isUpdate ? `${this.baseUrl}/${exercise.exercise_id}` : `${this.baseUrl}/create`;

            console.log(`[ExercisesAPI] ${isUpdate ? 'Updating' : 'Creating'} exercise ${exercise.exercise_id} via ${method} ${url}`);

            const response = await this.makeAuthenticatedRequest({
              method,
              url,
              data: exercise
            });

            const now = new Date().toISOString();

            if (isUpdate) {
              // For updates, just mark as synced - no ID changes expected
              console.log(`[ExercisesAPI] Exercise ${exercise.exercise_id} updated successfully`);
              
              await this.db.execute(
                `UPDATE exercises 
                 SET sync_status = 'synced',
                     sync_priority = NULL,
                     last_synced_at = ?
                 WHERE exercise_id = ?`,
                [now, exercise.exercise_id]
              );
            } else {
              // For new exercises, server might assign a new ID
              const serverExerciseId = response.data.exercise_id;

              if (serverExerciseId && serverExerciseId !== exercise.exercise_id) {
                //console.log(`[ExercisesAPI] Server assigned new ID: ${serverExerciseId}, updating from ${exercise.exercise_id}`);
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
            }

            //console.log(`[ExercisesAPI] Successfully ${isUpdate ? 'updated' : 'created'} exercise ${exercise.exercise_id}`);
            
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
              //console.log(`[ExercisesAPI] Syncing deletion of exercise ${exercise.exercise_id} (was previously synced)`);
              
              const deleteUrl = `${this.baseUrl}/${exercise.exercise_id}`;
              
              await this.makeAuthenticatedRequest({
                method: 'DELETE',
                url: deleteUrl
              });

              //console.log(`[ExercisesAPI] Successfully deleted exercise ${exercise.exercise_id} from server`);
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
            
            //console.log(`[ExercisesAPI] Successfully deleted exercise ${exercise.exercise_id} from local database`);
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
              
              //console.log(`[ExercisesAPI] Successfully deleted exercise ${exercise.exercise_id} from local database`);
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
    //console.log(`[ExercisesAPI] Clearing cache for exercise ${exerciseId}`);
    //console.log(`[ExercisesAPI] Cache size before clear:`, this.cache.getStats().size);
    this.cache.clearPattern(`^exercise:${exerciseId}`);
    //console.log(`[ExercisesAPI] Cache size after clear:`, this.cache.getStats().size);
    //console.log(`[ExercisesAPI] Cleared cache pattern: ^exercise:${exerciseId}`);
  }

  async storeLocally(exercise, syncStatus = "synced") {
    //console.log('[ExercisesAPI] Storing exercise locally:', exercise);
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
    //console.log('[ExercisesAPI] Store result:', result);
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
        //console.log('[ExercisesAPI] Found', exercises.length, 'exercises in database');
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
      
      //console.log(`[ExercisesAPI] Getting exercise history for ${exerciseId}`);
      //console.log(`[ExercisesAPI] Cache stats:`, this.cache.getStats());
      
      const cacheKey = `exercise:${exerciseId}:history`;
      const cachedData = this.cache.get(cacheKey);
      //console.log(`[ExercisesAPI] Cached data exists:`, !!cachedData);
      
      if (cachedData) {
        //console.log(`[ExercisesAPI] Returning cached data for ${exerciseId}:`, cachedData.length, 'workouts');
        return cachedData;
      }

      //console.log(`[ExercisesAPI] No cache found, querying database for ${exerciseId}`);
    
    // Get all workouts containing this exercise with their sets
    const history = await this.db.query(`
      SELECT 
        w.workout_id,
        w.name,
        w.date_performed,
        w.created_at,
        w.sync_status,
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

      //console.log(`[ExercisesAPI] Found ${history.length} history records for ${exerciseId}`);

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

      const result = Array.from(workoutMap.values());
      //console.log(`[ExercisesAPI] Grouped into ${result.length} workouts for ${exerciseId}`);
      

      // Cache the result
      this.cache.set(cacheKey, result);
      //console.log(`[ExercisesAPI] Cached result for ${exerciseId}`);

      return result;
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

      //console.log('[ExercisesAPI] Creating exercise:', exerciseData);

      // Store locally first
      const stored = await this.storeLocally(exerciseData, 'pending_sync');
      //console.log('[ExercisesAPI] Stored locally, result:', stored);

      // Clear cache to ensure fresh data on next fetch
      this.clearExerciseCache(exerciseId);
      this.cache.clear('exercises:all');

      let finalExerciseId = exerciseId;

      // If syncImmediately is true, try to sync to backend immediately
      if (syncImmediately) {
        try {
          //console.log('[ExercisesAPI] Syncing exercise immediately');
          await this.syncSpecificExercise(exerciseId);
          
          // After sync, get the updated exercise (which may have a new server-assigned ID)
          const [updatedExercise] = await this.db.query(
            'SELECT * FROM exercises WHERE exercise_id = ? OR exercise_id IN (SELECT exercise_id FROM exercises WHERE name = ? AND created_by = ? AND created_at = ?)',
            [exerciseId, exerciseData.name, exerciseData.created_by, exerciseData.created_at]
          );
          
          if (updatedExercise) {
            finalExerciseId = updatedExercise.exercise_id;
            //console.log('[ExercisesAPI] Final exercise ID after sync:', finalExerciseId);
            return updatedExercise;
          }
        } catch (syncError) {
          console.warn('[ExercisesAPI] Immediate sync failed, will sync later:', syncError);
          // Don't throw - exercise is still created locally
        }
      }

      // Return the full exercise object with the correct ID
      return {
        ...exerciseData,
        exercise_id: finalExerciseId,
        sync_status: 'pending_sync',
        version: 1,
        last_synced_at: null
      };
    } catch (error) {
      console.error("[ExercisesAPI] Create exercise error:", error);
      throw error;
    }
  }

  async updateExercise(exerciseId, { name, equipment, muscle_group, instruction = null }, syncImmediately = false) {
    try {
      await this.ensureInitialized();
      
      // Get existing exercise to preserve media_url and other fields
      const [existingExercise] = await this.db.query(
        'SELECT * FROM exercises WHERE exercise_id = ?',
        [exerciseId]
      );

      if (!existingExercise) {
        throw new Error('Exercise not found');
      }
      
      const now = new Date().toISOString();
      const updateData = {
        name: name.trim(),
        equipment,
        muscle_group,
        instruction: instruction?.trim() || null,
        updated_at: now,
        sync_priority: syncImmediately ? 'immediate' : 'background'
      };

      //console.log('[ExercisesAPI] Updating exercise:', exerciseId, updateData);
      //console.log('[ExercisesAPI] Preserving existing media_url:', existingExercise.media_url);

      // Update locally first - preserve existing media_url
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

      if (syncImmediately) {
        try {
            //console.log('[ExercisesAPI] Syncing exercise immediately');
            await this.syncSpecificExercise(exerciseId);
        } catch (syncError) {
            console.warn('[ExercisesAPI] Immediate sync failed, will sync later:', syncError);
        }
      } else {
        //console.log('[ExercisesAPI] Exercise updated locally, will sync in background');
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
      
      //console.log('[ExercisesAPI] Deleting exercise:', exerciseId);

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
          //console.log(`[ExercisesAPI] Exercise ${exerciseId} was never synced, deleting immediately`);
          
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
          //console.log(`[ExercisesAPI] Exercise ${exerciseId} was synced, marking for deletion`);
          
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
        
        //console.log('[ExercisesAPI] Exercise deletion complete, clearing caches');
        this.clearExerciseCache(exerciseId);
        this.cache.clear('exercises:all');

        return { success: true, message: "Exercise deleted successfully" };
      } catch (error) {
        await this.db.execute("ROLLBACK");
        //console.error('[ExercisesAPI] Error deleting exercise:', error);
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
        //console.log('[ExercisesAPI] Exercise not found for sync:', exerciseId);
        return;
      }

      if (exercise.sync_status === 'pending_delete') {
        try {
          // Check if exercise was ever synced to server (has last_synced_at timestamp)
          if (exercise.last_synced_at) {
            //console.log(`[ExercisesAPI] Syncing deletion of exercise ${exerciseId} (was previously synced)`);
            
            const deleteUrl = `${this.baseUrl}/${exerciseId}`;
            //console.log(`[ExercisesAPI] syncSpecific DELETE URL: ${deleteUrl}`);
            //console.log(`[ExercisesAPI] syncSpecific Base URL: ${this.baseUrl}`);
            //console.log(`[ExercisesAPI] syncSpecific Exercise ID: ${exerciseId}`);
            
            // Send delete request to server
            await this.makeAuthenticatedRequest({
              method: 'DELETE',
              url: deleteUrl
            });
            
            //console.log(`[ExercisesAPI] Successfully deleted exercise ${exerciseId} from server`);
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
          // Determine if this is a new exercise or an update
          const isUpdate = exercise.last_synced_at;
          const method = isUpdate ? 'PUT' : 'POST';
          const url = isUpdate ? `${this.baseUrl}/${exerciseId}` : `${this.baseUrl}/create`;

          //console.log(`[ExercisesAPI] ${isUpdate ? 'Updating' : 'Creating'} exercise ${exerciseId} via ${method} ${url}`);

          const response = await this.makeAuthenticatedRequest({
            method,
            url,
            data: exercise
          });

          const now = new Date().toISOString();

          if (isUpdate) {
            // For updates, just mark as synced - no ID changes expected
            //console.log(`[ExercisesAPI] Exercise ${exerciseId} updated successfully`);
            
            await this.db.execute(
              `UPDATE exercises 
               SET sync_status = 'synced', sync_priority = NULL, last_synced_at = ?
               WHERE exercise_id = ?`,
              [now, exerciseId]
            );
          } else {
            // For new exercises, server might assign a new ID
            const serverExerciseId = response.data.exercise_id;

            if (serverExerciseId && serverExerciseId !== exerciseId) {
              //console.log(`[ExercisesAPI] Server assigned new ID: ${serverExerciseId}, updating from ${exerciseId}`);
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
          }
          
          //console.log(`[ExercisesAPI] Successfully ${isUpdate ? 'updated' : 'created'} exercise ${exerciseId}`);
          
          // Clear cache to ensure fresh data with correct IDs
          this.cache.clearPattern('^exercises:');
        } catch (error) {
          //console.error(`[ExercisesAPI] Failed to sync exercise ${exerciseId}:`, error);
          throw error;
        }
      }
    } catch (error) {
      console.error('[ExercisesAPI] Sync specific exercise error:', error);
      throw error;
    }
  }

  async _fetchFromServer() {
    //console.log('[ExercisesAPI] Fetching exercises from server for initial population');
    try {
      const response = await this.makeAuthenticatedRequest({
        method: 'GET',
        url: this.baseUrl
      });
      
      if (response.data && Array.isArray(response.data)) {
        //console.log(`[ExercisesAPI] Retrieved ${response.data.length} exercises from server`);
        
        // Store each exercise locally
        for (const exercise of response.data) {
          try {
            await this.storeLocally(exercise, 'synced');
            //console.log(`[ExercisesAPI] Stored exercise ${exercise.exercise_id} locally`);
            
            // Download exercise media if it exists
            if (exercise.media_url) {
              try {
                const { mediaCache } = await import('./local/MediaCache');
                await mediaCache.downloadExerciseMediaIfNeeded(exercise.exercise_id, exercise.media_url);
                //console.log(`[ExercisesAPI] Downloaded media for exercise ${exercise.exercise_id}`);
              } catch (mediaError) {
                console.warn(`[ExercisesAPI] Failed to download media for exercise ${exercise.exercise_id}:`, mediaError);
                // Don't fail the entire sync for media download issues
              }
            }
          } catch (error) {
            console.error(`[ExercisesAPI] Failed to store exercise ${exercise.exercise_id}:`, error);
          }
        }
        
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('[ExercisesAPI] Failed to fetch exercises from server:', error);
      throw error;
    }
  }

  async syncExerciseWithMedia(exerciseId) {
    try {
      //console.log('[ExercisesAPI] Force syncing exercise with media:', exerciseId);
      
      // Get the exercise from local storage
      const [exercise] = await this.db.query(
        'SELECT * FROM exercises WHERE exercise_id = ?',
        [exerciseId]
      );
      
      if (!exercise) {
        throw new Error(`Exercise ${exerciseId} not found locally`);
      }
      
      //console.log('[ExercisesAPI] Exercise sync_status before sync:', exercise.sync_status);
      
      // If it's already synced, no need to sync again
      if (exercise.sync_status === 'synced') {
        //console.log('[ExercisesAPI] Exercise already synced, skipping server call');
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
      
      // Determine if this is a new exercise or an update
      const isUpdate = exercise.last_synced_at;
      const method = isUpdate ? 'PUT' : 'POST';
      const url = isUpdate ? `${this.baseUrl}/${exerciseId}` : `${this.baseUrl}/create`;
      
      //console.log(`[ExercisesAPI] Making server request to ${isUpdate ? 'update' : 'create'} exercise:`, exerciseForServer);
      
      // Sync to server
      const response = await this.makeAuthenticatedRequest({
        method,
        url,
        data: exerciseForServer
      });
      
      //console.log('[ExercisesAPI] Server response:', response.data);
      
      // Update sync status
      const now = new Date().toISOString();
      
      if (isUpdate) {
        // For updates, just mark as synced - no ID changes expected
        //console.log(`[ExercisesAPI] Exercise ${exerciseId} updated successfully`);
        
        await this.db.execute(
          `UPDATE exercises 
           SET sync_status = 'synced',
               sync_priority = NULL,
               last_synced_at = ?
           WHERE exercise_id = ?`,
          [now, exerciseId]
        );
      } else {
        // For new exercises, server might assign a new ID
        const serverExerciseId = response.data.exercise_id;
        
        if (serverExerciseId && serverExerciseId !== exerciseId) {
          //console.log(`[ExercisesAPI] Server assigned new ID: ${serverExerciseId}, updating from ${exerciseId}`);
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
      }
      
      console.log('[ExercisesAPI] Exercise synced successfully with server');
      this.cache.clearPattern('^exercises:');
      
      return {
        ...exercise,
        exercise_id: isUpdate ? exerciseId : (response.data.exercise_id || exerciseId),
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

  async getExerciseMedia(exerciseId) {
    try {
      const { mediaCache } = await import('./local/MediaCache');
      return await mediaCache.getExerciseMedia(exerciseId);
    } catch (error) {
      console.error(`[ExercisesAPI] Failed to get exercise media for ${exerciseId}:`, error);
      return null;
    }
  }

  async downloadExerciseMedia(exerciseId, mediaUrl) {
    try {
      const { mediaCache } = await import('./local/MediaCache');
      return await mediaCache.downloadExerciseMediaIfNeeded(exerciseId, mediaUrl);
    } catch (error) {
      console.error(`[ExercisesAPI] Failed to download exercise media for ${exerciseId}:`, error);
      return null;
    }
  }
}

export default new ExercisesAPI();
