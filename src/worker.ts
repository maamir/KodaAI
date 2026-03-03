import { PrismaClient, JobType, JobStatus } from '@prisma/client';
import { config } from './config';
import { logger } from './infrastructure/logger';
import { JobQueueManagerService } from './services/job-queue-manager.service';
import { JiraSyncService } from './integrations/jira/jira-sync.service';
import { GitHubCommitsSyncService } from './integrations/github/github-commits-sync.service';
import { GitHubPRsSyncService } from './integrations/github/github-prs-sync.service';
import { HookEventService } from './services/hook-event.service';
import { ConsistencyCheckerService } from './services/consistency-checker.service';
// Unit 3: Reporting and Visualization imports
import { reportGenerationService } from './services/report-generation.service';
import { metricCalculationService } from './services/metric-calculation.service';
import { reportStorageService } from './services/report-storage.service';

const prisma = new PrismaClient();
const jobQueueManager = new JobQueueManagerService(prisma);
const jiraSyncService = new JiraSyncService(prisma);
const githubCommitsService = new GitHubCommitsSyncService(prisma);
const githubPRsService = new GitHubPRsSyncService(prisma);
const hookEventService = new HookEventService(prisma);
const consistencyChecker = new ConsistencyCheckerService(prisma);

let isShuttingDown = false;
let currentJobId: string | null = null;

/**
 * Process a single job
 */
async function processJob(job: any): Promise<void> {
  currentJobId = job.id;
  
  try {
    logger.info('Processing job', {
      jobId: job.id,
      jobType: job.jobType,
      attempt: job.retryCount + 1,
    });

    // Mark job as running
    await jobQueueManager.updateJobStatus(job.id, JobStatus.RUNNING);

    let result: any;

    // Route to appropriate handler
    switch (job.jobType) {
      case JobType.JIRA_SYNC:
        result = await handleJiraSync(job.payload);
        break;

      case JobType.GITHUB_SYNC_COMMITS:
        result = await handleGitHubCommitsSync(job.payload);
        break;

      case JobType.GITHUB_SYNC_PRS:
        result = await handleGitHubPRsSync(job.payload);
        break;

      case JobType.HOOK_EVENT_PROCESS:
        result = await handleHookEventProcess(job.payload);
        break;

      case JobType.DATA_CONSISTENCY_CHECK:
        result = await handleConsistencyCheck(job.payload);
        break;

      // Unit 3: Reporting and Visualization job handlers
      case 'REPORT_GENERATION' as JobType:
        result = await handleReportGeneration(job.payload);
        break;

      case 'METRIC_CALCULATION' as JobType:
        result = await handleMetricCalculation(job.payload);
        break;

      default:
        throw new Error(`Unknown job type: ${job.jobType}`);
    }

    // Mark job as completed
    await jobQueueManager.updateJobStatus(job.id, JobStatus.COMPLETED, result);

    logger.info('Job completed successfully', {
      jobId: job.id,
      jobType: job.jobType,
    });
  } catch (error: any) {
    logger.error('Job failed', {
      jobId: job.id,
      jobType: job.jobType,
      error: error.message,
    });

    // Try to retry the job
    const retried = await jobQueueManager.retryJob(job.id);
    
    if (!retried) {
      // Mark as permanently failed
      await jobQueueManager.updateJobStatus(
        job.id,
        JobStatus.FAILED,
        undefined,
        error.message
      );
    }
  } finally {
    currentJobId = null;
  }
}

/**
 * Handle Jira sync job
 */
async function handleJiraSync(payload: any): Promise<any> {
  const { featureId, jiraKey, forceRefresh } = payload;
  return await jiraSyncService.syncStory(featureId, jiraKey, forceRefresh);
}

/**
 * Handle GitHub commits sync job
 */
async function handleGitHubCommitsSync(payload: any): Promise<any> {
  const { repositoryId, since, until, branch, forceRefresh } = payload;
  return await githubCommitsService.syncCommits(repositoryId, {
    since: since ? new Date(since) : undefined,
    until: until ? new Date(until) : undefined,
    branch,
    forceRefresh,
  });
}

/**
 * Handle GitHub PRs sync job
 */
