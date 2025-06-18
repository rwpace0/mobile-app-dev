import "react-native-get-random-values";
import axios from "axios";
import { storage } from "./tokenStorage";
import getBaseUrl from "./getBaseUrl";
import { dbManager } from "./local/dbManager";
import { syncManager } from "./local/syncManager";
import { workoutCache } from "./local/WorkoutCache";
import { backgroundProcessor } from "./local/BackgroundProcessor";
import NetInfo from "@react-native-community/netinfo";
import { v4 as uuid } from "uuid";

class WorkoutAPI {
  constructor() {
    this.baseUrl = `${getBaseUrl()}/workouts`;
    this.db = dbManager;
    this.cache = workoutCache;
    this.backgroundProcessor = backgroundProcessor;
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.minDelay = 3000; // 3 seconds between requests
    this.maxRetries = 2;
    this.setupSync();
  }

  setupSync() {
    syncManager.registerSyncFunction("workouts", async () => {
      await this.syncWorkouts();
    });
  }

  // Queue-based request processing to strictly control rate
  async _queueRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFn, resolve, reject });
      this._processQueue();
    });
  }

  async _processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const { requestFn, resolve, reject } = this.requestQueue.shift();

      try {
        const result = await this._executeWithRetry(requestFn);
        resolve(result);
      } catch (error) {
        reject(error);
      }

      // Always wait between requests
      if (this.requestQueue.length > 0) {
        console.log(`Waiting ${this.minDelay}ms before next request...`);
        await new Promise((resolve) => setTimeout(resolve, this.minDelay));
      }
    }

    this.isProcessingQueue = false;
  }

  async _executeWithRetry(requestFn, retryCount = 0) {
    try {
      return await requestFn();
    } catch (error) {
      if (error.response?.status === 429 && retryCount < this.maxRetries) {
        // Extract retry-after header if available
        const retryAfter = error.response.headers["retry-after"];
        const waitTime = retryAfter
          ? parseInt(retryAfter) * 1000
          : 5000 * Math.pow(2, retryCount);

        console.log(
          `Rate limited (429), waiting ${waitTime}ms before retry ${
            retryCount + 1
          }/${this.maxRetries}`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));

        return this._executeWithRetry(requestFn, retryCount + 1);
      }
      throw error;
    }
  }

  async ensureInitialized() {
    try {
      // Check if we have any workouts in local DB
      const [workoutCount] = await this.db.query(
        "SELECT COUNT(*) as count FROM workouts WHERE sync_status != 'pending_delete'"
      );
      
      // If we have workouts locally, we're considered initialized
      if (workoutCount.count > 0) {
        console.log(`Found ${workoutCount.count} workouts locally - app initialized`);
        return;
      }

      // Only if we have NO workouts at all, fetch basic list from server
      const netInfo = await NetInfo.fetch();
      const token = await storage.getItem("auth_token");

      if (netInfo.isConnected && token) {
        console.log("No local data found, fetching basic workout list...");

        try {
          // Get basic workout list only (no details)
          const workoutList = await this._queueRequest(async () => {
            return await axios.get(this.baseUrl, {
              headers: { Authorization: `Bearer ${token}` },
            });
          });

          console.log(`Found ${workoutList.data.length} workouts from server`);

          // Store all workouts without exercises for instant app readiness
          for (const workout of workoutList.data) {
            await this.storeWorkoutLocally({ ...workout, exercises: [] });
          }

          console.log("Basic workout list cached - app ready for use");
          
          // Details will be lazily loaded as needed
        } catch (error) {
          console.error("Failed to fetch initial workout list:", error.message);
          // App can still function without initial sync
        }
      } else {
        console.log("No network or token - app will work offline only");
      }
    } catch (error) {
      console.error("Database initialization error:", error);
    }
  }

  // Lazy loading with queue
  async ensureWorkoutDetails(workoutId) {
    try {
      const exerciseCount = await this.db.query(
        "SELECT COUNT(*) as count FROM workout_exercises WHERE workout_id = ?",
        [workoutId]
      );

      if (exerciseCount[0].count > 0) return;

      const token = await storage.getItem("auth_token");
      const netInfo = await NetInfo.fetch();

      if (!token || !netInfo.isConnected) return;

      console.log(`Lazy loading details for workout ${workoutId}...`);

      const response = await this._queueRequest(async () => {
        return await axios.get(`${this.baseUrl}/${workoutId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      });

      await this.storeWorkoutLocally(response.data);
    } catch (error) {
      console.error(`Failed to lazy load workout ${workoutId}:`, error);
    }
  }

  async syncWorkouts() {
    try {
      const token = await storage.getItem("auth_token");
      if (!token) return;

      console.log("Starting sync...");

      // Handle pending workouts first
      const pendingWorkouts = await this.db.query(
        `SELECT * FROM workouts WHERE sync_status != 'synced'`
      );

      for (const workout of pendingWorkouts) {
        try {
          if (workout.sync_status === "pending_delete") {
            await this._queueRequest(async () => {
              return await axios.delete(
                `${this.baseUrl}/${workout.workout_id}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
            });
            await this.db.execute("DELETE FROM workouts WHERE workout_id = ?", [
              workout.workout_id,
            ]);
          } else if (workout.sync_status === "pending_sync") {
            const response = await this._queueRequest(async () => {
              return await axios.post(`${this.baseUrl}/finish`, workout, {
                headers: { Authorization: `Bearer ${token}` },
              });
            });
            await this.db.execute(
              `UPDATE workouts SET sync_status = 'synced', version = ?, last_synced_at = ? WHERE workout_id = ?`,
              [
                response.data.version || 1,
                new Date().toISOString(),
                workout.workout_id,
              ]
            );
          }
        } catch (error) {
          console.error(`Failed to sync workout ${workout.workout_id}:`, error);
        }
      }

      // Get server workouts (basic list only)
      const response = await this._queueRequest(async () => {
        return await axios.get(this.baseUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
      });

      // Find new workouts
      const localWorkoutIds = new Set(
        (await this.db.query("SELECT workout_id FROM workouts")).map(
          (w) => w.workout_id
        )
      );

      const newWorkouts = response.data.filter(
        (workout) => !localWorkoutIds.has(workout.workout_id)
      );

      if (newWorkouts.length > 0) {
        console.log(`Found ${newWorkouts.length} new workouts`);

        // Store basic info first
        for (const workout of newWorkouts) {
          await this.storeWorkoutLocally({ ...workout, exercises: [] });
        }

        // ONLY fetch details for the 3 most recent new workouts
        const recentNew = newWorkouts
          .sort(
            (a, b) => new Date(b.date_performed) - new Date(a.date_performed)
          )
          .slice(0, 3);

        console.log(
          `Fetching details for ${recentNew.length} most recent new workouts...`
        );

        for (const workout of recentNew) {
          try {
            if (workout.exercises && workout.exercises.length > 0) {
              await this.storeWorkoutLocally(workout);
            } else {
              const detailedWorkout = await this._queueRequest(async () => {
                return await axios.get(
                  `${this.baseUrl}/${workout.workout_id}`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );
              });
              await this.storeWorkoutLocally(detailedWorkout.data);
            }
          } catch (error) {
            console.error(
              `Failed to fetch new workout ${workout.workout_id}:`,
              error
            );
          }
        }
      }

      console.log("Sync completed");
    } catch (error) {
      console.error("Sync error:", error);
    }
  }

  // Add a method to manually trigger detail fetching for specific workouts
  async preloadWorkoutDetails(workoutIds) {
    console.log(`Preloading details for ${workoutIds.length} workouts...`);

    for (const workoutId of workoutIds) {
      await this.ensureWorkoutDetails(workoutId);
    }
  }

  // Add a background detail fetcher that runs slowly
  async backgroundDetailFetch(maxWorkouts = 5) {
    try {
      const workoutsNeedingDetails = await this.db.query(
        `
        SELECT w.workout_id FROM workouts w
        LEFT JOIN workout_exercises we ON w.workout_id = we.workout_id
        WHERE we.workout_id IS NULL 
        AND w.sync_status != 'pending_delete'
        ORDER BY w.date_performed DESC
        LIMIT ?
      `,
        [maxWorkouts]
      );

      if (workoutsNeedingDetails.length > 0) {
        console.log(
          `Background fetching details for ${workoutsNeedingDetails.length} workouts...`
        );

        for (const workout of workoutsNeedingDetails) {
          await this.ensureWorkoutDetails(workout.workout_id);
        }
      }
    } catch (error) {
      console.error("Background detail fetch error:", error);
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

      const cacheKey = this.cache.generateListCacheKey(params);
      const cachedResult = this.cache.getWorkoutList(cacheKey);
      if (cachedResult) return cachedResult;

      // First get the workout IDs we need
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
        return { workouts: [], hasMore: false, nextCursor: null, totalLoaded: 0 };
      }

      // Now get full workout data including exercises and sets
      const workouts = await Promise.all(
        resultsIds.map(async (workoutId) => {
          const workoutData = await this.db.query(
            `
            SELECT 
              w.*,
              ws.summary_data,
              ws.total_volume,
              ws.exercise_count,
              we.workout_exercises_id,
              we.exercise_order,
              we.notes as exercise_notes,
              e.exercise_id,
              e.name as exercise_name,
              e.muscle_group,
              s.set_id,
              s.weight,
              s.reps,
              s.rir,
              s.set_order
            FROM workouts w
            LEFT JOIN workout_summaries ws ON w.workout_id = ws.workout_id
            LEFT JOIN workout_exercises we ON w.workout_id = we.workout_id
            LEFT JOIN exercises e ON we.exercise_id = e.exercise_id
            LEFT JOIN sets s ON we.workout_exercises_id = s.workout_exercises_id
            WHERE w.workout_id = ?
            ORDER BY we.exercise_order, s.set_order
            `,
            [workoutId]
          );

          if (!workoutData.length) return null;

          // Process workout data into structured format
          const workout = {
            workout_id: workoutData[0].workout_id,
            user_id: workoutData[0].user_id,
            name: workoutData[0].name,
            date_performed: workoutData[0].date_performed,
            duration: workoutData[0].duration,
            created_at: workoutData[0].created_at,
            updated_at: workoutData[0].updated_at,
            totalVolume: workoutData[0].total_volume,
            exerciseCount: workoutData[0].exercise_count,
            exercises: []
          };

          if (workoutData[0].summary_data) {
            Object.assign(workout, JSON.parse(workoutData[0].summary_data));
          }

          const exercisesMap = new Map();

          workoutData.forEach((row) => {
            if (!row.workout_exercises_id) return;

            let exercise = exercisesMap.get(row.workout_exercises_id);

            if (!exercise) {
              exercise = {
                workout_exercises_id: row.workout_exercises_id,
                exercise_id: row.exercise_id,
                name: row.exercise_name,
                muscle_group: row.muscle_group,
                exercise_order: row.exercise_order,
                notes: row.exercise_notes,
                sets: []
              };
              exercisesMap.set(row.workout_exercises_id, exercise);
              workout.exercises.push(exercise);
            }

            if (row.set_id) {
              exercise.sets.push({
                set_id: row.set_id,
                weight: row.weight,
                reps: row.reps,
                rir: row.rir,
                set_order: row.set_order
              });
            }
          });

          // Sort exercises by order
          workout.exercises.sort((a, b) => a.exercise_order - b.exercise_order);

          return workout;
        })
      );

      const results = workouts.filter(Boolean); // Remove any null results

      const nextCursor = hasMore && results.length > 0
        ? results[results.length - 1].date_performed
        : null;

      const response = {
        workouts: results,
        hasMore,
        nextCursor,
        totalLoaded: results.length
      };

      this.cache.setWorkoutList(cacheKey, response);
      return response;
    } catch (error) {
      console.error("Get workouts error:", error);
      throw error;
    }
  }

  async getWorkoutById(workoutId) {
    try {
      const cachedWorkout = this.cache.getWorkoutDetails(workoutId);
      if (cachedWorkout) return cachedWorkout;

      // Get all workout data in a single query
      const workoutData = await this.db.query(
        `
        SELECT 
          w.*,
          we.workout_exercises_id,
          we.exercise_order,
          we.notes as exercise_notes,
          e.exercise_id,
          e.name as exercise_name,
          e.muscle_group,
          s.set_id,
          s.weight,
          s.reps,
          s.rir,
          s.set_order
        FROM workouts w
        LEFT JOIN workout_exercises we ON w.workout_id = we.workout_id
        LEFT JOIN exercises e ON we.exercise_id = e.exercise_id
        LEFT JOIN sets s ON we.workout_exercises_id = s.workout_exercises_id
        WHERE w.workout_id = ? AND w.sync_status != 'pending_delete'
        ORDER BY we.exercise_order, s.set_order
      `,
        [workoutId]
      );

      if (workoutData.length === 0) {
        throw new Error("Workout not found");
      }

      // Process the flat data into a nested structure
      const workout = {
        workout_id: workoutData[0].workout_id,
        user_id: workoutData[0].user_id,
        name: workoutData[0].name,
        date_performed: workoutData[0].date_performed,
        duration: workoutData[0].duration,
        created_at: workoutData[0].created_at,
        updated_at: workoutData[0].updated_at,
        exercises: [],
      };

      const exercisesMap = new Map();

      workoutData.forEach((row) => {
        if (!row.workout_exercises_id) return; // Skip if no exercises

        let exercise = exercisesMap.get(row.workout_exercises_id);

        if (!exercise) {
          exercise = {
            workout_exercises_id: row.workout_exercises_id,
            exercise_id: row.exercise_id,
            name: row.exercise_name,
            muscle_group: row.muscle_group,
            exercise_order: row.exercise_order,
            notes: row.exercise_notes,
            sets: [],
          };
          exercisesMap.set(row.workout_exercises_id, exercise);
          workout.exercises.push(exercise);
        }

        if (row.set_id) {
          exercise.sets.push({
            set_id: row.set_id,
            weight: row.weight,
            reps: row.reps,
            rir: row.rir,
            set_order: row.set_order,
          });
        }
      });

      // Sort exercises by order
      workout.exercises.sort((a, b) => a.exercise_order - b.exercise_order);

      // Cache the result
      this.cache.setWorkoutDetails(workoutId, workout);

      // Removed aggressive sync trigger - only sync on app foreground or user request

      return workout;
    } catch (error) {
      console.error("Get workout by id error:", error);
      throw error;
    }
  }

  async getWorkouts(page = 1, limit = 20) {
    try {
      await this.ensureInitialized();
      const offset = (page - 1) * limit;

      const workouts = await this.db.query(
        `
        SELECT w.*, ws.summary_data, ws.total_volume, ws.exercise_count
        FROM workouts w
        LEFT JOIN workout_summaries ws ON w.workout_id = ws.workout_id
        WHERE w.sync_status != 'pending_delete'
        ORDER BY w.date_performed DESC
        LIMIT ? OFFSET ?
      `,
        [limit, offset]
      );

      if (workouts.length === 0) {
        return { workouts: [], hasMore: false };
      }

      const workoutsToProcess = workouts.filter((w) => !w.summary_data);

      if (workoutsToProcess.length > 0) {
        await Promise.all(
          workoutsToProcess.map((workout) =>
            this.calculateAndStoreSummary(workout)
          )
        );
        return this.getWorkouts(page, limit);
      }

      const processedWorkouts = workouts.map((workout) => ({
        ...workout,
        ...JSON.parse(workout.summary_data || "{}"),
      }));

      const [{ count }] = await this.db.query(`
        SELECT COUNT(*) as count FROM workouts WHERE sync_status != 'pending_delete'
      `);

      const hasMore = offset + limit < count;

      // Removed aggressive sync trigger - only sync on app foreground or user request

      return { workouts: processedWorkouts, hasMore };
    } catch (error) {
      console.error("Get workouts error:", error);
      throw error;
    }
  }

  // Keep all your other existing methods (storeWorkoutLocally, calculateAndStoreSummary, etc.)
  // ... (rest of your methods remain unchanged)

  async storeWorkoutLocally(workout, syncStatus = "synced") {
    const now = new Date().toISOString();

    const [existingWorkout] = await this.db.query(
      "SELECT * FROM workouts WHERE workout_id = ?",
      [workout.workout_id]
    );

    const newHasExercises = workout.exercises && workout.exercises.length > 0;

    if (existingWorkout) {
      const [existingExerciseCount] = await this.db.query(
        "SELECT COUNT(*) as count FROM workout_exercises WHERE workout_id = ?",
        [workout.workout_id]
      );

      if (existingExerciseCount.count > 0 && !newHasExercises) {
        return;
      }

      await this.db.execute(
        `UPDATE workouts SET
            user_id = ?, name = ?, date_performed = ?, duration = ?,
            updated_at = ?, sync_status = ?, version = ?, last_synced_at = ?
         WHERE workout_id = ?`,
        [
          workout.user_id,
          workout.name,
          workout.date_performed,
          workout.duration,
          workout.updated_at || now,
          syncStatus,
          workout.version || existingWorkout.version,
          now,
          workout.workout_id,
        ]
      );
    } else {
      await this.db.execute(
        `INSERT INTO workouts (
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
          now,
        ]
      );
    }

    if (newHasExercises) {
      await this.db.execute(
        "DELETE FROM workout_exercises WHERE workout_id = ?",
        [workout.workout_id]
      );

      for (const exercise of workout.exercises) {
        let exerciseData, exerciseId;

        if (exercise.exercises?.exercise_id) {
          exerciseData = exercise.exercises;
          exerciseId = exerciseData.exercise_id;
        } else if (exercise.exercise_id) {
          exerciseData = exercise;
          exerciseId = exercise.exercise_id;
        } else {
          continue;
        }

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
              exerciseData.updated_at || now,
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
            exercise.updated_at || now,
          ]
        );

        if (exercise.sets?.length) {
          await this.db.execute(
            "DELETE FROM sets WHERE workout_exercises_id = ?",
            [workoutExerciseId]
          );

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
                set.updated_at || now,
              ]
            );
          }
        }
      }
    }
  }

  async calculateAndStoreSummary(workout) {
    try {
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

      const sets = await this.db.query(
        `
        SELECT * FROM sets WHERE workout_id = ? ORDER BY workout_exercises_id, set_order
      `,
        [workout.workout_id]
      );

      const exercisesWithSets = workoutExercises.map((exercise) => ({
        ...exercise,
        sets: sets.filter(
          (set) => set.workout_exercises_id === exercise.workout_exercises_id
        ),
      }));

      let totalVolume = 0;
      const exerciseDetails = exercisesWithSets.map((exercise) => {
        const exerciseVolume = (exercise.sets || []).reduce(
          (total, set) => total + (set.weight || 0) * (set.reps || 0),
          0
        );
        totalVolume += exerciseVolume;

        const bestSet = exercise.sets.reduce(
          (best, current) => (current.weight > best.weight ? current : best),
          exercise.sets[0]
        );

        return {
          id: exercise.exercise_id,
          name: exercise.name,
          sets: exercise.sets.length,
          bestSet: bestSet
            ? { weight: bestSet.weight, reps: bestSet.reps }
            : null,
          volume: exerciseVolume,
        };
      });

      const summaryData = {
        exercises: exerciseDetails,
        totalVolume,
        exerciseCount: exercisesWithSets.length,
      };

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
          exercisesWithSets.length,
          new Date().toISOString(),
        ]
      );

      return summaryData;
    } catch (error) {
      console.error("Calculate summary error:", error);
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
        updated_at: now,
      };

      await this.db.execute("BEGIN TRANSACTION");
      try {
        await this.storeWorkoutLocally(workout, "pending_sync");
        await this.calculateAndStoreSummary(workout);
        await this.db.execute("COMMIT");
        
        // Clear all caches since a new workout affects list views
        this.cache.clearAll();

        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
          try {
            const response = await this._queueRequest(async () => {
              return await axios.post(`${this.baseUrl}/finish`, workout, {
                headers: { Authorization: `Bearer ${token}` },
              });
            });

            await this.db.execute(
              `UPDATE workouts SET sync_status = 'synced', version = ?, last_synced_at = ? WHERE workout_id = ?`,
              [response.data.version || 1, now, workoutId]
            );

            // Clear caches again after successful sync
            this.cache.clearAll();
            return response.data;
          } catch (error) {
            console.error(
              "Server sync failed, but local save succeeded:",
              error
            );
            return workout;
          }
        }

        return workout;
      } catch (error) {
        await this.db.execute("ROLLBACK");
        throw error;
      }
    } catch (error) {
      console.error("Finish workout error:", error);
      throw error;
    }
  }

  async getWorkoutCountsByWeek() {
    try {
      const localCounts = await this.db.query(`
        SELECT 
          strftime('%Y-%W', date_performed) as week,
          COUNT(*) as count
        FROM workouts
        WHERE sync_status != 'pending_delete'
        GROUP BY week
        ORDER BY week DESC
      `);

      // Removed aggressive sync trigger - only sync on app foreground or user request
      return localCounts;
    } catch (error) {
      console.error("Get workout counts error:", error);
      throw error;
    }
  }

  // Add method to handle scroll direction updates
  updateScrollDirection(direction) {
    this.backgroundProcessor.updateScrollDirection(direction);
  }

  // Add method to trigger smart prefetch
  triggerSmartPrefetch(visibleWorkouts, allWorkouts) {
    this.backgroundProcessor.smartPrefetch(visibleWorkouts, allWorkouts, this);
  }

  // Add method to get cache statistics
  getCacheStats() {
    return this.cache.getStats();
  }
}

export default new WorkoutAPI();
