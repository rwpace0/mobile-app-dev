import { dbManager } from "./dbManager.js";
import { v4 as uuid } from "uuid";

class FolderStorage {
  constructor() {
    this.db = dbManager;
  }

  async ensureInitialized() {
    await this.db.initializationPromise;
  }

  async getFolders() {
    try {
      await this.ensureInitialized();

      // Query folders with their associated routines
      const folders = await this.db.query(
        `SELECT f.folder_id, f.name, f.created_at, f.updated_at, f.sync_status, f.version, f.last_synced_at,
          GROUP_CONCAT(wt.template_id) as routineIds
         FROM folders f
         LEFT JOIN workout_templates wt ON f.folder_id = wt.folder_id AND wt.sync_status != 'pending_delete'
         WHERE f.sync_status != 'pending_delete'
         GROUP BY f.folder_id
         ORDER BY f.created_at DESC`
      );

      // Parse the routineIds from GROUP_CONCAT
      return folders.map((folder) => ({
        id: folder.folder_id,
        name: folder.name,
        routineIds: folder.routineIds
          ? folder.routineIds.split(",").filter((id) => id)
          : [],
        createdAt: folder.created_at,
        updatedAt: folder.updated_at,
        sync_status: folder.sync_status,
        last_synced_at: folder.last_synced_at,
      }));
    } catch (error) {
      console.error("[FolderStorage] Error getting folders:", error);
      return [];
    }
  }

