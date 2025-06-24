import 'react-native-get-random-values';
import getBaseUrl from './getBaseUrl';
import APIBase from './utils/APIBase';
import { dbManager } from './local/dbManager';
import { v4 as uuid } from 'uuid';
import { storage } from "./tokenStorage";
import { syncManager } from './local/syncManager';

class TemplateAPI extends APIBase {
  constructor() {
    super(`${getBaseUrl()}/templates`, dbManager, {
      cacheConfig: {
        maxSize: 500,
        ttl: 15 * 60 * 1000 // 15 minutes for template cache
      }
    });

    // Register sync function with sync manager
    syncManager.registerSyncFunction('templates', async () => {
      try {
        const pendingTemplates = await this.db.query(
          `SELECT * FROM workout_templates WHERE sync_status IN ('pending_sync', 'pending_delete')`
        );

        for (const template of pendingTemplates) {
          try {
            if (template.sync_status === 'pending_delete') {
              await this.makeAuthenticatedRequest({
                method: 'DELETE',
                url: `${this.baseUrl}/${template.template_id}`
              });
            } else {
              // Get template exercises for this template
              const exercises = await this.db.query(
                `SELECT * FROM template_exercises WHERE template_id = ?`,
                [template.template_id]
              );

              const response = await this.makeAuthenticatedRequest({
                method: 'POST',
                url: `${this.baseUrl}/create`,
                data: { ...template, exercises }
              });

              // Update sync status to synced
              await this.db.execute(
                `UPDATE workout_templates 
                 SET sync_status = 'synced',
                     last_synced_at = ?
                 WHERE template_id = ?`,
                [new Date().toISOString(), template.template_id]
              );

              // Update exercises sync status
              await this.db.execute(
                `UPDATE template_exercises 
                 SET sync_status = 'synced',
                     last_synced_at = ?
                 WHERE template_id = ?`,
                [new Date().toISOString(), template.template_id]
              );
            }
          } catch (error) {
            console.error(`[TemplateAPI] Failed to sync template ${template.template_id}:`, error);
          }
        }
      } catch (error) {
        console.error('[TemplateAPI] Template sync error:', error);
        throw error;
      }
    });
  }

  getTableName() {
    return 'workout_templates';
  }

  async storeLocally(template, syncStatus = "synced") {
    return this.storage.storeEntity(template, {
      table: 'workout_templates',
      idField: 'template_id',
      fields: ['name', 'created_by', 'is_public'],
      syncStatus,
      relations: [
        {
          table: 'template_exercises',
          data: template.exercises,
          orderField: 'exercise_order'
        }
      ]
    });
  }

  async getTemplates() {
    try {
      await this.ensureInitialized();
      console.log('[TemplateAPI] Fetching all templates');

      return this.handleOfflineFirst('templates:all', async () => {
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

        console.log('[TemplateAPI] Found', templates.length, 'templates in database');

        // Parse exercises JSON for each template
        return templates.map(template => ({
          ...template,
          exercises: template.exercises ? JSON.parse(template.exercises) : []
        }));
      });
    } catch (error) {
      console.error("[TemplateAPI] Get templates error:", error);
      throw error;
    }
  }

  async getTemplateById(templateId) {
    try {
      await this.ensureInitialized();

      return this.handleOfflineFirst(`template:${templateId}`, async () => {
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

        if (!template) return null;

        return {
          ...template,
          exercises: template.exercises ? JSON.parse(template.exercises) : []
        };
      });
    } catch (error) {
      console.error("Get template by id error:", error);
      throw error;
    }
  }

  async createTemplate(templateData) {
    try {
      console.log('[TemplateAPI] Starting template creation');
      const userId = await this.getUserId();
      const template_id = uuid();
      const now = new Date().toISOString();

      const template = {
        template_id,
        name: templateData.name,
        created_by: userId,
        is_public: templateData.is_public || false,
        exercises: templateData.exercises || [],
        created_at: now,
        updated_at: now
      };

      console.log('[TemplateAPI] Storing template locally first');
      await this.storeLocally(template, "pending_sync");

      console.log('[TemplateAPI] Template creation complete, clearing cache');
      this.cache.clearPattern('^templates:');

      return template;
    } catch (error) {
      console.error("[TemplateAPI] Create template error:", error);
      throw error;
    }
  }

  async _fetchFromServer() {
    console.log('[TemplateAPI] Fetching templates from server');
    const response = await this.makeAuthenticatedRequest({
      method: 'GET',
      url: this.baseUrl
    });
    console.log('[TemplateAPI] Server fetch complete');
    return response.data;
  }

  async getUserId() {
    const token = await storage.getItem("auth_token");
    if (!token) throw new Error("No auth token found");
    return JSON.parse(atob(token.split(".")[1])).sub;
  }
}

export default new TemplateAPI(); 