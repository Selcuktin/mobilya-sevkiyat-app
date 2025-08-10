import { cache, businessCache, invalidateCache } from '@/lib/cache'

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    exists: jest.fn(),
    flushdb: jest.fn(),
  }))
})

describe('Cache Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Cache Operations', () => {
    it('should set and get cache values', async () => {
      const testKey = 'test-key'
      const testValue = { data: 'test-data' }

      // Set cache
      const setResult = await cache.set(testKey, testValue)
      expect(setResult).toBe(true)

      // Get cache (will use memory cache in test environment)
      const getValue = await cache.get(testKey)
      expect(getValue).toEqual(testValue)
    })

    it('should return null for non-existent keys', async () => {
      const result = await cache.get('non-existent-key')
      expect(result).toBe(null)
    })

    it('should delete cache values', async () => {
      const testKey = 'delete-test'
      const testValue = 'test-value'

      await cache.set(testKey, testValue)
      const deleteResult = await cache.delete(testKey)
      expect(deleteResult).toBe(true)

      const getValue = await cache.get(testKey)
      expect(getValue).toBe(null)
    })

    it('should check if key exists', async () => {
      const testKey = 'exists-test'
      const testValue = 'test-value'

      // Key should not exist initially
      let exists = await cache.exists(testKey)
      expect(exists).toBe(false)

      // Set value and check again
      await cache.set(testKey, testValue)
      exists = await cache.exists(testKey)
      expect(exists).toBe(true)
    })
  })

  describe('Cache Options', () => {
    it('should handle TTL correctly', async () => {
      const testKey = 'ttl-test'
      const testValue = 'test-value'
      const ttl = 1 // 1 second

      await cache.set(testKey, testValue, { ttl })
      
      // Should exist immediately
      let exists = await cache.exists(testKey)
      expect(exists).toBe(true)

      // Wait for TTL to expire (in memory cache)
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      exists = await cache.exists(testKey)
      expect(exists).toBe(false)
    })

    it('should handle prefix correctly', async () => {
      const testKey = 'prefix-test'
      const testValue = 'test-value'
      const prefix = 'test-prefix'

      await cache.set(testKey, testValue, { prefix })
      const getValue = await cache.get(testKey, { prefix })
      expect(getValue).toEqual(testValue)

      // Should not be found without prefix
      const getWithoutPrefix = await cache.get(testKey)
      expect(getWithoutPrefix).toBe(null)
    })
  })

  describe('Business Cache Functions', () => {
    describe('Products Cache', () => {
      it('should cache product list', async () => {
        const userId = 1
        const page = 1
        const limit = 10
        const testData = [{ id: '1', name: 'Test Product' }]

        await businessCache.products.setList(userId, page, limit, testData)
        const cachedData = await businessCache.products.list(userId, page, limit)
        
        expect(cachedData).toEqual(testData)
      })

      it('should cache individual product', async () => {
        const productId = 'product-123'
        const testData = { id: productId, name: 'Test Product', price: 100 }

        await businessCache.products.setItem(productId, testData)
        const cachedData = await businessCache.products.item(productId)
        
        expect(cachedData).toEqual(testData)
      })

      it('should invalidate user products cache', async () => {
        const userId = 1
        
        // This should not throw an error
        await expect(businessCache.products.invalidateUser(userId)).resolves.not.toThrow()
      })
    })

    describe('Dashboard Cache', () => {
      it('should cache dashboard stats', async () => {
        const userId = 1
        const testStats = { totalSales: 1000, totalOrders: 50 }

        await businessCache.dashboard.setStats(userId, testStats)
        const cachedStats = await businessCache.dashboard.stats(userId)
        
        expect(cachedStats).toEqual(testStats)
      })

      it('should cache dashboard charts', async () => {
        const userId = 1
        const period = '30d'
        const testCharts = { sales: [100, 200, 300] }

        await businessCache.dashboard.setCharts(userId, period, testCharts)
        const cachedCharts = await businessCache.dashboard.charts(userId, period)
        
        expect(cachedCharts).toEqual(testCharts)
      })
    })
  })

  describe('Cache Invalidation', () => {
    it('should invalidate product cache', async () => {
      const productId = 'product-123'
      const userId = 1

      // This should not throw an error
      await expect(invalidateCache.product(productId, userId)).resolves.not.toThrow()
    })

    it('should invalidate customer cache', async () => {
      const customerId = 'customer-123'
      const userId = 1

      // This should not throw an error
      await expect(invalidateCache.customer(customerId, userId)).resolves.not.toThrow()
    })

    it('should invalidate shipment cache', async () => {
      const userId = 1

      // This should not throw an error
      await expect(invalidateCache.shipment(userId)).resolves.not.toThrow()
    })

    it('should invalidate all user cache', async () => {
      const userId = 1

      // This should not throw an error
      await expect(invalidateCache.user(userId)).resolves.not.toThrow()
    })
  })

  describe('Cache Statistics', () => {
    it('should return cache statistics', () => {
      const stats = cache.getStats()
      
      expect(stats).toHaveProperty('hits')
      expect(stats).toHaveProperty('misses')
      expect(stats).toHaveProperty('sets')
      expect(stats).toHaveProperty('deletes')
      expect(stats).toHaveProperty('errors')
      expect(stats).toHaveProperty('hitRate')
      expect(stats).toHaveProperty('isRedisConnected')
      
      expect(typeof stats.hits).toBe('number')
      expect(typeof stats.misses).toBe('number')
      expect(typeof stats.hitRate).toBe('number')
      expect(typeof stats.isRedisConnected).toBe('boolean')
    })
  })

  describe('Error Handling', () => {
    it('should handle cache errors gracefully', async () => {
      // Test with invalid data that might cause serialization errors
      const result = await cache.set('error-test', undefined)
      expect(typeof result).toBe('boolean')
    })

    it('should handle get errors gracefully', async () => {
      const result = await cache.get('non-existent-key')
      expect(result).toBe(null)
    })
  })
})