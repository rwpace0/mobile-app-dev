import "react-native-get-random-values";
import axios from "axios";
import { v4 as uuid } from "uuid";
import NetInfo from "@react-native-community/netinfo";
import getBaseUrl from "./utils/getBaseUrl.js";
import { tokenManager } from "./utils/tokenManager";
import { dbManager } from "./local/dbManager";
import { syncManager } from "./local/syncManager";
import templateAPI from "./templateAPI";

class PlanAPI {
  constructor() {
    this.baseUrl = `${getBaseUrl()}/plans`;
    this.db = dbManager;
    this.initializationPromise = this.db.initializationPromise;
    this._syncInFlight = false;

    syncManager.registerSyncFunction("plans", async (isInitialSync = false) => {
      await this._sync(isInitialSync);
    });

    // Plans sync every 30 minutes; minimum 10 minutes between forced syncs
    syncManager.syncIntervals.plans = 30 * 60 * 1000;
    syncManager.minSyncIntervals.plans = 10 * 60 * 1000;
  }

  async ensureInitialized() {
    await this.initializationPromise;
  }

  async _makeRequest(config) {
    const accessToken = await tokenManager.getValidToken();
    if (!accessToken) throw new Error("No auth token found");
    const response = await axios({
      ...config,
      headers: { ...config.headers, Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }

  async _getUserId() {
    const token = await tokenManager.getValidToken();
    if (!token) throw new Error("No auth token found");
    return JSON.parse(atob(token.split(".")[1])).sub;
  }

  async _isOnline() {
    const net = await NetInfo.fetch();
    return !!net.isConnected;
  }

  // ─── Background sync logic ──────────────────────────────────────────────────

  async _sync(isInitialSync = false) {
    try {
      await this.ensureInitialized();
      const userId = await this._getUserId();

      if (isInitialSync) {
        // Pull active plan from server if local is empty
        const [localCount] = await this.db.query(
          `SELECT COUNT(*) as count FROM workout_plans WHERE user_id = ? AND sync_status != 'pending_delete'`,
          [userId]
        );

        if (localCount.count === 0) {
          console.log("[PlanAPI] Local empty on initial sync — pulling from server");
          try {
            const serverPlan = await this._makeRequest({
              method: "GET",
              url: `${this.baseUrl}/active`,
            });
            if (serverPlan) {
              await this._saveLocalPlan(serverPlan, serverPlan.schedule || [], "synced");
              console.log("[PlanAPI] Initial plan pulled from server");
            }
          } catch (e) {
            console.warn("[PlanAPI] Initial server pull failed:", e.message);
          }
          return;
        }
      }

      // Push pending local changes to server
      const pendingPlans = await this.db.query(
        `SELECT * FROM workout_plans WHERE user_id = ? AND sync_status = 'pending_sync'`,
        [userId]
      );

      for (const plan of pendingPlans) {
        try {
          const schedule = await this.db.query(
            `SELECT pattern_position, template_id FROM plan_schedule WHERE plan_id = ?`,
            [plan.plan_id]
          );

          const schedulePayload = schedule.map((s) => ({
            pattern_position: s.pattern_position,
            template_id: s.template_id,
          }));

          // PUT upserts on the backend (creates if not found, updates if found)
          // The local plan_id is preserved via the URL param + backend upsert logic
          await this._makeRequest({
            method: "PUT",
            url: `${this.baseUrl}/${plan.plan_id}`,
            data: {
              name: plan.name,
              startDate: plan.start_date,
              patternLength: plan.pattern_length,
            },
          });

          // Schedule sync — plan is now guaranteed to exist on server
          await this._makeRequest({
            method: "PUT",
            url: `${this.baseUrl}/${plan.plan_id}/schedule`,
            data: { schedule: schedulePayload },
          });

          await this.db.execute(
            `UPDATE workout_plans SET sync_status = 'synced', updated_at = ? WHERE plan_id = ?`,
            [new Date().toISOString(), plan.plan_id]
          );
          console.log("[PlanAPI] Synced plan:", plan.plan_id);
        } catch (e) {
          console.warn("[PlanAPI] Failed to sync plan:", plan.plan_id, e.message);
        }
      }

      // Push pending deletes
      const pendingDeletes = await this.db.query(
        `SELECT * FROM workout_plans WHERE user_id = ? AND sync_status = 'pending_delete'`,
        [userId]
      );

      for (const plan of pendingDeletes) {
        try {
          await this._makeRequest({
            method: "DELETE",
            url: `${this.baseUrl}/${plan.plan_id}`,
          });
          await this.db.execute(
            `DELETE FROM plan_schedule WHERE plan_id = ?`, [plan.plan_id]
          );
          await this.db.execute(
            `DELETE FROM workout_plans WHERE plan_id = ?`, [plan.plan_id]
          );
          console.log("[PlanAPI] Deleted plan from server:", plan.plan_id);
        } catch (e) {
          console.warn("[PlanAPI] Failed to delete plan on server:", plan.plan_id, e.message);
        }
      }
    } catch (e) {
      console.error("[PlanAPI] Sync error:", e);
      throw e;
    }
  }

  // Fire-and-forget background sync — never blocks the caller, deduplicated
  _syncInBackground() {
    if (this._syncInFlight) return;
    this._syncInFlight = true;
    this._isOnline().then((online) => {
      if (!online) { this._syncInFlight = false; return; }
      this._sync(false)
        .catch((e) => console.warn("[PlanAPI] Background sync error:", e.message))
        .finally(() => { this._syncInFlight = false; });
    });
  }

  // ─── Local SQLite helpers ───────────────────────────────────────────────────

  async _getLocalActivePlan(userId) {
    const [plan] = await this.db.query(
      `SELECT * FROM workout_plans
       WHERE user_id = ? AND is_active = 1 AND sync_status != 'pending_delete'
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    if (!plan) return null;

    const schedule = await this.db.query(
      `SELECT ps.*, wt.name as template_name
       FROM plan_schedule ps
       LEFT JOIN workout_templates wt ON ps.template_id = wt.template_id
       WHERE ps.plan_id = ?
       ORDER BY COALESCE(ps.pattern_position, ps.day_of_week)`,
      [plan.plan_id]
    );

    return { ...plan, schedule };
  }

  async _saveLocalPlan(plan, schedule, syncStatus = "synced") {
    const now = new Date().toISOString();
    await this.db.execute(
      `INSERT OR REPLACE INTO workout_plans
       (plan_id, user_id, name, is_active, start_date, pattern_length,
        created_at, updated_at, sync_status, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        plan.plan_id,
        plan.user_id,
        plan.name,
        plan.is_active ? 1 : 0,
        plan.start_date,
        plan.pattern_length,
        plan.created_at || now,
        plan.updated_at || now,
        syncStatus,
      ]
    );

    if (Array.isArray(schedule)) {
      await this.db.execute(`DELETE FROM plan_schedule WHERE plan_id = ?`, [plan.plan_id]);
      for (const item of schedule) {
        await this.db.execute(
          `INSERT OR REPLACE INTO plan_schedule
           (schedule_id, plan_id, day_of_week, pattern_position, template_id,
            created_at, updated_at, sync_status, version)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', 1)`,
          [
            uuid(),
            plan.plan_id,
            item.pattern_position,
            item.pattern_position,
            item.template_id || null,
            now,
            now,
          ]
        );
      }
    }
  }

  async _deactivateLocalPlans(userId) {
    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE workout_plans SET is_active = 0, updated_at = ? WHERE user_id = ? AND is_active = 1`,
      [now, userId]
    );
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  // Local-first: always return local immediately, kick off background sync
  async getActivePlan() {
    try {
      await this.ensureInitialized();
      const userId = await this._getUserId();

      const localPlan = await this._getLocalActivePlan(userId);

      // If nothing local, do a one-time blocking pull (first-ever launch / new device)
      // but only if online — never blocks if offline
      if (!localPlan) {
        const online = await this._isOnline();
        if (online) {
          try {
            const serverPlan = await this._makeRequest({
              method: "GET",
              url: `${this.baseUrl}/active`,
            });
            if (serverPlan) {
              await this._saveLocalPlan(serverPlan, serverPlan.schedule || [], "synced");
              return await this._getLocalActivePlan(userId);
            }
          } catch (e) {
            console.warn("[PlanAPI] Could not pull plan from server:", e.message);
          }
        }
        return null;
      }

      // Return local immediately, sync in background
      this._syncInBackground();
      return localPlan;
    } catch (error) {
      console.error("[PlanAPI] Get active plan error:", error);
      throw error;
    }
  }

  // Write local immediately → mark pending_sync → background sync
  async createPlan(planData) {
    try {
      await this.ensureInitialized();
      const userId = await this._getUserId();
      const plan_id = uuid();
      const now = new Date().toISOString();

      await this._deactivateLocalPlans(userId);

      const localPlan = {
        plan_id,
        user_id: userId,
        name: planData.name,
        is_active: 1,
        start_date: planData.startDate || now,
        pattern_length: planData.patternLength || 7,
        created_at: now,
        updated_at: now,
      };
      await this._saveLocalPlan(localPlan, planData.schedule || [], "pending_sync");

      this._syncInBackground();

      return { ...localPlan, schedule: planData.schedule || [] };
    } catch (error) {
      console.error("[PlanAPI] Create plan error:", error);
      throw error;
    }
  }

  // Write local immediately → mark pending_sync → background sync
  async updatePlan(planId, planData) {
    try {
      await this.ensureInitialized();
      const now = new Date().toISOString();

      const updates = ["updated_at = ?", "sync_status = 'pending_sync'"];
      const values = [now];
      if (planData.name !== undefined) { updates.push("name = ?"); values.push(planData.name); }
      if (planData.startDate !== undefined) { updates.push("start_date = ?"); values.push(planData.startDate); }
      if (planData.patternLength !== undefined) { updates.push("pattern_length = ?"); values.push(planData.patternLength); }
      values.push(planId);

      await this.db.execute(
        `UPDATE workout_plans SET ${updates.join(", ")} WHERE plan_id = ?`,
        values
      );

      this._syncInBackground();

      return { success: true };
    } catch (error) {
      console.error("[PlanAPI] Update plan error:", error);
      throw error;
    }
  }

  // Replace full schedule locally → mark plan pending_sync → background sync
  async updatePlanSchedule(planId, schedule) {
    try {
      await this.ensureInitialized();
      const now = new Date().toISOString();

      await this.db.execute(`DELETE FROM plan_schedule WHERE plan_id = ?`, [planId]);
      for (const item of schedule) {
        await this.db.execute(
          `INSERT INTO plan_schedule
           (schedule_id, plan_id, day_of_week, pattern_position, template_id,
            created_at, updated_at, sync_status, version)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', 1)`,
          [uuid(), planId, item.pattern_position, item.pattern_position, item.template_id || null, now, now]
        );
      }

      await this.db.execute(
        `UPDATE workout_plans SET sync_status = 'pending_sync', updated_at = ? WHERE plan_id = ?`,
        [now, planId]
      );

      this._syncInBackground();

      return { success: true };
    } catch (error) {
      console.error("[PlanAPI] Update plan schedule error:", error);
      throw error;
    }
  }

