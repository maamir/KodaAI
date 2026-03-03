import { PrismaClient, IntegrationCache, Prisma } from '@prisma/client';
import { logger } from '../infrastructure/logger';

export class IntegrationCacheRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.IntegrationCacheCreateInput): Promise<IntegrationCache> {
    try {
      return await this.prisma.integrationCache.create({ data });
    } catch (error) {
      logger.error('Failed to create integration cache entry', { error, data });
      throw error;
    }
  }

  async findByCacheKey(cacheKey: string): Promise<IntegrationCache | null> {
    try {
      const entry = await this.prisma.integrationCache.findUnique({
        where: { cacheKey },
      });

      // Return null if expired
      if (entry && entry.expiresAt < new Date()) {
        await this.delete(entry.id);
        return null;
      }

      return entry;
    } catch (error) {
      logger.error('Failed to find integration cache by key', { error, cacheKey });
      throw error;
    }
  }

  async update(id: string, data: Prisma.IntegrationCacheUpdateInput): Promise<IntegrationCache> {
    try {
      return await this.prisma.integrationCache.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error('Failed to update integration cache', { error, id, data });
      throw error;
    }
  }

  async upsert(cacheKey: string, cacheValue: any, expiresAt: Date): Promise<IntegrationCache> {
    try {
      return await this.prisma.integrationCache.upsert({
        where: { cacheKey },
        create: {
          cacheKey,
          cacheValue,
          expiresAt,
        },
        update: {
          cacheValue,
          expiresAt,
        },
      });
    } catch (error) {
      logger.error('Failed to upsert integration cache', { error, cacheKey, expiresAt });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.integrationCache.delete({ where: { id } });
    } catch (error) {
      logger.error('Failed to delete integration cache entry', { error, id });
      throw error;
    }
  }

  async deleteByCacheKey(cacheKey: string): Promise<void> {
    try {
      await this.prisma.integrationCache.delete({ where: { cacheKey } });
    } catch (error) {
      logger.error('Failed to delete integration cache by key', { error, cacheKey });
      throw error;
    }
  }

  async deleteExpired(): Promise<number> {
    try {
      const now = new Date();
      const result = await this.prisma.integrationCache.deleteMany({
        where: {
          expiresAt: { lt: now },
        },
      });
      return result.count;
    } catch (error) {
      logger.error('Failed to delete expired cache entries', { error });
      throw error;
    }
  }

  async deleteByPattern(pattern: string): Promise<number> {
    try {
      const result = await this.prisma.integrationCache.deleteMany({
        where: {
          cacheKey: { contains: pattern },
        },
      });
      return result.count;
    } catch (error) {
      logger.error('Failed to delete cache entries by pattern', { error, pattern });
      throw error;
    }
  }

  async getCacheStats(): Promise<{
    totalEntries: number;
    expiredEntries: number;
    validEntries: number;
  }> {
    try {
      const now = new Date();
      const [totalEntries, expiredEntries] = await Promise.all([
        this.prisma.integrationCache.count(),
        this.prisma.integrationCache.count({
          where: { expiresAt: { lt: now } },
        }),
      ]);

      return {
        totalEntries,
        expiredEntries,
        validEntries: totalEntries - expiredEntries,
      };
    } catch (error) {
      logger.error('Failed to get cache stats', { error });
      throw error;
    }
  }
}
