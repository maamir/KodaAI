import { PrismaClient, JiraStory, Prisma } from '@prisma/client';
import { logger } from '../infrastructure/logger';

export class JiraStoryRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.JiraStoryCreateInput): Promise<JiraStory> {
    try {
      return await this.prisma.jiraStory.create({ data });
    } catch (error) {
      logger.error('Failed to create Jira story', { error, data });
      throw error;
    }
  }

  async findByJiraKey(jiraKey: string): Promise<JiraStory | null> {
    try {
      return await this.prisma.jiraStory.findUnique({
        where: { jiraKey },
      });
    } catch (error) {
      logger.error('Failed to find Jira story by key', { error, jiraKey });
      throw error;
    }
  }

  async findByFeatureId(featureId: string): Promise<JiraStory | null> {
    try {
      return await this.prisma.jiraStory.findUnique({
        where: { featureId },
      });
    } catch (error) {
      logger.error('Failed to find Jira story by feature ID', { error, featureId });
      throw error;
    }
  }

  async update(id: string, data: Prisma.JiraStoryUpdateInput): Promise<JiraStory> {
    try {
      return await this.prisma.jiraStory.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error('Failed to update Jira story', { error, id, data });
      throw error;
    }
  }

  async updateByJiraKey(jiraKey: string, data: Prisma.JiraStoryUpdateInput): Promise<JiraStory> {
    try {
      return await this.prisma.jiraStory.update({
        where: { jiraKey },
        data,
      });
    } catch (error) {
      logger.error('Failed to update Jira story by key', { error, jiraKey, data });
      throw error;
    }
  }

  async upsertByJiraKey(jiraKey: string, data: Prisma.JiraStoryCreateInput): Promise<JiraStory> {
    try {
      return await this.prisma.jiraStory.upsert({
        where: { jiraKey },
        create: data,
        update: {
          storyPoints: data.storyPoints,
          originalEstimate: data.originalEstimate,
          remainingEstimate: data.remainingEstimate,
          timeSpent: data.timeSpent,
          status: data.status,
          summary: data.summary,
          lastSyncedAt: data.lastSyncedAt,
        },
      });
    } catch (error) {
      logger.error('Failed to upsert Jira story', { error, jiraKey, data });
      throw error;
    }
  }

  async findStale(olderThan: Date): Promise<JiraStory[]> {
    try {
      return await this.prisma.jiraStory.findMany({
        where: {
          lastSyncedAt: {
            lt: olderThan,
          },
        },
        orderBy: { lastSyncedAt: 'asc' },
      });
    } catch (error) {
      logger.error('Failed to find stale Jira stories', { error, olderThan });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.jiraStory.delete({ where: { id } });
    } catch (error) {
      logger.error('Failed to delete Jira story', { error, id });
      throw error;
    }
  }
}
