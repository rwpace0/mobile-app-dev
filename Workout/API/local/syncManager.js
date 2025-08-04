import NetInfo from "@react-native-community/netinfo";
import { storage } from "./tokenStorage";
import { AppState } from "react-native";

class SyncManager {
  constructor() {
    this.lastSyncTimes = {};
    // Much longer intervals for local-first approach
    this.syncIntervals = {
      exercises: 2 * 60 * 60 * 1000, // 2 hours
      workouts: 1 * 60 * 60 * 1000, // 1 hour  
      templates: 4 * 60 * 60 * 1000, // 4 hours
      media: 24 * 60 * 60 * 1000, // 24 hours
    };
    
    // Minimum intervals to prevent excessive syncing
    this.minSyncIntervals = {
      exercises: 30 * 60 * 1000, // 30 minutes minimum
      workouts: 15 * 60 * 1000, // 15 minutes minimum
      templates: 1 * 60 * 60 * 1000, // 1 hour minimum
      media: 2 * 60 * 60 * 1000, // 2 hours minimum
    };
    
    this.syncListeners = {};
    this.appState = AppState.currentState;
    this.lastNetworkReconnect = 0;
    this.networkReconnectCooldown = 5 * 60 * 1000; // 5 minutes cooldown
    this.syncFailureCounts = {};
    this.maxRetries = 3;
    this.backgroundSyncEnabled = true;
    this.isInitialSyncComplete = false;
    
    this.setupNetworkListener();
    this.setupAppStateListener();
  }

  setupNetworkListener() {
    NetInfo.addEventListener((state) => {
      if (state.isConnected && this.shouldSyncOnNetworkReconnect()) {
        this.onNetworkReconnect();
      }
    });
  }

