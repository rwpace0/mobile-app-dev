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
        // Handle templates pending creation/update
        const pendingTemplates = await this.db.query(
          `SELECT * FROM workout_templates WHERE sync_status = 'pending_sync'`
        );

        for (const template of pendingTemplates) {
          try {
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
          } catch (error) {
            console.error(`[TemplateAPI] Failed to sync template ${template.template_id}:`, error);
          }
        }

        // Handle templates pending deletion
        const templatesForDeletion = await this.db.query(
          `SELECT * FROM workout_templates WHERE sync_status = 'pending_delete'`
        );

        for (const template of templatesForDeletion) {
          try {
            // Check if template was ever synced to server (has last_synced_at timestamp)
            if (template.last_synced_at) {
              console.log(`[TemplateAPI] Syncing deletion of template ${template.template_id} (was previously synced)`);
              
              await this.makeAuthenticatedRequest({
                method: 'DELETE',
                url: `${this.baseUrl}/${template.template_id}`
              });

              console.log(`[TemplateAPI] Successfully deleted template ${template.template_id} from server`);
            } else {
              console.log(`[TemplateAPI] Template ${template.template_id} was never synced to server, skipping server deletion`);
            }

            // Delete from local database regardless of server deletion
            await this.db.execute("BEGIN TRANSACTION");
            
            await this.db.execute(
              `DELETE FROM template_exercises WHERE template_id = ?`,
              [template.template_id]
            );
            
            await this.db.execute(
              `DELETE FROM workout_templates WHERE template_id = ?`,
              [template.template_id]
            );

            await this.db.execute("COMMIT");
            
            console.log(`[TemplateAPI] Successfully deleted template ${template.template_id} from local database`);
          } catch (error) {
            if (error.response && error.response.status === 404) {
              // Template doesn't exist on server, just delete locally
              console.log(`[TemplateAPI] Template ${template.template_id} not found on server (404) - deleting locally`);
              
              await this.db.execute("BEGIN TRANSACTION");
              
              await this.db.execute(
                `DELETE FROM template_exercises WHERE template_id = ?`,
                [template.template_id]
              );
              
              await this.db.execute(
                `DELETE FROM workout_templates WHERE template_id = ?`,
                [template.template_id]
              );

              await this.db.execute("COMMIT");
            } else {
              console.error(`[TemplateAPI] Failed to delete template ${template.template_id} from server:`, error);
              // Leave it marked as pending_delete to retry next sync
            }
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

  async updateTemplate(templateId, templateData) {
    try {
      console.log(`[TemplateAPI] Updating template ${templateId}`);
      
      const userId = await this.getUserId();
      const now = new Date().toISOString();

      // Get the existing template to preserve created_at and created_by
      const existingTemplate = await this.getTemplateById(templateId);
      if (!existingTemplate) {
        throw new Error("Template not found");
      }

      const updatedTemplate = {
        template_id: templateId,
        name: templateData.name,
        created_by: existingTemplate.created_by,
        is_public: templateData.is_public || false,
        exercises: templateData.exercises || [],
        created_at: existingTemplate.created_at,
        updated_at: now
      };

      try {
        // Use a single transaction for the entire update operation
        await this.db.execute("BEGIN TRANSACTION");
        
        // Delete existing exercises for this template
        await this.db.execute(
          `DELETE FROM template_exercises WHERE template_id = ?`,
          [templateId]
        );

        // Update the template record
        await this.db.execute(
          `UPDATE workout_templates 
           SET name = ?, is_public = ?, updated_at = ?, sync_status = ?
           WHERE template_id = ?`,
          [
            updatedTemplate.name,
            updatedTemplate.is_public,
            updatedTemplate.updated_at,
            "pending_sync",
            templateId
          ]
        );

        // Store each exercise
        for (let i = 0; i < updatedTemplate.exercises.length; i++) {
          const exercise = updatedTemplate.exercises[i];
          const templateExerciseId = uuid();
          
          await this.db.execute(
            `INSERT INTO template_exercises 
            (template_exercise_id, template_id, exercise_id, exercise_order, sets, created_at, updated_at, sync_status, version, last_synced_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              templateExerciseId,
              templateId,
              exercise.exercise_id,
              i + 1, // exercise_order
              exercise.sets || 1,
              updatedTemplate.created_at,
              updatedTemplate.updated_at,
              "pending_sync",
              1,
              new Date().toISOString()
            ]
          );
        }

        await this.db.execute("COMMIT");
        
        console.log('[TemplateAPI] Local template update successful, clearing caches');
        this.cache.clearPattern('^templates:');
        this.cache.clearPattern(`^template:${templateId}`);

        // Return the updated template
        return updatedTemplate;
      } catch (error) {
        await this.db.execute("ROLLBACK");
        console.error('[TemplateAPI] Error during template update:', error);
        throw error;
      }
    } catch (error) {
      console.error("[TemplateAPI] Update template error:", error);
      throw error;
    }
  }

  async duplicateTemplate(templateId, newName) {
    try {
      console.log(`[TemplateAPI] Duplicating template ${templateId}`);
      
      // Get the existing template
      const existingTemplate = await this.getTemplateById(templateId);
      if (!existingTemplate) {
        throw new Error("Template not found");
      }

      const userId = await this.getUserId();
      const newTemplateId = uuid();
      const now = new Date().toISOString();

      const duplicatedTemplate = {
        template_id: newTemplateId,
        name: newName || `${existingTemplate.name} (Copy)`,
        created_by: userId,
        is_public: false, // Duplicated templates are private by default
        exercises: existingTemplate.exercises || [],
        created_at: now,
        updated_at: now
      };

      console.log('[TemplateAPI] Storing duplicated template locally');
      await this.storeLocally(duplicatedTemplate, "pending_sync");

      console.log('[TemplateAPI] Template duplication complete, clearing cache');
      this.cache.clearPattern('^templates:');

      return duplicatedTemplate;
    } catch (error) {
      console.error("[TemplateAPI] Duplicate template error:", error);
      throw error;
    }
  }

  async deleteTemplate(templateId) {
    try {
      console.log(`[TemplateAPI] Marking template ${templateId} for deletion`);
      
      // Check if template exists and is not already marked for deletion
      const existingTemplate = await this.db.query(
        `SELECT * FROM workout_templates WHERE template_id = ? AND sync_status != 'pending_delete'`,
        [templateId]
      );
      
      if (!existingTemplate || existingTemplate.length === 0) {
        throw new Error("Template not found");
      }

      try {
        await this.db.execute("BEGIN TRANSACTION");
        
        // Mark template as pending deletion instead of deleting immediately
        await this.db.execute(
          `UPDATE workout_templates 
           SET sync_status = 'pending_delete',
               updated_at = ?
           WHERE template_id = ?`,
          [new Date().toISOString(), templateId]
        );

        // Also mark template exercises as pending deletion
        await this.db.execute(
          `UPDATE template_exercises 
           SET sync_status = 'pending_delete',
               updated_at = ?
           WHERE template_id = ?`,
          [new Date().toISOString(), templateId]
        );

        await this.db.execute("COMMIT");
        
        console.log('[TemplateAPI] Template marked for deletion, clearing caches');
        this.cache.clearPattern('^templates:');
        this.cache.clearPattern(`^template:${templateId}`);

        return { success: true, message: "Template deleted successfully" };
      } catch (error) {
        await this.db.execute("ROLLBACK");
        console.error('[TemplateAPI] Error marking template for deletion:', error);
        throw error;
      }
    } catch (error) {
      console.error("[TemplateAPI] Delete template error:", error);
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