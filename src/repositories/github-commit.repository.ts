import { PrismaClient, GitHubCommit, Prisma } from '@prisma/client';
import { logger } from '../infrastructure/logger';
import { GitHubCommitWithRelations } from '../types/entities';

export class GitHubCommitRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.GitHubCommitCreateInput): Promise<GitHubCommit> {
    try {
      return await this.prisma.gitHubCommit.create({ data });
    } catch (error) {
      logger.error('Failed to create GitHub commit', { error, data });
      throw error;
    }
  }

  async findById(id: string): Promise<GitHubCommit | null> {
    try {
      return await this.prisma.gitHubCommit.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error('Failed to find GitHub commit by ID', { error, id });
      throw error;
    }
  }

  async findBySha(repositoryId: string, sha: string): Promise<GitHubCommit | null> {
    try {
      return await this.prisma.gitHubCommit.findFirst({
        where: {
          repositoryId,
          sha,
        },
      });
    } catch (error) {
      logger.error('Failed to find GitHub commit by SHA', { error, repositoryId, sha });
      throw error;
    }
  }

  async findByIdWithRelations(id: string): Promise<GitHubCommitWithRelations | null> {
    try {
      return await this.prisma.gitHubCommit.findUnique({
        where: { id },
        include: {
          repository: true,
          feature: true,
        },
      });
    } catch (error) {
      logger.error('Failed to find GitHub commit with relations', { error, id });
      throw error;
    }
  }

  async findByRepository(repositoryId: string, options?: {
    since?: Date;
    until?: Date;
    branch?: string;
    limit?: number;
  }): Promise<GitHubCommit[]> {
    try {
      const where: Prisma.GitHubCommitWhereInput = {
        repositoryId,
        ...(options?.since && { committedAt: { gte: options.since } }),
        ...(options?.until && { committedAt: { lte: options.until } }),
        ...(options?.branch && { branchName: options.branch }),
      };

      return await this.prisma.gitHubCommit.findMany({
        where,
        orderBy: { committedAt: 'desc' },
        take: options?.limit,
      });
    } catch (error) {
      logger.error('Failed to find GitHub commits by repository', { error, repositoryId, options });
      throw error;
    }
  }

  async findByFeature(featureId: string): Promise<GitHubCommit[]> {
    try {
      return await this.prisma.gitHubCommit.findMany({
        where: { featureId },
        orderBy: { committedAt: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to find GitHub commits by feature', { error, featureId });
      throw error;
    }
  }

  async update(id: string, data: Prisma.GitHubCommitUpdateInput): Promise<GitHubCommit> {
    try {
      return await this.prisma.gitHubCommit.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error('Failed to update GitHub commit', { error, id, data });
      throw error;
    }
  }

  async upsertBySha(repositoryId: string, sha: string, data: Prisma.GitHubCommitCreateInput): Promise<GitHubCommit> {
    try {
      const existing = await this.findBySha(repositoryId, sha);
      if (existing) {
        return await this.update(existing.id, {
          featureId: data.featureId,
          message: data.message,
          author: data.author,
          authorEmail: data.authorEmail,
          committedAt: data.committedAt,
          additions: data.additions,
          deletions: data.deletions,
          totalChanges: data.totalChanges,
          filesChanged: data.filesChanged,
          branchName: data.branchName,
        });
      }
      return await this.create(data);
    } catch (error) {
      logger.error('Failed to upsert GitHub commit', { error, repositoryId, sha, data });
      throw error;
    }
  }

  async associateWithFeature(id: string, featureId: string): Promise<GitHubCommit> {
    try {
      return await this.prisma.gitHubCommit.update({
        where: { id },
        data: { featureId },
      });
    } catch (error) {
      logger.error('Failed to associate GitHub commit with feature', { error, id, featureId });
      throw error;
    }
  }

  async findUnassociated(repositoryId: string): Promise<GitHubCommit[]> {
    try {
      return await this.prisma.gitHubCommit.findMany({
        where: {
          repositoryId,
          featureId: null,
        },
        orderBy: { committedAt: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to find unassociated GitHub commits', { error, repositoryId });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.gitHubCommit.delete({ where: { id } });
    } catch (error) {
      logger.error('Failed to delete GitHub commit', { error, id });
      throw error;
    }
  }
}
