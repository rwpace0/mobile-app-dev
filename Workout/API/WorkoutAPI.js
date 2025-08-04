import "react-native-get-random-values";
import getBaseUrl from "./utils/getBaseUrl";
import APIBase from './utils/APIBase';
import { dbManager } from "./local/dbManager";
import { workoutCache } from "./local/WorkoutCache";
import { backgroundProcessor } from "./local/BackgroundProcessor";
import { v4 as uuid } from "uuid";
import { storage } from "./local/tokenStorage";
import { tokenManager } from "./utils/tokenManager";
import { syncManager } from "./local/syncManager";
import exercisesAPI from "./exercisesAPI";

class WorkoutAPI extends APIBase {
  constructor() {
    super(`${getBaseUrl()}/workouts`, dbManager, {
      minDelay: 3000,
      maxRetries: 2,
      cacheConfig: {
        maxSize: 2000,
        ttl: 10 * 60 * 1000 // 10 minutes
      }
    });
    this.workoutCache = workoutCache; // Keep the specialized workout cache
    this.backgroundProcessor = backgroundProcessor;

    // Register sync function with sync manager
    syncManager.registerSyncFunction('workouts', async (isInitialSync = false) => {
      // If this is an initial sync and local table is empty, fetch from server first
      if (isInitialSync) {
        const [localCount] = await this.db.query(
          `SELECT COUNT(*) as count FROM workouts WHERE sync_status != 'pending_delete'`
        );
        
        if (localCount.count === 0) {
          console.log('[WorkoutAPI] Local table empty, fetching initial data from server');
          try {
            await this._fetchFromServer();
            console.log('[WorkoutAPI] Initial data fetch completed');
            return; // Skip the normal sync process since we just fetched everything
          } catch (error) {
            console.error('[WorkoutAPI] Initial data fetch failed:', error);
            // Continue with normal sync process
          }
        }
      }
      try {
        const pendingWorkouts = await this.db.query(
          `SELECT * FROM workouts WHERE sync_status IN ('pending_sync', 'pending_delete')`
        );

        for (const workout of pendingWorkouts) {
          try {
            if (workout.sync_status === 'pending_delete') {
              await this.makeAuthenticatedRequest({
                method: 'DELETE',
                url: `${this.baseUrl}/${workout.workout_id}`
              });
              continue;
            }

            // Get workout exercises and sets
            const exercises = await this.db.query(
              `SELECT we.*, s.*
               FROM workout_exercises we
               LEFT JOIN sets s ON we.workout_exercises_id = s.workout_exercises_id
               WHERE we.workout_id = ?`,
              [workout.workout_id]
            );

            // Group sets by exercise
            const exercisesWithSets = exercises.reduce((acc, row) => {
              const exerciseId = row.workout_exercises_id;
              if (!acc[exerciseId]) {
                acc[exerciseId] = {
                  workout_exercises_id: row.workout_exercises_id,
                  exercise_id: row.exercise_id,
                  exercise_order: row.exercise_order,
                  notes: row.notes,
                  sets: []
                };
              }
              if (row.set_id) {
                acc[exerciseId].sets.push({
                  set_id: row.set_id,
                  weight: row.weight,
                  reps: row.reps,
                  rir: row.rir,
                  set_order: row.set_order
                });
              }
              return acc;
            }, {});

            // Use upsert to handle both creation and updates in one call
            const response = await this.makeAuthenticatedRequest({
              method: 'POST',
              url: `${this.baseUrl}/upsert`,
              data: {
                workout_id: workout.workout_id,
                name: workout.name,
                date_performed: workout.date_performed,
                duration: workout.duration,
                exercises: Object.values(exercisesWithSets)
              }
            });

            console.log(`[WorkoutAPI] Workout ${workout.workout_id} upserted successfully`);

            // Clear exercise history caches for all exercises in this synced workout
            // This ensures future queries get fresh data including this workout
            const uniqueExerciseIds = new Set();
            Object.values(exercisesWithSets).forEach(exercise => {
              if (exercise.exercise_id) {
                uniqueExerciseIds.add(exercise.exercise_id);
              }
            });
            
            uniqueExerciseIds.forEach(exerciseId => {
              // Clear cache from exercisesAPI where the exercise history is actually cached
              exercisesAPI.clearExerciseCache(exerciseId);
              console.log(`[WorkoutAPI] Cleared exercise cache for ${exerciseId} after sync`);
            });

            // Update sync status to synced
            const now = new Date().toISOString();
            await this.db.execute(
              `UPDATE workouts 
               SET sync_status = 'synced',
                   last_synced_at = ?
               WHERE workout_id = ?`,
              [now, workout.workout_id]
            );

            // Update exercises sync status
            await this.db.execute(
              `UPDATE workout_exercises 
               SET sync_status = 'synced',
                   last_synced_at = ?
               WHERE workout_id = ?`,
              [now, workout.workout_id]
            );

            // Update sets sync status
            await this.db.execute(
              `UPDATE sets 
               SET sync_status = 'synced',
                   last_synced_at = ?
               WHERE workout_id = ?`,
              [now, workout.workout_id]
            );
          } catch (error) {
            console.error(`[WorkoutAPI] Failed to sync workout ${workout.workout_id}:`, error);
          }
        }
      } catch (error) {
        console.error('[WorkoutAPI] Workout sync error:', error);
        throw error;
      }
    });
  }

