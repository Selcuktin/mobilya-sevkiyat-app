// Redis caching implementation

import { logger } from './monitoring';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  serialize?: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

class CacheManager {
  private redis: any = null;
  private isConnected = false;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0
  };

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      // Only initialize Redis in production or if Redis URL is provided
      if (process.env.REDIS_URL) {
        const Redis = require('ioredis');
        this.redis = new Redis(process.env.REDIS_URL, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          onConnect: () => {
            this.isConnected = true;
            logger.info('Redis connected successfully');
          },
          onError: (error: Error) => {
            this.isConnected = false;
            this.stats.errors++;
            logger.error('Redis connection error', error);
          }
        });

        await this.redis.connect();
      } else {
        logger.info('Redis not configured, using in-memory cache fallback');
        this.initializeMemoryCache();
      }
    } catch (error) {
      logger.error('Failed to initialize Redis', error);
      this.initializeMemoryCache();
    }
  }

  // Fallback in-memory cache
  private memoryCache = new Map<string, { value: any; expires: number }>();
  
  private initializeMemoryCache(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.expires < now) {
          this.memoryCache.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  // Get value from cache
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const fullKey = this.buildKey(key, options.prefix);

    try {
      let value: string | null = null;

      if (this.redis && this.isConnected) {
        value = await this.redis.get(fullKey);
      } else {
        // Use memory cache
        const entry = this.memoryCache.get(fullKey);
        if (entry && entry.expires > Date.now()) {
          value = entry.value;
        } else if (entry) {
          this.memoryCache.delete(fullKey);
        }
      }

      if (value !== null) {
        this.stats.hits++;
        return options.serialize !== false ? JSON.parse(value) : value;
      } else {
        this.stats.misses++;
        return null;
      }
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache get error', error, { key: fullKey });
      return null;
    }
  }

  // Set value in cache
  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    const fullKey = this.buildKey(key, options.prefix);
    const ttl = options.ttl || 3600; // Default 1 hour
    const serializedValue = options.serialize !== false ? JSON.stringify(value) : value;

    try {
      if (this.redis && this.isConnected) {
        await this.redis.setex(fullKey, ttl, serializedValue);
      } else {
        // Use memory cache
        this.memoryCache.set(fullKey, {
          value: serializedValue,
          expires: Date.now() + (ttl * 1000)
        });
      }

      this.stats.sets++;
      return true;
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache set error', error, { key: fullKey });
      return false;
    }
  }

  // Delete from cache
  async delete(key: string, options: CacheOptions = {}): Promise<boolean> {
    const fullKey = this.buildKey(key, options.prefix);

    try {
      if (this.redis && this.isConnected) {
        await this.redis.del(fullKey);
      } else {
        this.memoryCache.delete(fullKey);
      }

      this.stats.deletes++;
      return true;
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache delete error', error, { key: fullKey });
      return false;
    }
  }

  // Delete multiple keys by pattern
  async deletePattern(pattern: string, options: CacheOptions = {}): Promise<number> {
    const fullPattern = this.buildKey(pattern, options.prefix);

    try {
      let deletedCount = 0;

      if (this.redis && this.isConnected) {
        const keys = await this.redis.keys(fullPattern);
        if (keys.length > 0) {
          deletedCount = await this.redis.del(...keys);
        }
      } else {
        // Use memory cache
        const regex = new RegExp(fullPattern.replace('*', '.*'));
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
            deletedCount++;
          }
        }
      }

      this.stats.deletes += deletedCount;
      return deletedCount;
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache delete pattern error', error, { pattern: fullPattern });
      return 0;
    }
  }

  // Check if key exists
  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    const fullKey = this.buildKey(key, options.prefix);

    try {
      if (this.redis && this.isConnected) {
        return (await this.redis.exists(fullKey)) === 1;
      } else {
        const entry = this.memoryCache.get(fullKey);
        return entry !== undefined && entry.expires > Date.now();
      }
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache exists error', error, { key: fullKey });
      return false;
    }
  }

  // Get cache statistics
  getStats(): CacheStats & { hitRate: number; isRedisConnected: boolean } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      hitRate,
      isRedisConnected: this.isConnected
    };
  }

  // Build cache key with prefix
  private buildKey(key: string, prefix?: string): string {
    const appPrefix = process.env.CACHE_PREFIX || 'sevkiyat';
    const fullPrefix = prefix ? `${appPrefix}:${prefix}` : appPrefix;
    return `${fullPrefix}:${key}`;
  }

  // Flush all cache
  async flush(): Promise<boolean> {
    try {
      if (this.redis && this.isConnected) {
        await this.redis.flushdb();
      } else {
        this.memoryCache.clear();
      }
      return true;
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache flush error', error);
      return false;
    }
  }
}

