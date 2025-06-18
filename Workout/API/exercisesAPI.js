import 'react-native-get-random-values';
import getBaseUrl from "./getBaseUrl";
import APIBase from './utils/APIBase';
import { dbManager } from "./local/dbManager";
import { v4 as uuid } from 'uuid';

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
    return this.storage.storeEntity(exercise, {
      table: 'exercises',
      fields: [
        'name',
        'instruction',
        'muscle_group',
        'equipment',
        'media_url',
        'is_public',
        'created_by'
      ],
      syncStatus
    });
  }

  async getExercises() {
    try {
      await this.ensureInitialized();
      
      return this.handleOfflineFirst('exercises:all', async () => {
        const exercises = await this.db.query(
          `SELECT * FROM exercises WHERE sync_status != 'pending_delete'`
        );
        return exercises.length > 0 ? exercises : null;
      });
    } catch (error) {
      console.error("Get exercises error:", error);
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
      console.error("Get exercise by id error:", error);
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
      const userId = await this.getUserId();
      const exercise_id = uuid();
      const now = new Date().toISOString();

      const exercise = {
        exercise_id,
        name,
        equipment,
        muscle_group,
        instruction,
        created_by: userId,
        created_at: now,
        updated_at: now
      };

      // Save to local db first
      await this.storeLocally(exercise, "pending_sync");

      // Try to sync if online
      const response = await this.makeAuthenticatedRequest({
        method: 'POST',
        url: `${this.baseUrl}/create`,
        data: exercise
      }).catch(error => {
        console.error("Server sync failed, but local save succeeded:", error);
        return { data: exercise };
      });

      // Update local record with server data if sync succeeded
      if (response.data !== exercise) {
        await this.storeLocally(response.data, "synced");
      }

      // Clear cache
      this.cache.clearPattern('^exercises:');

      return response.data;
    } catch (error) {
      console.error("Create exercise error:", error);
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
    const response = await this.makeAuthenticatedRequest({
      method: 'GET',
      url: this.baseUrl
    });
    return response.data;
  }

  async getUserId() {
    const token = await this.storage.getItem("auth_token");
    if (!token) throw new Error("No auth token found");
    return JSON.parse(atob(token.split(".")[1])).sub;
  }
}

export default new ExercisesAPI();
