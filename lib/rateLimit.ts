import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RequestRecord {
  count: number
  resetTime: number
  successCount: number
  failedCount: number
}

class RateLimiter {
  private requests = new Map<string, RequestRecord>()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = {
      message: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config
    }
  }

  private getIdentifier(request: NextRequest): string {
    // Use IP address as identifier
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
    return ip
  }

  private cleanupExpiredRecords(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.requests.forEach((record, key) => {
      if (now > record.resetTime) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => {
      this.requests.delete(key)
    })
  }

  public check(request: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
    this.cleanupExpiredRecords()
    
    const identifier = this.getIdentifier(request)
    const now = Date.now()
    
    let record = this.requests.get(identifier)
    
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + this.config.windowMs,
        successCount: 0,
        failedCount: 0
      }
      this.requests.set(identifier, record)
    }
    
    const allowed = record.count < this.config.maxRequests
    const remaining = Math.max(0, this.config.maxRequests - record.count - 1)
    
    if (allowed) {
      record.count++
    }
    
    return {
      allowed,
      remaining,
      resetTime: record.resetTime
    }
  }

  public recordResult(request: NextRequest, success: boolean): void {
    if (this.config.skipSuccessfulRequests && success) return
    if (this.config.skipFailedRequests && !success) return
    
    const identifier = this.getIdentifier(request)
    const record = this.requests.get(identifier)
    
    if (record) {
      if (success) {
        record.successCount++
      } else {
        record.failedCount++
      }
    }
  }

  public createMiddleware() {
    return (request: NextRequest) => {
      const result = this.check(request)
      
      if (!result.allowed) {
        return NextResponse.json(
          { 
            success: false, 
            error: this.config.message,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': this.config.maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
            }
          }
        )
      }
      
      return null // Allow request to continue
    }
  }
}

// Pre-configured rate limiters
export const apiRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'API rate limit exceeded. Please try again later.'
})

export const authRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
  message: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.',
  skipSuccessfulRequests: true
})

export const strictRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
  message: 'Rate limit exceeded. Please slow down.'
})

// Helper function to apply rate limiting to API routes
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  rateLimiter: RateLimiter = apiRateLimit
) {
  return async (request: NextRequest) => {
    const rateLimitResponse = rateLimiter.createMiddleware()(request)
    
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    
    try {
      const response = await handler(request)
      rateLimiter.recordResult(request, response.status < 400)
      return response
    } catch (error) {
      rateLimiter.recordResult(request, false)
      throw error
    }
  }
}

// IP-based rate limiting for specific endpoints
export const createIPRateLimit = (maxRequests: number, windowMs: number) => {
  return new RateLimiter({
    windowMs,
    maxRequests,
    message: `Too many requests from this IP. Limit: ${maxRequests} requests per ${windowMs / 1000} seconds.`
  })
}

// User-based rate limiting (requires authentication)
export const createUserRateLimit = (maxRequests: number, windowMs: number) => {
  const userRequests = new Map<string, RequestRecord>()
  
  return {
    check: (userId: string): boolean => {
      const now = Date.now()
      let record = userRequests.get(userId)
      
      if (!record || now > record.resetTime) {
        record = {
          count: 1,
          resetTime: now + windowMs,
          successCount: 0,
          failedCount: 0
        }
        userRequests.set(userId, record)
        return true
      }
      
      if (record.count >= maxRequests) {
        return false
      }
      
      record.count++
      return true
    },
    
    cleanup: (): void => {
      const now = Date.now()
      const keysToDelete: string[] = []
      
      userRequests.forEach((record, key) => {
        if (now > record.resetTime) {
          keysToDelete.push(key)
        }
      })
      
      keysToDelete.forEach(key => {
        userRequests.delete(key)
      })
    }
  }
}