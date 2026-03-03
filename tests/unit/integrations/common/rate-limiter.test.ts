import { RateLimiter } from '../../../../src/integrations/common/rate-limiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    jest.clearAllMocks();
    rateLimiter = new RateLimiter();
  });

  describe('checkAndWait', () => {
    it('should allow request when no limit data exists', async () => {
      await expect(rateLimiter.checkAndWait('jira')).resolves.not.toThrow();
    });

    it('should allow request when remaining above threshold', async () => {
      rateLimiter.updateFromHeaders('jira', {
        'X-RateLimit-Remaining': '100',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Reset': String(Date.now() / 1000 + 3600),
      });

      await expect(rateLimiter.checkAndWait('jira')).resolves.not.toThrow();
    });

    it('should throttle when remaining below threshold', async () => {
      const resetTime = Date.now() / 1000 + 1; // 1 second from now
      
      rateLimiter.updateFromHeaders('jira', {
        'X-RateLimit-Remaining': '5',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Reset': String(resetTime),
      });

      const startTime = Date.now();
      await rateLimiter.checkAndWait('jira');
      const endTime = Date.now();

      // Should have waited approximately 1 second
      expect(endTime - startTime).toBeGreaterThanOrEqual(900);
    }, 10000);

    it('should allow request after reset time passed', async () => {
      const pastResetTime = Date.now() / 1000 - 3600; // 1 hour ago
      
      rateLimiter.updateFromHeaders('jira', {
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Reset': String(pastResetTime),
      });

      await expect(rateLimiter.checkAndWait('jira')).resolves.not.toThrow();
    });

    it('should handle different APIs independently', async () => {
      rateLimiter.updateFromHeaders('jira', {
        'X-RateLimit-Remaining': '5',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Reset': String(Date.now() / 1000 + 3600),
      });

      rateLimiter.updateFromHeaders('github', {
        'X-RateLimit-Remaining': '5000',
        'X-RateLimit-Limit': '5000',
        'X-RateLimit-Reset': String(Date.now() / 1000 + 3600),
      });

      // GitHub should not be throttled
      await expect(rateLimiter.checkAndWait('github')).resolves.not.toThrow();
    });
  });

  describe('updateFromHeaders', () => {
    it('should update rate limit from response headers', () => {
      const resetTime = Date.now() / 1000 + 3600;
      
      rateLimiter.updateFromHeaders('jira', {
        'X-RateLimit-Remaining': '50',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Reset': String(resetTime),
      });

      const status = rateLimiter.getStatus('jira');
      
      expect(status.remaining).toBe(50);
      expect(status.total).toBe(100);
      expect(status.percentUsed).toBe(50);
    });

    it('should handle missing headers gracefully', () => {
      rateLimiter.updateFromHeaders('jira', {});

      const status = rateLimiter.getStatus('jira');
      
      expect(status).toBeNull();
    });

    it('should handle invalid header values', () => {
      rateLimiter.updateFromHeaders('jira', {
        'X-RateLimit-Remaining': 'invalid',
        'X-RateLimit-Limit': 'invalid',
        'X-RateLimit-Reset': 'invalid',
      });

      const status = rateLimiter.getStatus('jira');
      
      expect(status).toBeNull();
    });
  });

  describe('getStatus', () => {
    it('should return rate limit status', () => {
      const resetTime = Date.now() / 1000 + 3600;
      
      rateLimiter.updateFromHeaders('jira', {
        'X-RateLimit-Remaining': '75',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Reset': String(resetTime),
      });

      const status = rateLimiter.getStatus('jira');
      
      expect(status).toBeDefined();
      expect(status!.remaining).toBe(75);
      expect(status!.total).toBe(100);
      expect(status!.percentUsed).toBe(25);
      expect(status!.resetAt).toBeInstanceOf(Date);
    });

    it('should return null for unknown API', () => {
      const status = rateLimiter.getStatus('unknown');
      
      expect(status).toBeNull();
    });

    it('should calculate percent used correctly', () => {
      rateLimiter.updateFromHeaders('jira', {
        'X-RateLimit-Remaining': '20',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Reset': String(Date.now() / 1000 + 3600),
      });

      const status = rateLimiter.getStatus('jira');
      
      expect(status!.percentUsed).toBe(80);
    });
  });

  describe('threshold behavior', () => {
    it('should use default threshold of 20%', async () => {
      const resetTime = Date.now() / 1000 + 1;
      
      // 15% remaining (below 20% threshold)
      rateLimiter.updateFromHeaders('jira', {
        'X-RateLimit-Remaining': '15',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Reset': String(resetTime),
      });

      const startTime = Date.now();
      await rateLimiter.checkAndWait('jira');
      const endTime = Date.now();

      // Should have waited
      expect(endTime - startTime).toBeGreaterThanOrEqual(900);
    }, 10000);

    it('should not throttle at exactly 20% remaining', async () => {
      rateLimiter.updateFromHeaders('jira', {
        'X-RateLimit-Remaining': '20',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Reset': String(Date.now() / 1000 + 3600),
      });

      const startTime = Date.now();
      await rateLimiter.checkAndWait('jira');
      const endTime = Date.now();

      // Should not have waited
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('concurrent requests', () => {
    it('should handle multiple concurrent checks', async () => {
      rateLimiter.updateFromHeaders('jira', {
        'X-RateLimit-Remaining': '100',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Reset': String(Date.now() / 1000 + 3600),
      });

      const promises = Array(10).fill(null).map(() => rateLimiter.checkAndWait('jira'));

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });
  });
});
