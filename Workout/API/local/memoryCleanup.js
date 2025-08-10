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
    this.memoryThreshold = 60; // Lowered from 80% to 60% for earlier intervention
    this.cleanupFrequency = 60 * 1000; // Reduced from 2 minutes to 1 minute
    this.memoryCheckFrequency = 15 * 1000; // Reduced from 30 seconds to 15 seconds
    this.emergencyCleanupThreshold = 3; // Number of consecutive high memory checks before emergency cleanup
    this.consecutiveHighMemoryCount = 0;
  }

  init() {
    if (this.initialized) return;

    // Register all cleanup tasks
    this.registerCleanupTask(() => backgroundProcessor.destroy());
    this.registerCleanupTask(() => workoutCache.destroy());
    this.registerCleanupTask(() => mediaCache.cleanup?.());

    // Set up app state listener for background cleanup
    AppState.addEventListener('change', this.handleAppStateChange.bind(this));

    // Set up light cleanup every 1 minute (reduced from 2 minutes)
    this.lightCleanupInterval = setInterval(() => {
      this.performLightCleanup();
    }, this.cleanupFrequency);

    // Set up memory monitoring every 15 seconds (reduced from 30 seconds)
    this.memoryMonitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, this.memoryCheckFrequency);

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
      console.log('[MemoryManager] App going to background, performing aggressive cleanup');
      this.performAggressiveCleanup();
    } else if (nextAppState === 'active') {
      console.log('[MemoryManager] App becoming active');
      // Perform light cleanup when app becomes active again
      setTimeout(() => this.performLightCleanup(), 500); // Reduced from 1000ms
    }
  }

  checkMemoryUsage() {
    try {
      // Check if we should perform emergency cleanup based on time or memory pressure
      const timeSinceLastCleanup = Date.now() - this.lastCleanupTime;
      
      // If more than 2 minutes since last cleanup (reduced from 5 minutes), perform light cleanup
      if (timeSinceLastCleanup > 2 * 60 * 1000) {
        console.log('[MemoryManager] Performing scheduled cleanup');
        this.performLightCleanup();
        this.lastCleanupTime = Date.now();
        this.consecutiveHighMemoryCount = 0; // Reset counter on successful cleanup
      }
      
      // Check for consecutive high memory pressure
      if (this.shouldPerformEmergencyCleanup()) {
        this.consecutiveHighMemoryCount++;
        if (this.consecutiveHighMemoryCount >= this.emergencyCleanupThreshold) {
          console.warn('[MemoryManager] Emergency cleanup threshold reached, performing emergency cleanup');
          this.performEmergencyCleanup();
          this.consecutiveHighMemoryCount = 0;
        }
      } else {
        this.consecutiveHighMemoryCount = 0;
      }
    } catch (error) {
      console.error('[MemoryManager] Memory check failed:', error);
    }
  }

  shouldPerformEmergencyCleanup() {
    // Check if we're under memory pressure
    // This is a simplified check - in a real app you might use performance.memory or similar
    const timeSinceLastCleanup = Date.now() - this.lastCleanupTime;
    return timeSinceLastCleanup > 5 * 60 * 1000; // 5 minutes
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

  performAggressiveCleanup() {
    try {
      // More aggressive than light cleanup but less than full
      workoutCache.cleanupExpired();
      
      // Clear some cache items to free memory
      workoutCache.clear();
      
      if (mediaCache.cleanupExpired) {
        mediaCache.cleanupExpired();
      }
      
      // Force garbage collection
      this.forceGarbageCollection(2);
      
      this.lastCleanupTime = Date.now();
      console.log('[MemoryManager] Aggressive cleanup completed');
    } catch (error) {
      console.error('[MemoryManager] Aggressive cleanup failed:', error);
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
      this.forceGarbageCollection(5); // Increased from 3 to 5
      
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
      timeSinceLastCleanup: Date.now() - this.lastCleanupTime,
      consecutiveHighMemoryCount: this.consecutiveHighMemoryCount,
      emergencyThreshold: this.emergencyCleanupThreshold
    };
  }
}

export const memoryManager = new MemoryManager();