  // Mark pending_delete locally → background sync handles server delete
  async deletePlan(planId) {
    try {
      await this.ensureInitialized();
      const now = new Date().toISOString();

      // Mark as pending_delete (sync will remove from server + clean up)
      await this.db.execute(
        `UPDATE workout_plans SET sync_status = 'pending_delete', is_active = 0, updated_at = ? WHERE plan_id = ?`,
        [now, planId]
      );

      this._syncInBackground();

      return { success: true };
    } catch (error) {
      console.error("[PlanAPI] Delete plan error:", error);
      throw error;
    }
  }

  // ─── Read helpers (fully local) ─────────────────────────────────────────────

  async getAllTemplates(planSchedule = null) {
    try {
      const templates = await templateAPI.getTemplates();

      return templates
        .map((template) => {
          let patternPosition = null;
          if (planSchedule && Array.isArray(planSchedule)) {
            const entry = planSchedule.find(
              (s) => s.template_id === template.template_id
            );
            if (entry) patternPosition = entry.pattern_position;
          }
          return { ...template, pattern_position: patternPosition };
        })
        .sort((a, b) => {
          if (a.pattern_position !== null && b.pattern_position !== null)
            return a.pattern_position - b.pattern_position;
          if (a.pattern_position !== null) return -1;
          if (b.pattern_position !== null) return 1;
          return new Date(b.created_at) - new Date(a.created_at);
        });
    } catch (error) {
      console.error("[PlanAPI] Get all templates error:", error);
      throw error;
    }
  }

