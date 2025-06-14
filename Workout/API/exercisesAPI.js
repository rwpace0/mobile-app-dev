import 'react-native-get-random-values';
import getBaseUrl from "./getBaseUrl";
import axios from "axios";
import { storage } from "./tokenStorage";
import { dbManager } from "./local/dbManager";
import { syncManager } from "./local/syncManager";
import NetInfo from "@react-native-community/netinfo";
import { v4 as uuid } from 'uuid';

class ExercisesAPI {
  constructor() {
    this.baseUrl = `${getBaseUrl()}/exercises`;
    this.db = dbManager;
    this.isInitialized = false;
    this.initializationPromise = null;
    this.setupSync();
  }

  setupSync() {
    // Register sync function with sync manager
    syncManager.registerSyncFunction("exercises", async () => {
      await this.syncExercises();
    });
  }

  async ensureInitialized() {
    if (this.isInitialized) return;

    if (!this.initializationPromise) {
      this.initializationPromise = (async () => {
        try {
          // Wait for database to be ready
          await this.db.initializationPromise;
          
          // Check if we have any exercises in local db
          const localCount = await this.db.query(
            "SELECT COUNT(*) as count FROM exercises"
          );

          if (localCount[0].count === 0) {
            // If empty, try to fetch initial data from server
            const netInfo = await NetInfo.fetch();
            if (netInfo.isConnected) {
              const response = await fetch(this.baseUrl);
              if (response.ok) {
                const serverExercises = await response.json();

                // Store initial exercises locally
                for (const exercise of serverExercises) {
                  await this.db.execute(
                    `INSERT OR REPLACE INTO exercises (
                      exercise_id, name, instruction, muscle_group, equipment,
                      media_url, is_public, created_by, created_at, updated_at,
                      sync_status, version, last_synced_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      exercise.exercise_id,
                      exercise.name,
                      exercise.instruction,
                      exercise.muscle_group,
                      exercise.equipment,
                      exercise.media_url,
                      exercise.is_public ? 1 : 0,
                      exercise.created_by,
                      exercise.created_at,
                      exercise.updated_at,
                      "synced",
                      exercise.version || 1,
                      new Date().toISOString(),
                    ]
                  );
                }
              }
            }
          }

          this.isInitialized = true;
        } catch (error) {
          console.error("Database initialization error:", error);
          this.isInitialized = true;
        }
      })();
    }

    await this.initializationPromise;
  }

  async getExercises() {
    try {
      await this.ensureInitialized();

      // Get local exercises first
      const localExercises = await this.db.query(
        `SELECT * FROM exercises WHERE sync_status != 'pending_delete'`
      );

      // If we have local exercises, return them immediately
      if (localExercises.length > 0) {
        // Try to sync in background if needed
        syncManager.syncIfNeeded("exercises").catch(console.error);
        return localExercises;
      }

      // If no local exercises, try to fetch from server
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch exercise data");
      }

      const serverExercises = await response.json();

      // Store server exercises locally
      for (const exercise of serverExercises) {
        await this.db.execute(
          `INSERT OR REPLACE INTO exercises (
                        exercise_id, name, instruction, muscle_group, equipment,
                        media_url, is_public, created_by, created_at, updated_at,
                        sync_status, version, last_synced_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            exercise.exercise_id,
            exercise.name,
            exercise.instruction,
            exercise.muscle_group,
            exercise.equipment,
            exercise.media_url,
            exercise.is_public ? 1 : 0,
            exercise.created_by,
            exercise.created_at,
            exercise.updated_at,
            "synced",
            exercise.version || 1,
            new Date().toISOString(),
          ]
        );
      }

      return serverExercises;
    } catch (error) {
      console.error("Get exercises error:", error);
      throw error;
    }
  }

  async getExerciseById(exerciseId) {
    try {
      await this.ensureInitialized();

      // Try local first
      const [localExercise] = await this.db.query(
        'SELECT * FROM exercises WHERE exercise_id = ? AND sync_status != "pending_delete"',
        [exerciseId]
      );

      if (localExercise) {
        return localExercise;
      }

      // If not found locally and we're online, try server
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        try {
          const token = await storage.getItem("auth_token");
          const response = await axios.get(`${this.baseUrl}/${exerciseId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });

          const exercise = response.data;

          // Store in local db
          await this.db.execute(
            `INSERT OR REPLACE INTO exercises (
              exercise_id, name, instruction, muscle_group, equipment,
              media_url, is_public, created_by, created_at, updated_at,
              sync_status, version, last_synced_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              exercise.exercise_id,
              exercise.name,
              exercise.instruction,
              exercise.muscle_group,
              exercise.equipment,
              exercise.media_url,
              exercise.is_public ? 1 : 0,
              exercise.created_by,
              exercise.created_at,
              exercise.updated_at,
              "synced",
              exercise.version || 1,
              new Date().toISOString(),
            ]
          );

          return exercise;
        } catch (error) {
          console.error("Server fetch failed:", error);
          // Return a default exercise object with the requested ID
          return {
            exercise_id: exerciseId,
            name: "Exercise Not Found",
            muscle_group: "",
            equipment: "",
            instruction: "",
            is_public: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
      }

      // If offline and not found locally, return a default exercise object
      return {
        exercise_id: exerciseId,
        name: "Exercise Not Found",
        muscle_group: "",
        equipment: "",
        instruction: "",
        is_public: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
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
      const token = await storage.getItem("auth_token");
      if (!token) throw new Error("No auth token found");

      const created_by = JSON.parse(atob(token.split(".")[1])).sub;
      const exercise_id = uuid();
      const now = new Date().toISOString();

      // Save to local db first
      await this.db.execute(
        `INSERT INTO exercises (
                    exercise_id, name, equipment, muscle_group, instruction,
                    created_by, created_at, updated_at, sync_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          exercise_id,
          name,
          equipment,
          muscle_group,
          instruction,
          created_by,
          now,
          now,
          "pending_sync",
        ]
      );

      // Try to sync if online
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        try {
          const response = await axios.post(
            `${this.baseUrl}/create`,
            { name, equipment, muscle_group, instruction },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          // Update local record with server data
          await this.db.execute(
            `UPDATE exercises 
                        SET sync_status = 'synced',
                            version = ?,
                            last_synced_at = ?
                        WHERE exercise_id = ?`,
            [response.data.version || 1, now, exercise_id]
          );

          return response.data;
        } catch (error) {
          console.error("Server sync failed, but local save succeeded:", error);
          // Return local data since we failed to sync
          return { exercise_id, name, equipment, muscle_group, instruction };
        }
      }

      // Return local data if offline
      return { exercise_id, name, equipment, muscle_group, instruction };
    } catch (error) {
      console.error("Create exercise error:", error);
      throw error;
    }
  }

  async getExerciseHistory(exerciseId) {
    try {
      const token = await storage.getItem("auth_token");
      if (!token) throw new Error("No auth token found");

      const response = await fetch(`${this.baseUrl}/${exerciseId}/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch exercise history");
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error("Get exercise history error:", error);
      throw error;
    }
  }

  async syncExercises() {
    try {
      const token = await storage.getItem("auth_token");
      if (!token) return;

      // Get pending exercises
      const pendingExercises = await this.db.query(
        `SELECT * FROM exercises WHERE sync_status != 'synced'`
      );

      // Process each pending exercise
      for (const exercise of pendingExercises) {
        if (exercise.sync_status === "pending_delete") {
          await this.syncDeleteExercise(exercise, token);
        } else if (exercise.sync_status === "pending_sync") {
          await this.syncCreateOrUpdateExercise(exercise, token);
        }
      }

      // Get all server exercises
      const response = await axios.get(this.baseUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update local database with server data
      for (const serverExercise of response.data) {
        const [localExercise] = await this.db.query(
          "SELECT * FROM exercises WHERE exercise_id = ?",
          [serverExercise.exercise_id]
        );

        if (!localExercise || localExercise.sync_status === "synced") {
          await this.db.execute(
            `INSERT OR REPLACE INTO exercises (
                            exercise_id, name, instruction, muscle_group, equipment,
                            media_url, is_public, created_by, created_at, updated_at,
                            sync_status, version, last_synced_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              serverExercise.exercise_id,
              serverExercise.name,
              serverExercise.instruction,
              serverExercise.muscle_group,
              serverExercise.equipment,
              serverExercise.media_url,
              serverExercise.is_public ? 1 : 0,
              serverExercise.created_by,
              serverExercise.created_at,
              serverExercise.updated_at,
              "synced",
              serverExercise.version || 1,
              new Date().toISOString(),
            ]
          );
        }
      }
    } catch (error) {
      console.error("Sync exercises error:", error); 
    } 
  } 
 
  async syncCreateOrUpdateExercise(exercise, token) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/create`,
        {
          name: exercise.name,
          equipment: exercise.equipment,
          muscle_group: exercise.muscle_group,
          instruction: exercise.instruction,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      await this.db.execute(
        `UPDATE exercises 
                SET sync_status = 'synced',
                    version = ?,
                    last_synced_at = ?
                WHERE exercise_id = ?`,
        [
          response.data.version || 1,
          new Date().toISOString(),
          exercise.exercise_id,
        ]
      );
    } catch (error) {
      console.error("Sync create/update exercise error:", error);
    }
  }

  async syncDeleteExercise(exercise, token) {
    try {
      await axios.delete(`${this.baseUrl}/${exercise.exercise_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await this.db.execute("DELETE FROM exercises WHERE exercise_id = ?", [
        exercise.exercise_id,
      ]);
    } catch (error) {
      console.error("Sync delete exercise error:", error);
    }
  }
}

export default new ExercisesAPI();
