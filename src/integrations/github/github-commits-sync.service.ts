import { PrismaClient } from '@prisma/client';
import { GitHubClient } from './github-client';
import { GitHubRepositoryRepository } from '../../repositories/github-repository.repository';
import { GitHubCommitRepository } from '../../repositories/github-commit.repository';
import { FeatureRepository } from '../../repositories/feature.repository';
import { secureLogger } from '../common/secure-logger';

export interface CommitSyncResult {
  success: boolean;
  repositoryId: string;
  commitsProcessed: number;
  commitsCreated: number;
  commitsUpdated: number;
  commitsAssociated: number;
  error?: string;
}

export class GitHubCommitsSyncService {
  private githubClient: GitHubClient;
  private repositoryRepository: GitHubRepositoryRepository;
  private commitRepository: GitHubCommitRepository;
  private featureRepository: FeatureRepository;

  constructor(private prisma: PrismaClient) {
    this.githubClient = new GitHubClient(prisma);
    this.repositoryRepository = new GitHubRepositoryRepository(prisma);
    this.commitRepository = new GitHubCommitRepository(prisma);
    this.featureRepository = new FeatureRepository(prisma);
  }

  /**
   * Sync commits for repository
   */
  async syncCommits(
    repositoryId: string,
    options?: {
      since?: Date;
      until?: Date;
      branch?: string;
      forceRefresh?: boolean;
    }
  ): Promise<CommitSyncResult> {
    try {
      secureLogger.logSyncStart('GitHub', 'syncCommits', { repositoryId, options });

      // Get repository info
      const repository = await this.repositoryRepository.findById(repositoryId);
      if (!repository) {
        return {
          success: false,
          repositoryId,
          commitsProcessed: 0,
          commitsCreated: 0,
          commitsUpdated: 0,
          commitsAssociated: 0,
          error: `Repository not found: ${repositoryId}`,
        };
      }

      // Fetch commits from GitHub
      const commits = await this.githubClient.listCommits(
        repository.owner,
        repository.name,
        {
          sha: options?.branch || repository.defaultBranch,
          since: options?.since,
          until: options?.until,
          forceRefresh: options?.forceRefresh,
        }
      );

      let commitsCreated = 0;
      let commitsUpdated = 0;
      let commitsAssociated = 0;

      // Process each commit
      for (const commit of commits) {
        // Check if commit already exists
        const existing = await this.commitRepository.findBySha(repositoryId, commit.sha);
        const isNew = !existing;

        // Upsert commit
        const savedCommit = await this.commitRepository.upsertBySha(
          repositoryId,
          commit.sha,
          {
            repository: { connect: { id: repositoryId } },
            sha: commit.sha,
            message: commit.message,
            author: commit.author.name,
            authorEmail: commit.author.email,
            committedAt: new Date(commit.author.date),
            additions: commit.stats.additions,
            deletions: commit.stats.deletions,
            totalChanges: commit.stats.total,
            filesChanged: commit.files.length,
            branchName: options?.branch || repository.defaultBranch,
          }
        );

        if (isNew) {
          commitsCreated++;
        } else {
          commitsUpdated++;
        }

        // Try to associate with feature
        if (!savedCommit.featureId) {
          const featureId = await this.matchCommitToFeature(commit.message);
          if (featureId) {
            await this.commitRepository.associateWithFeature(savedCommit.id, featureId);
            commitsAssociated++;
          }
        }
      }

      // Update repository last synced timestamp
      await this.repositoryRepository.update(repositoryId, {
        lastSyncedAt: new Date(),
      });

      const result: CommitSyncResult = {
        success: true,
        repositoryId,
        commitsProcessed: commits.length,
        commitsCreated,
        commitsUpdated,
        commitsAssociated,
      };

      secureLogger.logSyncComplete('GitHub', 'syncCommits', result);
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      secureLogger.logSyncError('GitHub', 'syncCommits', { repositoryId, error: errorMessage });
      
      return {
        success: false,
        repositoryId,
        commitsProcessed: 0,
        commitsCreated: 0,
        commitsUpdated: 0,
        commitsAssociated: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Match commit message to feature using feature ID pattern
   */
  private async matchCommitToFeature(commitMessage: string): Promise<string | null> {
    try {
      // Look for feature ID patterns in commit message
      // Common patterns: PROJ-123, [PROJ-123], feat(PROJ-123), #PROJ-123
      const patterns = [
        /([A-Z]+-\d+)/,           // PROJ-123
        /\[([A-Z]+-\d+)\]/,       // [PROJ-123]
        /feat\(([A-Z]+-\d+)\)/,   // feat(PROJ-123)
        /#([A-Z]+-\d+)/,          // #PROJ-123
      ];

      for (const pattern of patterns) {
        const match = commitMessage.match(pattern);
        if (match) {
          const featureIdPattern = match[1];
          
          // Find feature by featureId
          const feature = await this.featureRepository.findByFeatureId(featureIdPattern);
          if (feature) {
            secureLogger.debug('Matched commit to feature', {
              commitMessage: commitMessage.substring(0, 50),
              featureId: feature.id,
              featureIdPattern,
            });
            return feature.id;
          }
        }
      }

      return null;
    } catch (error) {
      secureLogger.error('Error matching commit to feature', { error, commitMessage });
      return null;
    }
  }

  /**
   * Associate unassociated commits with features
   */
  async associateUnassociatedCommits(repositoryId: string): Promise<number> {
    try {
      secureLogger.info('Associating unassociated commits', { repositoryId });

      const unassociated = await this.commitRepository.findUnassociated(repositoryId);
      let associatedCount = 0;

      for (const commit of unassociated) {
        const featureId = await this.matchCommitToFeature(commit.message);
        if (featureId) {
          await this.commitRepository.associateWithFeature(commit.id, featureId);
          associatedCount++;
        }
      }

      secureLogger.info('Unassociated commits processed', {
        repositoryId,
        total: unassociated.length,
        associated: associatedCount,
      });

      return associatedCount;
    } catch (error) {
      secureLogger.error('Error associating unassociated commits', { error, repositoryId });
      return 0;
    }
  }

  /**
   * Get commit statistics for feature
   */
  async getFeatureCommitStats(featureId: string): Promise<{
    totalCommits: number;
    totalAdditions: number;
    totalDeletions: number;
    totalChanges: number;
    filesChanged: number;
  }> {
    try {
      const commits = await this.commitRepository.findByFeature(featureId);

      const stats = commits.reduce(
        (acc, commit) => ({
          totalCommits: acc.totalCommits + 1,
          totalAdditions: acc.totalAdditions + commit.additions,
          totalDeletions: acc.totalDeletions + commit.deletions,
          totalChanges: acc.totalChanges + commit.totalChanges,
          filesChanged: acc.filesChanged + commit.filesChanged,
        }),
        {
          totalCommits: 0,
          totalAdditions: 0,
          totalDeletions: 0,
          totalChanges: 0,
          filesChanged: 0,
        }
      );

      return stats;
    } catch (error) {
      secureLogger.error('Error getting feature commit stats', { error, featureId });
      return {
        totalCommits: 0,
        totalAdditions: 0,
        totalDeletions: 0,
        totalChanges: 0,
        filesChanged: 0,
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
