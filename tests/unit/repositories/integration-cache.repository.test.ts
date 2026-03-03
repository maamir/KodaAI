import { PrismaClient } from '@prisma/client';
import { IntegrationCacheRepository } from '../../../src/repositories/integration-cache.repository';

const prisma = new PrismaClient();
const repository = new IntegrationCacheRepository(prisma);

describe('IntegrationCacheRepository', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.integrationCache.deleteMany();
  });

  describe('create', () => {
    it('should create a new cache entry', async () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const cache = await repository.create({
        cacheKey: 'test:key:1',
        cacheValue: { data: 'test value' },
        expiresAt,
      });

      expect(cache).toBeDefined();
      expect(cache.cacheKey).toBe('test:key:1');
      expect(cache.cacheValue).toEqual({ data: 'test value' });
    });
  });

  describe('findByCacheKey', () => {
    it('should find cache entry by key', async () => {
      const expiresAt = new Date(Date.now() + 3600000);
      await repository.create({
        cacheKey: 'test:key:2',
        cacheValue: { data: 'test value' },
        expiresAt,
      });

      const found = await repository.findByCacheKey('test:key:2');
      expect(found).toBeDefined();
      expect(found?.cacheKey).toBe('test:key:2');
    });

    it('should return null for non-existent key', async () => {
      const found = await repository.findByCacheKey('nonexistent:key');
      expect(found).toBeNull();
    });

    it('should return null and delete expired entry', async () => {
      const expiredDate = new Date(Date.now() - 1000);
      await repository.create({
        cacheKey: 'expired:key',
        cacheValue: { data: 'expired value' },
        expiresAt: expiredDate,
      });

      const found = await repository.findByCacheKey('expired:key');
      expect(found).toBeNull();

      // Verify it was deleted
      const allEntries = await prisma.integrationCache.findMany();
      expect(allEntries).toHaveLength(0);
    });
  });

  describe('upsert', () => {
    it('should create new entry if not exists', async () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const cache = await repository.upsert('new:key', { data: 'new value' }, expiresAt);

      expect(cache).toBeDefined();
      expect(cache.cacheKey).toBe('new:key');
      expect(cache.cacheValue).toEqual({ data: 'new value' });
    });

    it('should update existing entry', async () => {
      const expiresAt1 = new Date(Date.now() + 3600000);
      await repository.create({
        cacheKey: 'existing:key',
        cacheValue: { data: 'old value' },
        expiresAt: expiresAt1,
      });

      const expiresAt2 = new Date(Date.now() + 7200000);
      const updated = await repository.upsert('existing:key', { data: 'new value' }, expiresAt2);

      expect(updated.cacheValue).toEqual({ data: 'new value' });
      expect(updated.expiresAt).toEqual(expiresAt2);
    });
  });

  describe('deleteExpired', () => {
    it('should delete expired cache entries', async () => {
      const validDate = new Date(Date.now() + 3600000);
      const expiredDate = new Date(Date.now() - 1000);

      await repository.create({
        cacheKey: 'valid:key',
        cacheValue: { data: 'valid' },
        expiresAt: validDate,
      });

      await repository.create({
        cacheKey: 'expired:key:1',
        cacheValue: { data: 'expired 1' },
        expiresAt: expiredDate,
      });

      await repository.create({
        cacheKey: 'expired:key:2',
        cacheValue: { data: 'expired 2' },
        expiresAt: expiredDate,
      });

      const deletedCount = await repository.deleteExpired();
      expect(deletedCount).toBe(2);

      const remaining = await prisma.integrationCache.findMany();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].cacheKey).toBe('valid:key');
    });
  });

  describe('deleteByPattern', () => {
    it('should delete cache entries matching pattern', async () => {
      const expiresAt = new Date(Date.now() + 3600000);

      await repository.create({
        cacheKey: 'jira:story:1',
        cacheValue: { data: 'jira 1' },
        expiresAt,
      });

      await repository.create({
        cacheKey: 'jira:story:2',
        cacheValue: { data: 'jira 2' },
        expiresAt,
      });

      await repository.create({
        cacheKey: 'github:repo:1',
        cacheValue: { data: 'github 1' },
        expiresAt,
      });

      const deletedCount = await repository.deleteByPattern('jira');
      expect(deletedCount).toBe(2);

      const remaining = await prisma.integrationCache.findMany();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].cacheKey).toBe('github:repo:1');
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const validDate = new Date(Date.now() + 3600000);
      const expiredDate = new Date(Date.now() - 1000);

      await repository.create({
        cacheKey: 'valid:1',
        cacheValue: { data: 'valid 1' },
        expiresAt: validDate,
      });

      await repository.create({
        cacheKey: 'valid:2',
        cacheValue: { data: 'valid 2' },
        expiresAt: validDate,
      });

      await repository.create({
        cacheKey: 'expired:1',
        cacheValue: { data: 'expired 1' },
        expiresAt: expiredDate,
      });

      const stats = await repository.getCacheStats();
      expect(stats.totalEntries).toBe(3);
      expect(stats.expiredEntries).toBe(1);
      expect(stats.validEntries).toBe(2);
    });

    it('should return zero stats for empty cache', async () => {
      const stats = await repository.getCacheStats();
      expect(stats.totalEntries).toBe(0);
      expect(stats.expiredEntries).toBe(0);
      expect(stats.validEntries).toBe(0);
    });
  });

  describe('update', () => {
    it('should update cache entry', async () => {
      const expiresAt1 = new Date(Date.now() + 3600000);
      const cache = await repository.create({
        cacheKey: 'update:key',
        cacheValue: { data: 'original' },
        expiresAt: expiresAt1,
      });

      const expiresAt2 = new Date(Date.now() + 7200000);
      const updated = await repository.update(cache.id, {
        cacheValue: { data: 'updated' },
        expiresAt: expiresAt2,
      });

      expect(updated.cacheValue).toEqual({ data: 'updated' });
      expect(updated.expiresAt).toEqual(expiresAt2);
    });
  });

  describe('deleteByCacheKey', () => {
    it('should delete cache entry by key', async () => {
      const expiresAt = new Date(Date.now() + 3600000);
      await repository.create({
        cacheKey: 'delete:key',
        cacheValue: { data: 'to delete' },
        expiresAt,
      });

      await repository.deleteByCacheKey('delete:key');

      const found = await repository.findByCacheKey('delete:key');
      expect(found).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete cache entry by ID', async () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const cache = await repository.create({
        cacheKey: 'delete:id',
        cacheValue: { data: 'to delete' },
        expiresAt,
      });

      await repository.delete(cache.id);

      const found = await prisma.integrationCache.findUnique({
        where: { id: cache.id },
      });
      expect(found).toBeNull();
    });
  });
});