async function handleGitHubPRsSync(payload: any): Promise<any> {
  const { repositoryId, state, forceRefresh } = payload;
  return await githubPRsService.syncPullRequests(repositoryId, {
    state,
    forceRefresh,
  });
}

/**
 * Handle hook event processing job
 */
async function handleHookEventProcess(payload: any): Promise<any> {
  const { hookEventId } = payload;
  // Process hook event asynchronously
  return { processed: true, hookEventId };
}

/**
 * Handle data consistency check job
 */
async function handleConsistencyCheck(payload: any): Promise<any> {
  const { featureId, checkType } = payload;
  return await consistencyChecker.runConsistencyCheck(featureId, checkType);
}

/**
 * Handle report generation job (Unit 3)
 */
async function handleReportGeneration(payload: any): Promise<any> {
  const {
    reportType,
    format,
    dateRangeStart,
    dateRangeEnd,
    featureIds,
    filters,
    includeCharts,
    includeRawData,
    generatedBy,
  } = payload;

  logger.info('Starting report generation', { reportType, format });

  const reportId = await reportGenerationService.generateReport({
    reportType,
    format,
    dateRangeStart: dateRangeStart ? new Date(dateRangeStart) : undefined,
    dateRangeEnd: dateRangeEnd ? new Date(dateRangeEnd) : undefined,
    featureIds,
    filters,
    includeCharts,
    includeRawData,
    generatedBy,
  });

  logger.info('Report generation completed', { reportId });

  return {
    reportId,
    status: 'COMPLETED',
    completedAt: new Date(),
  };
}

/**
 * Handle metric calculation job (Unit 3)
 */
async function handleMetricCalculation(payload: any): Promise<any> {
  const { featureId, metricTypes, parameters } = payload;

  logger.info('Starting metric calculation', { featureId, metricTypes });

  let results;
  if (metricTypes && Array.isArray(metricTypes)) {
    results = await metricCalculationService.calculateMultipleMetrics(
      featureId,
      metricTypes,
      parameters
    );
  } else {
    results = await metricCalculationService.recalculateAllMetrics(featureId);
  }

  logger.info('Metric calculation completed', {
    featureId,
    metricsCalculated: results.length,
  });

  return {
    featureId,
    metricsCalculated: results.length,
    results: results.map(r => ({
      metricType: r.metricType,
      metricValue: r.metricValue,
    })),
    completedAt: new Date(),
  };
}

/**
 * Main worker loop
 */
async function workerLoop(): Promise<void> {
  logger.info('Worker loop started');

  while (!isShuttingDown) {
    try {
      // Fetch pending jobs
      const jobs = await jobQueueManager.fetchPendingJobs(1);

      if (jobs.length > 0) {
        await processJob(jobs[0]);
      } else {
        // No jobs, wait before checking again
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds
      }
    } catch (error) {
      logger.error('Worker loop error', { error });
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds on error
    }
  }

  logger.info('Worker loop stopped');
}

/**
 * Graceful shutdown
 */
async function shutdown(): Promise<void> {
  logger.info('Shutdown signal received');
  isShuttingDown = true;

  // Wait for current job to complete (with timeout)
  const timeout = 30000; // 30 seconds
  const startTime = Date.now();

  while (currentJobId && Date.now() - startTime < timeout) {
    logger.info('Waiting for current job to complete', { jobId: currentJobId });
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (currentJobId) {
    logger.warn('Shutdown timeout reached, current job may be incomplete', {
      jobId: currentJobId,
    });
  }

  // Disconnect from database
  await prisma.$disconnect();

  logger.info('Worker shutdown complete');
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start worker
logger.info('Background worker starting', {
  nodeEnv: config.nodeEnv,
  workerMode: config.workerMode,
});

// Start consistency checker cron job
consistencyChecker.startDailyCheck();

// Start report cleanup cron job (Unit 3)
setInterval(async () => {
  try {
    const deletedCount = await reportStorageService.cleanupExpiredReports();
    if (deletedCount > 0) {
      logger.info('Cleaned up expired reports', { count: deletedCount });
    }
  } catch (error) {
    logger.error('Error cleaning up expired reports', { error });
  }
}, 24 * 60 * 60 * 1000); // Run daily

// Start worker loop
workerLoop().catch(error => {
  logger.error('Worker loop crashed', { error });
  process.exit(1);
});
