import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { JiraSyncService } from '../integrations/jira/jira-sync.service';
import { GitHubCommitsSyncService } from '../integrations/github/github-commits-sync.service';
import { GitHubPRsSyncService } from '../integrations/github/github-prs-sync.service';
import { JobQueueManagerService } from '../services/job-queue-manager.service';
import { ConsistencyCheckerService } from '../services/consistency-checker.service';
import { logger } from '../infrastructure/logger';

const prisma = new PrismaClient();
const jiraSyncService = new JiraSyncService(prisma);
const githubCommitsService = new GitHubCommitsSyncService(prisma);
const githubPRsService = new GitHubPRsSyncService(prisma);
const jobQueueManager = new JobQueueManagerService(prisma);
const consistencyChecker = new ConsistencyCheckerService(prisma);

export class IntegrationsController {
  /**
   * POST /api/integrations/jira/sync
   */
  async syncJira(req: Request, res: Response): Promise<void> {
    try {
      const { featureId, jiraKey, forceRefresh } = req.body;

      const result = await jiraSyncService.syncStory(featureId, jiraKey, forceRefresh);

      res.json(result);
    } catch (error: any) {
      logger.error('Jira sync error', { error });
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/integrations/github/sync-commits
   */
  async syncGitHubCommits(req: Request, res: Response): Promise<void> {
    try {
      const { repositoryId, since, until, branch, forceRefresh } = req.body;

      const result = await githubCommitsService.syncCommits(repositoryId, {
        since: since ? new Date(since) : undefined,
        until: until ? new Date(until) : undefined,
        branch,
        forceRefresh,
      });

      res.json(result);
    } catch (error: any) {
      logger.error('GitHub commits sync error', { error });
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/integrations/github/sync-prs
   */
  async syncGitHubPRs(req: Request, res: Response): Promise<void> {
    try {
      const { repositoryId, state, forceRefresh } = req.body;

      const result = await githubPRsService.syncPullRequests(repositoryId, {
        state,
        forceRefresh,
      });

      res.json(result);
    } catch (error: any) {
      logger.error('GitHub PRs sync error', { error });
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/integrations/jobs/:id
   */
  async getJob(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // This would use job repository to fetch job details
      res.json({ message: 'Job details endpoint', jobId: id });
    } catch (error: any) {
      logger.error('Get job error', { error });
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/integrations/consistency-check
   */
  async runConsistencyCheck(req: Request, res: Response): Promise<void> {
    try {
      const { featureId, checkType } = req.body;

      const result = await consistencyChecker.runConsistencyCheck(featureId, checkType);

      res.json(result);
    } catch (error: any) {
      logger.error('Consistency check error', { error });
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/integrations/queue/metrics
   */
  async getQueueMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await jobQueueManager.getQueueMetrics();
      res.json(metrics);
    } catch (error: any) {
      logger.error('Queue metrics error', { error });
      res.status(500).json({ error: error.message });
    }
  }
}

export const integrationsController = new IntegrationsController();
