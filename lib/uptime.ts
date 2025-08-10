// Uptime monitoring and alerting system

import { logger } from './monitoring';

interface UptimeCheck {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'HEAD';
  expectedStatus: number;
  timeout: number;
  interval: number; // seconds
  enabled: boolean;
  headers?: Record<string, string>;
  body?: string;
}

interface UptimeResult {
  checkId: string;
  timestamp: Date;
  responseTime: number;
  status: 'up' | 'down';
  statusCode?: number;
  error?: string;
}

interface UptimeStats {
  checkId: string;
  uptime: number; // percentage
  avgResponseTime: number;
  totalChecks: number;
  successfulChecks: number;
  lastCheck: Date;
  status: 'up' | 'down' | 'unknown';
}

class UptimeMonitor {
  private checks: Map<string, UptimeCheck> = new Map();
  private results: Map<string, UptimeResult[]> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private maxResults = 1000; // Keep last 1000 results per check

  // Add uptime check
  addCheck(check: UptimeCheck): void {
    this.checks.set(check.id, check);
    this.results.set(check.id, []);
    
    if (check.enabled) {
      this.startCheck(check.id);
    }
    
    logger.info(`Uptime check added: ${check.name}`, { checkId: check.id });
  }

  // Remove uptime check
  removeCheck(checkId: string): void {
    this.stopCheck(checkId);
    this.checks.delete(checkId);
    this.results.delete(checkId);
    
    logger.info(`Uptime check removed`, { checkId });
  }

  // Start monitoring a check
  private startCheck(checkId: string): void {
    const check = this.checks.get(checkId);
    if (!check) return;

    // Clear existing interval
    this.stopCheck(checkId);

    // Start new interval
    const interval = setInterval(async () => {
      await this.performCheck(checkId);
    }, check.interval * 1000);

    this.intervals.set(checkId, interval);
    
    // Perform initial check
    this.performCheck(checkId);
  }

  // Stop monitoring a check
  private stopCheck(checkId: string): void {
    const interval = this.intervals.get(checkId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(checkId);
    }
  }

