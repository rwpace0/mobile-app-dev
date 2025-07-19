import { AppState } from 'react-native';
import { backgroundProcessor } from './BackgroundProcessor';
import { workoutCache } from './WorkoutCache';
import { mediaCache } from './MediaCache';

class MemoryManager {
  constructor() {
    this.cleanupTasks = new Set();
    this.lightCleanupInterval = null;
    this.initialized = false;
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
    }
  }

  performLightCleanup() {
    try {
      // Light cleanup - only expired cache items
      workoutCache.cleanupExpired();
      
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

      // Force garbage collection if available
      this.forceGarbageCollection();
      
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
      
      // Force multiple garbage collections
      this.forceGarbageCollection(3);
      
      console.log('[MemoryManager] Emergency cleanup completed');
    } catch (error) {
      console.error('[MemoryManager] Emergency cleanup failed:', error);
    }
  }

  forceGarbageCollection(times = 1) {
    if (global.gc) {
      for (let i = 0; i < times; i++) {
        global.gc();
      }
      console.log(`[MemoryManager] Forced garbage collection ${times} times`);
    } else {
      console.log('[MemoryManager] Garbage collection not available');
    }
  }

  destroy() {
    // Clear the light cleanup interval
    if (this.lightCleanupInterval) {
      clearInterval(this.lightCleanupInterval);
      this.lightCleanupInterval = null;
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
    const stats = {
      workoutCache: workoutCache.getStats(),
      cleanupTasks: this.cleanupTasks.size,
      initialized: this.initialized
    };

    // Add JSHeap info if available
    if (performance && performance.memory) {
      stats.jsHeap = {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }

    return stats;
  }
}

// Create singleton instance
export const memoryManager = new MemoryManager();

// Auto-initialize when module is imported
memoryManager.init();

// Export individual methods for convenience
export const {
  performLightCleanup,
  performFullCleanup,
  performEmergencyCleanup,
  forceGarbageCollection,
  getMemoryStats
} = memoryManager;
