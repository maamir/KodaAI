import { Octokit } from '@octokit/rest';
import { credentialManager } from '../common/credential-manager';
import { rateLimiter } from '../common/rate-limiter';
import { CacheManager } from '../common/cache-manager';
import { secureLogger } from '../common/secure-logger';
import { PrismaClient } from '@prisma/client';

export interface GitHubRepository {
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  stats: {
    additions: number;
    deletions: number;
    total: number;
  };
  files: Array<{
    filename: string;
    additions: number;
    deletions: number;
    changes: number;
  }>;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  merged: boolean;
  author: string;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
}

export interface GitHubReview {
  id: number;
  user: string;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED';
  submittedAt: string;
  body: string | null;
}

export class GitHubClient {
  private client: Octokit | null = null;
  private cacheManager: CacheManager;
  private maxRetries: number = 3;
  private retryDelayMs: number = 1000;

  constructor(prisma: PrismaClient) {
    this.cacheManager = new CacheManager(prisma);
    this.initializeClient();
  }

  /**
   * Initialize GitHub client with credentials
   */
  private initializeClient(): void {
    const credentials = credentialManager.getGitHubCredentials();
    
    if (!credentials) {
      secureLogger.warn('GitHub client not initialized: missing credentials');
      return;
    }

    try {
      this.client = new Octokit({
        auth: credentials.token,
      });

      secureLogger.info('GitHub client initialized');
    } catch (error) {
      secureLogger.error('Failed to initialize GitHub client', { error });
    }
  }

  /**
   * Check if client is initialized
   */
  private ensureInitialized(): void {
    if (!this.client) {
      throw new Error('GitHub client not initialized. Check credentials.');
    }
  }

  /**
   * Update rate limits from response headers
   */
  private updateRateLimits(headers: any): void {
    if (headers['x-ratelimit-limit'] && headers['x-ratelimit-remaining']) {
      const limit = parseInt(headers['x-ratelimit-limit']);
      const remaining = parseInt(headers['x-ratelimit-remaining']);
      const reset = new Date(parseInt(headers['x-ratelimit-reset']) * 1000);

      rateLimiter.updateLimits('github', { limit, remaining, reset });
      
      secureLogger.logRateLimit('GitHub', remaining, limit, reset);
    }
  }