  async createFolder(name) {
    try {
      await this.ensureInitialized();

      const folderId = uuid();
      const now = new Date().toISOString();

      await this.db.execute(
        `INSERT INTO folders (folder_id, name, created_at, updated_at, sync_status, version) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [folderId, name.trim(), now, now, "pending_sync", 1]
      );

      console.log(`[FolderStorage] Created folder: ${name} (${folderId})`);

      return {
        id: folderId,
        name: name.trim(),
        routineIds: [],
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error("[FolderStorage] Error creating folder:", error);
      throw error;
    }
  }

  async updateFolder(id, data) {
    try {
      await this.ensureInitialized();

      // Check if folder exists
      const [existingFolder] = await this.db.query(
        "SELECT * FROM folders WHERE folder_id = ? AND sync_status != 'pending_delete'",
        [id]
      );

      if (!existingFolder) {
        throw new Error("Folder not found");
      }

      const now = new Date().toISOString();
      const updates = [];
      const params = [];

      // Only update name if provided
      if (data.name !== undefined) {
        updates.push("name = ?");
        params.push(data.name.trim());
      }

      // Always update sync status and timestamp
      updates.push("sync_status = ?", "updated_at = ?");
      params.push("pending_sync", now);

      // Add folder_id as last parameter
      params.push(id);

      await this.db.execute(
        `UPDATE folders SET ${updates.join(", ")} WHERE folder_id = ?`,
        params
      );

      console.log(`[FolderStorage] Updated folder: ${id}`);

      // Fetch and return updated folder
      const folders = await this.getFolders();
      return folders.find((f) => f.id === id);
    } catch (error) {
      console.error("[FolderStorage] Error updating folder:", error);
      throw error;
    }
  }

  async deleteFolder(id) {
    try {
      await this.ensureInitialized();

      // Check if folder exists
      const [existingFolder] = await this.db.query(
        "SELECT * FROM folders WHERE folder_id = ? AND sync_status != 'pending_delete'",
        [id]
      );

      if (!existingFolder) {
        throw new Error("Folder not found");
      }

      await this.db.execute("BEGIN TRANSACTION");

      try {
        // Set folder_id to NULL for all templates in this folder
        await this.db.execute(
          "UPDATE workout_templates SET folder_id = NULL WHERE folder_id = ?",
          [id]
        );

        // If folder was never synced, delete immediately
        if (
          !existingFolder.last_synced_at ||
          existingFolder.sync_status === "pending_sync"
        ) {
          console.log(
            `[FolderStorage] Folder ${id} was never synced, deleting immediately`
          );
          await this.db.execute("DELETE FROM folders WHERE folder_id = ?", [
            id,
          ]);
        } else {
          // Folder was synced, mark for deletion
          console.log(
            `[FolderStorage] Folder ${id} was synced, marking for deletion`
          );
          await this.db.execute(
            `UPDATE folders SET sync_status = 'pending_delete', updated_at = ? WHERE folder_id = ?`,
            [new Date().toISOString(), id]
          );
        }

        await this.db.execute("COMMIT");
        console.log(`[FolderStorage] Deleted folder: ${id}`);
      } catch (error) {
        await this.db.execute("ROLLBACK");
        throw error;
      }
    } catch (error) {
      console.error("[FolderStorage] Error deleting folder:", error);
      throw error;
    }
  }

  async addRoutineToFolder(folderId, routineId) {
    try {
      await this.ensureInitialized();

      // Check if folder exists
      const [folder] = await this.db.query(
        "SELECT * FROM folders WHERE folder_id = ? AND sync_status != 'pending_delete'",
        [folderId]
      );

      if (!folder) {
        throw new Error("Folder not found");
      }

      // Check if template exists
      const [template] = await this.db.query(
        "SELECT * FROM workout_templates WHERE template_id = ? AND sync_status != 'pending_delete'",
        [routineId]
      );

      if (!template) {
        throw new Error("Template not found");
      }

      await this.db.execute("BEGIN TRANSACTION");

      try {
        const now = new Date().toISOString();

        // Remove routine from any existing folder (set folder_id to NULL for all templates with this ID)
        // Then update the specific template to be in the new folder
        await this.db.execute(
          "UPDATE workout_templates SET folder_id = NULL WHERE template_id = ? AND folder_id IS NOT NULL",
          [routineId]
        );

        // Add routine to target folder and mark template as needing sync
        await this.db.execute(
          "UPDATE workout_templates SET folder_id = ?, sync_status = 'pending_sync', updated_at = ? WHERE template_id = ?",
          [folderId, now, routineId]
        );

        // Update folder's updated_at timestamp and sync status
        await this.db.execute(
          "UPDATE folders SET updated_at = ?, sync_status = 'pending_sync' WHERE folder_id = ?",
          [now, folderId]
        );

        await this.db.execute("COMMIT");
        console.log(
          `[FolderStorage] Added routine ${routineId} to folder ${folderId}`
        );

        // Fetch and return updated folder
        const folders = await this.getFolders();
        return folders.find((f) => f.id === folderId);
      } catch (error) {
        await this.db.execute("ROLLBACK");
        throw error;
      }
    } catch (error) {
      console.error("[FolderStorage] Error adding routine to folder:", error);
      throw error;
    }
  }

  async removeRoutineFromFolder(folderId, routineId) {
    try {
      await this.ensureInitialized();

      // Check if folder exists
      const [folder] = await this.db.query(
        "SELECT * FROM folders WHERE folder_id = ? AND sync_status != 'pending_delete'",
        [folderId]
      );

      if (!folder) {
        throw new Error("Folder not found");
      }

      await this.db.execute("BEGIN TRANSACTION");

      try {
        const now = new Date().toISOString();

        // Remove routine from folder by setting folder_id to NULL
        await this.db.execute(
          "UPDATE workout_templates SET folder_id = NULL, sync_status = 'pending_sync', updated_at = ? WHERE template_id = ? AND folder_id = ?",
          [now, routineId, folderId]
        );

        // Update folder's updated_at timestamp
        await this.db.execute(
          "UPDATE folders SET updated_at = ? WHERE folder_id = ?",
          [now, folderId]
        );

        await this.db.execute("COMMIT");
        console.log(
          `[FolderStorage] Removed routine ${routineId} from folder ${folderId}`
        );

        // Fetch and return updated folder
        const folders = await this.getFolders();
        return folders.find((f) => f.id === folderId);
      } catch (error) {
        await this.db.execute("ROLLBACK");
        throw error;
      }
    } catch (error) {
      console.error(
        "[FolderStorage] Error removing routine from folder:",
        error
      );
      throw error;
    }
  }

  async removeRoutineFromAllFolders(routineId) {
    try {
      await this.ensureInitialized();

      const now = new Date().toISOString();

      // Remove routine from all folders by setting folder_id to NULL
      await this.db.execute(
        "UPDATE workout_templates SET folder_id = NULL, updated_at = ? WHERE template_id = ? AND folder_id IS NOT NULL",
        [now, routineId]
      );

      console.log(
        `[FolderStorage] Removed routine ${routineId} from all folders`
      );
    } catch (error) {
      console.error(
        "[FolderStorage] Error removing routine from all folders:",
        error
      );
      throw error;
    }
  }
}

export default new FolderStorage();
