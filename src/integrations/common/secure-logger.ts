import { logger as baseLogger } from '../../infrastructure/logger';

/**
 * Secure logger that redacts sensitive information from logs
 */
export class SecureLogger {
  private emailPattern = /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

  /**
   * Redact sensitive data from string
   */
  private redactString(str: string): string {
    let redacted = str;

    // Redact email addresses (keep domain)
    redacted = redacted.replace(this.emailPattern, (_match, username, domain) => {
      const redactedUsername = username.length > 2 
        ? `${username.substring(0, 2)}***` 
        : '***';
      return `${redactedUsername}@${domain}`;
    });

    // Redact tokens and secrets
    redacted = redacted.replace(
      /(password|secret|token|key|apikey|api_key)["']?\s*[:=]\s*["']?([^"',}\s]+)/gi,
      (_match, fieldName, value) => {
        const redactedValue = value.length > 8
          ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
          : '***';
        return `${fieldName}=${redactedValue}`;
      }
    );

    return redacted;
  }

  /**
   * Redact sensitive data from object
   */
  private redactObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.redactString(obj);
    }

    if (typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.redactObject(item));
    }

    const redacted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Redact known sensitive fields
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('token') ||
        lowerKey.includes('key') ||
        lowerKey.includes('apikey') ||
        lowerKey.includes('api_key') ||
        lowerKey.includes('authorization')
      ) {
        if (typeof value === 'string' && value.length > 8) {
          redacted[key] = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
        } else {
          redacted[key] = '***';
        }
      } else if (lowerKey.includes('email')) {
        redacted[key] = typeof value === 'string' ? this.redactEmail(value) : value;
      } else if (typeof value === 'object') {
        redacted[key] = this.redactObject(value);
      } else if (typeof value === 'string') {
        redacted[key] = this.redactString(value);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  /**
   * Redact email address
   */
  private redactEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return '***@***.***';
    }
    const [username, domain] = email.split('@');
    const redactedUsername = username.length > 2 
      ? `${username.substring(0, 2)}***` 
      : '***';
    return `${redactedUsername}@${domain}`;
  }

  /**
   * Log info with integration context
   */
  info(message: string, context?: any): void {
    const redactedContext = context ? this.redactObject(context) : undefined;
    baseLogger.info(message, redactedContext);
  }

  /**
   * Log error with integration context
   */
  error(message: string, context?: any): void {
    const redactedContext = context ? this.redactObject(context) : undefined;
    baseLogger.error(message, redactedContext);
  }

  /**
   * Log warning with integration context
   */
  warn(message: string, context?: any): void {
    const redactedContext = context ? this.redactObject(context) : undefined;
    baseLogger.warn(message, redactedContext);
  }

  /**
   * Log debug with integration context
   */
  debug(message: string, context?: any): void {
    const redactedContext = context ? this.redactObject(context) : undefined;
    baseLogger.debug(message, redactedContext);
  }

  /**
   * Log API request (redacts sensitive headers)
   */
  logApiRequest(integration: string, method: string, url: string, headers?: any): void {
    this.info(`${integration} API request`, {
      integration,
      method,
      url,
      headers: headers ? this.redactObject(headers) : undefined,
    });
  }

  /**
   * Log API response (redacts sensitive data)
   */
  logApiResponse(integration: string, status: number, data?: any): void {
    this.info(`${integration} API response`, {
      integration,
      status,
      data: data ? this.redactObject(data) : undefined,
    });
  }

  /**
   * Log API error (redacts sensitive data)
   */
  logApiError(integration: string, error: any): void {
    this.error(`${integration} API error`, {
      integration,
      error: error ? this.redactObject(error) : undefined,
    });
  }

  /**
   * Log sync operation start
   */
  logSyncStart(integration: string, operation: string, params?: any): void {
    this.info(`${integration} sync started`, {
      integration,
      operation,
      params: params ? this.redactObject(params) : undefined,
    });
  }

  /**
   * Log sync operation complete
   */
  logSyncComplete(integration: string, operation: string, result?: any): void {
    this.info(`${integration} sync completed`, {
      integration,
      operation,
      result: result ? this.redactObject(result) : undefined,
    });
  }

  /**
   * Log sync operation error
   */
  logSyncError(integration: string, operation: string, error: any): void {
    this.error(`${integration} sync failed`, {
      integration,
      operation,
      error: error ? this.redactObject(error) : undefined,
    });
  }

  /**
   * Log rate limit info
   */
  logRateLimit(integration: string, remaining: number, limit: number, reset: Date): void {
    this.info(`${integration} rate limit`, {
      integration,
      remaining,
      limit,
      reset,
      percentageRemaining: ((remaining / limit) * 100).toFixed(2),
    });
  }

  /**
   * Log cache operation
   */
  logCache(operation: 'hit' | 'miss' | 'set' | 'delete', key: string, ttl?: number): void {
    this.debug(`Cache ${operation}`, {
      operation,
      key,
      ttl,
    });
  }
}

// Export singleton instance
export const secureLogger = new SecureLogger();
