import { JobQueueManagerService } from '../../../src/services/job-queue-manager.service';
import { integrationJobRepository } from '../../../src/repositories/integration-job.repository';
import { JobType, JobStatus } from '@prisma/client';

jest.mock('../../../src/repositories/integration-job.repository');

describe('JobQueueManagerService', () => {
  let jobQueueManager: JobQueueManagerService;

  beforeEach(() => {
    jest.clearAllMocks();
    jobQueueManager = new JobQueueManagerService();
  });

  describe('createJob', () => {
    it('should create a job with default priority', async () => {
      const jobParams = {
        type: JobType.JIRA_SYNC,
        payload: { featureId: 'feature-123', jiraKey: 'PROJ-123' },
      };

      (integrationJobRepository.create as jest.Mock).mockResolvedValue({
        id: 'job-123',
        jobType: JobType.JIRA_SYNC,
        status: JobStatus.PENDING,
        priority: 5,
        payload: jobParams.payload,
        retryCount: 0,
        maxRetries: 3,
        scheduledAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await jobQueueManager.createJob(jobParams);

      expect(result.id).toBe('job-123');
      expect(result.priority).toBe(5);
      expect(integrationJobRepository.create).toHaveBeenCalledWith({
        jobType: JobType.JIRA_SYNC,
        payload: jobParams.payload,
        priority: 5,
        scheduledAt: expect.any(Date),
      });
    });

    it('should create a job with custom priority', async () => {
      const jobParams = {
        type: JobType.GITHUB_SYNC_COMMITS,
        payload: { owner: 'test', repo: 'repo' },
        priority: 10,
      };

      (integrationJobRepository.create as jest.Mock).mockResolvedValue({
        id: 'job-456',
        priority: 10,
      });

      const result = await jobQueueManager.createJob(jobParams);

      expect(integrationJobRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 10 })
      );
    });

    it('should create a job with scheduled time', async () => {
      const scheduledAt = new Date(Date.now() + 3600000); // 1 hour from now
      const jobParams = {
        type: JobType.DATA_CONSISTENCY_CHECK,
        payload: {},
        scheduledAt,
      };

      (integrationJobRepository.create as jest.Mock).mockResolvedValue({
        id: 'job-789',
        scheduledAt,
      });

      await jobQueueManager.createJob(jobParams);

      expect(integrationJobRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ scheduledAt })
      );
    });
  });

  describe('fetchPendingJobs', () => {
    it('should fetch pending jobs in priority order', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          jobType: JobType.JIRA_SYNC,
          status: JobStatus.PENDING,
          priority: 10,
          scheduledAt: new Date(),
        },
        {
          id: 'job-2',
          jobType: JobType.GITHUB_SYNC_COMMITS,
          status: JobStatus.PENDING,
          priority: 5,
          scheduledAt: new Date(),
        },
      ];

      (integrationJobRepository.findPending as jest.Mock).mockResolvedValue(mockJobs);

      const result = await jobQueueManager.fetchPendingJobs(10);

      expect(result).toEqual(mockJobs);
      expect(integrationJobRepository.findPending).toHaveBeenCalledWith(10);
    });

    it('should respect batch size', async () => {
      (integrationJobRepository.findPending as jest.Mock).mockResolvedValue([]);

      await jobQueueManager.fetchPendingJobs(5);

      expect(integrationJobRepository.findPending).toHaveBeenCalledWith(5);
    });

    it('should return empty array if no pending jobs', async () => {
      (integrationJobRepository.findPending as jest.Mock).mockResolvedValue([]);

      const result = await jobQueueManager.fetchPendingJobs(10);

      expect(result).toEqual([]);
    });
  });

  describe('updateJobStatus', () => {
    it('should update job to RUNNING status', async () => {
      const jobId = 'job-123';

      (integrationJobRepository.updateStatus as jest.Mock).mockResolvedValue({
        id: jobId,
        status: JobStatus.RUNNING,
        startedAt: new Date(),
      });

      await jobQueueManager.updateJobStatus(jobId, JobStatus.RUNNING);

      expect(integrationJobRepository.updateStatus).toHaveBeenCalledWith(
        jobId,
        JobStatus.RUNNING,
        undefined
      );
    });

    it('should update job to COMPLETED status with result', async () => {
      const jobId = 'job-123';
      const result = { success: true, data: { synced: 5 } };

      (integrationJobRepository.updateStatus as jest.Mock).mockResolvedValue({
        id: jobId,
        status: JobStatus.COMPLETED,
        result,
        completedAt: new Date(),
      });

      await jobQueueManager.updateJobStatus(jobId, JobStatus.COMPLETED, result);

      expect(integrationJobRepository.updateStatus).toHaveBeenCalledWith(
        jobId,
        JobStatus.COMPLETED,
        result
      );
    });

    it('should update job to FAILED status with error', async () => {
      const jobId = 'job-123';
      const error = 'API connection failed';

      (integrationJobRepository.updateStatus as jest.Mock).mockResolvedValue({
        id: jobId,
        status: JobStatus.FAILED,
        error,
        completedAt: new Date(),
      });

      await jobQueueManager.updateJobStatus(jobId, JobStatus.FAILED, { error });

      expect(integrationJobRepository.updateStatus).toHaveBeenCalledWith(
        jobId,
        JobStatus.FAILED,
        { error }
      );
    });
  });

  describe('retryJob', () => {
    it('should retry job with exponential backoff', async () => {
      const jobId = 'job-123';
      const mockJob = {
        id: jobId,
        retryCount: 1,
        maxRetries: 3,
      };

      (integrationJobRepository.findById as jest.Mock).mockResolvedValue(mockJob);
      (integrationJobRepository.incrementRetry as jest.Mock).mockResolvedValue({
        ...mockJob,
        retryCount: 2,
        status: JobStatus.PENDING,
      });

      await jobQueueManager.retryJob(jobId);

      expect(integrationJobRepository.incrementRetry).toHaveBeenCalledWith(
        jobId,
        expect.any(Date)
      );

      // Check exponential backoff calculation
      const call = (integrationJobRepository.incrementRetry as jest.Mock).mock.calls[0];
      const scheduledAt = call[1];
      const delay = scheduledAt.getTime() - Date.now();
      
      // Retry 1: 5 seconds, Retry 2: 25 seconds (5^2)
      expect(delay).toBeGreaterThanOrEqual(24000);
      expect(delay).toBeLessThanOrEqual(26000);
    });

    it('should fail job permanently if max retries exceeded', async () => {
      const jobId = 'job-123';
      const mockJob = {
        id: jobId,
        retryCount: 3,
        maxRetries: 3,
      };

      (integrationJobRepository.findById as jest.Mock).mockResolvedValue(mockJob);
      (integrationJobRepository.updateStatus as jest.Mock).mockResolvedValue({
        ...mockJob,
        status: JobStatus.FAILED,
      });

      await jobQueueManager.retryJob(jobId);

      expect(integrationJobRepository.updateStatus).toHaveBeenCalledWith(
        jobId,
        JobStatus.FAILED,
        { error: 'Max retries exceeded' }
      );
    });

    it('should throw error if job not found', async () => {
      const jobId = 'non-existent';

      (integrationJobRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(jobQueueManager.retryJob(jobId)).rejects.toThrow('Job not found');
    });
  });

  describe('getJobStatus', () => {
    it('should return job status', async () => {
      const jobId = 'job-123';
      const mockJob = {
        id: jobId,
        jobType: JobType.JIRA_SYNC,
        status: JobStatus.COMPLETED,
        result: { success: true },
      };

      (integrationJobRepository.findById as jest.Mock).mockResolvedValue(mockJob);

      const result = await jobQueueManager.getJobStatus(jobId);

      expect(result).toEqual(mockJob);
      expect(integrationJobRepository.findById).toHaveBeenCalledWith(jobId);
    });

    it('should return null if job not found', async () => {
      const jobId = 'non-existent';

      (integrationJobRepository.findById as jest.Mock).mockResolvedValue(null);

      const result = await jobQueueManager.getJobStatus(jobId);

      expect(result).toBeNull();
    });
  });

  describe('exponential backoff calculation', () => {
    it('should calculate correct delay for retry 1', () => {
      const delay = (jobQueueManager as any).calculateBackoffDelay(1);
      expect(delay).toBe(5000); // 5 seconds
    });

    it('should calculate correct delay for retry 2', () => {
      const delay = (jobQueueManager as any).calculateBackoffDelay(2);
      expect(delay).toBe(25000); // 25 seconds (5^2)
    });

    it('should calculate correct delay for retry 3', () => {
      const delay = (jobQueueManager as any).calculateBackoffDelay(3);
      expect(delay).toBe(125000); // 125 seconds (5^3)
    });

    it('should cap delay at maximum', () => {
      const delay = (jobQueueManager as any).calculateBackoffDelay(10);
      expect(delay).toBeLessThanOrEqual(300000); // Max 5 minutes
    });
  });

  describe('job priority handling', () => {
    it('should validate priority range', async () => {
      const jobParams = {
        type: JobType.JIRA_SYNC,
        payload: {},
        priority: 15, // Invalid: > 10
      };

      (integrationJobRepository.create as jest.Mock).mockResolvedValue({});

      await expect(jobQueueManager.createJob(jobParams)).rejects.toThrow(
        'Priority must be between 1 and 10'
      );
    });

    it('should accept priority 1 (lowest)', async () => {
      const jobParams = {
        type: JobType.DATA_CONSISTENCY_CHECK,
        payload: {},
        priority: 1,
      };

      (integrationJobRepository.create as jest.Mock).mockResolvedValue({});

      await expect(jobQueueManager.createJob(jobParams)).resolves.not.toThrow();
    });

    it('should accept priority 10 (highest)', async () => {
      const jobParams = {
        type: JobType.JIRA_SYNC,
        payload: {},
        priority: 10,
      };

      (integrationJobRepository.create as jest.Mock).mockResolvedValue({});

      await expect(jobQueueManager.createJob(jobParams)).resolves.not.toThrow();
    });
  });
});