  setupAppStateListener() {
    AppState.addEventListener('change', (nextAppState) => {
      if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - trigger sync if needed
        this.onAppForeground();
      } else if (nextAppState.match(/inactive|background/)) {
        // App going to background
        this.onAppBackground();
      }
      this.appState = nextAppState;
    });
  }

  shouldSyncOnNetworkReconnect() {
    const now = Date.now();
    if (now - this.lastNetworkReconnect < this.networkReconnectCooldown) {
      return false; // Prevent rapid network reconnect syncs
    }
    this.lastNetworkReconnect = now;
    return true;
  }

  async onNetworkReconnect() {
    console.log("Network reconnected - checking for pending syncs");
    
    // Only sync resources that have pending changes or are truly stale
    for (const resource of Object.keys(this.syncIntervals)) {
      const hasPendingChanges = await this.hasPendingChanges(resource);
      const isVeryStale = await this.isVeryStale(resource);
      
      if (hasPendingChanges || isVeryStale) {
        await this.syncIfNeeded(resource, true); // Force check on network reconnect
      }
    }
  }

  async onAppForeground() {
    if (!this.isInitialSyncComplete) {
      // Initial sync on first app launch
      await this.performInitialSync();
      this.isInitialSyncComplete = true;
      return;
    }

    console.log("App foregrounded - checking for critical syncs");
    
    // Only sync workouts on foreground if it's been more than 2 hours
    const workoutLastSync = this.lastSyncTimes.workouts || 0;
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    
    if (workoutLastSync < twoHoursAgo) {
      await this.syncIfNeeded('workouts');
    }
  }

  onAppBackground() {
    console.log("App backgrounded");
    this.backgroundSyncEnabled = false;
    
    // Re-enable background sync after 1 minute
    setTimeout(() => {
      this.backgroundSyncEnabled = true;
    }, 60000);
  }

  async performInitialSync() {
    console.log("Performing initial sync...");
    try {
      // Sync all resources for initial population
      const resources = ['exercises', 'workouts', 'templates'];
      for (const resource of resources) {
        try {
          await this.forceSyncResource(resource, true); // Pass true for initial sync
        } catch (error) {
          console.error(`Initial sync failed for ${resource}:`, error);
          // Continue with other resources even if one fails
        }
      }
    } catch (error) {
      console.error("Initial sync failed:", error);
    }
  }

  async hasPendingChanges(resource) {
    try {
      // Import dbManager to check for pending changes
      const { dbManager } = await import('../local/dbManager');
      
      let tableName;
      switch (resource) {
        case 'workouts':
          tableName = 'workouts';
          break;
        case 'exercises':
          tableName = 'exercises';
          break;
        case 'templates':
          tableName = 'workout_templates';
          break;
        default:
          return false;
      }
      
      const pendingCount = await dbManager.query(
        `SELECT COUNT(*) as count FROM ${tableName} WHERE sync_status IN ('pending_sync', 'pending_delete')`
      );
      
      return pendingCount[0]?.count > 0;
    } catch (error) {
      console.error(`Error checking pending changes for ${resource}:`, error);
      return false;
    }
  }

  async isVeryStale(resource) {
    const lastSync = this.lastSyncTimes[resource] || 0;
    const veryStaleThreshold = {
      exercises: 24 * 60 * 60 * 1000, // 24 hours
      workouts: 6 * 60 * 60 * 1000, // 6 hours
      templates: 48 * 60 * 60 * 1000, // 48 hours
      media: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    
    const threshold = veryStaleThreshold[resource] || 24 * 60 * 60 * 1000;
    return (Date.now() - lastSync) > threshold;
  }

  registerSyncFunction(resource, syncFunction) {
    this.syncListeners[resource] = syncFunction;
  }

  async shouldSync(resource, forceCheck = false) {
    const now = Date.now();
    const lastSync = this.lastSyncTimes[resource] || 0;
    const interval = forceCheck ? this.minSyncIntervals[resource] : this.syncIntervals[resource];
    const failureCount = this.syncFailureCounts[resource] || 0;

    if (!interval) {
      console.warn(`No sync interval defined for resource: ${resource}`);
      return false;
    }

    // Exponential backoff for failed syncs
    const backoffMultiplier = Math.min(Math.pow(2, failureCount), 8); // Max 8x backoff
    const adjustedInterval = interval * backoffMultiplier;

    return now - lastSync >= adjustedInterval;
  }

  async syncIfNeeded(resource, forceCheck = false) {
    try {
      // Don't sync if app is in background and background sync is disabled
      if (!this.backgroundSyncEnabled && this.appState !== 'active') {
        return false;
      }

      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) return false;

      if (!(await this.shouldSync(resource, forceCheck))) return false;

      const syncFunction = this.syncListeners[resource];
      if (!syncFunction) {
        console.warn(`No sync function registered for resource: ${resource}`);
        return false;
      }

      console.log(`Syncing ${resource}...`);
      await syncFunction(false); // Normal sync, not initial
      this.lastSyncTimes[resource] = Date.now();
      
      // Reset failure count on successful sync
      this.syncFailureCounts[resource] = 0;
      
      return true;
    } catch (error) {
      console.error(`Sync failed for ${resource}:`, error);
      
      // Increment failure count for exponential backoff
      this.syncFailureCounts[resource] = (this.syncFailureCounts[resource] || 0) + 1;
      
      return false;
    }
  }

  // Configure sync intervals
  setSyncInterval(resource, intervalMs) {
    this.syncIntervals[resource] = intervalMs;
  }

  // Force immediate sync
  async forceSyncResource(resource, isInitialSync = false) {
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

      console.log(`Force syncing ${resource}${isInitialSync ? ' (initial)' : ''}...`);
      await syncFunction(isInitialSync);
      this.lastSyncTimes[resource] = Date.now();
      
      // Reset failure count on successful sync
      this.syncFailureCounts[resource] = 0;
      
      return true;
    } catch (error) {
      console.error(`Force sync failed for ${resource}:`, error);
      this.syncFailureCounts[resource] = (this.syncFailureCounts[resource] || 0) + 1;
      throw error;
    }
  }

  // Method to trigger sync only when user explicitly requests it
  async syncOnUserRequest(resource) {
    console.log(`User requested sync for ${resource}`);
    return await this.forceSyncResource(resource);
  }

  // Get sync status
  getSyncStatus(resource) {
    const lastSync = this.lastSyncTimes[resource];
    const interval = this.syncIntervals[resource];
    const failureCount = this.syncFailureCounts[resource] || 0;

    if (!lastSync) return "never";

    const now = Date.now();
    const timeSinceLastSync = now - lastSync;
    const backoffMultiplier = Math.min(Math.pow(2, failureCount), 8);
    const adjustedInterval = interval * backoffMultiplier;

    return {
      lastSyncTime: new Date(lastSync).toISOString(),
      nextSyncDue: new Date(lastSync + adjustedInterval).toISOString(),
      timeUntilNextSync: Math.max(0, adjustedInterval - timeSinceLastSync),
      needsSync: timeSinceLastSync >= adjustedInterval,
      failureCount,
      backoffMultiplier,
    };
  }

  // Method to disable automatic syncing (for testing or user preference)
  setAutoSyncEnabled(enabled) {
    this.backgroundSyncEnabled = enabled;
  }
}

export const syncManager = new SyncManager();
