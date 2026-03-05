import { Version3Client } from 'jira.js';
import { credentialManager } from '../common/credential-manager';
import { rateLimiter } from '../common/rate-limiter';
import { CacheManager } from '../common/cache-manager';
import { secureLogger } from '../common/secure-logger';
import { PrismaClient } from '@prisma/client';

export interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    description?: string;
    status: {
      name: string;
    };
    customfield_10016?: number; // Story points (common field ID)
    timetracking?: {
      originalEstimate?: string;
      remainingEstimate?: string;
      timeSpent?: string;
      originalEstimateSeconds?: number;
      remainingEstimateSeconds?: number;
      timeSpentSeconds?: number;
    };
  };
}

export interface JiraSearchResult {
  issues: JiraIssue[];
  total: number;
  maxResults: number;
  startAt: number;
}

export class JiraClient {
  private client: Version3Client | null = null;
  private cacheManager: CacheManager;
  private maxRetries: number = 3;
  private retryDelayMs: number = 1000;

  constructor(prisma: PrismaClient) {
    this.cacheManager = new CacheManager(prisma);
    this.initializeClient();
  }

  /**
   * Initialize Jira client with credentials
   */
  private initializeClient(): void {
    const credentials = credentialManager.getJiraCredentials();
    
    if (!credentials) {
      secureLogger.warn('Jira client not initialized: missing credentials');
      return;
    }

    try {
      this.client = new Version3Client({
        host: credentials.baseUrl,
        authentication: {
          basic: {
            email: credentials.email,
            apiToken: credentials.apiToken,
          },
        },
      });

      secureLogger.info('Jira client initialized', {
        baseUrl: credentials.baseUrl,
      });
    } catch (error) {
      secureLogger.error('Failed to initialize Jira client', { error });
    }
  }

  /**
   * Check if client is initialized
   */
  private ensureInitialized(): void {
    if (!this.client) {
      throw new Error('Jira client not initialized. Check credentials.');
    }
  }

  /**
   * Execute API call with retry logic and rate limiting
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    this.ensureInitialized();

    let lastError: any;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Wait for rate limit if needed
        await rateLimiter.waitIfNeeded('jira');

        secureLogger.debug(`Jira API call: ${operationName}`, { attempt });
        
        const result = await operation();

        // Update rate limits if available (Jira doesn't always provide these)
        // We rely on in-memory tracking primarily
        
        secureLogger.debug(`Jira API call succeeded: ${operationName}`);
        return result;
      } catch (error: any) {
        lastError = error;
        
        // Check if rate limited
        if (error.statusCode === 429 || error.status === 429) {
          const retryAfter = error.headers?.['retry-after'] 
            ? parseInt(error.headers['retry-after']) * 1000 
            : this.retryDelayMs * Math.pow(2, attempt);
          
          secureLogger.warn(`Jira rate limited, retrying after ${retryAfter}ms`, {
            operationName,
            attempt,
            retryAfter,
          });

          await new Promise(resolve => setTimeout(resolve, retryAfter));
          continue;
        }

        // Check if transient error
        if (
          error.statusCode >= 500 || 
          error.code === 'ECONNRESET' || 
          error.code === 'ETIMEDOUT'
        ) {
          const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
          
          secureLogger.warn(`Jira transient error, retrying after ${delay}ms`, {
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
        secureLogger.error(`Jira API call failed: ${operationName}`, {
          error: error.message,
          statusCode: error.statusCode,
          attempt,
        });
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Get single issue by key
   */
  async getIssue(issueKey: string, options?: { forceRefresh?: boolean }): Promise<JiraIssue> {
    const cacheKey = CacheManager.jiraStoryKey(issueKey);

    return await this.cacheManager.getOrCompute(
      cacheKey,
      async () => {
        return await this.executeWithRetry(
          async () => {
            const issue = await this.client!.issues.getIssue({
              issueIdOrKey: issueKey,
              fields: ['summary', 'description', 'status', 'customfield_10016', 'timetracking'],
            });

            return issue as JiraIssue;
          },
          `getIssue(${issueKey})`
        );
      },
      { 
        ttlSeconds: 3600, // 1 hour cache
        forceRefresh: options?.forceRefresh,
      }
    );
  }

  /**
   * Search issues by JQL
   */
  async searchIssues(
    jql: string,
    options?: {
      startAt?: number;
      maxResults?: number;
      forceRefresh?: boolean;
    }
  ): Promise<JiraSearchResult> {
    const startAt = options?.startAt || 0;
    const maxResults = options?.maxResults || 50;
    
    // Cache key includes pagination
    const cacheKey = `jira:search:${Buffer.from(jql).toString('base64')}:${startAt}:${maxResults}`;

    return await this.cacheManager.getOrCompute(
      cacheKey,
      async () => {
        return await this.executeWithRetry(
          async () => {
            const result = await this.client!.issueSearch.searchForIssuesUsingJql({
              jql,
              startAt,
              maxResults,
              fields: ['summary', 'description', 'status', 'customfield_10016', 'timetracking'],
            });

            return {
              issues: result.issues as JiraIssue[],
              total: result.total || 0,
              maxResults: result.maxResults || maxResults,
              startAt: result.startAt || startAt,
            };
          },
          `searchIssues(${jql})`
        );
      },
      {
        ttlSeconds: 1800, // 30 minutes cache for searches
        forceRefresh: options?.forceRefresh,
      }
    );
  }

  /**
   * Get multiple issues by keys
   */
  async getIssues(issueKeys: string[], options?: { forceRefresh?: boolean }): Promise<JiraIssue[]> {
    const jql = `key in (${issueKeys.join(',')})`;
    const result = await this.searchIssues(jql, {
      maxResults: issueKeys.length,
      forceRefresh: options?.forceRefresh,
    });
    return result.issues;
  }

  /**
   * Extract story points from issue
   */
  extractStoryPoints(issue: JiraIssue): number | null {
    // Try common story points field
    if (issue.fields.customfield_10016 !== undefined) {
      return issue.fields.customfield_10016;
    }
    return null;
  }

  /**
   * Extract time estimates from issue (in seconds)
   */
  extractTimeEstimates(issue: JiraIssue): {
    originalEstimate: number | null;
    remainingEstimate: number | null;
    timeSpent: number | null;
  } {
    const timetracking = issue.fields.timetracking;
    
    return {
      originalEstimate: timetracking?.originalEstimateSeconds || null,
      remainingEstimate: timetracking?.remainingEstimateSeconds || null,
      timeSpent: timetracking?.timeSpentSeconds || null,
    };
  }

  /**
   * Test connection to Jira
   */
  async testConnection(): Promise<boolean> {
    try {
      this.ensureInitialized();
      
      // Try to get current user to test connection
      await this.executeWithRetry(
        async () => await this.client!.myself.getCurrentUser(),
        'testConnection'
      );
      
      secureLogger.info('Jira connection test successful');
      return true;
    } catch (error) {
      secureLogger.error('Jira connection test failed', { error });
      return false;
    }
  }

  /**
   * Clear cache for specific issue
   */
  async clearIssueCache(issueKey: string): Promise<void> {
    const cacheKey = CacheManager.jiraStoryKey(issueKey);
    await this.cacheManager.delete(cacheKey);
  }

  /**
   * Clear all Jira caches
   */
  async clearAllCache(): Promise<number> {
    return await this.cacheManager.invalidateJira();
  }
}
