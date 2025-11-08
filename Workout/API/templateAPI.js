import "react-native-get-random-values";
import getBaseUrl from "./utils/getBaseUrl.js";
import APIBase from "./utils/APIBase";
import { dbManager } from "./local/dbManager";
import { v4 as uuid } from "uuid";
import { storage } from "./local/tokenStorage.js";
import { syncManager } from "./local/syncManager";

class TemplateAPI extends APIBase {
  constructor() {
    super(`${getBaseUrl()}/templates`, dbManager, {
      cacheConfig: {
        maxSize: 50, // Reduced from 500 to save memory
        ttl: 5 * 60 * 1000, // 5 minutes instead of 15 to reduce memory usage
      },
    });

    // Register sync function with sync manager
    syncManager.registerSyncFunction(
      "templates",
      async (isInitialSync = false) => {
        // If this is an initial sync and local table is empty, fetch from server first
        if (isInitialSync) {
          const [localCount] = await this.db.query(
            `SELECT COUNT(*) as count FROM workout_templates WHERE sync_status != 'pending_delete'`
          );

          if (localCount.count === 0) {
            console.log(
              "[TemplateAPI] Local table empty, fetching initial data from server"
            );
            try {
              await this._fetchFromServer();
              console.log("[TemplateAPI] Initial data fetch completed");
              return; // Skip the normal sync process since we just fetched everything
            } catch (error) {
              console.error("[TemplateAPI] Initial data fetch failed:", error);
              // Continue with normal sync process
            }
          }
        }
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

              // Before syncing template, ensure all referenced exercises are synced
              // and get their server IDs
              const syncedExercises = [];

              console.log(
                `[TemplateAPI] Processing ${exercises.length} exercises for template sync`
              );

              for (const exercise of exercises) {
                console.log(
                  `[TemplateAPI] Checking exercise ${exercise.exercise_id}`
                );

                // Check if exercise exists locally
                const [exerciseRecord] = await this.db.query(
                  `SELECT * FROM exercises WHERE exercise_id = ?`,
                  [exercise.exercise_id]
                );

                if (!exerciseRecord) {
                  console.warn(
                    `[TemplateAPI] Exercise ${exercise.exercise_id} not found locally, skipping`
                  );
                  continue;
                }

                console.log(
                  `[TemplateAPI] Exercise ${exercise.exercise_id} sync status: ${exerciseRecord.sync_status}, last_synced_at: ${exerciseRecord.last_synced_at}`
                );

                // If exercise hasn't been synced to server yet, sync it first
                if (
                  !exerciseRecord.last_synced_at ||
                  exerciseRecord.sync_status === "pending_sync"
                ) {
                  console.log(
                    `[TemplateAPI] Exercise ${exercise.exercise_id} needs syncing before template creation`
                  );
                  try {
                    // Import exercisesAPI dynamically to avoid circular imports
                    const { default: exercisesAPI } = await import(
                      "./exercisesAPI.js"
                    );
                    await exercisesAPI.syncSpecificExercise(
                      exercise.exercise_id
                    );
                    console.log(
                      `[TemplateAPI] Exercise sync completed for ${exercise.exercise_id}`
                    );

                    // Get updated exercise record with potentially new server ID
                    // We need to check all exercises because the ID might have changed
                    const updatedExercises = await this.db.query(
                      `SELECT * FROM exercises WHERE sync_status = 'synced' AND (exercise_id = ? OR last_synced_at > ?)`,
                      [
                        exercise.exercise_id,
                        new Date(Date.now() - 5000).toISOString(),
                      ] // Last 5 seconds
                    );

                    // Find the exercise - either by original ID or by matching other properties
                    let updatedExercise = updatedExercises.find(
                      (e) => e.exercise_id === exercise.exercise_id
                    );

                    if (!updatedExercise && updatedExercises.length > 0) {
                      // If ID changed, find by created_by and created_at (most recent match)
                      updatedExercise = updatedExercises
                        .filter(
                          (e) => e.created_by === exerciseRecord.created_by
                        )
                        .sort(
                          (a, b) =>
                            new Date(b.last_synced_at) -
                            new Date(a.last_synced_at)
                        )[0];
                    }

                    if (updatedExercise) {
                      console.log(
                        `[TemplateAPI] Using synced exercise ID: ${updatedExercise.exercise_id} (was ${exercise.exercise_id})`
                      );

                      // If the exercise ID changed, update the template_exercises table
                      if (
                        updatedExercise.exercise_id !== exercise.exercise_id
                      ) {
                        console.log(
                          `[TemplateAPI] Updating template_exercises with new exercise ID`
                        );
                        await this.db.execute(
                          `UPDATE template_exercises 
                         SET exercise_id = ?
                         WHERE template_exercise_id = ?`,
                          [
                            updatedExercise.exercise_id,
                            exercise.template_exercise_id,
                          ]
                        );
                      }

                      syncedExercises.push({
                        ...exercise,
                        exercise_id: updatedExercise.exercise_id, // Use updated server ID
                      });
                    } else {
                      console.error(
                        `[TemplateAPI] Could not find synced exercise after sync attempt`
                      );
                      // Skip this exercise if we can't find it after sync
                      continue;
                    }
                  } catch (syncError) {
                    console.error(
                      `[TemplateAPI] Failed to sync exercise ${exercise.exercise_id}:`,
                      syncError
                    );
                    // Skip this exercise if sync fails
                    continue;
                  }
                } else {
                  // Exercise is already synced, use it as-is
                  console.log(
                    `[TemplateAPI] Exercise ${exercise.exercise_id} already synced, using as-is`
                  );
                  syncedExercises.push(exercise);
                }
              }

              console.log(
                `[TemplateAPI] Final synced exercises:`,
                syncedExercises.map((e) => ({
                  id: e.exercise_id,
                  order: e.exercise_order,
                }))
              );

              // Skip template sync if no valid exercises
              if (syncedExercises.length === 0) {
                console.warn(
                  `[TemplateAPI] No valid exercises found for template ${template.template_id}, skipping sync`
                );
                continue;
              }

              // A template is an update if it has been synced before (has last_synced_at)
              // New templates (never synced) will have last_synced_at = null and should use POST
              // Updated templates will have last_synced_at != null and should use PUT
              const isUpdate = template.last_synced_at != null;

              const method = isUpdate ? "PUT" : "POST";
              const url = isUpdate
                ? `${this.baseUrl}/${template.template_id}`
                : `${this.baseUrl}/create`;
              console.log(
                `[TemplateAPI] ${isUpdate ? "Updating" : "Creating"} template ${
                  template.template_id
                } via ${method} ${url}`
              );

              const response = await this.makeAuthenticatedRequest({
                method,
                url,
                data: { ...template, exercises: syncedExercises },
              });

              const now = new Date().toISOString();

              if (isUpdate) {
                // For updates, just mark as synced - no ID changes expected
                console.log(
                  `[TemplateAPI] Template ${template.template_id} updated successfully`
                );

                await this.db.execute(
                  `UPDATE workout_templates 
                 SET sync_status = 'synced', last_synced_at = ?
                 WHERE template_id = ?`,
                  [now, template.template_id]
                );

                // Update exercises sync status
                await this.db.execute(
                  `UPDATE template_exercises 
                 SET sync_status = 'synced', last_synced_at = ?
                 WHERE template_id = ?`,
                  [now, template.template_id]
                );
              } else {
                // For new templates, server might assign a new ID
                const serverTemplateId =
                  response.data.template_id ||
                  response.data.template?.template_id;

                if (
                  serverTemplateId &&
                  serverTemplateId !== template.template_id
                ) {
                  console.log(
                    `[TemplateAPI] Server assigned new ID: ${serverTemplateId}, updating from ${template.template_id}`
                  );

                  // Update local database with server's ID
                  await this.db.execute(
                    `UPDATE workout_templates 
                   SET template_id = ?, sync_status = 'synced', last_synced_at = ?
                   WHERE template_id = ?`,
                    [serverTemplateId, now, template.template_id]
                  );

                  // Update template exercises with new template_id
                  await this.db.execute(
                    `UPDATE template_exercises 
                   SET template_id = ?, sync_status = 'synced', last_synced_at = ?
                   WHERE template_id = ?`,
                    [serverTemplateId, now, template.template_id]
                  );
                } else {
                  // Update sync status using existing ID
                  await this.db.execute(
                    `UPDATE workout_templates 
                   SET sync_status = 'synced', last_synced_at = ?
                   WHERE template_id = ?`,
                    [now, template.template_id]
                  );

                  // Update exercises sync status
                  await this.db.execute(
                    `UPDATE template_exercises 
                   SET sync_status = 'synced', last_synced_at = ?
                   WHERE template_id = ?`,
                    [now, template.template_id]
                  );
                }
              }

              console.log(
                `[TemplateAPI] Successfully ${
                  isUpdate ? "updated" : "created"
                } template ${template.template_id}`
              );

              // Clear cache to ensure fresh data with correct IDs
              this.cache.clearPattern("^templates:");
            } catch (error) {
              console.error(
                `[TemplateAPI] Failed to sync template ${template.template_id}:`,
                error
              );
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
                console.log(
                  `[TemplateAPI] Syncing deletion of template ${template.template_id} (was previously synced)`
                );

                const deleteUrl = `${this.baseUrl}/${template.template_id}`;
                console.log(`[TemplateAPI] DELETE URL: ${deleteUrl}`);
                console.log(`[TemplateAPI] Base URL: ${this.baseUrl}`);
                console.log(
                  `[TemplateAPI] Template ID: ${template.template_id}`
                );

                await this.makeAuthenticatedRequest({
                  method: "DELETE",
                  url: deleteUrl,
                });

                console.log(
                  `[TemplateAPI] Successfully deleted template ${template.template_id} from server`
                );
              } else {
                console.log(
                  `[TemplateAPI] Template ${template.template_id} was never synced to server, skipping server deletion`
                );
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

              console.log(
                `[TemplateAPI] Successfully deleted template ${template.template_id} from local database`
              );
            } catch (error) {
              if (error.response && error.response.status === 404) {
                // Template doesn't exist on server, just delete locally
                console.log(
                  `[TemplateAPI] Template ${template.template_id} not found on server (404) - deleting locally`
                );

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
                console.error(
                  `[TemplateAPI] Failed to delete template ${template.template_id} from server:`,
                  error
                );
                // Leave it marked as pending_delete to retry next sync
              }
            }
          }
        } catch (error) {
          console.error("[TemplateAPI] Template sync error:", error);
          throw error;
        }
      }
    );
  }

  getTableName() {
    return "workout_templates";
  }

  async storeLocally(template, syncStatus = "synced") {
    return this.storage.storeEntity(template, {
      table: "workout_templates",
      idField: "template_id",
      fields: ["name", "created_by", "is_public"],
      syncStatus,
      relations: [
        {
          table: "template_exercises",
          data: template.exercises,
          orderField: "exercise_order",
        },
      ],
    });
  }

  async getTemplates() {
    try {
      await this.ensureInitialized();
      //console.log("[TemplateAPI] Fetching all templates");

      return this.handleOfflineFirst("templates:all", async () => {
        const templates = await this.db.query(
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
          WHERE t.sync_status != 'pending_delete'
          GROUP BY t.template_id
          ORDER BY t.created_at DESC`
        );

        console.log(
          "[TemplateAPI] Found",
          templates.length,
          "templates in database"
        );

        // Parse exercises JSON for each template
        return templates.map((template) => {
          let exercises = [];
          if (template.exercises) {
            try {
              const parsed = JSON.parse(template.exercises);
              // Filter out null values that might occur from LEFT JOIN
              exercises = Array.isArray(parsed)
                ? parsed.filter((ex) => ex && ex.exercise_id)
                : [];
            } catch (error) {
              console.error(
                `[TemplateAPI] Error parsing exercises for template ${template.template_id}:`,
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
          [templateId]
        );

        if (!template) return null;

        let exercises = [];
        if (template.exercises) {
          try {
            const parsed = JSON.parse(template.exercises);
            // Filter out null values that might occur from LEFT JOIN
            exercises = Array.isArray(parsed)
              ? parsed.filter((ex) => ex && ex.exercise_id)
              : [];
          } catch (error) {
            console.error(
              `[TemplateAPI] Error parsing exercises for template ${template.template_id}:`,
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
      console.error("Get template by id error:", error);
      throw error;
    }
  }

  async createTemplate(templateData) {
    try {
      console.log("[TemplateAPI] Starting template creation");
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
        updated_at: now,
      };

      console.log("[TemplateAPI] Storing template locally first");
      await this.storeLocally(template, "pending_sync");

      console.log("[TemplateAPI] Template creation complete, clearing cache");
      this.cache.clearPattern("^templates:");

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
        updated_at: now,
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
            templateId,
          ]
        );

        // Store each exercise
        for (let i = 0; i < updatedTemplate.exercises.length; i++) {
          const exercise = updatedTemplate.exercises[i];
          const templateExerciseId = uuid();

          await this.db.execute(
            `INSERT INTO template_exercises 
            (template_exercise_id, template_id, exercise_id, exercise_order, sets, created_at, updated_at, sync_status, version)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            ]
          );
        }

        await this.db.execute("COMMIT");

        console.log(
          "[TemplateAPI] Local template update successful, clearing caches"
        );
        this.cache.clearPattern("^templates:");
        this.cache.clearPattern(`^template:${templateId}`);

        // Return the updated template
        return updatedTemplate;
      } catch (error) {
        await this.db.execute("ROLLBACK");
        console.error("[TemplateAPI] Error during template update:", error);
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

      // Create new exercises with new IDs for the duplicated template
      const duplicatedExercises = (existingTemplate.exercises || []).map(
        (exercise) => ({
          exercise_id: exercise.exercise_id, // Keep the same exercise reference
          exercise_order:
            exercise.exercise_order !== null &&
            exercise.exercise_order !== undefined
              ? exercise.exercise_order
              : 0, // Preserve original order, default to 0
          sets: exercise.sets || 1, // Preserve sets count
          template_exercise_id: uuid(), // Generate new ID for each exercise
          template_id: newTemplateId, // Update to reference new template
          created_at: now,
          updated_at: now,
        })
      );

      const duplicatedTemplate = {
        template_id: newTemplateId,
        name: newName || `${existingTemplate.name} (Copy)`,
        created_by: userId,
        is_public: false, // Duplicated templates are private by default
        exercises: duplicatedExercises,
        created_at: now,
        updated_at: now,
      };

      const storedId = await this.storeLocally(
        duplicatedTemplate,
        "pending_sync"
      );

      // Verify the template was stored correctly by retrieving it
      const verificationTemplate = await this.getTemplateById(storedId);

      console.log(
        "[TemplateAPI] Template duplication complete, clearing cache"
      );
      this.cache.clearPattern("^templates:");

      return duplicatedTemplate;
    } catch (error) {
      console.error("[TemplateAPI] Duplicate template error:", error);
      throw error;
    }
  }

  async deleteTemplate(templateId) {
    try {
      console.log(`[TemplateAPI] Deleting template ${templateId}`);

      // Check if template exists and is not already marked for deletion
      const [existingTemplate] = await this.db.query(
        `SELECT * FROM workout_templates WHERE template_id = ? AND sync_status != 'pending_delete'`,
        [templateId]
      );

      if (!existingTemplate) {
        throw new Error("Template not found");
      }

      try {
        await this.db.execute("BEGIN TRANSACTION");

        // If template was never synced to server (pending_sync or no last_synced_at), delete immediately
        if (
          existingTemplate.sync_status === "pending_sync" ||
          !existingTemplate.last_synced_at
        ) {
          console.log(
            `[TemplateAPI] Template ${templateId} was never synced, deleting immediately`
          );

          // Delete template exercises
          await this.db.execute(
            `DELETE FROM template_exercises WHERE template_id = ?`,
            [templateId]
          );

          // Delete template
          await this.db.execute(
            `DELETE FROM workout_templates WHERE template_id = ?`,
            [templateId]
          );
        } else {
          // Template was synced to server, mark for deletion to be handled by sync
          console.log(
            `[TemplateAPI] Template ${templateId} was synced, marking for deletion`
          );

          await this.db.execute(
            `UPDATE workout_templates 
             SET sync_status = 'pending_delete',
                 updated_at = ?
             WHERE template_id = ?`,
            [new Date().toISOString(), templateId]
          );

          await this.db.execute(
            `UPDATE template_exercises 
             SET sync_status = 'pending_delete',
                 updated_at = ?
             WHERE template_id = ?`,
            [new Date().toISOString(), templateId]
          );
        }

        await this.db.execute("COMMIT");

        console.log(
          "[TemplateAPI] Template deletion complete, clearing caches"
        );
        this.cache.clearPattern("^templates:");
        this.cache.clearPattern(`^template:${templateId}`);

        return { success: true, message: "Template deleted successfully" };
      } catch (error) {
        await this.db.execute("ROLLBACK");
        console.error("[TemplateAPI] Error deleting template:", error);
        throw error;
      }
    } catch (error) {
      console.error("[TemplateAPI] Delete template error:", error);
      throw error;
    }
  }

  async _fetchFromServer() {
    console.log(
      "[TemplateAPI] Fetching templates from server for initial population"
    );
    try {
      const response = await this.makeAuthenticatedRequest({
        method: "GET",
        url: this.baseUrl,
      });

      if (response.data && Array.isArray(response.data)) {
        console.log(
          `[TemplateAPI] Retrieved ${response.data.length} templates from server`
        );

        // Store each template locally
        for (const template of response.data) {
          try {
            await this.storeLocally(template, "synced");
            console.log(
              `[TemplateAPI] Stored template ${template.template_id} locally`
            );
          } catch (error) {
            console.error(
              `[TemplateAPI] Failed to store template ${template.template_id}:`,
              error
            );
          }
        }

        return response.data;
      }

      return [];
    } catch (error) {
      console.error(
        "[TemplateAPI] Failed to fetch templates from server:",
        error
      );
      throw error;
    }
  }

  async getUserId() {
    const token = await storage.getItem("auth_token");
    if (!token) throw new Error("No auth token found");
    return JSON.parse(atob(token.split(".")[1])).sub;
  }
}

export default new TemplateAPI();
