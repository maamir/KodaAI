import { PrismaClient, JobStatus, JobType } from '@prisma/client';
import { IntegrationJobRepository } from '../../../src/repositories/integration-job.repository';

const prisma = new PrismaClient();
const repository = new IntegrationJobRepository(prisma);

describe('IntegrationJobRepository', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.integrationJob.deleteMany();
  });

  describe('create', () => {
    it('should create a new integration job', async () => {
      const job = await repository.create({
        jobType: JobType.JIRA_SYNC,
        status: JobStatus.PENDING,
        priority: 5,
        payload: { featureId: 'test-123' },
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: new Date(),
      });

      expect(job).toBeDefined();
      expect(job.jobType).toBe(JobType.JIRA_SYNC);
      expect(job.status).toBe(JobStatus.PENDING);
    });
  });

  describe('findPending', () => {
    it('should find pending jobs ordered by priority and schedule', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 60000);

      await repository.create({
        jobType: JobType.JIRA_SYNC,
        status: JobStatus.PENDING,
        priority: 5,
        payload: {},
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: now,
      });

      await repository.create({
        jobType: JobType.GITHUB_SYNC_COMMITS,
        status: JobStatus.PENDING,
        priority: 8,
        payload: {},
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: past,
      });

      await repository.create({
        jobType: JobType.HOOK_EVENT_PROCESS,
        status: JobStatus.RUNNING,
        priority: 10,
        payload: {},
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: past,
      });

      const pending = await repository.findPending(10);
      expect(pending).toHaveLength(2);
      expect(pending[0].priority).toBe(8); // Higher priority first
    });

    it('should not return jobs scheduled in the future', async () => {
      const future = new Date(Date.now() + 60000);

      await repository.create({
        jobType: JobType.JIRA_SYNC,
        status: JobStatus.PENDING,
        priority: 5,
        payload: {},
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: future,
      });

      const pending = await repository.findPending(10);
      expect(pending).toHaveLength(0);
    });
  });

  describe('findByType', () => {
    it('should find jobs by type', async () => {
      await repository.create({
        jobType: JobType.JIRA_SYNC,
        status: JobStatus.PENDING,
        priority: 5,
        payload: {},
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: new Date(),
      });

      await repository.create({
        jobType: JobType.GITHUB_SYNC_COMMITS,
        status: JobStatus.PENDING,
        priority: 5,
        payload: {},
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: new Date(),
      });

      const jiraJobs = await repository.findByType(JobType.JIRA_SYNC);
      expect(jiraJobs).toHaveLength(1);
      expect(jiraJobs[0].jobType).toBe(JobType.JIRA_SYNC);
    });

    it('should filter by status', async () => {
      await repository.create({
        jobType: JobType.JIRA_SYNC,
        status: JobStatus.PENDING,
        priority: 5,
        payload: {},
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: new Date(),
      });

      await repository.create({
        jobType: JobType.JIRA_SYNC,
        status: JobStatus.COMPLETED,
        priority: 5,
        payload: {},
        result: { success: true },
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: new Date(),
        completedAt: new Date(),
      });

      const completedJobs = await repository.findByType(JobType.JIRA_SYNC, {
        status: JobStatus.COMPLETED,
      });

      expect(completedJobs).toHaveLength(1);
      expect(completedJobs[0].status).toBe(JobStatus.COMPLETED);
    });
  });

  describe('updateStatus', () => {
    it('should update job status', async () => {
      const job = await repository.create({
        jobType: JobType.JIRA_SYNC,
        status: JobStatus.PENDING,
        priority: 5,
        payload: {},
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: new Date(),
      });

      const updated = await repository.updateStatus(job.id, JobStatus.RUNNING, {
        startedAt: new Date(),
      });

      expect(updated.status).toBe(JobStatus.RUNNING);
      expect(updated.startedAt).toBeDefined();
    });
  });

  describe('markAsRunning', () => {
    it('should mark job as running', async () => {
      const job = await repository.create({
        jobType: JobType.JIRA_SYNC,
        status: JobStatus.PENDING,
        priority: 5,
        payload: {},
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: new Date(),
      });

      const running = await repository.markAsRunning(job.id);
      expect(running.status).toBe(JobStatus.RUNNING);
      expect(running.startedAt).toBeDefined();
    });
  });

  describe('markAsCompleted', () => {
    it('should mark job as completed with result', async () => {
      const job = await repository.create({
        jobType: JobType.JIRA_SYNC,
        status: JobStatus.RUNNING,
        priority: 5,
        payload: {},
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: new Date(),
        startedAt: new Date(),
      });

      const result = { recordsProcessed: 10 };
      const completed = await repository.markAsCompleted(job.id, result);

      expect(completed.status).toBe(JobStatus.COMPLETED);
      expect(completed.result).toEqual(result);
      expect(completed.completedAt).toBeDefined();
    });
  });

  describe('markAsFailed', () => {
    it('should mark job as failed with error', async () => {
      const job = await repository.create({
        jobType: JobType.JIRA_SYNC,
        status: JobStatus.RUNNING,
        priority: 5,
        payload: {},
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: new Date(),
        startedAt: new Date(),
      });

      const failed = await repository.markAsFailed(job.id, 'Connection timeout');

      expect(failed.status).toBe(JobStatus.FAILED);
      expect(failed.error).toBe('Connection timeout');
      expect(failed.completedAt).toBeDefined();
    });
  });

  describe('incrementRetryCount', () => {
    it('should increment retry count', async () => {
      const job = await repository.create({
        jobType: JobType.JIRA_SYNC,
        status: JobStatus.PENDING,
        priority: 5,
        payload: {},
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: new Date(),
      });

      const incremented = await repository.incrementRetryCount(job.id);
      expect(incremented.retryCount).toBe(1);

      const incrementedAgain = await repository.incrementRetryCount(job.id);
      expect(incrementedAgain.retryCount).toBe(2);
    });
  });

  describe('reschedule', () => {
    it('should reschedule failed job', async () => {
      const job = await repository.create({
        jobType: JobType.JIRA_SYNC,
        status: JobStatus.FAILED,
        priority: 5,
        payload: {},
        retryCount: 1,
        maxRetries: 3,
        scheduledAt: new Date(),
        error: 'Previous error',
      });

      const newSchedule = new Date(Date.now() + 60000);
      const rescheduled = await repository.reschedule(job.id, newSchedule);

      expect(rescheduled.status).toBe(JobStatus.PENDING);
      expect(rescheduled.scheduledAt).toEqual(newSchedule);
      expect(rescheduled.retryCount).toBe(2);
    });
  });

  describe('getQueueDepth', () => {
    it('should count pending and running jobs', async () => {
      await repository.create({
        jobType: JobType.JIRA_SYNC,
        status: JobStatus.PENDING,
        priority: 5,
        payload: {},
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: new Date(),
      });

      await repository.create({
        jobType: JobType.GITHUB_SYNC_COMMITS,
        status: JobStatus.RUNNING,
        priority: 5,
        payload: {},
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: new Date(),
        startedAt: new Date(),
      });

      await repository.create({
        jobType: JobType.HOOK_EVENT_PROCESS,
        status: JobStatus.COMPLETED,
        priority: 5,
        payload: {},
        result: {},
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: new Date(),
        completedAt: new Date(),
      });

      const depth = await repository.getQueueDepth();
      expect(depth).toBe(2);
    });
  });

  describe('deleteOldCompleted', () => {
    it('should delete old completed jobs', async () => {
      const oldDate = new Date('2024-01-01');
      const recentDate = new Date();

      await repository.create({
        jobType: JobType.JIRA_SYNC,
        status: JobStatus.COMPLETED,
        priority: 5,
        payload: {},
        result: {},
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: oldDate,
        completedAt: oldDate,
      });

      await repository.create({
        jobType: JobType.GITHUB_SYNC_COMMITS,
        status: JobStatus.COMPLETED,
        priority: 5,
        payload: {},
        result: {},
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: recentDate,
        completedAt: recentDate,
      });

      const cutoff = new Date('2024-06-01');
      const deleted = await repository.deleteOldCompleted(cutoff);

      expect(deleted).toBe(1);

      const remaining = await repository.findByStatus(JobStatus.COMPLETED);
      expect(remaining).toHaveLength(1);
    });
  });

  describe('delete', () => {
    it('should delete job', async () => {
      const job = await repository.create({
        jobType: JobType.JIRA_SYNC,
        status: JobStatus.PENDING,
        priority: 5,
        payload: {},
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: new Date(),
      });

      await repository.delete(job.id);

      const found = await repository.findById(job.id);
      expect(found).toBeNull();
    });
  });
});
