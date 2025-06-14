import * as SQLite from "expo-sqlite";

class DatabaseManager {
  constructor() {
    this.db = null;
    this.currentVersion = 3; // Increment for timestamp type change
    this.initializationPromise = this.initDatabase();
  }

  async initDatabase() {
    try {
      // For Expo SQLite v13+
      this.db = await SQLite.openDatabaseAsync("workout_app.db");

      // Create version table if it doesn't exist
      await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS db_version (
                    version INTEGER PRIMARY KEY
                );
            `);

      // Check current version
      const versionResult = await this.db.getAllAsync(
        "SELECT version FROM db_version LIMIT 1"
      );
      const currentVersion =
        versionResult.length > 0 ? versionResult[0].version : 0;

      if (currentVersion < this.currentVersion) {
        // Drop existing tables if upgrading
        await this.db.execAsync(`
                    DROP TABLE IF EXISTS workout_exercises;
                    DROP TABLE IF EXISTS sets;
                    DROP TABLE IF EXISTS workouts;
                    DROP TABLE IF EXISTS template_exercises;
                    DROP TABLE IF EXISTS workout_templates;
                    DROP TABLE IF EXISTS exercises;
                `);
      }

      await this.db.execAsync(`
                -- All DATETIME fields store ISO8601 strings with timezone information
                -- Format: YYYY-MM-DDTHH:mm:ss.sssZ
                -- Example: 2024-03-14T12:00:00.000Z

                CREATE TABLE IF NOT EXISTS exercises (
                    exercise_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    instruction TEXT,
                    muscle_group TEXT,
                    equipment TEXT,
                    media_url TEXT,
                    is_public INTEGER DEFAULT 0,
                    created_by TEXT,
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                    sync_status TEXT DEFAULT 'synced'
                        CHECK (sync_status IN ('synced', 'pending_sync', 'pending_delete')),
                    version INTEGER DEFAULT 1,
                    last_synced_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
                );

                CREATE TABLE IF NOT EXISTS workouts (
                    workout_id TEXT PRIMARY KEY,
                    user_id TEXT,
                    name TEXT,
                    date_performed DATETIME,
                    duration INTEGER,
                    created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
                    updated_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                    sync_status TEXT DEFAULT 'synced'
                        CHECK (sync_status IN ('synced', 'pending_sync', 'pending_delete')),
                    version INTEGER DEFAULT 1,
                    last_synced_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
                );

                CREATE TABLE IF NOT EXISTS workout_exercises (
                    workout_exercises_id TEXT PRIMARY KEY,
                    workout_id TEXT NOT NULL,
                    exercise_id TEXT NOT NULL,
                    exercise_order INTEGER,
                    notes TEXT,
                    created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
                    updated_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                    sync_status TEXT DEFAULT 'synced'
                        CHECK (sync_status IN ('synced', 'pending_sync', 'pending_delete')),
                    version INTEGER DEFAULT 1,
                    last_synced_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                    FOREIGN KEY (workout_id) REFERENCES workouts (workout_id) ON DELETE CASCADE,
                    FOREIGN KEY (exercise_id) REFERENCES exercises (exercise_id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS sets (
                    set_id TEXT PRIMARY KEY,
                    workout_id TEXT NOT NULL,
                    workout_exercises_id TEXT,
                    weight REAL,
                    reps INTEGER,
                    rir INTEGER,
                    set_order INTEGER,
                    created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
                    updated_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                    sync_status TEXT DEFAULT 'synced'
                        CHECK (sync_status IN ('synced', 'pending_sync', 'pending_delete')),
                    version INTEGER DEFAULT 1,
                    last_synced_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                    FOREIGN KEY (workout_id) REFERENCES workouts (workout_id) ON DELETE CASCADE,
                    FOREIGN KEY (workout_exercises_id) REFERENCES workout_exercises (workout_exercises_id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS workout_templates (
                    template_id TEXT PRIMARY KEY,
                    name TEXT,
                    created_by TEXT,
                    is_public INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
                    updated_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                    sync_status TEXT DEFAULT 'synced'
                        CHECK (sync_status IN ('synced', 'pending_sync', 'pending_delete')),
                    version INTEGER DEFAULT 1,
                    last_synced_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
                );

                CREATE TABLE IF NOT EXISTS template_exercises (
                    template_exercise_id TEXT PRIMARY KEY,
                    template_id TEXT NOT NULL,
                    exercise_id TEXT NOT NULL,
                    exercise_order INTEGER,
                    sets INTEGER,
                    created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
                    updated_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                    sync_status TEXT DEFAULT 'synced'
                        CHECK (sync_status IN ('synced', 'pending_sync', 'pending_delete')),
                    version INTEGER DEFAULT 1,
                    last_synced_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                    FOREIGN KEY (template_id) REFERENCES workout_templates (template_id) ON DELETE CASCADE,
                    FOREIGN KEY (exercise_id) REFERENCES exercises (exercise_id) ON DELETE CASCADE
                );

                -- Create indexes for sync operations and common queries
                CREATE INDEX IF NOT EXISTS idx_workouts_sync_status ON workouts(sync_status);
                CREATE INDEX IF NOT EXISTS idx_exercises_sync_status ON exercises(sync_status);
                CREATE INDEX IF NOT EXISTS idx_workout_exercises_sync_status ON workout_exercises(sync_status);
                CREATE INDEX IF NOT EXISTS idx_sets_sync_status ON sets(sync_status);
                CREATE INDEX IF NOT EXISTS idx_templates_sync_status ON workout_templates(sync_status);
                CREATE INDEX IF NOT EXISTS idx_template_exercises_sync_status ON template_exercises(sync_status);

                -- Create indexes for date-based queries
                CREATE INDEX IF NOT EXISTS idx_workouts_date_performed ON workouts(date_performed);
                CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON workouts(created_at);
                CREATE INDEX IF NOT EXISTS idx_exercises_created_at ON exercises(created_at);
            `);

      // Update database version
      await this.db.execAsync(
        `
                DELETE FROM db_version;
                INSERT INTO db_version (version) VALUES (?);
            `,
        [this.currentVersion]
      );

      console.log(
        "Database initialized successfully at version",
        this.currentVersion
      );
    } catch (error) {
      console.error("Database initialization failed:", error);
      throw error;
    }
  }

  async query(sql, params = []) {
    try {
      await this.initializationPromise;
      if (!this.db) {
        throw new Error("Database not initialized");
      }

      const result = await this.db.getAllAsync(sql, params);
      return result;
    } catch (error) {
      console.error("Query failed:", error);
      throw error;
    }
  }

  async execute(sql, params = []) {
    try {
      await this.initializationPromise;
      if (!this.db) {
        throw new Error("Database not initialized");
      }

      const result = await this.db.runAsync(sql, params);
      return {
        rowsAffected: result.changes,
        insertId: result.lastInsertRowId,
      };
    } catch (error) {
      console.error("Execute failed:", error);
      throw error;
    }
  }

  async close() {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

export const dbManager = new DatabaseManager();