  // Perform single uptime check
  private async performCheck(checkId: string): Promise<UptimeResult> {
    const check = this.checks.get(checkId);
    if (!check) {
      throw new Error(`Check not found: ${checkId}`);
    }

    const startTime = Date.now();
    let result: UptimeResult;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), check.timeout);

      const response = await fetch(check.url, {
        method: check.method,
        headers: check.headers,
        body: check.body,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      result = {
        checkId,
        timestamp: new Date(),
        responseTime,
        status: response.status === check.expectedStatus ? 'up' : 'down',
        statusCode: response.status
      };

      if (response.status !== check.expectedStatus) {
        result.error = `Expected status ${check.expectedStatus}, got ${response.status}`;
      }

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      result = {
        checkId,
        timestamp: new Date(),
        responseTime,
        status: 'down',
        error: error.message
      };
    }

    // Store result
    this.storeResult(result);

    // Send alerts if needed
    await this.checkAlerts(result);

    return result;
  }

  // Store check result
  private storeResult(result: UptimeResult): void {
    const results = this.results.get(result.checkId) || [];
    results.push(result);

    // Keep only last N results
    if (results.length > this.maxResults) {
      results.shift();
    }

    this.results.set(result.checkId, results);
  }

  // Check if alerts should be sent
  private async checkAlerts(result: UptimeResult): Promise<void> {
    const check = this.checks.get(result.checkId);
    if (!check) return;

    if (result.status === 'down') {
      await this.sendAlert(check, result);
      logger.error(`Uptime check failed: ${check.name}`, {
        checkId: result.checkId,
        error: result.error,
        responseTime: result.responseTime
      });
    } else {
      // Check if this is a recovery
      const recentResults = this.getRecentResults(result.checkId, 2);
      if (recentResults.length >= 2 && 
          recentResults[0].status === 'down' && 
          result.status === 'up') {
        await this.sendRecoveryAlert(check, result);
        logger.info(`Uptime check recovered: ${check.name}`, {
          checkId: result.checkId,
          responseTime: result.responseTime
        });
      }
    }
  }

  // Send downtime alert
  private async sendAlert(check: UptimeCheck, result: UptimeResult): Promise<void> {
    const alertData = {
      type: 'downtime',
      checkName: check.name,
      url: check.url,
      error: result.error,
      timestamp: result.timestamp,
      responseTime: result.responseTime
    };

    // Send to webhook if configured
    if (process.env.UPTIME_WEBHOOK_URL) {
      try {
        await fetch(process.env.UPTIME_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alertData)
        });
      } catch (error) {
        logger.error('Failed to send uptime alert', error);
      }
    }

    // Send email if configured
    if (process.env.ALERT_EMAIL) {
      await this.sendEmailAlert(alertData);
    }
  }

  // Send recovery alert
  private async sendRecoveryAlert(check: UptimeCheck, result: UptimeResult): Promise<void> {
    const alertData = {
      type: 'recovery',
      checkName: check.name,
      url: check.url,
      timestamp: result.timestamp,
      responseTime: result.responseTime
    };

    if (process.env.UPTIME_WEBHOOK_URL) {
      try {
        await fetch(process.env.UPTIME_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alertData)
        });
      } catch (error) {
        logger.error('Failed to send recovery alert', error);
      }
    }
  }

  // Send email alert (placeholder)
  private async sendEmailAlert(alertData: any): Promise<void> {
    // This will be implemented with email system
    logger.info('Email alert would be sent', alertData);
  }

  // Get recent results
  private getRecentResults(checkId: string, count: number): UptimeResult[] {
    const results = this.results.get(checkId) || [];
    return results.slice(-count);
  }

  // Get uptime statistics
  getStats(checkId: string): UptimeStats | null {
    const check = this.checks.get(checkId);
    const results = this.results.get(checkId);
    
    if (!check || !results || results.length === 0) {
      return null;
    }

    const totalChecks = results.length;
    const successfulChecks = results.filter(r => r.status === 'up').length;
    const uptime = (successfulChecks / totalChecks) * 100;
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / totalChecks;
    const lastCheck = results[results.length - 1];

    return {
      checkId,
      uptime,
      avgResponseTime,
      totalChecks,
      successfulChecks,
      lastCheck: lastCheck.timestamp,
      status: lastCheck.status
    };
  }

  // Get all statistics
  getAllStats(): UptimeStats[] {
    const stats: UptimeStats[] = [];
    
    for (const checkId of this.checks.keys()) {
      const stat = this.getStats(checkId);
      if (stat) {
        stats.push(stat);
      }
    }
    
    return stats;
  }

  // Enable/disable check
  setCheckEnabled(checkId: string, enabled: boolean): void {
    const check = this.checks.get(checkId);
    if (!check) return;

    check.enabled = enabled;
    
    if (enabled) {
      this.startCheck(checkId);
    } else {
      this.stopCheck(checkId);
    }
  }

  // Cleanup
  destroy(): void {
    for (const checkId of this.intervals.keys()) {
      this.stopCheck(checkId);
    }
    this.checks.clear();
    this.results.clear();
  }
}

// Default uptime checks
const defaultChecks: UptimeCheck[] = [
  {
    id: 'main-site',
    name: 'Main Website',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    method: 'GET',
    expectedStatus: 200,
    timeout: 10000,
    interval: 60, // 1 minute
    enabled: true
  },
  {
    id: 'health-check',
    name: 'Health Check API',
    url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/health`,
    method: 'GET',
    expectedStatus: 200,
    timeout: 5000,
    interval: 30, // 30 seconds
    enabled: true
  },
  {
    id: 'database-api',
    name: 'Database API',
    url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/products`,
    method: 'GET',
    expectedStatus: 200,
    timeout: 10000,
    interval: 120, // 2 minutes
    enabled: true,
    headers: {
      'User-Agent': 'UptimeMonitor/1.0'
    }
  }
];

// Create and configure uptime monitor
export const uptimeMonitor = new UptimeMonitor();

// Initialize default checks
export const initializeUptimeMonitoring = () => {
  if (process.env.NODE_ENV === 'production') {
    defaultChecks.forEach(check => {
      uptimeMonitor.addCheck(check);
    });
    
    logger.info('Uptime monitoring initialized', {
      checksCount: defaultChecks.length
    });
  }
};

// Export types and monitor
export type { UptimeCheck, UptimeResult, UptimeStats };
export { UptimeMonitor };