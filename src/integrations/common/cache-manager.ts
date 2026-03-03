import { PrismaClient } from '@prisma/client';
import { IntegrationCacheRepository } from '../../../repositories/integration-cache.repository';
import { logger } from '../../infrastructure/logger';

export interface CacheOptions {
  ttlSeconds?: number;
  forceRefresh?: boolean;
}

export class CacheManager {
  private repository: IntegrationCacheRepository;
  private defaultTTL: number = 3600; // 1 hour default
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(prisma: PrismaClient) {
    this.repository = new IntegrationCacheRepository(prisma);
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = await this.repository.findByCacheKey(key);
      
      if (!entry) {
        logger.debug('Cache miss', { key });
        return null;
      }

      logger.debug('Cache hit', { key });
      return entry.cacheValue as T;
    } catch (error) {
      logger.error('Cache get error', { error, key });
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const ttlSeconds = options?.ttlSeconds || this.defaultTTL;
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      await this.repository.upsert(key, value, expiresAt);
      
      logger.debug('Cache set', { key, ttlSeconds });
    } catch (error) {
      logger.error('Cache set error', { error, key });
    }
  }

  /**
   * Get or compute value (cache-aside pattern)
   */
  async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Check if force refresh requested
    if (options?.forceRefresh) {
      logger.debug('Cache force refresh', { key });
      const value = await computeFn();
      await this.set(key, value, options);
      return value;
    }

    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Compute and cache
    logger.debug('Cache compute', { key });
    const value = await computeFn();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Delete specific cache entry
   */
  async delete(key: string): Promise<void> {
    try {
      await this.repository.deleteByCacheKey(key);
      logger.debug('Cache entry deleted', { key });
    } catch (error) {
      logger.error('Cache delete error', { error, key });
    }
  }

  /**
   * Delete cache entries matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const count = await this.repository.deleteByPattern(pattern);
      logger.info('Cache pattern deleted', { pattern, count });
      return count;
    } catch (error) {
      logger.error('Cache delete pattern error', { error, pattern });
      return 0;
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpired(): Promise<number> {
    try {
      const count = await this.repository.deleteExpired();
      logger.info('Expired cache entries cleared', { count });
      return count;
    } catch (error) {
      logger.error('Cache clear expired error', { error });
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    expiredEntries: number;
    validEntries: number;
  }> {
    try {
      return await this.repository.getCacheStats();
    } catch (error) {
      logger.error('Cache stats error', { error });
      return {
        totalEntries: 0,
        expiredEntries: 0,
        validEntries: 0,
      };
    }
  }

  /**
   * Start automatic cleanup job
   */
  startCleanupJob(intervalMinutes: number = 60): void {
    if (this.cleanupInterval) {
      logger.warn('Cache cleanup job already running');
      return;
    }

    const intervalMs = intervalMinutes * 60 * 1000;
    
    this.cleanupInterval = setInterval(async () => {
      logger.info('Running cache cleanup job');
      const count = await this.clearExpired();
      logger.info('Cache cleanup job completed', { entriesRemoved: count });
    }, intervalMs);

    logger.info('Cache cleanup job started', { intervalMinutes });
  }

  /**
   * Stop automatic cleanup job
   */
  stopCleanupJob(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('Cache cleanup job stopped');
    }
  }

  /**
   * Generate cache key for Jira story
   */
  static jiraStoryKey(jiraKey: string): string {
    return `jira:story:${jiraKey}`;
  }

  /**
   * Generate cache key for GitHub repository
   */
  static githubRepoKey(owner: string, repo: string): string {
    return `github:repo:${owner}/${repo}`;
  }

  /**
   * Generate cache key for GitHub commits
   */
  static githubCommitsKey(owner: string, repo: string, branch?: string): string {
    const branchPart = branch ? `:${branch}` : '';
    return `github:commits:${owner}/${repo}${branchPart}`;
  }

  /**
   * Generate cache key for GitHub pull requests
   */
  static githubPRsKey(owner: string, repo: string, state?: string): string {
    const statePart = state ? `:${state}` : '';
    return `github:prs:${owner}/${repo}${statePart}`;
  }

  /**
   * Invalidate all Jira caches
   */
  async invalidateJira(): Promise<number> {
    return await this.deletePattern('jira:');
  }

  /**
   * Invalidate all GitHub caches
   */
  async invalidateGitHub(): Promise<number> {
    return await this.deletePattern('github:');
  }

  /**
   * Invalidate all caches for a specific repository
   */
  async invalidateRepository(owner: string, repo: string): Promise<number> {
    return await this.deletePattern(`github:${owner}/${repo}`);
  }
}

// Note: Instance creation requires Prisma client, so no singleton export here
// Services will create their own instances
