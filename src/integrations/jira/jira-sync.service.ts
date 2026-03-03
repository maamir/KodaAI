import { PrismaClient } from '@prisma/client';
import { JiraClient, JiraIssue } from './jira-client';
import { JiraStoryRepository } from '../../repositories/jira-story.repository';
import { FeatureRepository } from '../../repositories/feature.repository';
import { secureLogger } from '../common/secure-logger';

export interface JiraSyncResult {
  success: boolean;
  issueKey: string;
  featureId?: string;
  storyPoints?: number | null;
  originalEstimate?: number | null;
  error?: string;
}

export class JiraSyncService {
  private jiraClient: JiraClient;
  private jiraStoryRepository: JiraStoryRepository;
  private featureRepository: FeatureRepository;

  constructor(private prisma: PrismaClient) {
    this.jiraClient = new JiraClient(prisma);
    this.jiraStoryRepository = new JiraStoryRepository(prisma);
    this.featureRepository = new FeatureRepository(prisma);
  }

  /**
   * Sync single Jira story to database
   */
  async syncStory(featureId: string, jiraKey: string, forceRefresh: boolean = false): Promise<JiraSyncResult> {
    try {
      secureLogger.logSyncStart('Jira', 'syncStory', { featureId, jiraKey, forceRefresh });

      // Verify feature exists
      const feature = await this.featureRepository.findById(featureId);
      if (!feature) {
        const error = `Feature not found: ${featureId}`;
        secureLogger.error(error);
        return {
          success: false,
          issueKey: jiraKey,
          error,
        };
      }

      // Fetch issue from Jira
      const issue = await this.jiraClient.getIssue(jiraKey, { forceRefresh });

      // Extract data
      const storyPoints = this.jiraClient.extractStoryPoints(issue);
      const timeEstimates = this.jiraClient.extractTimeEstimates(issue);

      // Upsert to database
      const jiraStory = await this.jiraStoryRepository.upsertByJiraKey(jiraKey, {
        feature: { connect: { id: featureId } },
        jiraKey,
        storyPoints,
        originalEstimate: timeEstimates.originalEstimate,
        remainingEstimate: timeEstimates.remainingEstimate,
        timeSpent: timeEstimates.timeSpent,
        status: issue.fields.status.name,
        summary: issue.fields.summary,
        lastSyncedAt: new Date(),
      });

      const result: JiraSyncResult = {
        success: true,
        issueKey: jiraKey,
        featureId,
        storyPoints,
        originalEstimate: timeEstimates.originalEstimate,
      };

      secureLogger.logSyncComplete('Jira', 'syncStory', result);
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      secureLogger.logSyncError('Jira', 'syncStory', { featureId, jiraKey, error: errorMessage });
      
      return {
        success: false,
        issueKey: jiraKey,
        error: errorMessage,
      };
    }
  }

  /**
   * Sync Jira story by feature (auto-detect Jira key from feature ID)
   */
  async syncStoryByFeature(featureId: string, forceRefresh: boolean = false): Promise<JiraSyncResult> {
    try {
      // Get feature to extract Jira key
      const feature = await this.featureRepository.findById(featureId);
      if (!feature) {
        return {
          success: false,
          issueKey: 'unknown',
          error: `Feature not found: ${featureId}`,
        };
      }

      // Use feature.featureId as Jira key (assumes format like "PROJ-123")
      const jiraKey = feature.featureId;

      return await this.syncStory(featureId, jiraKey, forceRefresh);
    } catch (error: any) {
      secureLogger.logSyncError('Jira', 'syncStoryByFeature', { featureId, error: error.message });
      
      return {
        success: false,
        issueKey: 'unknown',
        error: error.message,
      };
    }
  }

  /**
   * Sync multiple Jira stories
   */
  async syncMultipleStories(
    stories: Array<{ featureId: string; jiraKey: string }>,
    forceRefresh: boolean = false
  ): Promise<JiraSyncResult[]> {
    secureLogger.logSyncStart('Jira', 'syncMultipleStories', { 
      count: stories.length, 
      forceRefresh,
    });

    const results: JiraSyncResult[] = [];

    for (const story of stories) {
      const result = await this.syncStory(story.featureId, story.jiraKey, forceRefresh);
      results.push(result);

      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const successCount = results.filter(r => r.success).length;
    secureLogger.logSyncComplete('Jira', 'syncMultipleStories', {
      total: results.length,
      successful: successCount,
      failed: results.length - successCount,
    });

    return results;
  }

  /**
   * Sync all stale Jira stories (not synced recently)
   */
  async syncStaleStories(olderThanMinutes: number = 60): Promise<JiraSyncResult[]> {
    try {
      const cutoffDate = new Date(Date.now() - olderThanMinutes * 60 * 1000);
      
      secureLogger.logSyncStart('Jira', 'syncStaleStories', { 
        olderThanMinutes,
        cutoffDate,
      });

      // Find stale stories
      const staleStories = await this.jiraStoryRepository.findStale(cutoffDate);

      if (staleStories.length === 0) {
        secureLogger.info('No stale Jira stories found');
        return [];
      }

      secureLogger.info(`Found ${staleStories.length} stale Jira stories`);

      // Sync each stale story
      const results: JiraSyncResult[] = [];
      for (const story of staleStories) {
        const result = await this.syncStory(story.featureId, story.jiraKey, true);
        results.push(result);

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const successCount = results.filter(r => r.success).length;
      secureLogger.logSyncComplete('Jira', 'syncStaleStories', {
        total: results.length,
        successful: successCount,
        failed: results.length - successCount,
      });

      return results;
    } catch (error: any) {
      secureLogger.logSyncError('Jira', 'syncStaleStories', { error: error.message });
      return [];
    }
  }

  /**
   * Get sync status for feature
   */
  async getSyncStatus(featureId: string): Promise<{
    synced: boolean;
    lastSyncedAt?: Date;
    jiraKey?: string;
    storyPoints?: number | null;
  }> {
    try {
      const jiraStory = await this.jiraStoryRepository.findByFeatureId(featureId);
      
      if (!jiraStory) {
        return { synced: false };
      }

      return {
        synced: true,
        lastSyncedAt: jiraStory.lastSyncedAt,
        jiraKey: jiraStory.jiraKey,
        storyPoints: jiraStory.storyPoints,
      };
    } catch (error) {
      secureLogger.error('Failed to get sync status', { featureId, error });
      return { synced: false };
    }
  }

  /**
   * Test Jira connection
   */
  async testConnection(): Promise<boolean> {
    return await this.jiraClient.testConnection();
  }

  /**
   * Clear cache for specific story
   */
  async clearCache(jiraKey: string): Promise<void> {
    await this.jiraClient.clearIssueCache(jiraKey);
  }

  /**
   * Clear all Jira caches
   */
  async clearAllCache(): Promise<number> {
    return await this.jiraClient.clearAllCache();
  }
}
