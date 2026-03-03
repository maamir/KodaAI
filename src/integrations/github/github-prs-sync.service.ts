import { PrismaClient, PullRequestState } from '@prisma/client';
import { GitHubClient } from './github-client';
import { GitHubRepositoryRepository } from '../../repositories/github-repository.repository';
import { GitHubPullRequestRepository } from '../../repositories/github-pull-request.repository';
import { FeatureRepository } from '../../repositories/feature.repository';
import { secureLogger } from '../common/secure-logger';

export interface PRSyncResult {
  success: boolean;
  repositoryId: string;
  prsProcessed: number;
  prsCreated: number;
  prsUpdated: number;
  prsAssociated: number;
  error?: string;
}

export class GitHubPRsSyncService {
  private githubClient: GitHubClient;
  private repositoryRepository: GitHubRepositoryRepository;
  private prRepository: GitHubPullRequestRepository;
  private featureRepository: FeatureRepository;

  constructor(private prisma: PrismaClient) {
    this.githubClient = new GitHubClient(prisma);
    this.repositoryRepository = new GitHubRepositoryRepository(prisma);
    this.prRepository = new GitHubPullRequestRepository(prisma);
    this.featureRepository = new FeatureRepository(prisma);
  }

  /**
   * Sync pull requests for repository
   */
  async syncPullRequests(
    repositoryId: string,
    options?: {
      state?: 'OPEN' | 'CLOSED' | 'MERGED' | 'ALL';
      forceRefresh?: boolean;
    }
  ): Promise<PRSyncResult> {
    try {
      secureLogger.logSyncStart('GitHub', 'syncPullRequests', { repositoryId, options });

      // Get repository info
      const repository = await this.repositoryRepository.findById(repositoryId);
      if (!repository) {
        return {
          success: false,
          repositoryId,
          prsProcessed: 0,
          prsCreated: 0,
          prsUpdated: 0,
          prsAssociated: 0,
          error: `Repository not found: ${repositoryId}`,
        };
      }

      // Map state to GitHub API format
      const githubState = options?.state === 'ALL' ? 'all' : 
                         options?.state === 'OPEN' ? 'open' : 'closed';

      // Fetch PRs from GitHub
      const prs = await this.githubClient.listPullRequests(
        repository.owner,
        repository.name,
        {
          state: githubState as 'open' | 'closed' | 'all',
          forceRefresh: options?.forceRefresh,
        }
      );

      let prsCreated = 0;
      let prsUpdated = 0;
      let prsAssociated = 0;

      // Process each PR
      for (const pr of prs) {
        // Fetch detailed PR info (includes additions/deletions)
        const detailedPR = await this.githubClient.getPullRequest(
          repository.owner,
          repository.name,
          pr.number
        );

        // Fetch reviews
        const reviews = await this.githubClient.listReviews(
          repository.owner,
          repository.name,
          pr.number
        );

        // Calculate review metrics
        const reviewMetrics = this.calculateReviewMetrics(detailedPR, reviews);

        // Check if PR already exists
        const existing = await this.prRepository.findByNumber(repositoryId, pr.number);
        const isNew = !existing;

        // Determine PR state
        const state = detailedPR.merged ? PullRequestState.MERGED :
                     detailedPR.state === 'closed' ? PullRequestState.CLOSED :
                     PullRequestState.OPEN;

        // Upsert PR
        const savedPR = await this.prRepository.upsertByNumber(
          repositoryId,
          pr.number,
          {
            repository: { connect: { id: repositoryId } },
            number: pr.number,
            title: pr.title,
            description: pr.body,
            state,
            author: pr.author,
            createdAt: new Date(pr.createdAt),
            mergedAt: pr.mergedAt ? new Date(pr.mergedAt) : null,
            closedAt: pr.closedAt ? new Date(pr.closedAt) : null,
            reviewCount: reviewMetrics.reviewCount,
            approvalCount: reviewMetrics.approvalCount,
            changesRequestedCount: reviewMetrics.changesRequestedCount,
            commentCount: reviewMetrics.commentCount,
            reviewers: reviewMetrics.reviewers,
            timeToFirstReview: reviewMetrics.timeToFirstReview,
            timeToMerge: reviewMetrics.timeToMerge,
            reviewIterations: reviewMetrics.reviewIterations,
            additions: detailedPR.additions,
            deletions: detailedPR.deletions,
            filesChanged: detailedPR.changedFiles,
          }
        );

        if (isNew) {
          prsCreated++;
        } else {
          prsUpdated++;
        }

        // Try to associate with feature
        if (!savedPR.featureId) {
          const featureId = await this.matchPRToFeature(pr.title, pr.body);
          if (featureId) {
            await this.prRepository.associateWithFeature(savedPR.id, featureId);
            prsAssociated++;
          }
        }
      }

      // Update repository last synced timestamp
      await this.repositoryRepository.update(repositoryId, {
        lastSyncedAt: new Date(),
      });

      const result: PRSyncResult = {
        success: true,
        repositoryId,
        prsProcessed: prs.length,
        prsCreated,
        prsUpdated,
        prsAssociated,
      };

      secureLogger.logSyncComplete('GitHub', 'syncPullRequests', result);
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      secureLogger.logSyncError('GitHub', 'syncPullRequests', { repositoryId, error: errorMessage });
      
      return {
        success: false,
        repositoryId,
        prsProcessed: 0,
        prsCreated: 0,
        prsUpdated: 0,
        prsAssociated: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Calculate review metrics from PR and reviews
   */
  private calculateReviewMetrics(pr: any, reviews: any[]): {
    reviewCount: number;
    approvalCount: number;
    changesRequestedCount: number;
    commentCount: number;
    reviewers: string[];
    timeToFirstReview: number | null;
    timeToMerge: number | null;
    reviewIterations: number;
  } {
    const uniqueReviewers = new Set<string>();
    let approvalCount = 0;
    let changesRequestedCount = 0;
    let commentCount = 0;
    let firstReviewTime: Date | null = null;

    // Process reviews
    for (const review of reviews) {
      uniqueReviewers.add(review.user);

      if (review.state === 'APPROVED') {
        approvalCount++;
      } else if (review.state === 'CHANGES_REQUESTED') {
        changesRequestedCount++;
      } else if (review.state === 'COMMENTED') {
        commentCount++;
      }

      // Track first review time
      const reviewTime = new Date(review.submittedAt);
      if (!firstReviewTime || reviewTime < firstReviewTime) {
        firstReviewTime = reviewTime;
      }
    }

    // Calculate time to first review
    const createdAt = new Date(pr.createdAt);
    const timeToFirstReview = firstReviewTime 
      ? Math.floor((firstReviewTime.getTime() - createdAt.getTime()) / 1000)
      : null;

    // Calculate time to merge
    const timeToMerge = pr.mergedAt
      ? Math.floor((new Date(pr.mergedAt).getTime() - createdAt.getTime()) / 1000)
      : null;

    // Estimate review iterations (simplified: count of changes requested + 1)
    const reviewIterations = changesRequestedCount > 0 ? changesRequestedCount + 1 : 1;

    return {
      reviewCount: reviews.length,
      approvalCount,
      changesRequestedCount,
      commentCount,
      reviewers: Array.from(uniqueReviewers),
      timeToFirstReview,
      timeToMerge,
      reviewIterations,
    };
  }

  /**
   * Match PR to feature using feature ID pattern
   */
  private async matchPRToFeature(title: string, body: string | null): Promise<string | null> {
    try {
      const searchText = `${title} ${body || ''}`;

      // Look for feature ID patterns
      const patterns = [
        /([A-Z]+-\d+)/,           // PROJ-123
        /\[([A-Z]+-\d+)\]/,       // [PROJ-123]
        /feat\(([A-Z]+-\d+)\)/,   // feat(PROJ-123)
        /#([A-Z]+-\d+)/,          // #PROJ-123
      ];

      for (const pattern of patterns) {
        const match = searchText.match(pattern);
        if (match) {
          const featureIdPattern = match[1];
          
          // Find feature by featureId
          const feature = await this.featureRepository.findByFeatureId(featureIdPattern);
          if (feature) {
            secureLogger.debug('Matched PR to feature', {
              title: title.substring(0, 50),
              featureId: feature.id,
              featureIdPattern,
            });
            return feature.id;
          }
        }
      }

      return null;
    } catch (error) {
      secureLogger.error('Error matching PR to feature', { error, title });
      return null;
    }
  }

  /**
   * Associate unassociated PRs with features
   */
  async associateUnassociatedPRs(repositoryId: string): Promise<number> {
    try {
      secureLogger.info('Associating unassociated PRs', { repositoryId });

      const unassociated = await this.prRepository.findUnassociated(repositoryId);
      let associatedCount = 0;

      for (const pr of unassociated) {
        const featureId = await this.matchPRToFeature(pr.title, pr.description);
        if (featureId) {
          await this.prRepository.associateWithFeature(pr.id, featureId);
          associatedCount++;
        }
      }

      secureLogger.info('Unassociated PRs processed', {
        repositoryId,
        total: unassociated.length,
        associated: associatedCount,
      });

      return associatedCount;
    } catch (error) {
      secureLogger.error('Error associating unassociated PRs', { error, repositoryId });
      return 0;
    }
  }

  /**
   * Get PR statistics for feature
   */
  async getFeaturePRStats(featureId: string): Promise<{
    totalPRs: number;
    mergedPRs: number;
    openPRs: number;
    closedPRs: number;
    totalAdditions: number;
    totalDeletions: number;
    averageTimeToFirstReview: number | null;
    averageTimeToMerge: number | null;
    totalReviews: number;
  }> {
    try {
      const prs = await this.prRepository.findByFeature(featureId);

      let totalTimeToFirstReview = 0;
      let countTimeToFirstReview = 0;
      let totalTimeToMerge = 0;
      let countTimeToMerge = 0;

      const stats = prs.reduce(
        (acc, pr) => {
          // Count by state
          if (pr.state === PullRequestState.MERGED) acc.mergedPRs++;
          else if (pr.state === PullRequestState.OPEN) acc.openPRs++;
          else if (pr.state === PullRequestState.CLOSED) acc.closedPRs++;

          // Sum metrics
          acc.totalAdditions += pr.additions;
          acc.totalDeletions += pr.deletions;
          acc.totalReviews += pr.reviewCount;

          // Track time metrics
          if (pr.timeToFirstReview !== null) {
            totalTimeToFirstReview += pr.timeToFirstReview;
            countTimeToFirstReview++;
          }
          if (pr.timeToMerge !== null) {
            totalTimeToMerge += pr.timeToMerge;
            countTimeToMerge++;
          }

          return acc;
        },
        {
          totalPRs: prs.length,
          mergedPRs: 0,
          openPRs: 0,
          closedPRs: 0,
          totalAdditions: 0,
          totalDeletions: 0,
          totalReviews: 0,
        }
      );

      return {
        ...stats,
        averageTimeToFirstReview: countTimeToFirstReview > 0 
          ? Math.floor(totalTimeToFirstReview / countTimeToFirstReview)
          : null,
        averageTimeToMerge: countTimeToMerge > 0
          ? Math.floor(totalTimeToMerge / countTimeToMerge)
          : null,
      };
    } catch (error) {
      secureLogger.error('Error getting feature PR stats', { error, featureId });
      return {
        totalPRs: 0,
        mergedPRs: 0,
        openPRs: 0,
        closedPRs: 0,
        totalAdditions: 0,
        totalDeletions: 0,
        averageTimeToFirstReview: null,
        averageTimeToMerge: null,
        totalReviews: 0,
      };
    }
  }

  /**
   * Test GitHub connection
   */
  async testConnection(): Promise<boolean> {
    return await this.githubClient.testConnection();
  }

  /**
   * Clear cache for repository
   */
  async clearCache(owner: string, repo: string): Promise<number> {
    return await this.githubClient.clearRepositoryCache(owner, repo);
  }
}