  /**
   * Execute API call with retry logic and rate limiting
   */
  private async executeWithRetry<T>(
    operation: () => Promise<{ data: T; headers: any }>,
    operationName: string
  ): Promise<T> {
    this.ensureInitialized();

    let lastError: any;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Wait for rate limit if needed
        await rateLimiter.waitIfNeeded('github');

        secureLogger.debug(`GitHub API call: ${operationName}`, { attempt });
        
        const response = await operation();

        // Update rate limits from response
        this.updateRateLimits(response.headers);
        
        secureLogger.debug(`GitHub API call succeeded: ${operationName}`);
        return response.data;
      } catch (error: any) {
        lastError = error;
        
        // Update rate limits if available
        if (error.response?.headers) {
          this.updateRateLimits(error.response.headers);
        }

        // Check if rate limited
        if (error.status === 403 && error.response?.headers['x-ratelimit-remaining'] === '0') {
          const reset = new Date(parseInt(error.response.headers['x-ratelimit-reset']) * 1000);
          const retryAfter = reset.getTime() - Date.now();
          
          secureLogger.warn(`GitHub rate limited, retrying after ${retryAfter}ms`, {
            operationName,
            attempt,
            reset,
          });

          if (attempt < this.maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryAfter));
            continue;
          }
        }

        // Check if transient error
        if (
          error.status >= 500 || 
          error.code === 'ECONNRESET' || 
          error.code === 'ETIMEDOUT'
        ) {
          const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
          
          secureLogger.warn(`GitHub transient error, retrying after ${delay}ms`, {
            operationName,
            attempt,
            error: error.message,
          });

          if (attempt < this.maxRetries) {
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        // Non-retryable error
        secureLogger.error(`GitHub API call failed: ${operationName}`, {
          error: error.message,
          status: error.status,
          attempt,
        });
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Get repository information
   */
  async getRepository(owner: string, repo: string, options?: { forceRefresh?: boolean }): Promise<GitHubRepository> {
    const cacheKey = CacheManager.githubRepoKey(owner, repo);

    return await this.cacheManager.getOrCompute(
      cacheKey,
      async () => {
        const data = await this.executeWithRetry(
          async () => await this.client!.repos.get({ owner, repo }),
          `getRepository(${owner}/${repo})`
        );

        return {
          owner: data.owner.login,
          name: data.name,
          fullName: data.full_name,
          defaultBranch: data.default_branch,
        };
      },
      {
        ttlSeconds: 3600, // 1 hour cache
        forceRefresh: options?.forceRefresh,
      }
    );
  }

  /**
   * List commits for repository
   */
  async listCommits(
    owner: string,
    repo: string,
    options?: {
      sha?: string;
      since?: Date;
      until?: Date;
      perPage?: number;
      page?: number;
      forceRefresh?: boolean;
    }
  ): Promise<GitHubCommit[]> {
    const cacheKey = CacheManager.githubCommitsKey(owner, repo, options?.sha);

    return await this.cacheManager.getOrCompute(
      cacheKey,
      async () => {
        const commits = await this.executeWithRetry(
          async () => await this.client!.repos.listCommits({
            owner,
            repo,
            sha: options?.sha,
            since: options?.since?.toISOString(),
            until: options?.until?.toISOString(),
            per_page: options?.perPage || 100,
            page: options?.page || 1,
          }),
          `listCommits(${owner}/${repo})`
        );

        // Fetch detailed commit info with stats
        const detailedCommits: GitHubCommit[] = [];
        for (const commit of commits) {
          const detailed = await this.getCommit(owner, repo, commit.sha);
          detailedCommits.push(detailed);
        }

        return detailedCommits;
      },
      {
        ttlSeconds: 1800, // 30 minutes cache
        forceRefresh: options?.forceRefresh,
      }
    );
  }

  /**
   * Get single commit with stats
   */
  async getCommit(owner: string, repo: string, sha: string): Promise<GitHubCommit> {
    const data = await this.executeWithRetry(
      async () => await this.client!.repos.getCommit({ owner, repo, ref: sha }),
      `getCommit(${owner}/${repo}/${sha})`
    );

    return {
      sha: data.sha,
      message: data.commit.message,
      author: {
        name: data.commit.author?.name || 'unknown',
        email: data.commit.author?.email || 'unknown',
        date: data.commit.author?.date || new Date().toISOString(),
      },
      stats: {
        additions: data.stats?.additions || 0,
        deletions: data.stats?.deletions || 0,
        total: data.stats?.total || 0,
      },
      files: (data.files || []).map(file => ({
        filename: file.filename,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
      })),
    };
  }

  /**
   * Get pull request
   */
  async getPullRequest(owner: string, repo: string, pullNumber: number): Promise<GitHubPullRequest> {
    const data = await this.executeWithRetry(
      async () => await this.client!.pulls.get({ owner, repo, pull_number: pullNumber }),
      `getPullRequest(${owner}/${repo}#${pullNumber})`
    );

    return {
      number: data.number,
      title: data.title,
      body: data.body,
      state: data.state as 'open' | 'closed',
      merged: data.merged || false,
      author: data.user?.login || 'unknown',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      mergedAt: data.merged_at,
      closedAt: data.closed_at,
      additions: data.additions || 0,
      deletions: data.deletions || 0,
      changedFiles: data.changed_files || 0,
    };
  }

  /**
   * List pull requests
   */
  async listPullRequests(
    owner: string,
    repo: string,
    options?: {
      state?: 'open' | 'closed' | 'all';
      perPage?: number;
      page?: number;
      forceRefresh?: boolean;
    }
  ): Promise<GitHubPullRequest[]> {
    const state = options?.state || 'all';
    const cacheKey = CacheManager.githubPRsKey(owner, repo, state);

    return await this.cacheManager.getOrCompute(
      cacheKey,
      async () => {
        const prs = await this.executeWithRetry(
          async () => await this.client!.pulls.list({
            owner,
            repo,
            state,
            per_page: options?.perPage || 100,
            page: options?.page || 1,
          }),
          `listPullRequests(${owner}/${repo})`
        );

        return prs.map(pr => ({
          number: pr.number,
          title: pr.title,
          body: pr.body,
          state: pr.state as 'open' | 'closed',
          merged: pr.merged_at !== null,
          author: pr.user?.login || 'unknown',
          createdAt: pr.created_at,
          updatedAt: pr.updated_at,
          mergedAt: pr.merged_at,
          closedAt: pr.closed_at,
          additions: 0, // Not available in list, need to fetch individually
          deletions: 0,
          changedFiles: 0,
        }));
      },
      {
        ttlSeconds: 1800, // 30 minutes cache
        forceRefresh: options?.forceRefresh,
      }
    );
  }

  /**
   * List reviews for pull request
   */
  async listReviews(owner: string, repo: string, pullNumber: number): Promise<GitHubReview[]> {
    const reviews = await this.executeWithRetry(
      async () => await this.client!.pulls.listReviews({ owner, repo, pull_number: pullNumber }),
      `listReviews(${owner}/${repo}#${pullNumber})`
    );

    return reviews.map(review => ({
      id: review.id,
      user: review.user?.login || 'unknown',
      state: review.state as 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED',
      submittedAt: review.submitted_at || new Date().toISOString(),
      body: review.body,
    }));
  }

  /**
   * Test connection to GitHub
   */
  async testConnection(): Promise<boolean> {
    try {
      this.ensureInitialized();
      
      await this.executeWithRetry(
        async () => await this.client!.users.getAuthenticated(),
        'testConnection'
      );
      
      secureLogger.info('GitHub connection test successful');
      return true;
    } catch (error) {
      secureLogger.error('GitHub connection test failed', { error });
      return false;
    }
  }

  /**
   * Clear cache for repository
   */
  async clearRepositoryCache(owner: string, repo: string): Promise<number> {
    return await this.cacheManager.invalidateRepository(owner, repo);
  }

  /**
   * Clear all GitHub caches
   */
  async clearAllCache(): Promise<number> {
    return await this.cacheManager.invalidateGitHub();
  }
}
