import NetInfo from "@react-native-community/netinfo";
import { storage } from "../tokenStorage";

class SyncManager {
  constructor() {
    this.lastSyncTimes = {};
    this.syncIntervals = {
      exercises: 5 * 60 * 1000, // 5 minutes
      workouts: 10 * 60 * 1000, // 10 minutes
      templates: 15 * 60 * 1000, // 15 minutes
      media: 30 * 60 * 1000, // 30 minutes
    };
    this.syncListeners = {};
    this.setupNetworkListener();
  }

  setupNetworkListener() {
    NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        this.onNetworkReconnect();
      }
    });
  }

  async onNetworkReconnect() {
    // Trigger sync for all resources that need it
    for (const resource of Object.keys(this.syncIntervals)) {
      await this.syncIfNeeded(resource);
    }
  }

  registerSyncFunction(resource, syncFunction) {
    this.syncListeners[resource] = syncFunction;
  }

  async shouldSync(resource) {
    const now = Date.now();
    const lastSync = this.lastSyncTimes[resource] || 0;
    const interval = this.syncIntervals[resource];

    if (!interval) {
      console.warn(`No sync interval defined for resource: ${resource}`);
      return false;
    }

    return now - lastSync >= interval;
  }

  async syncIfNeeded(resource) {
    try {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) return false;

      if (!(await this.shouldSync(resource))) return false;

      const syncFunction = this.syncListeners[resource];
      if (!syncFunction) {
        console.warn(`No sync function registered for resource: ${resource}`);
        return false;
      }

      await syncFunction();
      this.lastSyncTimes[resource] = Date.now();
      return true;
    } catch (error) {
      console.error(`Sync failed for ${resource}:`, error);
      return false;
    }
  }

  // Configure sync intervals
  setSyncInterval(resource, intervalMs) {
    this.syncIntervals[resource] = intervalMs;
  }

  // Force immediate sync
  async forceSyncResource(resource) {
    try {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error("No network connection available");
      }

      const syncFunction = this.syncListeners[resource];
      if (!syncFunction) {
        throw new Error(
          `No sync function registered for resource: ${resource}`
        );
      }

      await syncFunction();
      this.lastSyncTimes[resource] = Date.now();
      return true;
    } catch (error) {
      console.error(`Force sync failed for ${resource}:`, error);
      throw error;
    }
  }

  // Get sync status
  getSyncStatus(resource) {
    const lastSync = this.lastSyncTimes[resource];
    const interval = this.syncIntervals[resource];

    if (!lastSync) return "never";

    const now = Date.now();
    const timeSinceLastSync = now - lastSync;

    return {
      lastSyncTime: new Date(lastSync).toISOString(),
      nextSyncDue: new Date(lastSync + interval).toISOString(),
      timeUntilNextSync: Math.max(0, interval - timeSinceLastSync),
      needsSync: timeSinceLastSync >= interval,
    };
  }
}

export const syncManager = new SyncManager();
