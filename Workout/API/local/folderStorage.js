import { storage } from "./tokenStorage.js";
import { v4 as uuid } from "uuid";

const FOLDERS_KEY = "workout_folders";

class FolderStorage {
  async getFolders() {
    try {
      const foldersJson = await storage.getItem(FOLDERS_KEY);
      if (!foldersJson) {
        return [];
      }
      return JSON.parse(foldersJson);
    } catch (error) {
      console.error("Error getting folders:", error);
      return [];
    }
  }

  async createFolder(name) {
    try {
      const folders = await this.getFolders();
      const newFolder = {
        id: uuid(),
        name: name.trim(),
        routineIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      folders.push(newFolder);
      await storage.setItem(FOLDERS_KEY, JSON.stringify(folders));
      return newFolder;
    } catch (error) {
      console.error("Error creating folder:", error);
      throw error;
    }
  }

  async updateFolder(id, data) {
    try {
      const folders = await this.getFolders();
      const folderIndex = folders.findIndex((f) => f.id === id);

      if (folderIndex === -1) {
        throw new Error("Folder not found");
      }

      folders[folderIndex] = {
        ...folders[folderIndex],
        ...data,
        updatedAt: new Date().toISOString(),
      };

      await storage.setItem(FOLDERS_KEY, JSON.stringify(folders));
      return folders[folderIndex];
    } catch (error) {
      console.error("Error updating folder:", error);
      throw error;
    }
  }

  async deleteFolder(id) {
    try {
      const folders = await this.getFolders();
      const filteredFolders = folders.filter((f) => f.id !== id);
      await storage.setItem(FOLDERS_KEY, JSON.stringify(filteredFolders));
    } catch (error) {
      console.error("Error deleting folder:", error);
      throw error;
    }
  }

  async addRoutineToFolder(folderId, routineId) {
    try {
      const folders = await this.getFolders();

      // First, remove the routine from any existing folder
      folders.forEach((folder) => {
        folder.routineIds = folder.routineIds.filter((id) => id !== routineId);
      });

      // Then add it to the target folder
      const folderIndex = folders.findIndex((f) => f.id === folderId);
      if (folderIndex === -1) {
        throw new Error("Folder not found");
      }

      if (!folders[folderIndex].routineIds.includes(routineId)) {
        folders[folderIndex].routineIds.push(routineId);
        folders[folderIndex].updatedAt = new Date().toISOString();
      }

      await storage.setItem(FOLDERS_KEY, JSON.stringify(folders));
      return folders[folderIndex];
    } catch (error) {
      console.error("Error adding routine to folder:", error);
      throw error;
    }
  }

  async removeRoutineFromFolder(folderId, routineId) {
    try {
      const folders = await this.getFolders();
      const folderIndex = folders.findIndex((f) => f.id === folderId);

      if (folderIndex === -1) {
        throw new Error("Folder not found");
      }

      folders[folderIndex].routineIds = folders[folderIndex].routineIds.filter(
        (id) => id !== routineId
      );
      folders[folderIndex].updatedAt = new Date().toISOString();

      await storage.setItem(FOLDERS_KEY, JSON.stringify(folders));
      return folders[folderIndex];
    } catch (error) {
      console.error("Error removing routine from folder:", error);
      throw error;
    }
  }

  async removeRoutineFromAllFolders(routineId) {
    try {
      const folders = await this.getFolders();
      let updated = false;

      folders.forEach((folder) => {
        const originalLength = folder.routineIds.length;
        folder.routineIds = folder.routineIds.filter((id) => id !== routineId);
        if (folder.routineIds.length !== originalLength) {
          folder.updatedAt = new Date().toISOString();
          updated = true;
        }
      });

      if (updated) {
        await storage.setItem(FOLDERS_KEY, JSON.stringify(folders));
      }
    } catch (error) {
      console.error("Error removing routine from all folders:", error);
      throw error;
    }
  }
}

export default new FolderStorage();
