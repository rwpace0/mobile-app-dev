import { AppState } from 'react-native';
import { backgroundProcessor } from './BackgroundProcessor';
import { workoutCache } from './WorkoutCache';
import { mediaCache } from './MediaCache';

class MemoryManager {
  constructor() {
    this.cleanupTasks = new Set();
    this.lightCleanupInterval = null;
    this.initialized = false;
    this.lastCleanupTime = Date.now();
    this.memoryThreshold = 80; // Percentage threshold for emergency cleanup
  }

  init() {
    if (this.initialized) return;

    // Register all cleanup tasks
    this.registerCleanupTask(() => backgroundProcessor.destroy());
    this.registerCleanupTask(() => workoutCache.destroy());
    this.registerCleanupTask(() => mediaCache.cleanup?.());

    // Set up app state listener for background cleanup
    AppState.addEventListener('change', this.handleAppStateChange.bind(this));

    // Set up light cleanup every 2 minutes
    this.lightCleanupInterval = setInterval(() => {
      this.performLightCleanup();
    }, 2 * 60 * 1000);

    // Set up memory monitoring every 30 seconds
    this.memoryMonitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30 * 1000);

    this.initialized = true;
    console.log('[MemoryManager] Initialized with', this.cleanupTasks.size, 'cleanup tasks');
  }

  registerCleanupTask(task) {
    this.cleanupTasks.add(task);
  }

  unregisterCleanupTask(task) {
    this.cleanupTasks.delete(task);
  }

  handleAppStateChange(nextAppState) {
    if (nextAppState === 'background') {
      console.log('[MemoryManager] App going to background, performing cleanup');
      this.performFullCleanup();
    } else if (nextAppState === 'active') {
      console.log('[MemoryManager] App becoming active');
      // Perform light cleanup when app becomes active again
      setTimeout(() => this.performLightCleanup(), 1000);
    }
  }

  checkMemoryUsage() {
    try {
      // Check if we should perform emergency cleanup based on time or memory pressure
      const timeSinceLastCleanup = Date.now() - this.lastCleanupTime;
      
      // If more than 5 minutes since last cleanup, perform light cleanup
      if (timeSinceLastCleanup > 5 * 60 * 1000) {
        console.log('[MemoryManager] Performing scheduled cleanup');
        this.performLightCleanup();
        this.lastCleanupTime = Date.now();
      }
    } catch (error) {
      console.error('[MemoryManager] Memory check failed:', error);
    }
  }

  performLightCleanup() {
    try {
      // Light cleanup - only expired cache items and garbage collection
      workoutCache.cleanupExpired();
      
      // Clear any expired media cache items
      if (mediaCache.cleanupExpired) {
        mediaCache.cleanupExpired();
      }
      
      // Force garbage collection if available (development only)
      if (__DEV__ && global.gc) {
        global.gc();
      }
      
      console.log('[MemoryManager] Light cleanup completed');
    } catch (error) {
      console.error('[MemoryManager] Light cleanup failed:', error);
    }
  }

  performFullCleanup() {
    try {
      // Run all registered cleanup tasks
      for (const task of this.cleanupTasks) {
        try {
          task();
        } catch (error) {
          console.error('[MemoryManager] Cleanup task failed:', error);
        }
      }

      // Clear all caches
      workoutCache.clear();
      
      // Clear media cache if available
      if (mediaCache.clear) {
        mediaCache.clear();
      }

      // Force garbage collection if available
      this.forceGarbageCollection();
      
      this.lastCleanupTime = Date.now();
      console.log('[MemoryManager] Full cleanup completed');
    } catch (error) {
      console.error('[MemoryManager] Full cleanup failed:', error);
    }
  }

  performEmergencyCleanup() {
    console.warn('[MemoryManager] Performing emergency cleanup');
    
    try {
      // Aggressive cleanup
      workoutCache.clearAll();
      backgroundProcessor.clearTasks();
      
      // Clear all caches
      if (mediaCache.clearAll) {
        mediaCache.clearAll();
      }
      
      // Force multiple garbage collections
      this.forceGarbageCollection(3);
      
      this.lastCleanupTime = Date.now();
      console.log('[MemoryManager] Emergency cleanup completed');
    } catch (error) {
      console.error('[MemoryManager] Emergency cleanup failed:', error);
    }
  }

  forceGarbageCollection(times = 1) {
    if (__DEV__ && global.gc) {
      for (let i = 0; i < times; i++) {
        global.gc();
      }
      console.log('[MemoryManager] Forced garbage collection', times, 'times');
    }
  }

  destroy() {
    // Clear the light cleanup interval
    if (this.lightCleanupInterval) {
      clearInterval(this.lightCleanupInterval);
      this.lightCleanupInterval = null;
    }

    // Clear memory monitoring interval
    if (this.memoryMonitoringInterval) {
      clearInterval(this.memoryMonitoringInterval);
      this.memoryMonitoringInterval = null;
    }

    // Remove app state listener
    AppState.removeEventListener('change', this.handleAppStateChange);

    // Perform final cleanup
    this.performFullCleanup();

    // Clear cleanup tasks
    this.cleanupTasks.clear();

    this.initialized = false;
    console.log('[MemoryManager] Destroyed');
  }

  getMemoryStats() {
    return {
      lastCleanupTime: this.lastCleanupTime,
      cleanupTasksCount: this.cleanupTasks.size,
      isInitialized: this.initialized,
      timeSinceLastCleanup: Date.now() - this.lastCleanupTime
    };
  }
}

export const memoryManager = new MemoryManager();
