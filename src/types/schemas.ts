import { z } from 'zod';

// Feature ID validation
export const featureIdSchema = z.string().regex(/^[A-Z]+-\d+$/, 'Invalid feature ID format (expected: PROJ-123)');

// Request schemas
export const startTrackingSchema = z.object({
  featureId: featureIdSchema,
  name: z.string().optional(),
  estimatedHours: z.number().positive().optional(),
});

export const transitionPhaseSchema = z.object({
  phase: z.enum(['INCEPTION', 'CONSTRUCTION', 'TESTING']),
});

export const createHookEventSchema = z.object({
  featureId: z.string().uuid(),
  eventType: z.enum(['FILE_EDIT', 'PROMPT_SUBMITTED', 'AGENT_EXECUTION']),
  eventData: z.record(z.any()),
  timestamp: z.coerce.date(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

// Query schemas
export const featureQuerySchema = z.object({
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'ABANDONED']).optional(),
  phase: z.enum(['INCEPTION', 'CONSTRUCTION', 'TESTING']).optional(),
}).merge(paginationSchema);

// Unit 2: Integration Module Schemas

// Jira Integration Schemas
export const syncJiraSchema = z.object({
  featureId: z.string().uuid(),
  jiraKey: z.string().regex(/^[A-Z]+-\d+$/, 'Invalid Jira key format (expected: PROJ-123)'),
  forceRefresh: z.boolean().optional().default(false),
});

// GitHub Integration Schemas
export const syncGitHubCommitsSchema = z.object({
  repositoryId: z.string().uuid(),
  since: z.coerce.date().optional(),
  until: z.coerce.date().optional(),
  branch: z.string().optional(),
});

export const syncGitHubPRsSchema = z.object({
  repositoryId: z.string().uuid(),
  state: z.enum(['OPEN', 'CLOSED', 'MERGED', 'ALL']).optional().default('ALL'),
  since: z.coerce.date().optional(),
});

export const createGitHubRepositorySchema = z.object({
  owner: z.string().min(1),
  name: z.string().min(1),
  defaultBranch: z.string().default('main'),
  isActive: z.boolean().default(true),
});

// Job Queue Schemas
export const createJobSchema = z.object({
  jobType: z.enum(['JIRA_SYNC', 'GITHUB_SYNC_COMMITS', 'GITHUB_SYNC_PRS', 'HOOK_EVENT_PROCESS', 'DATA_CONSISTENCY_CHECK']),
  priority: z.number().int().min(1).max(10).default(5),
  payload: z.record(z.any()),
  scheduledAt: z.coerce.date().optional(),
});

export const jobQuerySchema = z.object({
  jobType: z.enum(['JIRA_SYNC', 'GITHUB_SYNC_COMMITS', 'GITHUB_SYNC_PRS', 'HOOK_EVENT_PROCESS', 'DATA_CONSISTENCY_CHECK']).optional(),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
}).merge(paginationSchema);

// Consistency Check Schemas
export const consistencyCheckSchema = z.object({
  featureId: z.string().uuid().optional(),
  checkType: z.enum(['JIRA', 'GITHUB', 'ALL']).optional().default('ALL'),
});

// Unit 3: Reporting and Visualization Schemas

// Dashboard Schemas
export const dashboardDataSchema = z.object({
  featureId: z.string().uuid().optional(),
  dateRangeStart: z.coerce.date().optional(),
  dateRangeEnd: z.coerce.date().optional(),
  metricTypes: z.array(z.enum([
    'TIME_SAVED',
    'SPEED_MULTIPLIER',
    'COST_SAVINGS',
    'PRODUCTIVITY_GAIN',
    'QUALITY_SCORE',
    'VELOCITY',
    'CYCLE_TIME',
    'LEAD_TIME',
    'THROUGHPUT',
    'DEFECT_RATE'
  ])).optional(),
});

// Metric Schemas
export const calculateMetricSchema = z.object({
  featureId: z.string().uuid(),
  metricType: z.enum([
    'TIME_SAVED',
    'SPEED_MULTIPLIER',
    'COST_SAVINGS',
    'PRODUCTIVITY_GAIN',
    'QUALITY_SCORE',
    'VELOCITY',
    'CYCLE_TIME',
    'LEAD_TIME',
    'THROUGHPUT',
    'DEFECT_RATE'
  ]),
  parameters: z.record(z.any()).optional(),
});

export const metricQuerySchema = z.object({
  featureId: z.string().uuid().optional(),
  metricType: z.enum([
    'TIME_SAVED',
    'SPEED_MULTIPLIER',
    'COST_SAVINGS',
    'PRODUCTIVITY_GAIN',
    'QUALITY_SCORE',
    'VELOCITY',
    'CYCLE_TIME',
    'LEAD_TIME',
    'THROUGHPUT',
    'DEFECT_RATE'
  ]).optional(),
  dateRangeStart: z.coerce.date().optional(),
  dateRangeEnd: z.coerce.date().optional(),
}).merge(paginationSchema);

// Report Schemas
export const generateReportSchema = z.object({
  reportType: z.enum([
    'FEATURE_SUMMARY',
    'TIME_ANALYSIS',
    'PRODUCTIVITY',
    'COST_BENEFIT',
    'QUALITY_METRICS',
    'VELOCITY_TRENDS',
    'CUSTOM'
  ]),
  format: z.enum(['PDF', 'EXCEL', 'HTML', 'JSON']),
  dateRangeStart: z.coerce.date().optional(),
  dateRangeEnd: z.coerce.date().optional(),
  featureIds: z.array(z.string().uuid()).optional(),
  filters: z.record(z.any()).optional(),
  includeCharts: z.boolean().optional().default(true),
  includeRawData: z.boolean().optional().default(false),
});

export const reportQuerySchema = z.object({
  reportType: z.enum([
    'FEATURE_SUMMARY',
    'TIME_ANALYSIS',
    'PRODUCTIVITY',
    'COST_BENEFIT',
    'QUALITY_METRICS',
    'VELOCITY_TRENDS',
    'CUSTOM'
  ]).optional(),
  status: z.enum(['PENDING', 'GENERATING', 'COMPLETED', 'FAILED']).optional(),
  generatedBy: z.string().optional(),
}).merge(paginationSchema);

// Dashboard Configuration Schemas
export const createDashboardViewSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  viewType: z.enum(['EXECUTIVE', 'MANAGER', 'DEVELOPER', 'CUSTOM']),
  layout: z.record(z.any()),
  widgets: z.array(z.object({
    widgetId: z.string(),
    widgetType: z.string(),
    position: z.object({
      x: z.number().int().min(0),
      y: z.number().int().min(0),
      w: z.number().int().min(1),
      h: z.number().int().min(1),
    }),
    config: z.record(z.any()),
  })),
  filters: z.record(z.any()).optional(),
  isDefault: z.boolean().optional().default(false),
});

export const updateDashboardViewSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  layout: z.record(z.any()).optional(),
  widgets: z.array(z.object({
    widgetId: z.string(),
    widgetType: z.string(),
    position: z.object({
      x: z.number().int().min(0),
      y: z.number().int().min(0),
      w: z.number().int().min(1),
      h: z.number().int().min(1),
    }),
    config: z.record(z.any()),
  })).optional(),
  filters: z.record(z.any()).optional(),
  isDefault: z.boolean().optional(),
});

export const dashboardViewQuerySchema = z.object({
  viewType: z.enum(['EXECUTIVE', 'MANAGER', 'DEVELOPER', 'CUSTOM']).optional(),
  isDefault: z.boolean().optional(),
}).merge(paginationSchema);

// Analytics Schemas
export const trackAnalyticsEventSchema = z.object({
  eventType: z.string().min(1),
  eventData: z.record(z.any()),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
});
