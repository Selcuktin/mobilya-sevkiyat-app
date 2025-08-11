// Production monitoring and logging

interface LogLevel {
  ERROR: 'error'
  WARN: 'warn'
  INFO: 'info'
  DEBUG: 'debug'
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
}

interface LogEntry {
  level: keyof LogLevel
  message: string
  timestamp: string
  userId?: string
  ip?: string
  userAgent?: string
  url?: string
  method?: string
  statusCode?: number
  responseTime?: number
  error?: any
  metadata?: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatLog(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version
    })
  }

  private shouldLog(level: keyof LogLevel): boolean {
    if (this.isDevelopment) return true
    
    const logLevel = process.env.LOG_LEVEL || 'info'
    const levels = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(logLevel)
    const messageLevelIndex = levels.indexOf(level)
    
    return messageLevelIndex >= currentLevelIndex
  }

  error(message: string, error?: any, metadata?: any): void {
    if (!this.shouldLog('ERROR')) return

    const logEntry: LogEntry = {
      level: 'ERROR',
      message,
      timestamp: new Date().toISOString(),
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      metadata
    }

    console.error(this.formatLog(logEntry))
    
    // Send to external logging service in production
    if (!this.isDevelopment) {
      this.sendToExternalLogger(logEntry)
    }
  }

  warn(message: string, metadata?: any): void {
    if (!this.shouldLog('WARN')) return

    const logEntry: LogEntry = {
      level: 'WARN',
      message,
      timestamp: new Date().toISOString(),
      metadata
    }

    console.warn(this.formatLog(logEntry))
  }

  info(message: string, metadata?: any): void {
    if (!this.shouldLog('INFO')) return

    const logEntry: LogEntry = {
      level: 'INFO',
      message,
      timestamp: new Date().toISOString(),
      metadata
    }

    console.info(this.formatLog(logEntry))
  }

  debug(message: string, metadata?: any): void {
    if (!this.shouldLog('DEBUG')) return

    const logEntry: LogEntry = {
      level: 'DEBUG',
      message,
      timestamp: new Date().toISOString(),
      metadata
    }

    console.debug(this.formatLog(logEntry))
  }

  // API request logging
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    userId?: string,
    ip?: string,
    userAgent?: string,
    error?: any
  ): void {
    const logEntry: LogEntry = {
      level: statusCode >= 400 ? 'ERROR' : 'INFO',
      message: `${method} ${url} - ${statusCode}`,
      timestamp: new Date().toISOString(),
      method,
      url,
      statusCode,
      responseTime,
      userId,
      ip,
      userAgent,
      error
    }

    if (statusCode >= 400) {
      console.error(this.formatLog(logEntry))
    } else {
      console.info(this.formatLog(logEntry))
    }

    // Send to external service
    if (!this.isDevelopment) {
      this.sendToExternalLogger(logEntry)
    }
  }

  private async sendToExternalLogger(logEntry: LogEntry): Promise<void> {
    try {
      // Example: Send to external logging service
      if (process.env.LOG_WEBHOOK_URL) {
        await fetch(process.env.LOG_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry)
        })
      }
    } catch (error) {
      console.error('Failed to send log to external service:', error)
    }
  }
}

// Performance monitoring
class PerformanceMonitor {
  private metrics = new Map<string, number[]>()

  startTimer(label: string): () => number {
    const start = Date.now()
    return () => {
      const duration = Date.now() - start
      this.recordMetric(label, duration)
      return duration
    }
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    
    const values = this.metrics.get(label)!
    values.push(value)
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }

  getMetrics(label: string): {
    count: number
    avg: number
    min: number
    max: number
    p95: number
  } | null {
    const values = this.metrics.get(label)
    if (!values || values.length === 0) return null

    const sorted = [...values].sort((a, b) => a - b)
    const count = values.length
    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / count
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    const p95Index = Math.floor(count * 0.95)
    const p95 = sorted[p95Index]

    return { count, avg, min, max, p95 }
  }

  getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {}
    
    this.metrics.forEach((_, label) => {
      result[label] = this.getMetrics(label)
    })
    
    return result
  }
}

// Health check
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  version: string
  uptime: number
  database: 'connected' | 'disconnected'
  redis?: 'connected' | 'disconnected'
  external_services: Record<string, 'up' | 'down'>
  metrics: Record<string, any>
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const startTime = Date.now()
  
  // Check database
  let databaseStatus: 'connected' | 'disconnected' = 'disconnected'
  try {
    // Add your database health check here
    databaseStatus = 'connected'
  } catch (error) {
    logger.error('Database health check failed', error)
  }

  // Check external services
  const externalServices: Record<string, 'up' | 'down'> = {}
  
  // Example: Check email service
  try {
    if (process.env.SMTP_HOST) {
      // Add SMTP health check
      externalServices.email = 'up'
    }
  } catch (error) {
    externalServices.email = 'down'
  }

  const responseTime = Date.now() - startTime
  const uptime = process.uptime()

  const status: HealthStatus = {
    status: databaseStatus === 'connected' ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    uptime,
    database: databaseStatus,
    external_services: externalServices,
    metrics: {
      response_time: responseTime,
      memory_usage: process.memoryUsage(),
      cpu_usage: process.cpuUsage()
    }
  }

  return status
}

// Error tracking
export function trackError(error: Error, context?: any): void {
  logger.error('Unhandled error', error, context)
  
  // Send to error tracking service (e.g., Sentry)
  if (process.env.SENTRY_DSN) {
    // Sentry.captureException(error, { extra: context })
  }
}

// Export instances
export const logger = new Logger()
export const performanceMonitor = new PerformanceMonitor()

// Middleware for request logging
export function createRequestLogger() {
  return (req: any, res: any, next: any) => {
    const start = Date.now()
    const originalSend = res.send

    res.send = function(body: any) {
      const responseTime = Date.now() - start
      
      logger.logRequest(
        req.method,
        req.url,
        res.statusCode,
        responseTime,
        req.user?.id,
        req.ip,
        req.get('User-Agent')
      )
      
      return originalSend.call(this, body)
    }

    next()
  }
}