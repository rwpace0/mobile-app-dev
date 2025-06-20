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

  set(key, value, ttlMs = 60000) { // 15min TTL
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
    // Cache for detailed workout data
    this.workoutDetailsCache = new LRUCache(200);

    // Cache for workout lists (e.g. paginated results)
    this.workoutListCache = new LRUCache(15);

    // Background cleanup interval - only clean expired items, don't clear everything
    setInterval(() => this.cleanupExpired(), 60000); // Run cleanup every minute
  }

  getWorkoutDetails(workoutId) {
    const result = this.workoutDetailsCache.get(workoutId);
    return result;
  }

  setWorkoutDetails(workoutId, workout) {
    this.workoutDetailsCache.set(workoutId, workout);
  }

  getWorkoutList(cacheKey) {
    const result = this.workoutListCache.get(cacheKey);
    return result;
  }

  setWorkoutList(cacheKey, workouts) {
    this.workoutListCache.set(cacheKey, workouts);
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
}

export const workoutCache = new WorkoutCache(); 