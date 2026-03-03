import { CacheManager } from '../../../../src/integrations/common/cache-manager';
import { integrationCacheRepository } from '../../../../src/repositories/integration-cache.repository';

jest.mock('../../../../src/repositories/integration-cache.repository');

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheManager = new CacheManager();
  });

  describe('get', () => {
    it('should return cached value if not expired', async () => {
      const cacheKey = 'jira:PROJ-123';
      const cacheValue = { key: 'PROJ-123', summary: 'Test Issue' };
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

      (integrationCacheRepository.findByKey as jest.Mock).mockResolvedValue({
        id: 'cache-123',
        cacheKey,
        cacheValue,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await cacheManager.get(cacheKey);

      expect(result).toEqual(cacheValue);
      expect(integrationCacheRepository.findByKey).toHaveBeenCalledWith(cacheKey);
    });

    it('should return null if cache entry not found', async () => {
      const cacheKey = 'jira:PROJ-999';

      (integrationCacheRepository.findByKey as jest.Mock).mockResolvedValue(null);

      const result = await cacheManager.get(cacheKey);

      expect(result).toBeNull();
    });

    it('should return null and delete if cache expired', async () => {
      const cacheKey = 'jira:PROJ-123';
      const cacheValue = { key: 'PROJ-123' };
      const expiresAt = new Date(Date.now() - 3600000); // 1 hour ago

      (integrationCacheRepository.findByKey as jest.Mock).mockResolvedValue({
        id: 'cache-123',
        cacheKey,
        cacheValue,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (integrationCacheRepository.delete as jest.Mock).mockResolvedValue(undefined);

      const result = await cacheManager.get(cacheKey);

      expect(result).toBeNull();
      expect(integrationCacheRepository.delete).toHaveBeenCalledWith(cacheKey);
    });

    it('should handle repository errors gracefully', async () => {
      const cacheKey = 'jira:PROJ-123';

      (integrationCacheRepository.findByKey as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const result = await cacheManager.get(cacheKey);

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should store value with TTL', async () => {
      const cacheKey = 'jira:PROJ-123';
      const cacheValue = { key: 'PROJ-123', summary: 'Test Issue' };
      const ttlSeconds = 900; // 15 minutes

      (integrationCacheRepository.upsert as jest.Mock).mockResolvedValue({
        id: 'cache-123',
        cacheKey,
        cacheValue,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await cacheManager.set(cacheKey, cacheValue, ttlSeconds);

      expect(integrationCacheRepository.upsert).toHaveBeenCalledWith({
        cacheKey,
        cacheValue,
        expiresAt: expect.any(Date),
      });

      const call = (integrationCacheRepository.upsert as jest.Mock).mock.calls[0][0];
      const expiresAt = call.expiresAt.getTime();
      const expectedExpiry = Date.now() + ttlSeconds * 1000;
      
      expect(expiresAt).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(expiresAt).toBeLessThanOrEqual(expectedExpiry + 1000);
    });

    it('should handle complex objects', async () => {
      const cacheKey = 'github:commit:abc123';
      const cacheValue = {
        sha: 'abc123',
        message: 'Test commit',
        author: { name: 'Test', email: 'test@example.com' },
        stats: { additions: 10, deletions: 5 },
      };

      (integrationCacheRepository.upsert as jest.Mock).mockResolvedValue({});

      await cacheManager.set(cacheKey, cacheValue, 900);

      expect(integrationCacheRepository.upsert).toHaveBeenCalledWith({
        cacheKey,
        cacheValue,
        expiresAt: expect.any(Date),
      });
    });

    it('should handle repository errors', async () => {
      const cacheKey = 'jira:PROJ-123';
      const cacheValue = { key: 'PROJ-123' };

      (integrationCacheRepository.upsert as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await expect(cacheManager.set(cacheKey, cacheValue, 900)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('invalidate', () => {
    it('should delete cache entry', async () => {
      const cacheKey = 'jira:PROJ-123';

      (integrationCacheRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await cacheManager.invalidate(cacheKey);

      expect(integrationCacheRepository.delete).toHaveBeenCalledWith(cacheKey);
    });

    it('should handle non-existent keys gracefully', async () => {
      const cacheKey = 'jira:PROJ-999';

      (integrationCacheRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await expect(cacheManager.invalidate(cacheKey)).resolves.not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should delete expired entries', async () => {
      (integrationCacheRepository.deleteExpired as jest.Mock).mockResolvedValue(5);

      const deletedCount = await cacheManager.cleanup();

      expect(deletedCount).toBe(5);
      expect(integrationCacheRepository.deleteExpired).toHaveBeenCalled();
    });

    it('should return 0 if no expired entries', async () => {
      (integrationCacheRepository.deleteExpired as jest.Mock).mockResolvedValue(0);

      const deletedCount = await cacheManager.cleanup();

      expect(deletedCount).toBe(0);
    });

    it('should handle cleanup errors', async () => {
      (integrationCacheRepository.deleteExpired as jest.Mock).mockRejectedValue(
        new Error('Cleanup failed')
      );

      await expect(cacheManager.cleanup()).rejects.toThrow('Cleanup failed');
    });
  });

  describe('cache key patterns', () => {
    it('should support Jira cache keys', async () => {
      const cacheKey = 'jira:PROJ-123';
      (integrationCacheRepository.upsert as jest.Mock).mockResolvedValue({});

      await cacheManager.set(cacheKey, { data: 'test' }, 900);

      expect(integrationCacheRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ cacheKey })
      );
    });

    it('should support GitHub commit cache keys', async () => {
      const cacheKey = 'github:commit:owner/repo/abc123';
      (integrationCacheRepository.upsert as jest.Mock).mockResolvedValue({});

      await cacheManager.set(cacheKey, { data: 'test' }, 900);

      expect(integrationCacheRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ cacheKey })
      );
    });

    it('should support GitHub PR cache keys', async () => {
      const cacheKey = 'github:pr:owner/repo/42';
      (integrationCacheRepository.upsert as jest.Mock).mockResolvedValue({});

      await cacheManager.set(cacheKey, { data: 'test' }, 900);

      expect(integrationCacheRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ cacheKey })
      );
    });
  });

  describe('TTL variations', () => {
    it('should handle short TTL (1 minute)', async () => {
      const cacheKey = 'test:short';
      (integrationCacheRepository.upsert as jest.Mock).mockResolvedValue({});

      await cacheManager.set(cacheKey, { data: 'test' }, 60);

      const call = (integrationCacheRepository.upsert as jest.Mock).mock.calls[0][0];
      const expiresAt = call.expiresAt.getTime();
      const expectedExpiry = Date.now() + 60000;
      
      expect(expiresAt).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(expiresAt).toBeLessThanOrEqual(expectedExpiry + 1000);
    });

    it('should handle long TTL (1 hour)', async () => {
      const cacheKey = 'test:long';
      (integrationCacheRepository.upsert as jest.Mock).mockResolvedValue({});

      await cacheManager.set(cacheKey, { data: 'test' }, 3600);

      const call = (integrationCacheRepository.upsert as jest.Mock).mock.calls[0][0];
      const expiresAt = call.expiresAt.getTime();
      const expectedExpiry = Date.now() + 3600000;
      
      expect(expiresAt).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(expiresAt).toBeLessThanOrEqual(expectedExpiry + 1000);
    });
  });
});
