// Simple cache implementation without problematic iterators
export class SimpleCache<T = any> {
  private memoryCache = new Map<string, { value: T; expires: number }>()
  private stats = { hits: 0, misses: 0 }

  async get<K = T>(key: string): Promise<K | null> {
    const entry = this.memoryCache.get(key)
    if (entry && entry.expires > Date.now()) {
      this.stats.hits++
      return entry.value as unknown as K
    }
    this.stats.misses++
    return null
  }

  async set(key: string, value: T, ttl = 3600): Promise<void> {
    const expires = Date.now() + (ttl * 1000)
    this.memoryCache.set(key, { value, expires })
  }

  async delete(key: string): Promise<boolean> {
    return this.memoryCache.delete(key)
  }

  async clear(): Promise<void> {
    this.memoryCache.clear()
  }

  getStats() {
    return { ...this.stats }
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.memoryCache.forEach((entry, key) => {
      if (entry.expires < now) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.memoryCache.delete(key))
  }
}

// Export default instance
export const cache = new SimpleCache()

// Helper functions
export async function getCached<T>(key: string): Promise<T | null> {
  return cache.get<T>(key)
}

export async function setCached<T>(key: string, value: T, ttl?: number): Promise<void> {
  return cache.set(key, value, ttl)
}

export async function deleteCached(key: string): Promise<boolean> {
  return cache.delete(key)
}

export async function clearCache(): Promise<void> {
  return cache.clear()
}