import 'react-native-get-random-values';
import getBaseUrl from './getBaseUrl';
import APIBase from './utils/APIBase';
import { dbManager } from './local/dbManager';
import { v4 as uuid } from 'uuid';

class TemplateAPI extends APIBase {
  constructor() {
    super(`${getBaseUrl()}/templates`, dbManager, {
      cacheConfig: {
        maxSize: 500,
        ttl: 15 * 60 * 1000 // 15 minutes for template cache
      }
    });
  }

  getTableName() {
    return 'workout_templates';
  }

  async storeLocally(template, syncStatus = "synced") {
    return this.storage.storeEntity(template, {
      table: 'workout_templates',
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

      console.log('[TemplateAPI] Storing template locally with ID:', template_id);
      await this.storeLocally(template, "pending_sync");

      console.log('[TemplateAPI] Attempting to sync template with server');
      const response = await this.makeAuthenticatedRequest({
        method: 'POST',
        url: `${this.baseUrl}/create`,
        data: template
      }).catch(error => {
        console.warn("[TemplateAPI] Server sync failed, but local save succeeded:", error);
        return { data: template };
      });

      if (response.data !== template) {
        console.log('[TemplateAPI] Server sync successful, updating local data');
        await this.storeLocally(response.data, "synced");
      }

      console.log('[TemplateAPI] Template creation complete, clearing cache');
      this.cache.clearPattern('^templates:');

      return response.data;
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
    const token = await this.storage.getItem("auth_token");
    if (!token) throw new Error("No auth token found");
    return JSON.parse(atob(token.split(".")[1])).sub;
  }
}

export default new TemplateAPI(); 