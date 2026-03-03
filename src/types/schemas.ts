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
