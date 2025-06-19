import "react-native-get-random-values";
import getBaseUrl from "./getBaseUrl";
import APIBase from './utils/APIBase';
import { dbManager } from "./local/dbManager";
import { workoutCache } from "./local/WorkoutCache";
import { backgroundProcessor } from "./local/BackgroundProcessor";
import { v4 as uuid } from "uuid";

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
  }

  getTableName() {
    return 'workouts';
  }

  async storeLocally(workout, syncStatus = "synced") {
    return this.storage.storeEntity(workout, {
      table: 'workouts',
      fields: ['user_id', 'name', 'date_performed', 'duration'],
      syncStatus,
      relations: [
        {
          table: 'workout_exercises',
          data: workout.exercises,
          orderField: 'exercise_order',
          relations: [
            {
              table: 'sets',
              data: (exercise) => exercise.sets,
              orderField: 'set_order'
            }
          ]
        }
      ]
    });
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
        return { workouts: [], hasMore: false, nextCursor: null, totalLoaded: 0 };
      }

      // Get full workout data
      const workouts = await Promise.all(
        resultsIds.map(workoutId => this._getWorkoutWithDetails(workoutId))
      );

      const results = workouts.filter(Boolean);
      const nextCursor = hasMore && results.length > 0
        ? results[results.length - 1].date_performed
        : null;

      console.log('[WorkoutAPI] Fetched', results.length, 'workouts from database');

      const response = {
        workouts: results,
        hasMore,
        nextCursor,
        totalLoaded: results.length
      };

      this.workoutCache.setWorkoutList(cacheKey, response);
      console.log('[WorkoutAPI] Cached new workout list results');
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

  async _getWorkoutWithDetails(workoutId) {
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

    if (workoutData.length === 0) return null;

    // Process workout data into structured format
    const workout = {
      workout_id: workoutData[0].workout_id,
      user_id: workoutData[0].user_id,
      name: workoutData[0].name,
      date_performed: workoutData[0].date_performed,
      duration: workoutData[0].duration,
      created_at: workoutData[0].created_at,
      updated_at: workoutData[0].updated_at,
      exercises: []
    };

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
  }

  async finishWorkout(workoutData) {
    try {
      console.log('[WorkoutAPI] Starting workout finish process');
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
        exercises: workoutData.exercises || [],
        created_at: now,
        updated_at: now
      };

      await this.db.execute("BEGIN TRANSACTION");
      try {
        console.log('[WorkoutAPI] Storing workout locally with ID:', workoutId);
        await this.storeLocally(workout, "pending_sync");
        await this.calculateAndStoreSummary(workout);
        await this.db.execute("COMMIT");
        
        console.log('[WorkoutAPI] Local workout storage successful, clearing caches');
        this.cache.clearPattern('^workouts:');
        this.workoutCache.clearAll();

        console.log('[WorkoutAPI] Attempting to sync workout with server');
        const response = await this.makeAuthenticatedRequest({
          method: 'POST',
          url: `${this.baseUrl}/finish`,
          data: workout
        }).catch(error => {
          console.warn("[WorkoutAPI] Server sync failed, but local save succeeded:", error);
          return { data: workout };
        });

        if (response.data !== workout) {
          console.log('[WorkoutAPI] Server sync successful, updating local data');
          await this.storeLocally(response.data, "synced");
          this.cache.clearPattern('^workouts:');
          this.workoutCache.clearAll();
        }

        return response.data;
      } catch (error) {
        console.error('[WorkoutAPI] Error during workout finish, rolling back:', error);
        await this.db.execute("ROLLBACK");
        throw error;
      }
    } catch (error) {
      console.error("[WorkoutAPI] Finish workout error:", error);
      throw error;
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

  async _fetchFromServer() {
    console.log('[WorkoutAPI] Fetching workouts from server');
    const response = await this.makeAuthenticatedRequest({
      method: 'GET',
      url: this.baseUrl
    });
    console.log('[WorkoutAPI] Server fetch complete');
    return response.data;
  }

  async getUserId() {
    const token = await this.storage.getItem("auth_token");
    if (!token) throw new Error("No auth token found");
    return JSON.parse(atob(token.split(".")[1])).sub;
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
