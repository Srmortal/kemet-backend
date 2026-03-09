import {
  getRedisClient,
  isRedisConnected,
} from "#app/infrastructure/config/redis.js";
import logger from "../metrics/logger.js";

/**
 * Hybrid cache combining Redis (distributed) and in-memory (fast)
 *
 * Strategy:
 * 1. Check in-memory cache (instant)
 * 2. Check Redis cache (fast, shared across instances)
 * 3. Fetch from source (database, computation, etc.)
 * 4. Store in both caches
 */
export class HybridCache {
  private readonly memoryCache = new Map<
    string,
    { data: unknown; timestamp: number; size: number }
  >();
  private accessOrder: string[] = [];
  private totalSize = 0;
  private readonly maxEntries: number;
  private readonly maxSizeMB: number;
  private readonly ttlMs: number;

  constructor(maxEntries = 20, maxSizeMB = 5, ttlMs: number = 5 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.maxSizeMB = maxSizeMB;
    this.ttlMs = ttlMs;
  }

  /**
   * Get value from cache (memory first, then Redis)
   */
  async get<T>(key: string): Promise<T | null> {
    // 1. Check in-memory cache first
    const memoryValue = this.getFromMemory<T>(key);
    if (memoryValue !== null) {
      return memoryValue;
    }

    // 2. Check Redis if connected
    if (isRedisConnected()) {
      try {
        const redisValue = await this.getFromRedis<T>(key);
        if (redisValue !== null) {
          // Store back in memory for future hits
          this.setInMemory(key, redisValue);
          return redisValue;
        }
      } catch (error) {
        logger.error(`Redis get error for key ${key}:`, error);
        // Continue to null - will fetch from source
      }
    }

    return null;
  }

  /**
   * Set value in cache (both memory and Redis)
   */
  async set(key: string, data: unknown): Promise<boolean> {
    const size = this.estimateSize(data);

    // Don't cache oversized results
    if (size > 100 * 1024) {
      // 100KB limit
      return false;
    }

    // 1. Store in memory
    this.setInMemory(key, data, size);

    // 2. Store in Redis (if connected)
    if (isRedisConnected()) {
      try {
        await this.setInRedis(key, data);
      } catch (error) {
        logger.error(`Redis set error for key ${key}:`, error);
        // Still return true - data is in memory
      }
    }

    return true;
  }

  /**
   * Delete from both caches
   */
  async delete(key: string): Promise<void> {
    this.deleteFromMemory(key);

    if (isRedisConnected()) {
      try {
        await this.deleteFromRedis(key);
      } catch (error) {
        logger.error(`Redis delete error for key ${key}:`, error);
      }
    }
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.memoryCache.clear();
    this.accessOrder = [];
    this.totalSize = 0;

    // Redis clear is intentionally not implemented - be careful with flushDb in production
    // if (isRedisConnected()) {
    //   getRedisClient()?.flushDb();
    // }
  }

  // ============ Private Methods ============

  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) {
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.deleteFromMemory(key);
      return null;
    }

    // Update LRU order
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    this.accessOrder.push(key);

    return entry.data as T;
  }

  private setInMemory(key: string, data: unknown, size?: number): void {
    const dataSize = size || this.estimateSize(data);

    // Remove existing entry
    const existing = this.memoryCache.get(key);
    if (existing) {
      this.totalSize -= existing.size;
      this.memoryCache.delete(key);
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
    }

    // Evict LRU entries if needed
    while (
      this.memoryCache.size >= this.maxEntries ||
      this.totalSize + dataSize > this.maxSizeMB * 1024 * 1024
    ) {
      const oldestKey = this.accessOrder.shift();
      if (!oldestKey) {
        break;
      }
      const removed = this.memoryCache.get(oldestKey);
      if (removed) {
        this.totalSize -= removed.size;
      }
      this.memoryCache.delete(oldestKey);
    }

    // Add new entry
    this.memoryCache.set(key, { data, timestamp: Date.now(), size: dataSize });
    this.totalSize += dataSize;
    this.accessOrder.push(key);
  }

  private deleteFromMemory(key: string): void {
    const entry = this.memoryCache.get(key);
    if (entry) {
      this.totalSize -= entry.size;
      this.memoryCache.delete(key);
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
    }
  }

  private async getFromRedis<T>(key: string): Promise<T | null> {
    const redis = getRedisClient();
    if (!redis) {
      return null;
    }

    try {
      const value = await redis.get(key);
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Error parsing Redis value for key ${key}:`, error);
      return null;
    }
  }

  private async setInRedis(key: string, data: unknown): Promise<void> {
    const redis = getRedisClient();
    if (!redis) {
      return;
    }

    try {
      const ttlSeconds = Math.ceil(this.ttlMs / 1000);
      await redis.setEx(key, ttlSeconds, JSON.stringify(data));
    } catch (error) {
      logger.error(`Error setting Redis value for key ${key}:`, error);
    }
  }

  private async deleteFromRedis(key: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) {
      return;
    }

    try {
      await redis.del(key);
    } catch (error) {
      logger.error(`Error deleting Redis value for key ${key}:`, error);
    }
  }

  private estimateSize(obj: unknown): number {
    try {
      return JSON.stringify(obj).length + 100;
    } catch {
      return 1000;
    }
  }

  getStats() {
    return {
      memoryEntries: this.memoryCache.size,
      memorySizeMB: (this.totalSize / 1024 / 1024).toFixed(2),
      redisConnected: isRedisConnected(),
    };
  }
}