  getTableName() {
    return 'workouts';
  }

  async storeLocally(workout, syncStatus = "synced") {
    if (!workout || typeof workout !== 'object') {
      throw new Error("[WorkoutAPI] Invalid workout data: workout must be an object");
    }

    if (!Array.isArray(workout.exercises)) {
      console.warn("[WorkoutAPI] Workout has no exercises array, initializing empty array");
      workout.exercises = [];
    }

    // Validate and prepare exercises data
    workout.exercises = workout.exercises.map((exercise, index) => {
      if (!exercise.exercise_id) {
        throw new Error("[WorkoutAPI] Invalid exercise data: exercise_id is required");
      }

      return {
        ...exercise,
        exercise_order: exercise.exercise_order || index + 1,
        notes: exercise.notes || "",
        sets: (exercise.sets || []).map((set, setIndex) => ({
          weight: Number(set.weight) || 0,
          reps: Number(set.reps) || 0,
          rir: set.rir != null ? Number(set.rir) : null,
          set_order: set.set_order || setIndex + 1
        }))
      };
    });

    try {
      await this.db.execute("BEGIN TRANSACTION");
      console.log("[WorkoutAPI] Storing workout with exercises:", JSON.stringify(workout.exercises));
      
      // First store the workout
      // First store the workout
      await this.db.execute(
        `INSERT OR REPLACE INTO workouts 
        (workout_id, user_id, name, date_performed, duration, template_id, created_at, updated_at, sync_status, version, last_synced_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [
          workout.workout_id,
          workout.user_id,
          workout.name,
          workout.date_performed,
          workout.duration,
          workout.template_id,
          workout.created_at,
          workout.updated_at,
          syncStatus,
          1, // version
          null // last_synced_at
        ]
      );

      // Then store each exercise and its sets
      for (const exercise of workout.exercises) {
        // Store exercise
        const workoutExerciseId = uuid();
        await this.db.execute(
          `INSERT OR REPLACE INTO workout_exercises 
          (workout_exercises_id, workout_id, exercise_order, created_at, updated_at, sync_status, version, last_synced_at, exercise_id, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            workoutExerciseId,
            workout.workout_id,
            exercise.exercise_order,
            workout.created_at,
            workout.updated_at,
            syncStatus,
            1,
            new Date().toISOString(),
            exercise.exercise_id,
            exercise.notes
          ]
        );

        // Store sets for this exercise
        for (const set of exercise.sets) {
          await this.db.execute(
            `INSERT OR REPLACE INTO sets 
            (set_id, workout_id, workout_exercises_id, set_order, weight, reps, rir, created_at, updated_at, sync_status, version, last_synced_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              uuid(),
              workout.workout_id,
              workoutExerciseId,
              set.set_order,
              set.weight,
              set.reps,
              set.rir,
              workout.created_at,
              workout.updated_at,
              syncStatus,
              1,
              new Date().toISOString()
            ]
          );
        }
      }

      await this.db.execute("COMMIT");
      return workout;
    } catch (error) {
      console.error("[WorkoutAPI] Store locally error:", error);
      await this.db.execute("ROLLBACK").catch(() => {
        // Ignore rollback errors as the transaction might not be active
        console.log("[WorkoutAPI] Rollback failed - transaction might not be active");
      });
      throw error;
    }
  }

  async getWorkoutsCursor(params = {}) {
    try {
      await this.ensureInitialized();
      const {
        cursor = null,
        limit = 20,
        dateFrom,
        dateTo,
        searchTerm,
      } = params;

      console.log('[WorkoutAPI] Fetching workouts cursor:', { cursor, limit, dateFrom, dateTo, searchTerm });

      const cacheKey = this.workoutCache.generateListCacheKey(params);
      const cachedResult = this.workoutCache.getWorkoutList(cacheKey);
      if (cachedResult) {
        console.log('[WorkoutAPI] Returning cached workout list');
        return cachedResult;
      }

      // Build query
      let workoutQuery = `
        SELECT w.workout_id
        FROM workouts w
        WHERE w.sync_status != 'pending_delete'
      `;
      const queryParams = [];

      if (cursor) {
        workoutQuery += ` AND w.date_performed < ?`;
        queryParams.push(cursor);
      }

      if (dateFrom) {
        workoutQuery += ` AND w.date_performed >= ?`;
        queryParams.push(dateFrom);
      }

      if (dateTo) {
        workoutQuery += ` AND w.date_performed <= ?`;
        queryParams.push(dateTo);
      }

      if (searchTerm) {
        workoutQuery += ` AND (w.name LIKE ? OR EXISTS (
          SELECT 1 FROM workout_exercises we
          JOIN exercises e ON we.exercise_id = e.exercise_id
          WHERE we.workout_id = w.workout_id AND e.name LIKE ?
        ))`;
        const searchPattern = `%${searchTerm}%`;
        queryParams.push(searchPattern, searchPattern);
      }

      workoutQuery += ` ORDER BY w.date_performed DESC LIMIT ?`;
      queryParams.push(limit + 1);

      const workoutIds = await this.db.query(workoutQuery, queryParams);
      const hasMore = workoutIds.length > limit;
      const resultsIds = workoutIds.slice(0, limit).map(w => w.workout_id);

      if (resultsIds.length === 0) {
        const emptyResponse = { workouts: [], hasMore: false, nextCursor: null, totalLoaded: 0 };
        this.workoutCache.setWorkoutList(cacheKey, emptyResponse);
        return emptyResponse;
      }

      // Get full workout data with improved error handling and logging
      const workouts = await Promise.all(
        resultsIds.map(async workoutId => {
          try {
            // First check the cache
            let workout = this.workoutCache.getWorkoutDetails(workoutId);
            
            if (!workout) {
              // If not in cache, load from database
              workout = await this._getWorkoutWithDetails(workoutId);
              if (workout) {
                // Cache the workout details
                this.workoutCache.setWorkoutDetails(workoutId, workout);
              } else {
                console.warn(`[WorkoutAPI] Failed to load details for workout ${workoutId}`);
              }
            }
            
            return workout;
          } catch (error) {
            console.error(`[WorkoutAPI] Error loading workout ${workoutId}:`, error);
            return null;
          }
        })
      );

      const results = workouts.filter(Boolean);
      const nextCursor = hasMore && results.length > 0
        ? results[results.length - 1].date_performed
        : null;

      

      const response = {
        workouts: results,
        hasMore,
        nextCursor,
        totalLoaded: results.length
      };

      // Cache the response with workout details
      this.workoutCache.setWorkoutList(cacheKey, response);
      

      // Trigger background prefetch for next page if there are more results
      if (hasMore && this.backgroundProcessor) {
        const nextPageWorkoutIds = workoutIds.slice(limit).map(w => w.workout_id);
        this.backgroundProcessor.prefetchWorkoutDetails(nextPageWorkoutIds, this);
      }

      return response;
    } catch (error) {
      console.error("[WorkoutAPI] Get workouts cursor error:", error);
      throw error;
    }
  }

  async getWorkoutById(workoutId) {
    try {
      await this.ensureInitialized();

      return this.handleOfflineFirst(`workout:${workoutId}`, async () => {
        return await this._getWorkoutWithDetails(workoutId);
      });
    } catch (error) {
      console.error("Get workout by id error:", error);
      throw error;
    }
  }

  async getLastWorkoutForTemplate(templateId) {
    try {
      await this.ensureInitialized();
      
      // Find workouts created from this specific template only
      const workoutIds = await this.db.query(`
        SELECT workout_id, date_performed
        FROM workouts
        WHERE template_id = ? 
          AND sync_status != 'pending_delete'
        ORDER BY date_performed DESC
        LIMIT 1
      `, [templateId]);
      
      if (workoutIds.length === 0) {
        return null;
      }
      
      // Get the full workout details
      return this._getWorkoutWithDetails(workoutIds[0].workout_id);
    } catch (error) {
      console.error("[WorkoutAPI] Get last workout for template error:", error);
      return null;
    }
  }

  async _getWorkoutWithDetails(workoutId) {
    
    // First get the basic workout data without joins
    const [basicWorkout] = await this.db.query(
      `SELECT * FROM workouts WHERE workout_id = ? AND sync_status != 'pending_delete'`,
      [workoutId]
    );

    if (!basicWorkout) {
      console.warn(`[WorkoutAPI] No workout found for ID ${workoutId}`);
      return null;
    }

    // Initialize the workout object with basic data
    const workout = {
      workout_id: basicWorkout.workout_id,
      user_id: basicWorkout.user_id,
      name: basicWorkout.name,
      date_performed: basicWorkout.date_performed,
      duration: basicWorkout.duration,
      created_at: basicWorkout.created_at,
      updated_at: basicWorkout.updated_at,
      exercises: [],
      totalVolume: 0
    };

    // Get the workout summary if it exists
    const [summaryData] = await this.db.query(
      `SELECT * FROM workout_summaries WHERE workout_id = ?`,
      [workoutId]
    );

    if (summaryData) {
      try {
        const parsedSummary = JSON.parse(summaryData.summary_data);
        workout.totalVolume = summaryData.total_volume || 0;
        workout.exerciseCount = summaryData.exercise_count || 0;
        workout.summary = parsedSummary;
      } catch (error) {
        console.error(`[WorkoutAPI] Error parsing summary data for workout ${workoutId}:`, error);
      }
    }

    // Get workout exercises data
    const workoutExercises = await this.db.query(
      `
      SELECT 
        we.*,
        e.exercise_id,
        e.name as exercise_name,
        e.muscle_group
      FROM workout_exercises we
      LEFT JOIN exercises e ON we.exercise_id = e.exercise_id
      WHERE we.workout_id = ?
      ORDER BY we.exercise_order
      `,
      [workoutId]
    );

    if (workoutExercises.length > 0) {
      // Get all sets for this workout's exercises in a single query
      const sets = await this.db.query(
        `
        SELECT * FROM sets 
        WHERE workout_id = ?
        ORDER BY workout_exercises_id, set_order
        `,
        [workoutId]
      );

      const exercisesMap = new Map();
      let totalVolume = 0;

      // Process exercises and their sets
      workoutExercises.forEach((exercise) => {
        const exerciseObj = {
          workout_exercises_id: exercise.workout_exercises_id,
          exercise_id: exercise.exercise_id,
          name: exercise.exercise_name,
          muscle_group: exercise.muscle_group,
          exercise_order: exercise.exercise_order,
          notes: exercise.notes,
          sets: []
        };

        // Add sets for this exercise
        const exerciseSets = sets.filter(set => 
          set.workout_exercises_id === exercise.workout_exercises_id
        );

        exerciseSets.forEach(set => {
          const weight = Number(set.weight) || 0;
          const reps = Number(set.reps) || 0;
          exerciseObj.sets.push({
            set_id: set.set_id,
            weight,
            reps,
            rir: set.rir,
            set_order: set.set_order
          });
          totalVolume += weight * reps;
        });

        workout.exercises.push(exerciseObj);
      });

      // Sort exercises by order
      workout.exercises.sort((a, b) => a.exercise_order - b.exercise_order);

      // Update total volume if not set from summary
      if (!workout.totalVolume) {
        workout.totalVolume = totalVolume;
      }
    }

    // If we don't have a summary, calculate it
    if (!summaryData && workout.exercises.length > 0) {
      console.log(`[WorkoutAPI] No summary data found for workout ${workoutId}, calculating...`);
      try {
        const summary = await this.calculateAndStoreSummary(workout);
        if (summary) {
          workout.summary = summary;
          workout.totalVolume = summary.totalVolume;
          workout.exerciseCount = summary.exerciseCount;
        }
      } catch (error) {
        console.error(`[WorkoutAPI] Error calculating summary for workout ${workoutId}:`, error);
      }
    }

    
    return workout;
  }

  async finishWorkout(workoutData) {
    try {
      
      const userId = await this.getUserId();
      const workoutId = uuid();
      const now = new Date().toISOString();

      if (!workoutData.date_performed) {
        throw new Error("date_performed is required for workout");
      }

      const workout = {
        workout_id: workoutId,
        user_id: userId,
        name: workoutData.name,
        date_performed: workoutData.date_performed,
        duration: workoutData.duration || 0,
        template_id: workoutData.templateId || null, // Store template ID if workout was created from template
        exercises: workoutData.exercises || [],
        created_at: now,
        updated_at: now
      };

      try {
        
        await this.storeLocally(workout, "pending_sync");
        await this.calculateAndStoreSummary(workout);
        
        console.log('[WorkoutAPI] Local workout storage successful, clearing caches');
        this.cache.clearPattern('^workouts:');
        this.workoutCache.clearAll();

        // Clear exercise history caches for all exercises in this workout
        // This ensures previous performance data includes the just-finished workout
        workout.exercises.forEach(exercise => {
          if (exercise.exercise_id) {
            // Clear cache from exercisesAPI where the exercise history is actually cached
            exercisesAPI.clearExerciseCache(exercise.exercise_id);
            console.log(`[WorkoutAPI] Cleared exercise cache for ${exercise.exercise_id}`);
          }
        });

        // Return the locally stored workout - sync will happen in background
        return workout;
      } catch (error) {
        console.error('[WorkoutAPI] Error during workout finish:', error);
        throw error;
      }
    } catch (error) {
      console.error("[WorkoutAPI] Finish workout error:", error);
      throw error;
    }
  }

  async updateWorkout(workoutId, workoutData) {
    try {
      console.log(`[WorkoutAPI] Updating workout ${workoutId}`);
      
      const userId = await this.getUserId();
      const now = new Date().toISOString();

      if (!workoutData.date_performed) {
        throw new Error("date_performed is required for workout");
      }

      // Get the existing workout to preserve created_at
      const existingWorkout = await this.getWorkoutById(workoutId);
      if (!existingWorkout) {
        throw new Error("Workout not found");
      }

      const updatedWorkout = {
        workout_id: workoutId,
        user_id: userId,
        name: workoutData.name,
        date_performed: workoutData.date_performed,
        duration: workoutData.duration || 0,
        exercises: workoutData.exercises || [],
        created_at: existingWorkout.created_at,
        updated_at: now
      };

      try {
        // Use a single transaction for the entire update operation
        await this.db.execute("BEGIN TRANSACTION");
        
        // Delete existing exercises and sets for this workout
        await this.db.execute(
          `DELETE FROM sets WHERE workout_id = ?`,
          [workoutId]
        );
        
        await this.db.execute(
          `DELETE FROM workout_exercises WHERE workout_id = ?`,
          [workoutId]
        );

        // Update the workout record directly instead of using storeLocally
        await this.db.execute(
          `UPDATE workouts 
           SET name = ?, date_performed = ?, duration = ?, updated_at = ?, sync_status = ?
           WHERE workout_id = ?`,
          [
            updatedWorkout.name,
            updatedWorkout.date_performed,
            updatedWorkout.duration,
            updatedWorkout.updated_at,
            "pending_sync",
            workoutId
          ]
        );

        // Store each exercise and its sets
        for (const exercise of updatedWorkout.exercises) {
          // Store exercise
          const workoutExerciseId = uuid();
          await this.db.execute(
            `INSERT INTO workout_exercises 
            (workout_exercises_id, workout_id, exercise_order, created_at, updated_at, sync_status, version, last_synced_at, exercise_id, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              workoutExerciseId,
              workoutId,
              exercise.exercise_order,
              updatedWorkout.created_at,
              updatedWorkout.updated_at,
              "pending_sync",
              1,
              new Date().toISOString(),
              exercise.exercise_id,
              exercise.notes
            ]
          );

          // Store sets for this exercise
          for (const set of exercise.sets) {
            await this.db.execute(
              `INSERT INTO sets 
              (set_id, workout_id, workout_exercises_id, set_order, weight, reps, rir, created_at, updated_at, sync_status, version, last_synced_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                uuid(),
                workoutId,
                workoutExerciseId,
                set.set_order,
                set.weight,
                set.reps,
                set.rir,
                updatedWorkout.created_at,
                updatedWorkout.updated_at,
                "pending_sync",
                1,
                new Date().toISOString()
              ]
            );
          }
        }

        await this.db.execute("COMMIT");

        // Calculate and store summary after transaction
        await this.calculateAndStoreSummary(updatedWorkout);
        
        console.log('[WorkoutAPI] Local workout update successful, clearing caches');
        this.cache.clearPattern('^workouts:');
        this.workoutCache.clearAll();

        // Clear exercise history caches for all exercises in this workout
        // This ensures previous performance data includes the updated workout
        updatedWorkout.exercises.forEach(exercise => {
          if (exercise.exercise_id) {
            // Clear cache from exercisesAPI where the exercise history is actually cached
            exercisesAPI.clearExerciseCache(exercise.exercise_id);
            console.log(`[WorkoutAPI] Cleared exercise cache for ${exercise.exercise_id}`);
          }
        });

        // Return the updated workout
        return updatedWorkout;
      } catch (error) {
        await this.db.execute("ROLLBACK");
        console.error('[WorkoutAPI] Error during workout update:', error);
        throw error;
      }
    } catch (error) {
      console.error("[WorkoutAPI] Update workout error:", error);
      throw error;
    }
  }

  async calculateAndStoreSummary(workout) {
    let transaction = false;
    try {
      console.log(`[WorkoutAPI] Calculating summary for workout ${workout.workout_id}`);
      
      // Get exercises with their details
      const workoutExercises = await this.db.query(
        `
        SELECT we.*, e.name, e.muscle_group
        FROM workout_exercises we
        LEFT JOIN exercises e ON we.exercise_id = e.exercise_id
        WHERE we.workout_id = ?
        ORDER BY we.exercise_order
      `,
        [workout.workout_id]
      );

      if (!workoutExercises || workoutExercises.length === 0) {
        console.log(`[WorkoutAPI] No exercises found for workout ${workout.workout_id}, storing empty summary`);
        // Store an empty summary instead of returning null
        const emptySummary = {
          exercises: [],
          totalVolume: 0,
          exerciseCount: 0
        };

        await this.db.execute("BEGIN TRANSACTION");
        transaction = true;
        
        await this.db.execute(
          `
          INSERT OR REPLACE INTO workout_summaries 
          (workout_id, summary_data, total_volume, exercise_count, last_calculated_at)
          VALUES (?, ?, ?, ?, ?)
        `,
          [
            workout.workout_id,
            JSON.stringify(emptySummary),
            0,
            0,
            new Date().toISOString(),
          ]
        );

        await this.db.execute("COMMIT");
        transaction = false;
        return emptySummary;
      }

      // Get all sets for this workout's exercises
      const sets = await this.db.query(
        `
        SELECT s.* 
        FROM sets s
        WHERE s.workout_id = ? 
        ORDER BY s.workout_exercises_id, s.set_order
        `,
        [workout.workout_id]
      );

      

      let totalVolume = 0;
      const exerciseDetails = workoutExercises.map((exercise) => {
        const exerciseSets = sets.filter(
          set => set.workout_exercises_id === exercise.workout_exercises_id
        );

        const exerciseVolume = exerciseSets.reduce(
          (total, set) => total + (Number(set.weight) || 0) * (Number(set.reps) || 0),
          0
        );
        totalVolume += exerciseVolume;

        const bestSet = exerciseSets.length > 0
          ? exerciseSets.reduce(
              (best, current) => {
                const currentWeight = Number(current.weight) || 0;
                const bestWeight = Number(best.weight) || 0;
                return currentWeight > bestWeight ? current : best;
              },
              exerciseSets[0]
            )
          : null;

        return {
          id: exercise.exercise_id,
          name: exercise.name,
          sets: exerciseSets.length,
          bestSet: bestSet
            ? { weight: Number(bestSet.weight) || 0, reps: Number(bestSet.reps) || 0 }
            : null,
          volume: exerciseVolume,
        };
      });

      const summaryData = {
        exercises: exerciseDetails,
        totalVolume,
        exerciseCount: workoutExercises.length,
      };

      console.log(`[WorkoutAPI] Calculated summary for workout ${workout.workout_id}:`, 
        `${workoutExercises.length} exercises, ${sets.length} sets, ${totalVolume}kg total volume`);

      // Store the summary
      await this.db.execute("BEGIN TRANSACTION");
      transaction = true;

      await this.db.execute(
        `
        INSERT OR REPLACE INTO workout_summaries 
        (workout_id, summary_data, total_volume, exercise_count, last_calculated_at)
        VALUES (?, ?, ?, ?, ?)
      `,
        [
          workout.workout_id,
          JSON.stringify(summaryData),
          totalVolume,
          workoutExercises.length,
          new Date().toISOString(),
        ]
      );

      await this.db.execute("COMMIT");
      transaction = false;

      return summaryData;
    } catch (error) {
      console.error(`[WorkoutAPI] Calculate summary error for workout ${workout.workout_id}:`, error);
      if (transaction) {
        try {
          await this.db.execute("ROLLBACK");
        } catch (rollbackError) {
          console.log("[WorkoutAPI] Rollback failed:", rollbackError.message);
        }
      }
      return null;
    }
  }

  async getWorkoutCountsByWeek() {
    try {
      return this.handleOfflineFirst('workouts:weekly_counts', async () => {
        const counts = await this.db.query(`
          SELECT 
            strftime('%Y-%W', date_performed) as week,
            COUNT(*) as count
          FROM workouts
          WHERE sync_status != 'pending_delete'
          GROUP BY week
          ORDER BY week DESC
        `);
        return counts.length > 0 ? counts : null;
      });
    } catch (error) {
      console.error("Get workout counts error:", error);
      throw error;
    }
  }

  async getTotalWorkoutCount() {
    try {
      return this.handleOfflineFirst('workouts:total_count', async () => {
        const result = await this.db.query(`
          SELECT COUNT(*) as count
          FROM workouts
          WHERE sync_status != 'pending_delete'
        `);
        return result.length > 0 ? result[0].count : 0;
      });
    } catch (error) {
      console.error("Get total workout count error:", error);
      return 0;
    }
  }



  async getUserId() {
    const accessToken = await tokenManager.getValidToken()
    if (!accessToken) throw new Error("No auth token found");
    return JSON.parse(atob(accessToken.split(".")[1])).sub;
  }

  async _fetchFromServer() {
    console.log('[WorkoutAPI] Fetching workouts from server for initial population');
    try {
      const response = await this.makeAuthenticatedRequest({
        method: 'GET',
        url: this.baseUrl
      });
      
      if (response.data && Array.isArray(response.data)) {
        console.log(`[WorkoutAPI] Retrieved ${response.data.length} workouts from server`);
        
        // Store each workout locally
        for (const workout of response.data) {
          try {
            await this.storeLocally(workout, 'synced');
            console.log(`[WorkoutAPI] Stored workout ${workout.workout_id} locally`);
          } catch (error) {
            console.error(`[WorkoutAPI] Failed to store workout ${workout.workout_id}:`, error);
          }
        }
        
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('[WorkoutAPI] Failed to fetch workouts from server:', error);
      throw error;
    }
  }

  // Background processing methods
  updateScrollDirection(direction) {
    this.backgroundProcessor.updateScrollDirection(direction);
  }

  triggerSmartPrefetch(visibleWorkouts, allWorkouts) {
    this.backgroundProcessor.smartPrefetch(visibleWorkouts, allWorkouts, this);
  }

  getCacheStats() {
    return {
      memory: this.cache.getStats(),
      workout: this.workoutCache.getStats()
    };
  }

  async ensureWorkoutDetails(workoutId) {
    // First check if we have it in the specialized workout cache
    const cached = this.workoutCache.getWorkoutDetails(workoutId);
    if (cached) return cached;

    // If not in cache, fetch it and store in cache
    const workout = await this._getWorkoutWithDetails(workoutId);
    if (workout) {
      this.workoutCache.setWorkoutDetails(workoutId, workout);
    }
    return workout;
  }
}

export default new WorkoutAPI();
