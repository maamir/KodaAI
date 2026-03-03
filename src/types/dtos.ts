import { Phase } from '@prisma/client';

// Request DTOs
export interface StartTrackingRequest {
  featureId: string;
  name?: string;
  estimatedHours?: number;
}

export interface TransitionPhaseRequest {
  phase: Phase;
}

export interface CreateHookEventRequest {
  featureId: string;
  eventType: 'FILE_EDIT' | 'PROMPT_SUBMITTED' | 'AGENT_EXECUTION';
  eventData: Record<string, any>;
  timestamp: Date;
}

// Response DTOs
export interface FeatureResponse {
  id: string;
  featureId: string;
  name: string;
  status: string;
  currentPhase: string;
  startedAt: Date | null;
  completedAt: Date | null;
  estimatedHours: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeTrackingResponse {
  id: string;
  featureId: string;
  phase: string;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number;
  isPaused: boolean;
  pausedAt: Date | null;
}

export interface FeatureSummaryResponse {
  feature: FeatureResponse;
  summary: {
    totalMinutes: number;
    inceptionMinutes: number;
    constructionMinutes: number;
    testingMinutes: number;
  };
  hookData: {
    totalFileEdits: number;
    uniqueFiles: number;
    totalLinesAdded: number;
    totalLinesDeleted: number;
    netLinesChanged: number;
    totalPrompts: number;
    totalAgentExecutions: number;
    totalAgentTimeSeconds: number;
  };
}

// Unit 2: Integration Module DTOs

// Jira Integration DTOs
export interface SyncJiraRequest {
  featureId: string;
  jiraKey: string;
  forceRefresh?: boolean;
}

export interface JiraStoryResponse {
  id: string;
  featureId: string;
  jiraKey: string;
  storyPoints: number | null;
  originalEstimate: number | null;
  remainingEstimate: number | null;
  timeSpent: number | null;
  status: string;
  summary: string;
  lastSyncedAt: Date;
}

// GitHub Integration DTOs
export interface SyncGitHubCommitsRequest {
  repositoryId: string;
  since?: Date;
  until?: Date;
  branch?: string;
}

export interface SyncGitHubPRsRequest {
  repositoryId: string;
  state?: 'OPEN' | 'CLOSED' | 'MERGED' | 'ALL';
  since?: Date;
}

export interface GitHubRepositoryResponse {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  isActive: boolean;
  lastSyncedAt: Date | null;
}

export interface GitHubCommitResponse {
  id: string;
  repositoryId: string;
  featureId: string | null;
  sha: string;
  message: string;
  author: string;
  authorEmail: string;
  committedAt: Date;
  additions: number;
  deletions: number;
  totalChanges: number;
  filesChanged: number;
  branchName: string | null;
}

export interface GitHubPullRequestResponse {
  id: string;
  repositoryId: string;
  featureId: string | null;
  number: number;
  title: string;
  state: 'OPEN' | 'CLOSED' | 'MERGED';
  author: string;
  createdAt: Date;
  mergedAt: Date | null;
  closedAt: Date | null;
  reviewCount: number;
  approvalCount: number;
  changesRequestedCount: number;
  commentCount: number;
  reviewers: string[];
  timeToFirstReview: number | null;
  timeToMerge: number | null;
  reviewIterations: number;
  additions: number;
  deletions: number;
  filesChanged: number;
}

// Job Queue DTOs
export interface CreateJobRequest {
  jobType: 'JIRA_SYNC' | 'GITHUB_SYNC_COMMITS' | 'GITHUB_SYNC_PRS' | 'HOOK_EVENT_PROCESS' | 'DATA_CONSISTENCY_CHECK';
  priority?: number;
  payload: Record<string, any>;
  scheduledAt?: Date;
}

export interface IntegrationJobResponse {
  id: string;
  jobType: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  priority: number;
  payload: Record<string, any>;
  result: Record<string, any> | null;
  error: string | null;
  retryCount: number;
  maxRetries: number;
  scheduledAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Consistency Check DTOs
export interface ConsistencyCheckRequest {
  featureId?: string;
  checkType?: 'JIRA' | 'GITHUB' | 'ALL';
}

export interface ConsistencyCheckResponse {
  checkId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED';
  inconsistenciesFound: number;
  inconsistencies: Array<{
    entityType: string;
    entityId: string;
    field: string;
    localValue: any;
    externalValue: any;
    resolution: string;
  }>;
  completedAt: Date | null;
}

// Unit 3: Reporting and Visualization DTOs

// Dashboard DTOs
export interface DashboardDataRequest {
  featureId?: string;
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  metricTypes?: string[];
}

export interface DashboardDataResponse {
  metrics: CalculatedMetricResponse[];
  features: FeatureResponse[];
  summary: {
    totalFeatures: number;
    completedFeatures: number;
    totalTimeSaved: number;
    averageSpeedMultiplier: number;
    totalCostSavings: number;
  };
}

export interface DashboardWidgetData {
  widgetId: string;
  widgetType: string;
  data: any;
  lastUpdated: Date;
}

// Metric DTOs
export interface CalculateMetricRequest {
  featureId: string;
  metricType: 'TIME_SAVED' | 'SPEED_MULTIPLIER' | 'COST_SAVINGS' | 'PRODUCTIVITY_GAIN' | 'QUALITY_SCORE' | 'VELOCITY' | 'CYCLE_TIME' | 'LEAD_TIME' | 'THROUGHPUT' | 'DEFECT_RATE';
  parameters?: Record<string, any>;
}

export interface CalculatedMetricResponse {
  id: string;
  featureId: string;
  metricType: string;
  metricValue: number;
  formula: string;
  parameters: Record<string, any>;
  calculatedAt: Date;
  validUntil: Date | null;
}

export interface MetricTrendResponse {
  metricType: string;
  dataPoints: Array<{
    date: Date;
    value: number;
  }>;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  changePercentage: number;
}

// Report DTOs
export interface GenerateReportRequest {
  reportType: 'FEATURE_SUMMARY' | 'TIME_ANALYSIS' | 'PRODUCTIVITY' | 'COST_BENEFIT' | 'QUALITY_METRICS' | 'VELOCITY_TRENDS' | 'CUSTOM';
  format: 'PDF' | 'EXCEL' | 'HTML' | 'JSON';
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  featureIds?: string[];
  filters?: Record<string, any>;
  includeCharts?: boolean;
  includeRawData?: boolean;
}

export interface ReportResponse {
  id: string;
  reportType: string;
  format: string;
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  fileUrl: string | null;
  fileSize: number | null;
  expiresAt: Date | null;
  generatedBy: string;
  generatedAt: Date | null;
  error: string | null;
  parameters: Record<string, any>;
}

export interface ReportStatusResponse {
  id: string;
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  progress: number;
  fileUrl: string | null;
  error: string | null;
}

// Dashboard Configuration DTOs
export interface CreateDashboardViewRequest {
  name: string;
  description?: string;
  viewType: 'EXECUTIVE' | 'MANAGER' | 'DEVELOPER' | 'CUSTOM';
  layout: Record<string, any>;
  widgets: Array<{
    widgetId: string;
    widgetType: string;
    position: { x: number; y: number; w: number; h: number };
    config: Record<string, any>;
  }>;
  filters?: Record<string, any>;
  isDefault?: boolean;
}

export interface UpdateDashboardViewRequest {
  name?: string;
  description?: string;
  layout?: Record<string, any>;
  widgets?: Array<{
    widgetId: string;
    widgetType: string;
    position: { x: number; y: number; w: number; h: number };
    config: Record<string, any>;
  }>;
  filters?: Record<string, any>;
  isDefault?: boolean;
}

export interface DashboardViewResponse {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  viewType: string;
  layout: Record<string, any>;
  widgets: Record<string, any>;
  filters: Record<string, any>;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics DTOs
export interface TrackAnalyticsEventRequest {
  eventType: string;
  eventData: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export interface AnalyticsEventResponse {
  eventId: string;
  eventType: string;
  timestamp: Date;
  success: boolean;
}
