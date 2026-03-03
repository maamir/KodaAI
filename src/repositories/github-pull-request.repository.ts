import { PrismaClient, GitHubPullRequest, Prisma, PullRequestState } from '@prisma/client';
import { logger } from '../infrastructure/logger';
import { GitHubPullRequestWithRelations } from '../types/entities';

export class GitHubPullRequestRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.GitHubPullRequestCreateInput): Promise<GitHubPullRequest> {
    try {
      return await this.prisma.gitHubPullRequest.create({ data });
    } catch (error) {
      logger.error('Failed to create GitHub pull request', { error, data });
      throw error;
    }
  }

  async findById(id: string): Promise<GitHubPullRequest | null> {
    try {
      return await this.prisma.gitHubPullRequest.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error('Failed to find GitHub pull request by ID', { error, id });
      throw error;
    }
  }

  async findByNumber(repositoryId: string, number: number): Promise<GitHubPullRequest | null> {
    try {
      return await this.prisma.gitHubPullRequest.findFirst({
        where: {
          repositoryId,
          number,
        },
      });
    } catch (error) {
      logger.error('Failed to find GitHub pull request by number', { error, repositoryId, number });
      throw error;
    }
  }

  async findByIdWithRelations(id: string): Promise<GitHubPullRequestWithRelations | null> {
    try {
      return await this.prisma.gitHubPullRequest.findUnique({
        where: { id },
        include: {
          repository: true,
          feature: true,
        },
      });
    } catch (error) {
      logger.error('Failed to find GitHub pull request with relations', { error, id });
      throw error;
    }
  }

  async findByRepository(repositoryId: string, options?: {
    state?: PullRequestState | 'ALL';
    since?: Date;
    limit?: number;
  }): Promise<GitHubPullRequest[]> {
    try {
      const where: Prisma.GitHubPullRequestWhereInput = {
        repositoryId,
        ...(options?.state && options.state !== 'ALL' && { state: options.state }),
        ...(options?.since && { createdAt: { gte: options.since } }),
      };

      return await this.prisma.gitHubPullRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit,
      });
    } catch (error) {
      logger.error('Failed to find GitHub pull requests by repository', { error, repositoryId, options });
      throw error;
    }
  }

  async findByFeature(featureId: string): Promise<GitHubPullRequest[]> {
    try {
      return await this.prisma.gitHubPullRequest.findMany({
        where: { featureId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to find GitHub pull requests by feature', { error, featureId });
      throw error;
    }
  }

  async update(id: string, data: Prisma.GitHubPullRequestUpdateInput): Promise<GitHubPullRequest> {
    try {
      return await this.prisma.gitHubPullRequest.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error('Failed to update GitHub pull request', { error, id, data });
      throw error;
    }
  }

  async upsertByNumber(repositoryId: string, number: number, data: Prisma.GitHubPullRequestCreateInput): Promise<GitHubPullRequest> {
    try {
      const existing = await this.findByNumber(repositoryId, number);
      if (existing) {
        return await this.update(existing.id, {
          featureId: data.featureId,
          title: data.title,
          description: data.description,
          state: data.state,
          author: data.author,
          mergedAt: data.mergedAt,
          closedAt: data.closedAt,
          reviewCount: data.reviewCount,
          approvalCount: data.approvalCount,
          changesRequestedCount: data.changesRequestedCount,
          commentCount: data.commentCount,
          reviewers: data.reviewers,
          timeToFirstReview: data.timeToFirstReview,
          timeToMerge: data.timeToMerge,
          reviewIterations: data.reviewIterations,
          additions: data.additions,
          deletions: data.deletions,
          filesChanged: data.filesChanged,
        });
      }
      return await this.create(data);
    } catch (error) {
      logger.error('Failed to upsert GitHub pull request', { error, repositoryId, number, data });
      throw error;
    }
  }

  async associateWithFeature(id: string, featureId: string): Promise<GitHubPullRequest> {
    try {
      return await this.prisma.gitHubPullRequest.update({
        where: { id },
        data: { featureId },
      });
    } catch (error) {
      logger.error('Failed to associate GitHub pull request with feature', { error, id, featureId });
      throw error;
    }
  }

  async findUnassociated(repositoryId: string): Promise<GitHubPullRequest[]> {
    try {
      return await this.prisma.gitHubPullRequest.findMany({
        where: {
          repositoryId,
          featureId: null,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to find unassociated GitHub pull requests', { error, repositoryId });
      throw error;
    }
  }

  async findMerged(repositoryId: string, since?: Date): Promise<GitHubPullRequest[]> {
    try {
      return await this.prisma.gitHubPullRequest.findMany({
        where: {
          repositoryId,
          state: PullRequestState.MERGED,
          ...(since && { mergedAt: { gte: since } }),
        },
        orderBy: { mergedAt: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to find merged GitHub pull requests', { error, repositoryId, since });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.gitHubPullRequest.delete({ where: { id } });
    } catch (error) {
      logger.error('Failed to delete GitHub pull request', { error, id });
      throw error;
    }
  }
}
