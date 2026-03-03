import { register, Counter, Histogram, Gauge } from 'prom-client';

// API Request Counters
export const jiraApiRequestsTotal = new Counter({
  name: 'jira_api_requests_total',
  help: 'Total number of Jira API requests',
  labelNames: ['method', 'status'],
});

export const githubApiRequestsTotal = new Counter({
  name: 'github_api_requests_total',
  help: 'Total number of GitHub API requests',
  labelNames: ['method', 'status'],
});

// Response Time Histograms
export const jiraApiDuration = new Histogram({
  name: 'jira_api_duration_seconds',
  help: 'Jira API request duration in seconds',
  labelNames: ['method'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

export const githubApiDuration = new Histogram({
  name: 'github_api_duration_seconds',
  help: 'GitHub API request duration in seconds',
  labelNames: ['method'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

// Rate Limit Gauges
export const jiraRateLimitRemaining = new Gauge({
  name: 'jira_rate_limit_remaining',
  help: 'Remaining Jira API rate limit',
});

export const githubRateLimitRemaining = new Gauge({
  name: 'github_rate_limit_remaining',
  help: 'Remaining GitHub API rate limit',
});

// Job Queue Metrics
export const jobQueueDepth = new Gauge({
  name: 'job_queue_depth',
  help: 'Number of jobs in queue (pending + running)',
});

export const jobsProcessedTotal = new Counter({
  name: 'jobs_processed_total',
  help: 'Total number of jobs processed',
  labelNames: ['job_type', 'status'],
});

export const jobProcessingDuration = new Histogram({
  name: 'job_processing_duration_seconds',
  help: 'Job processing duration in seconds',
  labelNames: ['job_type'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
});

// Cache Metrics
export const cacheHitsTotal = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['integration'],
});

export const cacheMissesTotal = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['integration'],
});

export const cacheSize = new Gauge({
  name: 'cache_size',
  help: 'Number of entries in cache',
});

// Sync Metrics
export const syncOperationsTotal = new Counter({
  name: 'sync_operations_total',
  help: 'Total number of sync operations',
  labelNames: ['integration', 'operation', 'status'],
});

export const syncDuration = new Histogram({
  name: 'sync_duration_seconds',
  help: 'Sync operation duration in seconds',
  labelNames: ['integration', 'operation'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
});

// Export all metrics
export { register };
