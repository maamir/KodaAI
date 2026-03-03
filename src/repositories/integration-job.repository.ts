import { PrismaClient, IntegrationJob, Prisma, JobStatus, JobType } from '@prisma/client';
import { logger } from '../infrastructure/logger';

export class IntegrationJobRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.IntegrationJobCreateInput): Promise<IntegrationJob> {
    try {
      return await this.prisma.integrationJob.create({ data });
    } catch (error) {
      logger.error('Failed to create integration job', { error, data });
      throw error;
    }
  }

  async findById(id: string): Promise<IntegrationJob | null> {
    try {
      return await this.prisma.integrationJob.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error('Failed to find integration job by ID', { error, id });
      throw error;
    }
  }

  async findPending(limit: number = 10): Promise<IntegrationJob[]> {
    try {
      const now = new Date();
      return await this.prisma.integrationJob.findMany({
        where: {
          status: JobStatus.PENDING,
          scheduledAt: { lte: now },
        },
        orderBy: [
          { priority: 'desc' },
          { scheduledAt: 'asc' },
        ],
        take: limit,
      });
    } catch (error) {
      logger.error('Failed to find pending integration jobs', { error, limit });
      throw error;
    }
  }

  async findByType(jobType: JobType, options?: {
    status?: JobStatus;
    limit?: number;
  }): Promise<IntegrationJob[]> {
    try {
      return await this.prisma.integrationJob.findMany({
        where: {
          jobType,
          ...(options?.status && { status: options.status }),
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit,
      });
    } catch (error) {
      logger.error('Failed to find integration jobs by type', { error, jobType, options });
      throw error;
    }
  }

  async findByStatus(status: JobStatus, limit?: number): Promise<IntegrationJob[]> {
    try {
      return await this.prisma.integrationJob.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      logger.error('Failed to find integration jobs by status', { error, status, limit });
      throw error;
    }
  }

  async update(id: string, data: Prisma.IntegrationJobUpdateInput): Promise<IntegrationJob> {
    try {
      return await this.prisma.integrationJob.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error('Failed to update integration job', { error, id, data });
      throw error;
    }
  }

  async updateStatus(id: string, status: JobStatus, additionalData?: {
    result?: any;
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
  }): Promise<IntegrationJob> {
    try {
      return await this.prisma.integrationJob.update({
        where: { id },
        data: {
          status,
          ...(additionalData?.result && { result: additionalData.result }),
          ...(additionalData?.error && { error: additionalData.error }),
          ...(additionalData?.startedAt && { startedAt: additionalData.startedAt }),
          ...(additionalData?.completedAt && { completedAt: additionalData.completedAt }),
        },
      });
    } catch (error) {
      logger.error('Failed to update integration job status', { error, id, status, additionalData });
      throw error;
    }
  }

  async incrementRetryCount(id: string): Promise<IntegrationJob> {
    try {
      return await this.prisma.integrationJob.update({
        where: { id },
        data: {
          retryCount: { increment: 1 },
        },
      });
    } catch (error) {
      logger.error('Failed to increment retry count', { error, id });
      throw error;
    }
  }

  async markAsRunning(id: string): Promise<IntegrationJob> {
    try {
      return await this.updateStatus(id, JobStatus.RUNNING, {
        startedAt: new Date(),
      });
    } catch (error) {
      logger.error('Failed to mark job as running', { error, id });
      throw error;
    }
  }

  async markAsCompleted(id: string, result: any): Promise<IntegrationJob> {
    try {
      return await this.updateStatus(id, JobStatus.COMPLETED, {
        result,
        completedAt: new Date(),
      });
    } catch (error) {
      logger.error('Failed to mark job as completed', { error, id, result });
      throw error;
    }
  }

  async markAsFailed(id: string, error: string): Promise<IntegrationJob> {
    try {
      return await this.updateStatus(id, JobStatus.FAILED, {
        error,
        completedAt: new Date(),
      });
    } catch (error: any) {
      logger.error('Failed to mark job as failed', { error: error.message, id, jobError: error });
      throw error;
    }
  }

  async reschedule(id: string, scheduledAt: Date): Promise<IntegrationJob> {
    try {
      return await this.prisma.integrationJob.update({
        where: { id },
        data: {
          status: JobStatus.PENDING,
          scheduledAt,
          retryCount: { increment: 1 },
        },
      });
    } catch (error) {
      logger.error('Failed to reschedule job', { error, id, scheduledAt });
      throw error;
    }
  }

  async deleteOldCompleted(olderThan: Date): Promise<number> {
    try {
      const result = await this.prisma.integrationJob.deleteMany({
        where: {
          status: JobStatus.COMPLETED,
          completedAt: { lt: olderThan },
        },
      });
      return result.count;
    } catch (error) {
      logger.error('Failed to delete old completed jobs', { error, olderThan });
      throw error;
    }
  }

  async getQueueDepth(): Promise<number> {
    try {
      return await this.prisma.integrationJob.count({
        where: {
          status: { in: [JobStatus.PENDING, JobStatus.RUNNING] },
        },
      });
    } catch (error) {
      logger.error('Failed to get queue depth', { error });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.integrationJob.delete({ where: { id } });
    } catch (error) {
      logger.error('Failed to delete integration job', { error, id });
      throw error;
    }
  }
}
