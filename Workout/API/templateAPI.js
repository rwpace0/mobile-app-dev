import 'react-native-get-random-values';
import axios from 'axios';
import { storage } from './tokenStorage';
import getBaseUrl from './getBaseUrl';
import { dbManager } from './local/dbManager';
import { syncManager } from './local/syncManager';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuid } from 'uuid';

class TemplateAPI {
  constructor() {
    this.baseUrl = `${getBaseUrl()}/templates`;
    this.db = dbManager;
    this.isInitialized = false;
    this.initializationPromise = null;
    this.setupSync();
  }

  setupSync() {
    syncManager.registerSyncFunction("templates", async () => {
      await this.syncTemplates();
    });
  }

  async ensureInitialized() {
    if (this.isInitialized) return;

    if (!this.initializationPromise) {
      this.initializationPromise = (async () => {
        try {
          // Wait for database to be ready
          await this.db.initializationPromise;
          
          // Check if we have any templates in local db
          const localCount = await this.db.query(
            "SELECT COUNT(*) as count FROM workout_templates"
          );

          if (localCount[0].count === 0) {
            // If empty, try to fetch initial data from server
            const netInfo = await NetInfo.fetch();
            if (netInfo.isConnected) {
              const token = await storage.getItem("auth_token");
              if (token) {
                const response = await axios.get(this.baseUrl, {
                  headers: { Authorization: `Bearer ${token}` }
                });

                // Store initial templates locally
                for (const template of response.data) {
                  await this.storeTemplateLocally(template);
                }
              }
            }
          }

          this.isInitialized = true;
        } catch (error) {
          console.error("Template database initialization error:", error);
          this.isInitialized = true;
        }
      })();
    }

    await this.initializationPromise;
  }

