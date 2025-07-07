import * as SQLite from "expo-sqlite";

class DatabaseManager {
  constructor() {
    this.db = null;
    this.initializationPromise = this.initDatabase();
  }

  async initDatabase() {
    try {
      // For Expo SQLite v13+
      this.db = await SQLite.openDatabaseAsync("workout_app.db");

      // Create version table if it doesn't exist
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS db_version (
          version INTEGER PRIMARY KEY,
          updated_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
      `);

      // Check current version
      const [versionRow] = await this.db.getAllAsync('SELECT version FROM db_version ORDER BY version DESC LIMIT 1');
      const currentVersion = versionRow ? versionRow.version : 0;
      console.log(`[DatabaseManager] Current database version: ${currentVersion}`);

      if (currentVersion < 1) {
        // Initial schema
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
                    local_media_path TEXT,
                    is_public INTEGER DEFAULT 0,
                    created_by TEXT,
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                    sync_status TEXT DEFAULT 'synced'
                        CHECK (sync_status IN ('synced', 'pending_sync', 'pending_delete')),
                    version INTEGER DEFAULT 1,
                    last_synced_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
                );

                -- Add local_media_path column if it doesn't exist
                ALTER TABLE exercises ADD COLUMN IF NOT EXISTS local_media_path TEXT;

                CREATE TABLE IF NOT EXISTS profiles (
                    user_id TEXT PRIMARY KEY,
                    username TEXT UNIQUE,
                    display_name TEXT,
                    avatar_url TEXT,
                    local_avatar_path TEXT,
                    is_public INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                    updated_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                    user_email TEXT UNIQUE,
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

                CREATE TABLE IF NOT EXISTS workout_summaries (
                    workout_id TEXT PRIMARY KEY,
                    summary_data TEXT,
                    total_volume REAL,
                    exercise_count INTEGER,
                    last_calculated_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                    FOREIGN KEY (workout_id) REFERENCES workouts (workout_id) ON DELETE CASCADE
                );

                -- Create indexes for sync operations and common queries
                CREATE INDEX IF NOT EXISTS idx_workouts_sync_status ON workouts(sync_status);
                CREATE INDEX IF NOT EXISTS idx_exercises_sync_status ON exercises(sync_status);
                CREATE INDEX IF NOT EXISTS idx_workout_exercises_sync_status ON workout_exercises(sync_status);
                CREATE INDEX IF NOT EXISTS idx_sets_sync_status ON sets(sync_status);
                CREATE INDEX IF NOT EXISTS idx_templates_sync_status ON workout_templates(sync_status);
                CREATE INDEX IF NOT EXISTS idx_template_exercises_sync_status ON template_exercises(sync_status);

                -- Enhanced indexes for performance optimization
                CREATE INDEX IF NOT EXISTS idx_workouts_date_user ON workouts(date_performed DESC, user_id, sync_status);
                CREATE INDEX IF NOT EXISTS idx_workout_exercises_order ON workout_exercises(workout_id, exercise_order);
                CREATE INDEX IF NOT EXISTS idx_sets_order ON sets(workout_exercises_id, set_order);
                CREATE INDEX IF NOT EXISTS idx_summaries_calc ON workout_summaries(workout_id, last_calculated_at);

                -- Create indexes for date-based queries
                CREATE INDEX IF NOT EXISTS idx_workouts_date_performed ON workouts(date_performed);
                CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON workouts(created_at);
                CREATE INDEX IF NOT EXISTS idx_exercises_created_at ON exercises(created_at);

                -- For user-specific queries
                CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, date_performed DESC);
                -- For exercise statistics
                CREATE INDEX IF NOT EXISTS idx_sets_exercise ON sets(workout_exercises_id, weight, reps);
            `);

        // Update version - check if version 1 exists first
        const [version1Exists] = await this.db.getAllAsync('SELECT 1 FROM db_version WHERE version = 1');
        if (!version1Exists) {
          await this.db.execAsync('INSERT INTO db_version (version) VALUES (1)');
        }
      }

      if (currentVersion < 2) {
        // Add local_media_path if it doesn't exist
        try {
          await this.db.execAsync('ALTER TABLE exercises ADD COLUMN local_media_path TEXT;');
        } catch (e) {
          // Column might already exist, that's fine
        }

        // Update version - check if version 2 exists first
        const [version2Exists] = await this.db.getAllAsync('SELECT 1 FROM db_version WHERE version = 2');
        if (!version2Exists) {
          await this.db.execAsync('INSERT INTO db_version (version) VALUES (2)');
        }
      }

      // Force check for sync_priority column and add if missing (regardless of version)
      // This handles cases where cache was reset but migration state is inconsistent
      try {
        const tableInfo = await this.db.getAllAsync('PRAGMA table_info(exercises)');
        const hasSyncPriority = tableInfo.some(col => col.name === 'sync_priority');
        console.log(`[DatabaseManager] sync_priority column exists: ${hasSyncPriority}`);
        
        if (!hasSyncPriority) {
          console.log('Adding missing sync_priority column to exercises table');
          await this.db.execAsync('ALTER TABLE exercises ADD COLUMN sync_priority TEXT;');
          console.log('Successfully added sync_priority column');
        }
      } catch (error) {
        console.error('Error checking/adding sync_priority column:', error);
        throw error;
      }

      if (currentVersion < 3) {
        console.log('Updating to database version 3');
        
        // Update version
        const [version3Exists] = await this.db.getAllAsync('SELECT 1 FROM db_version WHERE version = 3');
        if (!version3Exists) {
          await this.db.execAsync('INSERT INTO db_version (version) VALUES (3)');
          console.log('Database version updated to 3');
        }
      }

      console.log("Database initialized successfully");
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

      // Replace placeholders with actual values to avoid parameter binding issues
      let finalSql = sql;
      params.forEach((param, index) => {
        let value = param;
        if (param === undefined || param === null) {
          value = 'NULL';
        } else if (typeof param === 'string') {
          value = `'${param.replace(/'/g, "''")}'`; // Escape single quotes
        } else if (typeof param === 'boolean') {
          value = param ? 1 : 0;
        }
        finalSql = finalSql.replace('?', value);
      });

      console.log('[DatabaseManager] Final SQL:', finalSql);
      
      // Execute the query directly
      const result = await this.db.execAsync(finalSql);
      return {
        rowsAffected: result ? 1 : 0,
        insertId: null
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

  async reload() {
    await this.close();
    this.initializationPromise = this.initDatabase();
    await this.initializationPromise;
  }
}

export const dbManager = new DatabaseManager();

// Force a database reload when the module is imported
dbManager.reload().catch(console.error);
