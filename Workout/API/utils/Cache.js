class Cache {
  constructor(config = {}) {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      clears: 0
    };
    this.maxSize = config.maxSize || 1000;
    this.ttl = config.ttl || 5 * 60 * 1000; // 5 minutes default TTL
  }

  _generateKey(key) {
    if (typeof key === 'string') return key;
    return JSON.stringify(key);
  }

  get(key) {
    const cacheKey = this._generateKey(key);
    const item = this.cache.get(cacheKey);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(cacheKey);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  set(key, value, customTtl) {
    const cacheKey = this._generateKey(key);
    
    // If cache is at max size, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(cacheKey, {
      value,
      expiry: Date.now() + (customTtl || this.ttl)
    });

    this.stats.sets++;
  }

  delete(key) {
    const cacheKey = this._generateKey(key);
    return this.cache.delete(cacheKey);
  }

  clear() {
    this.cache.clear();
    this.stats.clears++;
  }

  clearPattern(pattern) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
    this.stats.clears++;
  }

  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  prune() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

export default Cache; 