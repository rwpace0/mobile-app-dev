import 'react-native-get-random-values';
import getBaseUrl from "./getBaseUrl";
import APIBase from './utils/APIBase';
import { dbManager } from "./local/dbManager";
import { v4 as uuid } from 'uuid';
import { storage } from './tokenStorage';

class ExercisesAPI extends APIBase {
  constructor() {
    super(`${getBaseUrl()}/exercises`, dbManager, {
      cacheConfig: {
        maxSize: 500,
        ttl: 30 * 60 * 1000 // 30 minutes for exercise cache
      }
    });
  }

  getTableName() {
    return 'exercises';
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
        'updated_at'
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
          `SELECT * FROM exercises WHERE sync_status != 'pending_delete'`
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
          'SELECT * FROM exercises WHERE exercise_id = ? AND sync_status != "pending_delete"',
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

  async createExercise({ name, equipment, muscle_group, instruction = null }) {
    try {
      console.log('[ExercisesAPI] Starting exercise creation with data:', { name, equipment, muscle_group, instruction });
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
      console.log('[ExercisesAPI] Storing exercise locally with ID:', exercise_id);
      await this.storeLocally(exercise, "pending_sync");

      console.log('[ExercisesAPI] Attempting to sync exercise with server');
      const response = await this.makeAuthenticatedRequest({
        method: 'POST',
        url: `${this.baseUrl}/create`,
        data: exercise
      }).catch(error => {
        console.warn("[ExercisesAPI] Server sync failed, but local save succeeded:", error);
        return { data: exercise };
      });

      // Only update the sync status and server-provided ID if needed
      if (response.data.exercise_id && response.data.exercise_id !== exercise_id) {
        console.log('[ExercisesAPI] Server sync successful, updating sync status');
        await this.db.execute(
          `UPDATE exercises 
           SET sync_status = 'synced',
               exercise_id = ?,
               last_synced_at = ?
           WHERE exercise_id = ?`,
          [response.data.exercise_id, now, exercise_id]
        );
      }

      console.log('[ExercisesAPI] Exercise creation complete, clearing cache');
      this.cache.clearPattern('^exercises:');

      return {
        ...exercise,
        exercise_id: response.data.exercise_id || exercise_id
      };
    } catch (error) {
      console.error("[ExercisesAPI] Create exercise error:", error);
      throw error;
    }
  }

  async getExerciseHistory(exerciseId) {
    try {
      return this.handleOfflineFirst(`exercise:${exerciseId}:history`, async () => {
        const response = await this.makeAuthenticatedRequest({
          method: 'GET',
          url: `${this.baseUrl}/${exerciseId}/history`
        });
        return response.data;
      });
    } catch (error) {
      console.error("Get exercise history error:", error);
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

  async getUserId() {
    const token = await storage.getItem("auth_token");
    if (!token) throw new Error("No auth token found");
    return JSON.parse(atob(token.split(".")[1])).sub;
  }
}

export default new ExercisesAPI();
