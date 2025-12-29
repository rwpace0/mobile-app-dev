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

      // Create the new plan with pattern support
      await this.db.execute(
        `INSERT INTO workout_plans 
        (plan_id, user_id, name, is_active, start_date, pattern_length, created_at, updated_at, sync_status, version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          plan_id,
          userId,
          planData.name,
          1,
          planData.startDate || new Date().toISOString(),
          planData.patternLength || 7,
          now,
          now,
          "synced",
          1,
        ]
      );

      // Create schedule entries if provided
      if (planData.schedule && Array.isArray(planData.schedule)) {
        for (const scheduleItem of planData.schedule) {
          const schedule_id = uuid();
          await this.db.execute(
            `INSERT INTO plan_schedule 
            (schedule_id, plan_id, day_of_week, pattern_position, template_id, created_at, updated_at, sync_status, version)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              schedule_id,
              plan_id,
              scheduleItem.pattern_position, // Use pattern_position as day_of_week for backward compatibility
              scheduleItem.pattern_position,
              scheduleItem.template_id,
              now,
              now,
              "synced",
              1,
            ]
          );
        }
      }

      console.log("[PlanAPI] Plan created successfully");
      return {
        plan_id,
        name: planData.name,
        is_active: 1,
        start_date: planData.startDate || new Date().toISOString(),
        pattern_length: planData.patternLength || 7,
        created_at: now,
      };
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

      // Get schedule for this plan - prioritize pattern_position, fallback to day_of_week
      const schedule = await this.db.query(
        `SELECT ps.*, wt.name as template_name
         FROM plan_schedule ps
         LEFT JOIN workout_templates wt ON ps.template_id = wt.template_id
         WHERE ps.plan_id = ?
         ORDER BY COALESCE(ps.pattern_position, ps.day_of_week)`,
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

  // Update pattern position for a specific schedule entry
  async updateSchedulePatternPosition(scheduleId, newPatternPosition) {
    try {
      await this.ensureInitialized();
      const now = new Date().toISOString();

      await this.db.execute(
        `UPDATE plan_schedule 
         SET pattern_position = ?, day_of_week = ?, updated_at = ?
         WHERE schedule_id = ?`,
        [newPatternPosition, newPatternPosition, now, scheduleId]
      );

      console.log(
        `[PlanAPI] Updated pattern_position for schedule ${scheduleId} to ${newPatternPosition}`
      );
      return { success: true };
    } catch (error) {
      console.error("[PlanAPI] Update schedule pattern position error:", error);
      throw error;
    }
  }

  // Update plan schedule - assign or remove templates from pattern positions
  async updatePlanSchedule(planId, patternPosition, templateId) {
    try {
      console.log(
        `[PlanAPI] Updating schedule for plan ${planId}, position ${patternPosition}`
      );
      await this.ensureInitialized();

      const now = new Date().toISOString();

      // Check if a schedule entry already exists for this pattern position
      const [existingSchedule] = await this.db.query(
        `SELECT * FROM plan_schedule WHERE plan_id = ? AND pattern_position = ?`,
        [planId, patternPosition]
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
          (schedule_id, plan_id, day_of_week, pattern_position, template_id, created_at, updated_at, sync_status, version)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            schedule_id,
            planId,
            patternPosition, // Use pattern_position as day_of_week for backward compatibility
            patternPosition,
            templateId,
            now,
            now,
            "synced",
            1,
          ]
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

      // Calculate pattern position for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaySchedule = this.getRoutineForDate(
        today,
        activePlan.start_date,
        activePlan.pattern_length,
        activePlan.schedule
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

  // Helper method to calculate which routine applies to a given date
  getRoutineForDate(targetDate, startDate, patternLength, schedule) {
    if (!startDate || !patternLength || !schedule) {
      return null;
    }

    // Ensure dates are Date objects and normalized to midnight
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    // Calculate days since start
    const daysSinceStart = Math.floor((target - start) / (1000 * 60 * 60 * 24));

    // Handle dates before start date
    if (daysSinceStart < 0) {
      return null;
    }

    // Calculate pattern position
    const position = daysSinceStart % patternLength;

    // Find schedule entry for this position
    const scheduleEntry = schedule.find((s) => s.pattern_position === position);

    return scheduleEntry || null;
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

  // Update plan configuration (name, pattern settings)
  async updatePlan(planId, planData) {
    try {
      console.log(`[PlanAPI] Updating plan ${planId}`);
      await this.ensureInitialized();

      const now = new Date().toISOString();

      // Build update query dynamically based on provided fields
      const updates = [];
      const values = [];

      if (planData.name !== undefined) {
        updates.push("name = ?");
        values.push(planData.name);
      }

      if (planData.startDate !== undefined) {
        updates.push("start_date = ?");
        values.push(planData.startDate);
      }

      if (planData.patternLength !== undefined) {
        updates.push("pattern_length = ?");
        values.push(planData.patternLength);
      }

      updates.push("updated_at = ?");
      values.push(now);

      values.push(planId);

      await this.db.execute(
        `UPDATE workout_plans SET ${updates.join(", ")} WHERE plan_id = ?`,
        values
      );

      console.log("[PlanAPI] Plan updated successfully");
      return { success: true };
    } catch (error) {
      console.error("[PlanAPI] Update plan error:", error);
      throw error;
    }
  }

  // Get all templates for display in plan page
  // planSchedule: optional array of schedule items with pattern_position and template_id
  async getAllTemplates(planSchedule = null) {
    try {
      await this.ensureInitialized();

      const templates = await this.db.query(
        `SELECT t.template_id, t.name, t.created_by, t.is_public, t.created_at, t.updated_at, t.display_order,
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

      let processedTemplates = templates.map((template) => {
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

        // Find pattern_position if this template is in the plan schedule
        let patternPosition = null;
        if (planSchedule && Array.isArray(planSchedule)) {
          const scheduleEntry = planSchedule.find(
            (s) => s.template_id === template.template_id
          );
          if (scheduleEntry) {
            patternPosition = scheduleEntry.pattern_position;
          }
        }

        return {
          ...template,
          exercises,
          pattern_position: patternPosition,
        };
      });

      // Sort templates: schedule routines first (by pattern_position), then others (by display_order or created_at)
      processedTemplates.sort((a, b) => {
        // If both are in schedule, sort by pattern_position
        if (a.pattern_position !== null && b.pattern_position !== null) {
          return a.pattern_position - b.pattern_position;
        }
        // If only a is in schedule, it comes first
        if (a.pattern_position !== null && b.pattern_position === null) {
          return -1;
        }
        // If only b is in schedule, it comes first
        if (a.pattern_position === null && b.pattern_position !== null) {
          return 1;
        }
        // Neither is in schedule: sort by display_order (if set), then by created_at DESC
        if (a.display_order !== null && b.display_order !== null) {
          return a.display_order - b.display_order;
        }
        if (a.display_order !== null) {
          return -1;
        }
        if (b.display_order !== null) {
          return 1;
        }
        // Both have no display_order, sort by created_at DESC
        return new Date(b.created_at) - new Date(a.created_at);
      });

      return processedTemplates;
    } catch (error) {
      console.error("[PlanAPI] Get all templates error:", error);
      throw error;
    }
  }

  // Update template display order
  async updateTemplateDisplayOrder(templateId, displayOrder) {
    try {
      await this.ensureInitialized();
      const now = new Date().toISOString();

      await this.db.execute(
        `UPDATE workout_templates 
         SET display_order = ?, updated_at = ?
         WHERE template_id = ?`,
        [displayOrder, now, templateId]
      );

      console.log(
        `[PlanAPI] Updated display_order for template ${templateId} to ${displayOrder}`
      );
      return { success: true };
    } catch (error) {
      console.error("[PlanAPI] Update template display order error:", error);
      throw error;
    }
  }

  // Update multiple template display orders in batch
  async updateTemplateDisplayOrders(updates) {
    try {
      await this.ensureInitialized();
      const now = new Date().toISOString();

      await this.db.execute("BEGIN TRANSACTION");

      for (const { templateId, displayOrder } of updates) {
        await this.db.execute(
          `UPDATE workout_templates 
           SET display_order = ?, updated_at = ?
           WHERE template_id = ?`,
          [displayOrder, now, templateId]
        );
      }

      await this.db.execute("COMMIT");

      console.log(
        `[PlanAPI] Updated display_order for ${updates.length} templates`
      );
      return { success: true };
    } catch (error) {
      await this.db.execute("ROLLBACK");
      console.error("[PlanAPI] Update template display orders error:", error);
      throw error;
    }
  }
}

export default new PlanAPI();
