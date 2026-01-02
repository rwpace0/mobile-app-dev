import { storage } from "./tokenStorage";

const ACTIVE_WORKOUT_KEY = "active_workout";

class ActiveWorkoutStorage {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Save the current active workout state to persistent storage
   * @param {Object} workoutData - The workout data to persist
   */
  async saveActiveWorkout(workoutData) {
    try {
      if (!workoutData) {
        console.warn(
          "[ActiveWorkoutStorage] Attempted to save null/undefined workout"
        );
        return;
      }

      const persistentData = {
        ...workoutData,
        lastSavedTime: Date.now(),
        // Ensure startTime is preserved as the original start timestamp
        startTime: workoutData.startTime || Date.now(),
      };

      await storage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(persistentData));
      //console.log('[ActiveWorkoutStorage] Active workout saved successfully');
    } catch (error) {
      console.error(
        "[ActiveWorkoutStorage] Failed to save active workout:",
        error
      );
    }
  }

  /**
   * Load the active workout from persistent storage
   * @returns {Object|null} The restored workout data or null if none exists
   */
  async loadActiveWorkout() {
    try {
      const workoutJson = await storage.getItem(ACTIVE_WORKOUT_KEY);

      if (!workoutJson) {
        console.log(
          "[ActiveWorkoutStorage] No active workout found in storage"
        );
        return null;
      }

      const workoutData = JSON.parse(workoutJson);

      // Validate that we have required fields
      if (!workoutData.startTime) {
        console.warn(
          "[ActiveWorkoutStorage] Invalid workout data - missing startTime"
        );
        await this.clearActiveWorkout();
        return null;
      }

      // Calculate the current duration based on real time elapsed
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor(
        (currentTime - workoutData.startTime) / 1000
      );

      const restoredWorkout = {
        ...workoutData,
        duration: elapsedSeconds, // Real-time calculated duration
        lastRestoredTime: currentTime,
      };

      console.log(
        `[ActiveWorkoutStorage] Active workout restored - elapsed time: ${this.formatDuration(
          elapsedSeconds
        )}`
      );
      return restoredWorkout;
    } catch (error) {
      console.error(
        "[ActiveWorkoutStorage] Failed to load active workout:",
        error
      );
      // Clear corrupted data
      await this.clearActiveWorkout();
      return null;
    }
  }

  /**
   * Clear the active workout from persistent storage
   */
  async clearActiveWorkout() {
    try {
      await storage.removeItem(ACTIVE_WORKOUT_KEY);
      console.log("[ActiveWorkoutStorage] Active workout cleared from storage");
    } catch (error) {
      console.error(
        "[ActiveWorkoutStorage] Failed to clear active workout:",
        error
      );
    }
  }

  /**
   * Check if there's an active workout in storage
   * @returns {boolean} True if active workout exists
   */
  async hasActiveWorkout() {
    try {
      const workoutJson = await storage.getItem(ACTIVE_WORKOUT_KEY);
      return !!workoutJson;
    } catch (error) {
      console.error(
        "[ActiveWorkoutStorage] Failed to check for active workout:",
        error
      );
      return false;
    }
  }

  /**
   * Update specific fields of the active workout without loading the entire state
   * @param {Object} updates - Fields to update
   */
  async updateActiveWorkout(updates) {
    try {
      const currentWorkout = await this.loadActiveWorkout();
      if (currentWorkout) {
        const updatedWorkout = {
          ...currentWorkout,
          ...updates,
          lastSavedTime: Date.now(),
          // Preserve the original startTime
          startTime: currentWorkout.startTime,
        };
        await this.saveActiveWorkout(updatedWorkout);
      }
    } catch (error) {
      console.error(
        "[ActiveWorkoutStorage] Failed to update active workout:",
        error
      );
    }
  }

  /**
   * Get workout statistics without loading full state
   * @returns {Object|null} Basic workout stats or null
   */
  async getWorkoutStats() {
    try {
      const workoutJson = await storage.getItem(ACTIVE_WORKOUT_KEY);
      if (!workoutJson) return null;

      const workoutData = JSON.parse(workoutJson);
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor(
        (currentTime - workoutData.startTime) / 1000
      );

      return {
        name: workoutData.name || "Active Workout",
        duration: elapsedSeconds,
        exerciseCount: (workoutData.exercises || []).length,
        totalSets: workoutData.totalSets || 0,
        totalVolume: workoutData.totalVolume || 0,
        startTime: workoutData.startTime,
      };
    } catch (error) {
      console.error(
        "[ActiveWorkoutStorage] Failed to get workout stats:",
        error
      );
      return null;
    }
  }

  /**
   * Format duration in seconds to HH:MM:SS or MM:SS
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    } else {
      return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    }
  }

  /**
   * Initialize the storage service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Check if we can access storage
      await storage.getItem("test");
      this.isInitialized = true;
      console.log("[ActiveWorkoutStorage] Initialized successfully");
    } catch (error) {
      console.error("[ActiveWorkoutStorage] Failed to initialize:", error);
    }
  }
}

export const activeWorkoutStorage = new ActiveWorkoutStorage();
