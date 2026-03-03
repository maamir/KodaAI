import { PrismaClient, GitHubRepository, Prisma } from '@prisma/client';
import { logger } from '../infrastructure/logger';
import { GitHubRepositoryWithRelations } from '../types/entities';

export class GitHubRepositoryRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.GitHubRepositoryCreateInput): Promise<GitHubRepository> {
    try {
      return await this.prisma.gitHubRepository.create({ data });
    } catch (error) {
      logger.error('Failed to create GitHub repository', { error, data });
      throw error;
    }
  }

  async findById(id: string): Promise<GitHubRepository | null> {
    try {
      return await this.prisma.gitHubRepository.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error('Failed to find GitHub repository by ID', { error, id });
      throw error;
    }
  }

  async findByFullName(fullName: string): Promise<GitHubRepository | null> {
    try {
      return await this.prisma.gitHubRepository.findUnique({
        where: { fullName },
      });
    } catch (error) {
      logger.error('Failed to find GitHub repository by full name', { error, fullName });
      throw error;
    }
  }

  async findByIdWithRelations(id: string): Promise<GitHubRepositoryWithRelations | null> {
    try {
      return await this.prisma.gitHubRepository.findUnique({
        where: { id },
        include: {
          commits: true,
          pullRequests: true,
        },
      });
    } catch (error) {
      logger.error('Failed to find GitHub repository with relations', { error, id });
      throw error;
    }
  }

  async findAllActive(): Promise<GitHubRepository[]> {
    try {
      return await this.prisma.gitHubRepository.findMany({
        where: { isActive: true },
        orderBy: { fullName: 'asc' },
      });
    } catch (error) {
      logger.error('Failed to find active GitHub repositories', { error });
      throw error;
    }
  }

  async update(id: string, data: Prisma.GitHubRepositoryUpdateInput): Promise<GitHubRepository> {
    try {
      return await this.prisma.gitHubRepository.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error('Failed to update GitHub repository', { error, id, data });
      throw error;
    }
  }

  async upsertByFullName(fullName: string, data: Prisma.GitHubRepositoryCreateInput): Promise<GitHubRepository> {
    try {
      return await this.prisma.gitHubRepository.upsert({
        where: { fullName },
        create: data,
        update: {
          defaultBranch: data.defaultBranch,
          isActive: data.isActive,
          lastSyncedAt: data.lastSyncedAt,
        },
      });
    } catch (error) {
      logger.error('Failed to upsert GitHub repository', { error, fullName, data });
      throw error;
    }
  }

  async setActive(id: string, isActive: boolean): Promise<GitHubRepository> {
    try {
      return await this.prisma.gitHubRepository.update({
        where: { id },
        data: { isActive },
      });
    } catch (error) {
      logger.error('Failed to set GitHub repository active status', { error, id, isActive });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.gitHubRepository.delete({ where: { id } });
    } catch (error) {
      logger.error('Failed to delete GitHub repository', { error, id });
      throw error;
    }
  }
}
