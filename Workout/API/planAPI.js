import "react-native-get-random-values";
import { dbManager } from "./local/dbManager";
import { v4 as uuid } from "uuid";
import { storage } from "./local/tokenStorage.js";

class PlanAPI {
  constructor() {
    this.db = dbManager;
    this.initializationPromise = this.db.initializationPromise;
  }

  async ensureInitialized() {
    await this.initializationPromise;
  }

  async getUserId() {
    const token = await storage.getItem("auth_token");
    if (!token) throw new Error("No auth token found");
    return JSON.parse(atob(token.split(".")[1])).sub;
  }

  // Create a new plan
  async createPlan(planData) {
    try {
      console.log("[PlanAPI] Creating new plan");
      await this.ensureInitialized();

      const userId = await this.getUserId();
      const plan_id = uuid();
      const now = new Date().toISOString();

      // First, deactivate any existing active plans for this user
      await this.db.execute(
        `UPDATE workout_plans SET is_active = 0 WHERE user_id = ? AND is_active = 1`,
        [userId]
      );

      // Create the new plan
      await this.db.execute(
        `INSERT INTO workout_plans 
        (plan_id, user_id, name, is_active, created_at, updated_at, sync_status, version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [plan_id, userId, planData.name, 1, now, now, "synced", 1]
      );

      console.log("[PlanAPI] Plan created successfully");
      return { plan_id, name: planData.name, is_active: 1, created_at: now };
    } catch (error) {
      console.error("[PlanAPI] Create plan error:", error);
      throw error;
    }
  }

  // Get the active plan with schedule
  async getActivePlan() {
    try {
      await this.ensureInitialized();
      const userId = await this.getUserId();

      const [plan] = await this.db.query(
        `SELECT * FROM workout_plans 
         WHERE user_id = ? AND is_active = 1
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId]
      );

      if (!plan) {
        return null;
      }

      // Get schedule for this plan
      const schedule = await this.db.query(
        `SELECT ps.*, wt.name as template_name
         FROM plan_schedule ps
         LEFT JOIN workout_templates wt ON ps.template_id = wt.template_id
         WHERE ps.plan_id = ?
         ORDER BY ps.day_of_week`,
        [plan.plan_id]
      );

      return {
        ...plan,
        schedule,
      };
    } catch (error) {
      console.error("[PlanAPI] Get active plan error:", error);
      throw error;
    }
  }

  // Update plan schedule - assign or remove templates from days
  async updatePlanSchedule(planId, dayOfWeek, templateId) {
    try {
      console.log(
        `[PlanAPI] Updating schedule for plan ${planId}, day ${dayOfWeek}`
      );
      await this.ensureInitialized();

      const now = new Date().toISOString();

      // Check if a schedule entry already exists for this day
      const [existingSchedule] = await this.db.query(
        `SELECT * FROM plan_schedule WHERE plan_id = ? AND day_of_week = ?`,
        [planId, dayOfWeek]
      );

      if (existingSchedule) {
        // Update existing schedule entry
        if (templateId === null) {
          // Set to rest day (null template)
          await this.db.execute(
            `UPDATE plan_schedule 
             SET template_id = NULL, updated_at = ?
             WHERE schedule_id = ?`,
            [now, existingSchedule.schedule_id]
          );
        } else {
          // Update with new template
          await this.db.execute(
            `UPDATE plan_schedule 
             SET template_id = ?, updated_at = ?
             WHERE schedule_id = ?`,
            [templateId, now, existingSchedule.schedule_id]
          );
        }
      } else {
        // Create new schedule entry
        const schedule_id = uuid();
        await this.db.execute(
          `INSERT INTO plan_schedule 
          (schedule_id, plan_id, day_of_week, template_id, created_at, updated_at, sync_status, version)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [schedule_id, planId, dayOfWeek, templateId, now, now, "synced", 1]
        );
      }

      console.log("[PlanAPI] Schedule updated successfully");
      return { success: true };
    } catch (error) {
      console.error("[PlanAPI] Update plan schedule error:", error);
      throw error;
    }
  }

  // Delete a plan and its schedule
  async deletePlan(planId) {
    try {
      console.log(`[PlanAPI] Deleting plan ${planId}`);
      await this.ensureInitialized();

      await this.db.execute("BEGIN TRANSACTION");

      // Delete schedule entries
      await this.db.execute(`DELETE FROM plan_schedule WHERE plan_id = ?`, [
        planId,
      ]);

      // Delete plan
      await this.db.execute(`DELETE FROM workout_plans WHERE plan_id = ?`, [
        planId,
      ]);

      await this.db.execute("COMMIT");

      console.log("[PlanAPI] Plan deleted successfully");
      return { success: true };
    } catch (error) {
      await this.db.execute("ROLLBACK");
      console.error("[PlanAPI] Delete plan error:", error);
      throw error;
    }
  }

  // Set a plan as active (deactivating others)
  async setActivePlan(planId) {
    try {
      console.log(`[PlanAPI] Setting plan ${planId} as active`);
      await this.ensureInitialized();

      const userId = await this.getUserId();
      const now = new Date().toISOString();

      await this.db.execute("BEGIN TRANSACTION");

      // Deactivate all plans for this user
      await this.db.execute(
        `UPDATE workout_plans SET is_active = 0, updated_at = ? WHERE user_id = ?`,
        [now, userId]
      );

      // Activate the specified plan
      await this.db.execute(
        `UPDATE workout_plans SET is_active = 1, updated_at = ? WHERE plan_id = ?`,
        [now, planId]
      );

      await this.db.execute("COMMIT");

      console.log("[PlanAPI] Plan activated successfully");
      return { success: true };
    } catch (error) {
      await this.db.execute("ROLLBACK");
      console.error("[PlanAPI] Set active plan error:", error);
      throw error;
    }
  }

  // Get today's workout template
  async getTodaysWorkout() {
    try {
      await this.ensureInitialized();

      const activePlan = await this.getActivePlan();
      if (!activePlan || !activePlan.schedule) {
        return null;
      }

      // Get current day of week (0 = Sunday, 6 = Saturday)
      const today = new Date().getDay();

      // Find schedule entry for today
      const todaySchedule = activePlan.schedule.find(
        (s) => s.day_of_week === today
      );

      if (!todaySchedule || !todaySchedule.template_id) {
        return null; // Rest day or not scheduled
      }

      // Get the full template details
      const [template] = await this.db.query(
        `SELECT t.template_id, t.name, t.created_by, t.is_public, t.created_at, t.updated_at,
          t.sync_status, t.version, t.last_synced_at,
          CASE 
            WHEN COUNT(te.template_exercise_id) = 0 THEN '[]'
            ELSE json_group_array(
              CASE 
                WHEN te.template_exercise_id IS NULL THEN NULL
                ELSE json_object(
                  'template_exercise_id', te.template_exercise_id,
                  'exercise_id', te.exercise_id,
                  'exercise_order', te.exercise_order,
                  'sets', te.sets,
                  'created_at', te.created_at,
                  'updated_at', te.updated_at
                )
              END
            )
          END as exercises
        FROM workout_templates t
        LEFT JOIN template_exercises te ON t.template_id = te.template_id
        WHERE t.template_id = ? AND t.sync_status != 'pending_delete'
        GROUP BY t.template_id`,
        [todaySchedule.template_id]
      );

      if (!template) {
        return null;
      }

      // Parse exercises JSON
      let exercises = [];
      if (template.exercises) {
        try {
          const parsed = JSON.parse(template.exercises);
          exercises = Array.isArray(parsed)
            ? parsed.filter((ex) => ex && ex.exercise_id)
            : [];
        } catch (error) {
          console.error(
            `[PlanAPI] Error parsing exercises for template ${template.template_id}:`,
            error
          );
          exercises = [];
        }
      }

      return {
        ...template,
        exercises,
      };
    } catch (error) {
      console.error("[PlanAPI] Get today's workout error:", error);
      throw error;
    }
  }

  // Calculate weekly volume (sets per muscle group)
  async getWeeklyVolume(planId) {
    try {
      await this.ensureInitialized();

      // Get all templates scheduled in the plan
      const scheduleEntries = await this.db.query(
        `SELECT DISTINCT template_id FROM plan_schedule 
         WHERE plan_id = ? AND template_id IS NOT NULL`,
        [planId]
      );

      if (scheduleEntries.length === 0) {
        return {};
      }

      const templateIds = scheduleEntries.map((entry) => entry.template_id);
      const placeholders = templateIds.map(() => "?").join(",");

      // Get all exercises in these templates with their muscle groups
      const exercises = await this.db.query(
        `SELECT 
          e.muscle_group,
          e.secondary_muscle_groups,
          te.sets
         FROM template_exercises te
         JOIN exercises e ON te.exercise_id = e.exercise_id
         WHERE te.template_id IN (${placeholders})`,
        templateIds
      );

      // Calculate volume per muscle group
      const volumeMap = {};

      exercises.forEach((exercise) => {
        // Primary muscle group
        if (exercise.muscle_group) {
          const muscle = exercise.muscle_group;
          volumeMap[muscle] = (volumeMap[muscle] || 0) + (exercise.sets || 0);
        }

        // Secondary muscle groups
        if (exercise.secondary_muscle_groups) {
          try {
            const secondaryMuscles = JSON.parse(
              exercise.secondary_muscle_groups
            );
            if (Array.isArray(secondaryMuscles)) {
              secondaryMuscles.forEach((muscle) => {
                // Count secondary muscles at half volume
                volumeMap[muscle] =
                  (volumeMap[muscle] || 0) + (exercise.sets || 0) * 0.5;
              });
            }
          } catch (error) {
            console.error(
              "[PlanAPI] Error parsing secondary muscle groups:",
              error
            );
          }
        }
      });

      // Round all volumes to nearest integer
      Object.keys(volumeMap).forEach((muscle) => {
        volumeMap[muscle] = Math.round(volumeMap[muscle]);
      });

      return volumeMap;
    } catch (error) {
      console.error("[PlanAPI] Get weekly volume error:", error);
      throw error;
    }
  }

  // Get all templates for display in plan page
  async getAllTemplates() {
    try {
      await this.ensureInitialized();

      const templates = await this.db.query(
        `SELECT t.template_id, t.name, t.created_by, t.is_public, t.created_at, t.updated_at,
          CASE 
            WHEN COUNT(te.template_exercise_id) = 0 THEN '[]'
            ELSE json_group_array(
              CASE 
                WHEN te.template_exercise_id IS NULL THEN NULL
                ELSE json_object(
                  'template_exercise_id', te.template_exercise_id,
                  'exercise_id', te.exercise_id,
                  'exercise_order', te.exercise_order,
                  'sets', te.sets
                )
              END
            )
          END as exercises
        FROM workout_templates t
        LEFT JOIN template_exercises te ON t.template_id = te.template_id
        WHERE t.sync_status != 'pending_delete'
        GROUP BY t.template_id
        ORDER BY t.created_at DESC`
      );

      return templates.map((template) => {
        let exercises = [];
        if (template.exercises) {
          try {
            const parsed = JSON.parse(template.exercises);
            exercises = Array.isArray(parsed)
              ? parsed.filter((ex) => ex && ex.exercise_id)
              : [];
          } catch (error) {
            console.error(
              `[PlanAPI] Error parsing exercises for template ${template.template_id}:`,
              error
            );
            exercises = [];
          }
        }

        return {
          ...template,
          exercises,
        };
      });
    } catch (error) {
      console.error("[PlanAPI] Get all templates error:", error);
      throw error;
    }
  }
}

export default new PlanAPI();

