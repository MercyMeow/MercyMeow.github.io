// Cache Manager for API responses and static data
export class CacheManager {
    constructor() {
        this.cache = new Map();
        this.expirationTimes = new Map();
        this.hitCount = 0;
        this.missCount = 0;
        this.maxSize = 100; // Maximum number of cached items
        
        // Clean up expired items periodically
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000); // Every 5 minutes
    }

    // Set a cache entry with optional expiration
    set(key, value, ttlMs = null) {
        // Remove oldest items if cache is full
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        this.cache.set(key, {
            value: value,
            timestamp: Date.now(),
            accessCount: 0
        });

        if (ttlMs) {
            this.expirationTimes.set(key, Date.now() + ttlMs);
        }
    }

    // Get a cache entry
    get(key) {
        const entry = this.cache.get(key);
        
        if (!entry) {
            this.missCount++;
            return null;
        }

        // Check if expired
        const expirationTime = this.expirationTimes.get(key);
        if (expirationTime && Date.now() > expirationTime) {
            this.delete(key);
            this.missCount++;
            return null;
        }

        // Update access statistics
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        this.hitCount++;

        return entry.value;
    }

    // Check if key exists and is not expired
    has(key) {
        if (!this.cache.has(key)) {
            return false;
        }

        const expirationTime = this.expirationTimes.get(key);
        if (expirationTime && Date.now() > expirationTime) {
            this.delete(key);
            return false;
        }

        return true;
    }

    // Delete a cache entry
    delete(key) {
        this.cache.delete(key);
        this.expirationTimes.delete(key);
    }

    // Clear all cache entries
    clear() {
        this.cache.clear();
        this.expirationTimes.clear();
        this.hitCount = 0;
        this.missCount = 0;
    }

    // Get cache size
    size() {
        return this.cache.size;
    }

    // Get cache hit rate
    getHitRate() {
        const total = this.hitCount + this.missCount;
        return total === 0 ? 0 : (this.hitCount / total);
    }

    // Get cache statistics
    getStats() {
        return {
            size: this.cache.size,
            hitCount: this.hitCount,
            missCount: this.missCount,
            hitRate: this.getHitRate(),
            maxSize: this.maxSize
        };
    }

    // Clean up expired entries
    cleanup() {
        const now = Date.now();
        const expiredKeys = [];

        for (const [key, expirationTime] of this.expirationTimes) {
            if (now > expirationTime) {
                expiredKeys.push(key);
            }
        }

        expiredKeys.forEach(key => this.delete(key));
        
        if (expiredKeys.length > 0) {
            console.log(`Cache cleanup: removed ${expiredKeys.length} expired entries`);
        }
    }

    // Evict oldest entries when cache is full
    evictOldest() {
        let oldestKey = null;
        let oldestTime = Date.now();

        for (const [key, entry] of this.cache) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.delete(oldestKey);
        }
    }

    // Set maximum cache size
    setMaxSize(size) {
        this.maxSize = size;
        
        // Evict entries if current size exceeds new max
        while (this.cache.size > this.maxSize) {
            this.evictOldest();
        }
    }

    // Get all cache keys
    keys() {
        return Array.from(this.cache.keys());
    }

    // Get cache entries sorted by access frequency
    getMostAccessed(limit = 10) {
        const entries = Array.from(this.cache.entries())
            .map(([key, entry]) => ({
                key,
                accessCount: entry.accessCount,
                lastAccessed: entry.lastAccessed,
                timestamp: entry.timestamp
            }))
            .sort((a, b) => b.accessCount - a.accessCount)
            .slice(0, limit);

        return entries;
    }

    // Preload cache with data
    preload(data) {
        for (const [key, value] of Object.entries(data)) {
            this.set(key, value);
        }
    }

    // Export cache data for persistence
    export() {
        const data = {};
        for (const [key, entry] of this.cache) {
            data[key] = {
                value: entry.value,
                timestamp: entry.timestamp,
                expirationTime: this.expirationTimes.get(key)
            };
        }
        return data;
    }

    // Import cache data from persistence
    import(data) {
        const now = Date.now();
        
        for (const [key, entry] of Object.entries(data)) {
            // Skip expired entries
            if (entry.expirationTime && now > entry.expirationTime) {
                continue;
            }

            this.cache.set(key, {
                value: entry.value,
                timestamp: entry.timestamp,
                accessCount: 0
            });

            if (entry.expirationTime) {
                this.expirationTimes.set(key, entry.expirationTime);
            }
        }
    }

    // Destroy cache manager
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clear();
    }
}

// Persistent cache using localStorage
export class PersistentCacheManager extends CacheManager {
    constructor(storageKey = 'riot_api_cache') {
        super();
        this.storageKey = storageKey;
        this.loadFromStorage();
    }

    // Override set to persist to localStorage
    set(key, value, ttlMs = null) {
        super.set(key, value, ttlMs);
        this.saveToStorage();
    }

    // Override delete to persist to localStorage
    delete(key) {
        super.delete(key);
        this.saveToStorage();
    }

    // Override clear to persist to localStorage
    clear() {
        super.clear();
        this.saveToStorage();
    }

    // Save cache to localStorage
    saveToStorage() {
        try {
            const data = this.export();
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save cache to localStorage:', error);
        }
    }

    // Load cache from localStorage
    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                this.import(JSON.parse(data));
            }
        } catch (error) {
            console.warn('Failed to load cache from localStorage:', error);
        }
    }
}