  getRoutineForDate(targetDate, startDate, patternLength, schedule) {
    if (!startDate || !patternLength || !schedule) return null;

    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const daysSinceStart = Math.floor((target - start) / (1000 * 60 * 60 * 24));
    if (daysSinceStart < 0) return null;

    const position = daysSinceStart % patternLength;
    return schedule.find((s) => s.pattern_position === position) || null;
  }

  async getTodaysWorkout() {
    try {
      const activePlan = await this.getActivePlan();
      if (!activePlan || !activePlan.schedule) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaySchedule = this.getRoutineForDate(
        today,
        activePlan.start_date,
        activePlan.pattern_length,
        activePlan.schedule
      );
      if (!todaySchedule || !todaySchedule.template_id) return null;

      const templates = await templateAPI.getTemplates();
      return templates.find((t) => t.template_id === todaySchedule.template_id) || null;
    } catch (error) {
      console.error("[PlanAPI] Get today's workout error:", error);
      throw error;
    }
  }

  async getWeeklyVolume(planId) {
    try {
      const activePlan = await this.getActivePlan();
      if (!activePlan || !activePlan.schedule) return {};

      const scheduledIds = [
        ...new Set(
          activePlan.schedule.filter((s) => s.template_id).map((s) => s.template_id)
        ),
      ];
      if (scheduledIds.length === 0) return {};

      const allTemplates = await templateAPI.getTemplates();
      const scheduled = allTemplates.filter((t) => scheduledIds.includes(t.template_id));

      const volumeMap = {};
      for (const template of scheduled) {
        for (const ex of Array.isArray(template.exercises) ? template.exercises : []) {
          const sets = ex.sets || 0;
          if (ex.muscle_group) {
            volumeMap[ex.muscle_group] = (volumeMap[ex.muscle_group] || 0) + sets;
          }
          if (ex.secondary_muscle_groups) {
            try {
              const secondary =
                typeof ex.secondary_muscle_groups === "string"
                  ? JSON.parse(ex.secondary_muscle_groups)
                  : ex.secondary_muscle_groups;
              if (Array.isArray(secondary)) {
                secondary.forEach((m) => {
                  volumeMap[m] = (volumeMap[m] || 0) + sets * 0.5;
                });
              }
            } catch {
              // ignore
            }
          }
        }
      }

      Object.keys(volumeMap).forEach((m) => {
        volumeMap[m] = Math.round(volumeMap[m]);
      });

      return volumeMap;
    } catch (error) {
      console.error("[PlanAPI] Get weekly volume error:", error);
      throw error;
    }
  }
}

export default new PlanAPI();
