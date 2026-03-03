import { logger } from '../../infrastructure/logger';

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  throttleThreshold: number; // Percentage (e.g., 20 for 20%)
}

export class RateLimiter {
  private limits: Map<string, RateLimitInfo> = new Map();
  private requestCounts: Map<string, number[]> = new Map();
  private config: Map<string, RateLimitConfig> = new Map();

  constructor() {
    // Default configurations
    this.config.set('jira', {
      maxRequests: 100,
      windowMs: 60000, // 1 minute
      throttleThreshold: 20,
    });

    this.config.set('github', {
      maxRequests: 5000,
      windowMs: 3600000, // 1 hour
      throttleThreshold: 20,
    });
  }

  /**
   * Update rate limit info from API response headers
   */
  updateLimits(integration: string, limitInfo: RateLimitInfo): void {
    this.limits.set(integration, limitInfo);
    
    logger.debug('Rate limit updated', {
      integration,
      limit: limitInfo.limit,
      remaining: limitInfo.remaining,
      reset: limitInfo.reset,
    });
  }

  /**
   * Get current rate limit info for integration
   */
  getLimits(integration: string): RateLimitInfo | null {
    return this.limits.get(integration) || null;
  }

  /**
   * Check if we should throttle requests (proactive)
   */
  shouldThrottle(integration: string): boolean {
    const limitInfo = this.limits.get(integration);
    if (!limitInfo) {
      return false;
    }

    const config = this.config.get(integration);
    if (!config) {
      return false;
    }

    const percentageRemaining = (limitInfo.remaining / limitInfo.limit) * 100;
    const shouldThrottle = percentageRemaining < config.throttleThreshold;

    if (shouldThrottle) {
      logger.warn('Rate limit throttling activated', {
        integration,
        remaining: limitInfo.remaining,
        limit: limitInfo.limit,
        percentageRemaining: percentageRemaining.toFixed(2),
        threshold: config.throttleThreshold,
      });
    }

    return shouldThrottle;
  }

  /**
   * Check if rate limit is exceeded
   */
  isLimitExceeded(integration: string): boolean {
    const limitInfo = this.limits.get(integration);
    if (!limitInfo) {
      return false;
    }

    // Check if reset time has passed
    if (new Date() > limitInfo.reset) {
      // Reset has occurred, clear the limit
      this.limits.delete(integration);
      return false;
    }

    return limitInfo.remaining <= 0;
  }

  /**
   * Get time until rate limit reset (in milliseconds)
   */
  getTimeUntilReset(integration: string): number {
    const limitInfo = this.limits.get(integration);
    if (!limitInfo) {
      return 0;
    }

    const now = new Date();
    const resetTime = limitInfo.reset;
    
    if (now > resetTime) {
      return 0;
    }

    return resetTime.getTime() - now.getTime();
  }

  /**
   * Record a request for in-memory tracking
   */
  recordRequest(integration: string): void {
    const now = Date.now();
    const config = this.config.get(integration);
    
    if (!config) {
      return;
    }

    // Get or initialize request timestamps
    let timestamps = this.requestCounts.get(integration) || [];
    
    // Remove timestamps outside the window
    const windowStart = now - config.windowMs;
    timestamps = timestamps.filter(ts => ts > windowStart);
    
    // Add current request
    timestamps.push(now);
    
    this.requestCounts.set(integration, timestamps);

    // Log if approaching limit
    if (timestamps.length > config.maxRequests * 0.8) {
      logger.warn('Approaching in-memory rate limit', {
        integration,
        requests: timestamps.length,
        limit: config.maxRequests,
        windowMs: config.windowMs,
      });
    }
  }

  /**
   * Check if in-memory rate limit would be exceeded
   */
  wouldExceedInMemoryLimit(integration: string): boolean {
    const now = Date.now();
    const config = this.config.get(integration);
    
    if (!config) {
      return false;
    }

    const timestamps = this.requestCounts.get(integration) || [];
    const windowStart = now - config.windowMs;
    const recentRequests = timestamps.filter(ts => ts > windowStart);

    return recentRequests.length >= config.maxRequests;
  }

  /**
   * Calculate delay needed before next request (proactive throttling)
   */
  calculateDelay(integration: string): number {
    // Check API-reported limits first
    if (this.shouldThrottle(integration)) {
      const timeUntilReset = this.getTimeUntilReset(integration);
      const limitInfo = this.limits.get(integration);
      
      if (limitInfo && limitInfo.remaining > 0) {
        // Spread remaining requests evenly until reset
        return Math.ceil(timeUntilReset / limitInfo.remaining);
      }
    }

    // Check in-memory limits
    if (this.wouldExceedInMemoryLimit(integration)) {
      const config = this.config.get(integration);
      if (config) {
        // Wait for the window to slide
        return config.windowMs / config.maxRequests;
      }
    }

    return 0;
  }

  /**
   * Wait for rate limit delay if needed
   */
  async waitIfNeeded(integration: string): Promise<void> {
    const delay = this.calculateDelay(integration);
    
    if (delay > 0) {
      logger.info('Rate limit delay applied', {
        integration,
        delayMs: delay,
      });
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.recordRequest(integration);
  }

  /**
   * Get rate limit status for monitoring
   */
  getStatus(integration: string): {
    apiLimits: RateLimitInfo | null;
    inMemoryRequests: number;
    shouldThrottle: boolean;
    isExceeded: boolean;
    nextResetMs: number;
  } {
    const limitInfo = this.limits.get(integration);
    const timestamps = this.requestCounts.get(integration) || [];
    const config = this.config.get(integration);
    
    const now = Date.now();
    const windowStart = config ? now - config.windowMs : now;
    const recentRequests = timestamps.filter(ts => ts > windowStart);

    return {
      apiLimits: limitInfo || null,
      inMemoryRequests: recentRequests.length,
      shouldThrottle: this.shouldThrottle(integration),
      isExceeded: this.isLimitExceeded(integration),
      nextResetMs: this.getTimeUntilReset(integration),
    };
  }

  /**
   * Clear rate limit data for integration
   */
  clear(integration: string): void {
    this.limits.delete(integration);
    this.requestCounts.delete(integration);
    logger.debug('Rate limit data cleared', { integration });
  }

  /**
   * Clear all rate limit data
   */
  clearAll(): void {
    this.limits.clear();
    this.requestCounts.clear();
    logger.debug('All rate limit data cleared');
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();
