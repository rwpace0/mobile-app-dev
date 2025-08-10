class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0
    };
  }

  get(key) {
    this.cleanup();
    const item = this.cache.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.expirations++;
      return null;
    }
    this.stats.hits++;
    this.cache.delete(key);
    this.cache.set(key, item); // Move to end (most recently used)
    return item.value;
  }

  set(key, value, ttlMs = 30 * 60 * 1000) { // Increased default TTL to 30 minutes
    this.cleanup();
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.stats.evictions++;
    }
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        this.stats.expirations++;
      }
    }
  }

  invalidate(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

class WorkoutCache {
  constructor() {
    // Cache for detailed workout data - reduced from 50 to 25
    this.workoutDetailsCache = new LRUCache(25);

    // Cache for workout lists (e.g. paginated results) - reduced from 10 to 5
    this.workoutListCache = new LRUCache(5);

    // Background cleanup interval - run cleanup every 3 minutes instead of 5
    this.cleanupInterval = setInterval(() => this.cleanupExpired(), 3 * 60 * 1000);
  }

  getWorkoutDetails(workoutId) {
    const result = this.workoutDetailsCache.get(workoutId);
    if (!result) {
      console.log(`[WorkoutCache] Cache miss for workout ${workoutId}`);
    }
    return result;
  }

  setWorkoutDetails(workoutId, workout, ttlMs = 15 * 60 * 1000) { // Reduced from 30 to 15 minutes TTL
    if (!workout) {
      console.warn(`[WorkoutCache] Attempted to cache null/undefined workout for ID ${workoutId}`);
      return;
    }
    console.log(`[WorkoutCache] Caching workout ${workoutId}`);
    this.workoutDetailsCache.set(workoutId, workout, ttlMs);
  }

  getWorkoutList(cacheKey) {
    return this.workoutListCache.get(cacheKey);
  }

  setWorkoutList(cacheKey, workouts, ttlMs = 8 * 60 * 1000) { // Reduced from 15 to 8 minutes TTL for lists
    if (!workouts) {
      console.warn(`[WorkoutCache] Attempted to cache null/undefined workout list for key ${cacheKey}`);
      return;
    }
    console.log(`[WorkoutCache] Caching workout list with key ${cacheKey}`);
    this.workoutListCache.set(cacheKey, workouts, ttlMs);
  }

  invalidateWorkout(workoutId) {
    this.workoutDetailsCache.invalidate(workoutId);
    // Also invalidate all list caches since they might contain this workout
    this.workoutListCache.clear();
  }

  generateListCacheKey(params) {
    return JSON.stringify({
      cursor: params.cursor,
      limit: params.limit,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      searchTerm: params.searchTerm
    });
  }

  getStats() {
    return {
      detailsSize: this.workoutDetailsCache.cache.size,
      detailsMaxSize: this.workoutDetailsCache.maxSize,
      listSize: this.workoutListCache.cache.size,
      listMaxSize: this.workoutListCache.maxSize,
      detailsStats: this.workoutDetailsCache.getStats(),
      listStats: this.workoutListCache.getStats()
    };
  }

  // Only clean expired items, don't clear everything
  cleanupExpired() {
    // LRUCache cleanup method only removes expired items
    this.workoutDetailsCache.cleanup();
    this.workoutListCache.cleanup();
  }

  // Emergency clear method (only use when debugging)
  clearAll() {
    this.workoutDetailsCache.clear();
    this.workoutListCache.clear();
  }

  destroy() {
    // Clear the cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Clear all cached data
    this.clearAll();

    console.log('[WorkoutCache] Destroyed and cleaned up');
  }
}

export const workoutCache = new WorkoutCache();