// Cache wrapper for functions
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: CacheOptions & { keyGenerator?: (...args: Parameters<T>) => string } = {}
): T {
  return (async (...args: Parameters<T>) => {
    const key = options.keyGenerator 
      ? options.keyGenerator(...args)
      : `fn:${fn.name}:${JSON.stringify(args)}`;

    // Try to get from cache
    const cached = await cache.get(key, options);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn(...args);
    await cache.set(key, result, options);
    
    return result;
  }) as T;
}

// Specific cache functions for business logic
export const businessCache = {
  // Products cache
  products: {
    list: (userId: number, page: number = 1, limit: number = 10) => 
      cache.get(`products:list:${userId}:${page}:${limit}`, { ttl: 300, prefix: 'products' }),
    
    setList: (userId: number, page: number, limit: number, data: any) =>
      cache.set(`products:list:${userId}:${page}:${limit}`, data, { ttl: 300, prefix: 'products' }),
    
    item: (productId: string) =>
      cache.get(`item:${productId}`, { ttl: 600, prefix: 'products' }),
    
    setItem: (productId: string, data: any) =>
      cache.set(`item:${productId}`, data, { ttl: 600, prefix: 'products' }),
    
    invalidateUser: (userId: number) =>
      cache.deletePattern(`products:list:${userId}:*`, { prefix: 'products' })
  },

  // Customers cache
  customers: {
    list: (userId: number, page: number = 1) =>
      cache.get(`list:${userId}:${page}`, { ttl: 300, prefix: 'customers' }),
    
    setList: (userId: number, page: number, data: any) =>
      cache.set(`list:${userId}:${page}`, data, { ttl: 300, prefix: 'customers' }),
    
    item: (customerId: string) =>
      cache.get(`item:${customerId}`, { ttl: 600, prefix: 'customers' }),
    
    setItem: (customerId: string, data: any) =>
      cache.set(`item:${customerId}`, data, { ttl: 600, prefix: 'customers' })
  },

  // Dashboard cache
  dashboard: {
    stats: (userId: number) =>
      cache.get(`stats:${userId}`, { ttl: 180, prefix: 'dashboard' }),
    
    setStats: (userId: number, data: any) =>
      cache.set(`stats:${userId}`, data, { ttl: 180, prefix: 'dashboard' }),
    
    charts: (userId: number, period: string) =>
      cache.get(`charts:${userId}:${period}`, { ttl: 300, prefix: 'dashboard' }),
    
    setCharts: (userId: number, period: string, data: any) =>
      cache.set(`charts:${userId}:${period}`, data, { ttl: 300, prefix: 'dashboard' })
  },

  // Reports cache
  reports: {
    data: (userId: number, type: string, filters: string) =>
      cache.get(`data:${userId}:${type}:${filters}`, { ttl: 600, prefix: 'reports' }),
    
    setData: (userId: number, type: string, filters: string, data: any) =>
      cache.set(`data:${userId}:${type}:${filters}`, data, { ttl: 600, prefix: 'reports' })
  }
};

// Create cache instance
export const cache = new CacheManager();

// Cache invalidation helpers
export const invalidateCache = {
  product: async (productId: string, userId: number) => {
    await Promise.all([
      cache.delete(`products:item:${productId}`),
      cache.deletePattern(`products:list:${userId}:*`),
      cache.delete(`dashboard:stats:${userId}`),
      cache.deletePattern(`dashboard:charts:${userId}:*`)
    ]);
  },

  customer: async (customerId: string, userId: number) => {
    await Promise.all([
      cache.delete(`customers:item:${customerId}`),
      cache.deletePattern(`customers:list:${userId}:*`),
      cache.delete(`dashboard:stats:${userId}`)
    ]);
  },

  shipment: async (userId: number) => {
    await Promise.all([
      cache.delete(`dashboard:stats:${userId}`),
      cache.deletePattern(`dashboard:charts:${userId}:*`),
      cache.deletePattern(`reports:data:${userId}:*`)
    ]);
  },

  user: async (userId: number) => {
    await cache.deletePattern(`*:${userId}:*`);
  }
};