  async storeTemplateLocally(template, syncStatus = "synced") {
    const now = new Date().toISOString();
    
    // Store template
    await this.db.execute(
      `INSERT OR REPLACE INTO workout_templates (
        template_id, name, created_by, is_public,
        created_at, updated_at, sync_status, version, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        template.template_id,
        template.name,
        template.created_by,
        template.is_public ? 1 : 0,
        template.created_at || now,
        template.updated_at || now,
        syncStatus,
        template.version || 1,
        now
      ]
    );

    // Store template exercises
    if (template.exercises) {
      for (const exercise of template.exercises) {
        await this.db.execute(
          `INSERT OR REPLACE INTO template_exercises (
            template_exercise_id, template_id, exercise_id,
            exercise_order, sets, created_at, updated_at,
            sync_status, version, last_synced_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            exercise.template_exercise_id,
            template.template_id,
            exercise.exercise_id,
            exercise.exercise_order,
            exercise.sets,
            exercise.created_at || now,
            exercise.updated_at || now,
            syncStatus,
            exercise.version || 1,
            now
          ]
        );
      }
    }
  }

  async getTemplates() {
    try {
      await this.ensureInitialized();

      // Get local templates first
      const templates = await this.db.query(
        `SELECT t.*,
          json_group_array(
            json_object(
              'template_exercise_id', te.template_exercise_id,
              'exercise_id', te.exercise_id,
              'exercise_order', te.exercise_order,
              'sets', te.sets,
              'created_at', te.created_at,
              'updated_at', te.updated_at
            )
          ) as exercises
        FROM workout_templates t
        LEFT JOIN template_exercises te ON t.template_id = te.template_id
        WHERE t.sync_status != 'pending_delete'
        GROUP BY t.template_id
        ORDER BY t.created_at DESC`
      );

      // Parse exercises JSON for each template
      const processedTemplates = templates.map(template => ({
        ...template,
        exercises: template.exercises ? JSON.parse(template.exercises) : []
      }));

      // Try to sync in background if needed
      syncManager.syncIfNeeded("templates").catch(console.error);

      return processedTemplates;
    } catch (error) {
      console.error("Get templates error:", error);
      throw error;
    }
  }

  async getTemplateById(templateId) {
    try {
      // Try local first
      const [template] = await this.db.query(
        `SELECT t.*,
          json_group_array(
            json_object(
              'template_exercise_id', te.template_exercise_id,
              'exercise_id', te.exercise_id,
              'exercise_order', te.exercise_order,
              'sets', te.sets,
              'created_at', te.created_at,
              'updated_at', te.updated_at
            )
          ) as exercises
        FROM workout_templates t
        LEFT JOIN template_exercises te ON t.template_id = te.template_id
        WHERE t.template_id = ? AND t.sync_status != 'pending_delete'
        GROUP BY t.template_id`,
        [templateId]
      );

      if (template) {
        return {
          ...template,
          exercises: template.exercises ? JSON.parse(template.exercises) : []
        };
      }

      // If not found locally, try server
      const token = await storage.getItem("auth_token");
      if (!token) throw new Error("No auth token found");

      const response = await axios.get(`${this.baseUrl}/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Store in local db
      await this.storeTemplateLocally(response.data);

      return response.data;
    } catch (error) {
      console.error("Get template by id error:", error);
      throw error;
    }
  }

  async createTemplate(templateData) {
    try {
      const token = await storage.getItem("auth_token");
      if (!token) throw new Error("No auth token found");

      const created_by = JSON.parse(atob(token.split(".")[1])).sub;
      const template_id = uuid();
      const now = new Date().toISOString();

      const template = {
        template_id,
        name: templateData.name,
        created_by,
        is_public: templateData.is_public || false,
        exercises: templateData.exercises || [],
        created_at: now,
        updated_at: now
      };

      // Save to local db first
      await this.storeTemplateLocally(template, "pending_sync");

      // Try to sync if online
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        try {
          const response = await axios.post(
            `${this.baseUrl}/create`,
            template,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
              }
            }
          );

          // Update local record with server data
          await this.db.execute(
            `UPDATE workout_templates 
            SET sync_status = 'synced',
                version = ?,
                last_synced_at = ?
            WHERE template_id = ?`,
            [response.data.version || 1, now, template_id]
          );

          return response.data;
        } catch (error) {
          console.error("Server sync failed, but local save succeeded:", error);
          return template;
        }
      }

      return template;
    } catch (error) {
      console.error("Create template error:", error);
      throw error;
    }
  }

  async syncTemplates() {
    try {
      const token = await storage.getItem("auth_token");
      if (!token) return;

      // Get pending templates
      const pendingTemplates = await this.db.query(
        `SELECT * FROM workout_templates WHERE sync_status != 'synced'`
      );

      // Process each pending template
      for (const template of pendingTemplates) {
        if (template.sync_status === "pending_delete") {
          await this.syncDeleteTemplate(template, token);
        } else if (template.sync_status === "pending_sync") {
          await this.syncCreateTemplate(template, token);
        }
      }

      // Get all server templates
      const response = await axios.get(this.baseUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local database with server data
      for (const serverTemplate of response.data) {
        const [localTemplate] = await this.db.query(
          "SELECT * FROM workout_templates WHERE template_id = ?",
          [serverTemplate.template_id]
        );

        if (!localTemplate || localTemplate.sync_status === "synced") {
          await this.storeTemplateLocally(serverTemplate);
        }
      }
    } catch (error) {
      console.error("Sync templates error:", error);
    }
  }

  async syncCreateTemplate(template, token) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/create`,
        template,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      await this.db.execute(
        `UPDATE workout_templates 
        SET sync_status = 'synced',
            version = ?,
            last_synced_at = ?
        WHERE template_id = ?`,
        [response.data.version || 1, new Date().toISOString(), template.template_id]
      );
    } catch (error) {
      console.error("Sync create template error:", error);
    }
  }

  async syncDeleteTemplate(template, token) {
    try {
      await axios.delete(`${this.baseUrl}/${template.template_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await this.db.execute(
        "DELETE FROM workout_templates WHERE template_id = ?",
        [template.template_id]
      );
    } catch (error) {
      console.error("Sync delete template error:", error);
    }
  }
}

export default new TemplateAPI(); 