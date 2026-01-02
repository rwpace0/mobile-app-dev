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
      const [versionRow] = await this.db.getAllAsync(
        "SELECT version FROM db_version ORDER BY version DESC LIMIT 1"
      );
      const currentVersion = versionRow ? versionRow.version : 0;
      console.log(
        `[DatabaseManager] Current database version: ${currentVersion}`
      );

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
                    template_id TEXT,
                    created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
                    updated_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                    sync_status TEXT DEFAULT 'synced'
                        CHECK (sync_status IN ('synced', 'pending_sync', 'pending_delete')),
                    version INTEGER DEFAULT 1,
                    last_synced_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                    FOREIGN KEY (template_id) REFERENCES workout_templates (template_id) ON DELETE SET NULL
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
                    weight REAL,
                    reps INTEGER,
                    rep_range_min INTEGER,
                    rep_range_max INTEGER,
                    rir INTEGER,
                    rir_range_min INTEGER,
                    rir_range_max INTEGER,
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
        const version1Results = await this.db.getAllAsync(
          "SELECT 1 FROM db_version WHERE version = 1"
        );
        if (version1Results.length === 0) {
          await this.db.execAsync(
            "INSERT INTO db_version (version) VALUES (1)"
          );
        }
      }

      if (currentVersion < 2) {
        // Add local_media_path if it doesn't exist
        try {
          await this.db.execAsync(
            "ALTER TABLE exercises ADD COLUMN local_media_path TEXT;"
          );
        } catch (e) {
          // Column might already exist, that's fine
        }

        // Add template_id to workouts table if it doesn't exist
        try {
          await this.db.execAsync(
            "ALTER TABLE workouts ADD COLUMN template_id TEXT;"
          );
          console.log(
            "[DatabaseManager] Added template_id column to workouts table"
          );
        } catch (e) {
          // Column might already exist, that's fine
          console.log(
            "[DatabaseManager] template_id column already exists or failed to add:",
            e.message
          );
        }

        // Update version - check if version 2 exists first
        const version2Results = await this.db.getAllAsync(
          "SELECT 1 FROM db_version WHERE version = 2"
        );
        if (version2Results.length === 0) {
          await this.db.execAsync(
            "INSERT INTO db_version (version) VALUES (2)"
          );
        }
      }

      // Force check for sync_priority column and add if missing (regardless of version)
      // This handles cases where cache was reset but migration state is inconsistent
      try {
        const tableInfo = await this.db.getAllAsync(
          "PRAGMA table_info(exercises)"
        );
        const hasSyncPriority = tableInfo.some(
          (col) => col.name === "sync_priority"
        );

        if (!hasSyncPriority) {
          console.log("Adding missing sync_priority column to exercises table");
          await this.db.execAsync(
            "ALTER TABLE exercises ADD COLUMN sync_priority TEXT;"
          );
          console.log("Successfully added sync_priority column");
        }
      } catch (error) {
        console.error("Error checking/adding sync_priority column:", error);
        throw error;
      }

      // Force check for template_id column and add if missing (regardless of version)
      // This handles cases where the column is missing from existing databases
      try {
        const workoutsTableInfo = await this.db.getAllAsync(
          "PRAGMA table_info(workouts)"
        );
        const hasTemplateId = workoutsTableInfo.some(
          (col) => col.name === "template_id"
        );

        if (!hasTemplateId) {
          console.log(
            "[DatabaseManager] Adding missing template_id column to workouts table"
          );
          await this.db.execAsync(
            "ALTER TABLE workouts ADD COLUMN template_id TEXT;"
          );
          console.log(
            "[DatabaseManager] Successfully added template_id column"
          );
        } else {
        }
      } catch (error) {
        console.error(
          "[DatabaseManager] Error checking/adding template_id column:",
          error
        );
        throw error;
      }

      if (currentVersion < 3) {
        console.log("Updating to database version 3");

        // Update version
        const version3Results = await this.db.getAllAsync(
          "SELECT 1 FROM db_version WHERE version = 3"
        );
        if (version3Results.length === 0) {
          await this.db.execAsync(
            "INSERT INTO db_version (version) VALUES (3)"
          );
          console.log("Database version updated to 3");
        }
      }

      if (currentVersion < 4) {
        console.log("[DatabaseManager] Updating to database version 4");

        // Add secondary_muscle_groups column to exercises table
        try {
          await this.db.execAsync(
            "ALTER TABLE exercises ADD COLUMN secondary_muscle_groups TEXT;"
          );
          console.log(
            "[DatabaseManager] Added secondary_muscle_groups column to exercises table"
          );
        } catch (e) {
          console.log(
            "[DatabaseManager] secondary_muscle_groups column already exists or failed to add:",
            e.message
          );
        }

        // Update version
        const version4Results = await this.db.getAllAsync(
          "SELECT 1 FROM db_version WHERE version = 4"
        );
        if (version4Results.length === 0) {
          await this.db.execAsync(
            "INSERT INTO db_version (version) VALUES (4)"
          );
          console.log("[DatabaseManager] Database version updated to 4");
        }
      }

      if (currentVersion < 5) {
        console.log("[DatabaseManager] Updating to database version 5");

        // Create workout_plans table
        try {
          await this.db.execAsync(`
            CREATE TABLE IF NOT EXISTS workout_plans (
              plan_id TEXT PRIMARY KEY,
              user_id TEXT,
              name TEXT,
              is_active INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
              updated_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
              sync_status TEXT DEFAULT 'synced'
                CHECK (sync_status IN ('synced', 'pending_sync', 'pending_delete')),
              version INTEGER DEFAULT 1,
              last_synced_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
            );

            CREATE TABLE IF NOT EXISTS plan_schedule (
              schedule_id TEXT PRIMARY KEY,
              plan_id TEXT NOT NULL,
              day_of_week INTEGER NOT NULL,
              template_id TEXT,
              created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
              updated_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
              sync_status TEXT DEFAULT 'synced'
                CHECK (sync_status IN ('synced', 'pending_sync', 'pending_delete')),
              version INTEGER DEFAULT 1,
              last_synced_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
              FOREIGN KEY (plan_id) REFERENCES workout_plans (plan_id) ON DELETE CASCADE,
              FOREIGN KEY (template_id) REFERENCES workout_templates (template_id) ON DELETE SET NULL
            );

            CREATE INDEX IF NOT EXISTS idx_workout_plans_user_active ON workout_plans(user_id, is_active);
            CREATE INDEX IF NOT EXISTS idx_plan_schedule_plan ON plan_schedule(plan_id);
            CREATE INDEX IF NOT EXISTS idx_plan_schedule_day ON plan_schedule(day_of_week);
          `);
          console.log(
            "[DatabaseManager] Added workout_plans and plan_schedule tables"
          );
        } catch (e) {
          console.log(
            "[DatabaseManager] workout_plans tables already exist or failed to add:",
            e.message
          );
        }

        // Update version
        const version5Results = await this.db.getAllAsync(
          "SELECT 1 FROM db_version WHERE version = 5"
        );
        if (version5Results.length === 0) {
          await this.db.execAsync(
            "INSERT INTO db_version (version) VALUES (5)"
          );
          console.log("[DatabaseManager] Database version updated to 5");
        }
      }

      if (currentVersion < 6) {
        console.log("[DatabaseManager] Updating to database version 6");

        // Add pattern fields to workout_plans table
        try {
          await this.db.execAsync(
            "ALTER TABLE workout_plans ADD COLUMN start_date DATETIME;"
          );
          console.log(
            "[DatabaseManager] Added start_date column to workout_plans table"
          );
        } catch (e) {
          console.log(
            "[DatabaseManager] start_date column already exists or failed to add:",
            e.message
          );
        }

        try {
          await this.db.execAsync(
            "ALTER TABLE workout_plans ADD COLUMN pattern_length INTEGER;"
          );
          console.log(
            "[DatabaseManager] Added pattern_length column to workout_plans table"
          );
        } catch (e) {
          console.log(
            "[DatabaseManager] pattern_length column already exists or failed to add:",
            e.message
          );
        }

        // Add pattern_position to plan_schedule table
        try {
          await this.db.execAsync(
            "ALTER TABLE plan_schedule ADD COLUMN pattern_position INTEGER;"
          );
          console.log(
            "[DatabaseManager] Added pattern_position column to plan_schedule table"
          );
        } catch (e) {
          console.log(
            "[DatabaseManager] pattern_position column already exists or failed to add:",
            e.message
          );
        }

        // Create indexes for new pattern fields
        try {
          await this.db.execAsync(`
            CREATE INDEX IF NOT EXISTS idx_plan_schedule_pattern ON plan_schedule(plan_id, pattern_position);
            CREATE INDEX IF NOT EXISTS idx_workout_plans_pattern ON workout_plans(pattern_length, start_date);
          `);
          console.log("[DatabaseManager] Created indexes for pattern fields");
        } catch (e) {
          console.log(
            "[DatabaseManager] Pattern indexes already exist or failed to create:",
            e.message
          );
        }

        // Update version
        const version6Results = await this.db.getAllAsync(
          "SELECT 1 FROM db_version WHERE version = 6"
        );
        if (version6Results.length === 0) {
          await this.db.execAsync(
            "INSERT INTO db_version (version) VALUES (6)"
          );
          console.log("[DatabaseManager] Database version updated to 6");
        }
      }

      if (currentVersion < 7) {
        console.log("[DatabaseManager] Updating to database version 7");

        // Add display_order column to workout_templates table
        try {
          await this.db.execAsync(
            "ALTER TABLE workout_templates ADD COLUMN display_order INTEGER;"
          );
          console.log(
            "[DatabaseManager] Added display_order column to workout_templates table"
          );
        } catch (e) {
          console.log(
            "[DatabaseManager] display_order column already exists or failed to add:",
            e.message
          );
        }

        // Update version
        const version7Results = await this.db.getAllAsync(
          "SELECT 1 FROM db_version WHERE version = 7"
        );
        if (version7Results.length === 0) {
          await this.db.execAsync(
            "INSERT INTO db_version (version) VALUES (7)"
          );
          console.log("[DatabaseManager] Database version updated to 7");
        }
      }

      if (currentVersion < 8) {
        console.log("[DatabaseManager] Updating to database version 8");

        // Add weight, reps, rep ranges, RIR, and RIR ranges to template_exercises table
        try {
          await this.db.execAsync(
            "ALTER TABLE template_exercises ADD COLUMN weight REAL;"
          );
          console.log(
            "[DatabaseManager] Added weight column to template_exercises table"
          );
        } catch (e) {
          console.log(
            "[DatabaseManager] weight column already exists or failed to add:",
            e.message
          );
        }

        try {
          await this.db.execAsync(
            "ALTER TABLE template_exercises ADD COLUMN reps INTEGER;"
          );
          console.log(
            "[DatabaseManager] Added reps column to template_exercises table"
          );
        } catch (e) {
          console.log(
            "[DatabaseManager] reps column already exists or failed to add:",
            e.message
          );
        }

        try {
          await this.db.execAsync(
            "ALTER TABLE template_exercises ADD COLUMN rep_range_min INTEGER;"
          );
          console.log(
            "[DatabaseManager] Added rep_range_min column to template_exercises table"
          );
        } catch (e) {
          console.log(
            "[DatabaseManager] rep_range_min column already exists or failed to add:",
            e.message
          );
        }

        try {
          await this.db.execAsync(
            "ALTER TABLE template_exercises ADD COLUMN rep_range_max INTEGER;"
          );
          console.log(
            "[DatabaseManager] Added rep_range_max column to template_exercises table"
          );
        } catch (e) {
          console.log(
            "[DatabaseManager] rep_range_max column already exists or failed to add:",
            e.message
          );
        }

        try {
          await this.db.execAsync(
            "ALTER TABLE template_exercises ADD COLUMN rir INTEGER;"
          );
          console.log(
            "[DatabaseManager] Added rir column to template_exercises table"
          );
        } catch (e) {
          console.log(
            "[DatabaseManager] rir column already exists or failed to add:",
            e.message
          );
        }

        try {
          await this.db.execAsync(
            "ALTER TABLE template_exercises ADD COLUMN rir_range_min INTEGER;"
          );
          console.log(
            "[DatabaseManager] Added rir_range_min column to template_exercises table"
          );
        } catch (e) {
          console.log(
            "[DatabaseManager] rir_range_min column already exists or failed to add:",
            e.message
          );
        }

        try {
          await this.db.execAsync(
            "ALTER TABLE template_exercises ADD COLUMN rir_range_max INTEGER;"
          );
          console.log(
            "[DatabaseManager] Added rir_range_max column to template_exercises table"
          );
        } catch (e) {
          console.log(
            "[DatabaseManager] rir_range_max column already exists or failed to add:",
            e.message
          );
        }

        // Update version
        const version8Results = await this.db.getAllAsync(
          "SELECT 1 FROM db_version WHERE version = 8"
        );
        if (version8Results.length === 0) {
          await this.db.execAsync(
            "INSERT INTO db_version (version) VALUES (8)"
          );
          console.log("[DatabaseManager] Database version updated to 8");
        }
      }

      // Force check for secondary_muscle_groups column and add if missing (regardless of version)
      try {
        const tableInfo = await this.db.getAllAsync(
          "PRAGMA table_info(exercises)"
        );
        const hasSecondaryMuscleGroups = tableInfo.some(
          (col) => col.name === "secondary_muscle_groups"
        );

        if (!hasSecondaryMuscleGroups) {
          console.log(
            "[DatabaseManager] Adding missing secondary_muscle_groups column to exercises table"
          );
          await this.db.execAsync(
            "ALTER TABLE exercises ADD COLUMN secondary_muscle_groups TEXT;"
          );
          console.log(
            "[DatabaseManager] Successfully added secondary_muscle_groups column"
          );
        }
      } catch (error) {
        console.error(
          "[DatabaseManager] Error checking/adding secondary_muscle_groups column:",
          error
        );
        throw error;
      }

      // Force check for template_exercises columns from version 8 and add if missing (regardless of version)
      try {
        const templateExercisesTableInfo = await this.db.getAllAsync(
          "PRAGMA table_info(template_exercises)"
        );
        const columnNames = templateExercisesTableInfo.map((col) => col.name);

        const requiredColumns = [
          { name: "weight", type: "REAL" },
          { name: "reps", type: "INTEGER" },
          { name: "rep_range_min", type: "INTEGER" },
          { name: "rep_range_max", type: "INTEGER" },
          { name: "rir", type: "INTEGER" },
          { name: "rir_range_min", type: "INTEGER" },
          { name: "rir_range_max", type: "INTEGER" },
        ];

        for (const column of requiredColumns) {
          if (!columnNames.includes(column.name)) {
            console.log(
              `[DatabaseManager] Adding missing ${column.name} column to template_exercises table`
            );
            try {
              await this.db.execAsync(
                `ALTER TABLE template_exercises ADD COLUMN ${column.name} ${column.type};`
              );
              console.log(
                `[DatabaseManager] Successfully added ${column.name} column`
              );
            } catch (e) {
              console.log(
                `[DatabaseManager] ${column.name} column already exists or failed to add:`,
                e.message
              );
            }
          }
        }
      } catch (error) {
        console.error(
          "[DatabaseManager] Error checking/adding template_exercises columns:",
          error
        );
        // Don't throw - continue with initialization
      }

      // Defensive check: Ensure all core tables exist even if version check failed
      // This handles cases where version is set but tables don't exist
      try {
        const tables = await this.db.getAllAsync(
          "SELECT name FROM sqlite_master WHERE type='table'"
        );
        const tableNames = tables.map((t) => t.name);
        const requiredTables = [
          "exercises",
          "profiles",
          "workouts",
          "workout_exercises",
          "sets",
          "workout_templates",
          "template_exercises",
          "workout_summaries",
          "workout_plans",
          "plan_schedule",
        ];

        const missingTables = requiredTables.filter(
          (table) => !tableNames.includes(table)
        );

        if (missingTables.length > 0) {
          console.log(
            `[DatabaseManager] Missing tables detected: ${missingTables.join(
              ", "
            )}. Recreating...`
          );

          // Check if missing tables include workout_plans or plan_schedule
          const needsPlanTables =
            missingTables.includes("workout_plans") ||
            missingTables.includes("plan_schedule");

          if (needsPlanTables) {
            console.log("[DatabaseManager] Creating missing plan tables...");
            await this.db.execAsync(`
              CREATE TABLE IF NOT EXISTS workout_plans (
                plan_id TEXT PRIMARY KEY,
                user_id TEXT,
                name TEXT,
                is_active INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
                updated_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                sync_status TEXT DEFAULT 'synced'
                  CHECK (sync_status IN ('synced', 'pending_sync', 'pending_delete')),
                version INTEGER DEFAULT 1,
                last_synced_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
              );

              CREATE TABLE IF NOT EXISTS plan_schedule (
                schedule_id TEXT PRIMARY KEY,
                plan_id TEXT NOT NULL,
                day_of_week INTEGER NOT NULL,
                template_id TEXT,
                created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
                updated_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                sync_status TEXT DEFAULT 'synced'
                  CHECK (sync_status IN ('synced', 'pending_sync', 'pending_delete')),
                version INTEGER DEFAULT 1,
                last_synced_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                FOREIGN KEY (plan_id) REFERENCES workout_plans (plan_id) ON DELETE CASCADE,
                FOREIGN KEY (template_id) REFERENCES workout_templates (template_id) ON DELETE SET NULL
              );

              CREATE INDEX IF NOT EXISTS idx_workout_plans_user_active ON workout_plans(user_id, is_active);
              CREATE INDEX IF NOT EXISTS idx_plan_schedule_plan ON plan_schedule(plan_id);
              CREATE INDEX IF NOT EXISTS idx_plan_schedule_day ON plan_schedule(day_of_week);
            `);
            console.log("[DatabaseManager] Plan tables created successfully");
          }

          // Re-run version 1 migration to create missing core tables
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
                    template_id TEXT,
                    created_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
                    updated_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                    sync_status TEXT DEFAULT 'synced'
                        CHECK (sync_status IN ('synced', 'pending_sync', 'pending_delete')),
                    version INTEGER DEFAULT 1,
                    last_synced_at DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                    FOREIGN KEY (template_id) REFERENCES workout_templates (template_id) ON DELETE SET NULL
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
                    weight REAL,
                    reps INTEGER,
                    rep_range_min INTEGER,
                    rep_range_max INTEGER,
                    rir INTEGER,
                    rir_range_min INTEGER,
                    rir_range_max INTEGER,
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
          console.log(
            "[DatabaseManager] Successfully recreated missing tables"
          );
        }
      } catch (error) {
        console.error(
          "[DatabaseManager] Error checking/creating core tables:",
          error
        );
        // Don't throw - continue with initialization
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
          value = "NULL";
        } else if (typeof param === "string") {
          value = `'${param.replace(/'/g, "''")}'`; // Escape single quotes
        } else if (typeof param === "boolean") {
          value = param ? 1 : 0;
        }
        finalSql = finalSql.replace("?", value);
      });

      //console.log('[DatabaseManager] Final SQL:', finalSql);

      // Execute the query directly
      const result = await this.db.execAsync(finalSql);
      return {
        rowsAffected: result ? 1 : 0,
        insertId: null,
      };
    } catch (error) {
      console.error("Execute failed:", error);
      throw error;
    }
  }

  async clearAllData() {
    await this.initializationPromise;
    if (!this.db) throw new Error("Database not initialized");
    // Order matters due to foreign key constraints
    await this.db.execAsync("DELETE FROM sets");
    await this.db.execAsync("DELETE FROM workout_exercises");
    await this.db.execAsync("DELETE FROM workouts");
    await this.db.execAsync("DELETE FROM template_exercises");
    await this.db.execAsync("DELETE FROM workout_templates");
    await this.db.execAsync("DELETE FROM exercises");
    await this.db.execAsync("DELETE FROM profiles");
    await this.db.execAsync("DELETE FROM workout_summaries");
    await this.db.execAsync("DELETE FROM plan_schedule");
    await this.db.execAsync("DELETE FROM workout_plans");
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
