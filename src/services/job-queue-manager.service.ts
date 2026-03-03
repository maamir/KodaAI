import { PrismaClient, JobType, JobStatus } from '@prisma/client';
import { IntegrationJobRepository } from '../repositories/integration-job.repository';
import { logger } from '../infrastructure/logger';

export interface CreateJobOptions {
  jobType: JobType;
  priority?: number;
  payload: Record<string, any>;
  scheduledAt?: Date;
  maxRetries?: number;
}

export class JobQueueManagerService {
  private jobRepository: IntegrationJobRepository;
  private defaultMaxRetries: number = 3;
  private defaultPriority: number = 5;

  constructor(private prisma: PrismaClient) {
    this.jobRepository = new IntegrationJobRepository(prisma);
  }

  /**
   * Create a new job
   */
  async createJob(options: CreateJobOptions): Promise<string> {
    try {
      const job = await this.jobRepository.create({
        jobType: options.jobType,
        status: JobStatus.PENDING,
        priority: options.priority || this.defaultPriority,
        payload: options.payload,
        retryCount: 0,
        maxRetries: options.maxRetries || this.defaultMaxRetries,
        scheduledAt: options.scheduledAt || new Date(),
      });

      logger.info('Job created', {
        jobId: job.id,
        jobType: job.jobType,
        priority: job.priority,
      });

      return job.id;
    } catch (error) {
      logger.error('Failed to create job', { error, options });
      throw error;
    }
  }

  /**
   * Fetch pending jobs (with locking)
   */
  async fetchPendingJobs(limit: number = 10): Promise<any[]> {
    try {
      const jobs = await this.jobRepository.findPending(limit);
      
      logger.debug('Fetched pending jobs', { count: jobs.length });
      
      return jobs;
    } catch (error) {
      logger.error('Failed to fetch pending jobs', { error });
      return [];
    }
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    result?: any,
    error?: string
  ): Promise<void> {
    try {
      await this.jobRepository.updateStatus(jobId, status, {
        result,
        error,
        ...(status === JobStatus.RUNNING && { startedAt: new Date() }),
        ...(status === JobStatus.COMPLETED && { completedAt: new Date() }),
        ...(status === JobStatus.FAILED && { completedAt: new Date() }),
      });

      logger.info('Job status updated', { jobId, status });
    } catch (error) {
      logger.error('Failed to update job status', { error, jobId, status });
      throw error;
    }
  }

  /**
   * Retry failed job with exponential backoff
   */
  async retryJob(jobId: string): Promise<boolean> {
    try {
      const job = await this.jobRepository.findById(jobId);
      
      if (!job) {
        logger.error('Job not found for retry', { jobId });
        return false;
      }

      if (job.retryCount >= job.maxRetries) {
        logger.warn('Job exceeded max retries', {
          jobId,
          retryCount: job.retryCount,
          maxRetries: job.maxRetries,
        });
        return false;
      }

      // Calculate exponential backoff delay
      const delaySeconds = Math.pow(2, job.retryCount) * 60; // 1min, 2min, 4min, etc.
      const scheduledAt = new Date(Date.now() + delaySeconds * 1000);

      await this.jobRepository.reschedule(jobId, scheduledAt);

      logger.info('Job rescheduled for retry', {
        jobId,
        retryCount: job.retryCount + 1,
        scheduledAt,
      });

      return true;
    } catch (error) {
      logger.error('Failed to retry job', { error, jobId });
      return false;
    }
  }

  /**
   * Get job queue metrics
   */
  async getQueueMetrics(): Promise<{
    queueDepth: number;
    pendingJobs: number;
    runningJobs: number;
    failedJobs: number;
  }> {
    try {
      const [queueDepth, pending, running, failed] = await Promise.all([
        this.jobRepository.getQueueDepth(),
        this.jobRepository.findByStatus(JobStatus.PENDING).then(jobs => jobs.length),
        this.jobRepository.findByStatus(JobStatus.RUNNING).then(jobs => jobs.length),
        this.jobRepository.findByStatus(JobStatus.FAILED).then(jobs => jobs.length),
      ]);

      return {
        queueDepth,
        pendingJobs: pending,
        runningJobs: running,
        failedJobs: failed,
      };
    } catch (error) {
      logger.error('Failed to get queue metrics', { error });
      return {
        queueDepth: 0,
        pendingJobs: 0,
        runningJobs: 0,
        failedJobs: 0,
      };
    }
  }

  /**
   * Cleanup old completed jobs
   */
  async cleanupOldJobs(olderThanDays: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      const count = await this.jobRepository.deleteOldCompleted(cutoffDate);
      
      logger.info('Old jobs cleaned up', { count, olderThanDays });
      
      return count;
    } catch (error) {
      logger.error('Failed to cleanup old jobs', { error });
      return 0;
    }
  }
}
