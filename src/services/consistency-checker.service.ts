import { PrismaClient } from '@prisma/client';
import * as cron from 'node-cron';
import { JiraSyncService } from '../integrations/jira/jira-sync.service';
import { GitHubCommitsSyncService } from '../integrations/github/github-commits-sync.service';
import { GitHubPRsSyncService } from '../integrations/github/github-prs-sync.service';
import { JiraStoryRepository } from '../repositories/jira-story.repository';
import { FeatureRepository } from '../repositories/feature.repository';
import { logger } from '../infrastructure/logger';

export interface ConsistencyIssue {
  entityType: string;
  entityId: string;
  field: string;
  localValue: any;
  externalValue: any;
  resolution: string;
}

export interface ConsistencyCheckResult {
  featureId?: string;
  checkType: string;
  inconsistenciesFound: number;
  inconsistencies: ConsistencyIssue[];
  timestamp: Date;
}

export class ConsistencyCheckerService {
  private jiraSyncService: JiraSyncService;
  private githubCommitsService: GitHubCommitsSyncService;
  private githubPRsService: GitHubPRsSyncService;
  private jiraStoryRepository: JiraStoryRepository;
  private featureRepository: FeatureRepository;
  private cronJob: cron.ScheduledTask | null = null;

  constructor(private prisma: PrismaClient) {
    this.jiraSyncService = new JiraSyncService(prisma);
    this.githubCommitsService = new GitHubCommitsSyncService(prisma);
    this.githubPRsService = new GitHubPRsSyncService(prisma);
    this.jiraStoryRepository = new JiraStoryRepository(prisma);
    this.featureRepository = new FeatureRepository(prisma);
  }

  /**
   * Run consistency check
   */
  async runConsistencyCheck(
    featureId?: string,
    checkType: 'JIRA' | 'GITHUB' | 'ALL' = 'ALL'
  ): Promise<ConsistencyCheckResult> {
    try {
      logger.info('Starting consistency check', { featureId, checkType });

      const inconsistencies: ConsistencyIssue[] = [];

      if (checkType === 'JIRA' || checkType === 'ALL') {
        const jiraIssues = await this.checkJiraConsistency(featureId);
        inconsistencies.push(...jiraIssues);
      }

      if (checkType === 'GITHUB' || checkType === 'ALL') {
        const githubIssues = await this.checkGitHubConsistency(featureId);
        inconsistencies.push(...githubIssues);
      }

      const result: ConsistencyCheckResult = {
        featureId,
        checkType,
        inconsistenciesFound: inconsistencies.length,
        inconsistencies,
        timestamp: new Date(),
      };

      logger.info('Consistency check completed', {
        featureId,
        checkType,
        inconsistenciesFound: inconsistencies.length,
      });

      return result;
    } catch (error) {
      logger.error('Consistency check failed', { error, featureId, checkType });
      throw error;
    }
  }

  /**
   * Check Jira data consistency
   */
  private async checkJiraConsistency(featureId?: string): Promise<ConsistencyIssue[]> {
    const inconsistencies: ConsistencyIssue[] = [];

    try {
      // Get Jira stories to check
      const jiraStories = featureId
        ? [await this.jiraStoryRepository.findByFeatureId(featureId)].filter(Boolean)
        : await this.jiraStoryRepository.findStale(new Date(Date.now() - 24 * 60 * 60 * 1000));

      for (const story of jiraStories) {
        if (!story) continue;

        // Fetch fresh data from Jira
        const syncResult = await this.jiraSyncService.syncStory(
          story.featureId,
          story.jiraKey,
          true
        );

        if (!syncResult.success) {
          continue;
        }

        // Compare story points
        if (syncResult.storyPoints !== story.storyPoints) {
          inconsistencies.push({
            entityType: 'JiraStory',
            entityId: story.id,
            field: 'storyPoints',
            localValue: story.storyPoints,
            externalValue: syncResult.storyPoints,
            resolution: 'Updated from Jira',
          });
        }

        // Compare original estimate
        if (syncResult.originalEstimate !== story.originalEstimate) {
          inconsistencies.push({
            entityType: 'JiraStory',
            entityId: story.id,
            field: 'originalEstimate',
            localValue: story.originalEstimate,
            externalValue: syncResult.originalEstimate,
            resolution: 'Updated from Jira',
          });
        }
      }
    } catch (error) {
      logger.error('Jira consistency check error', { error });
    }

    return inconsistencies;
  }

  /**
   * Check GitHub data consistency
   */
  private async checkGitHubConsistency(featureId?: string): Promise<ConsistencyIssue[]> {
    const inconsistencies: ConsistencyIssue[] = [];

    try {
      // For now, just log that GitHub consistency check would run
      // Full implementation would compare local commits/PRs with GitHub
      logger.info('GitHub consistency check placeholder', { featureId });
    } catch (error) {
      logger.error('GitHub consistency check error', { error });
    }

    return inconsistencies;
  }

  /**
   * Start daily consistency check cron job
   */
  startDailyCheck(): void {
    if (this.cronJob) {
      logger.warn('Daily consistency check already running');
      return;
    }

    // Run at 2 AM every day
    this.cronJob = cron.schedule('0 2 * * *', async () => {
      logger.info('Running scheduled daily consistency check');
      
      try {
        const result = await this.runConsistencyCheck(undefined, 'ALL');
        
        logger.info('Scheduled consistency check completed', {
          inconsistenciesFound: result.inconsistenciesFound,
        });
      } catch (error) {
        logger.error('Scheduled consistency check failed', { error });
      }
    });

    logger.info('Daily consistency check scheduled (2 AM daily)');
  }

  /**
   * Stop daily consistency check
   */
  stopDailyCheck(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Daily consistency check stopped');
    }
  }
}
