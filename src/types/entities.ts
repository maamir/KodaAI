import { 
  Feature, 
  TimeTracking, 
  HookEvent, 
  Estimate, 
  Configuration,
  JiraStory,
  GitHubRepository,
  GitHubCommit,
  GitHubPullRequest,
  IntegrationJob,
  IntegrationCache,
  // Unit 3: Reporting and Visualization types
  CalculatedMetric,
  Report,
  DashboardView,
} from '@prisma/client';

// Re-export Prisma types
export type {
  Feature,
  TimeTracking,
  HookEvent,
  Estimate,
  Configuration,
  FeatureStatus,
  Phase,
  HookEventType,
  EstimateSource,
  ConfigType,
  // Unit 2: Integration Module types
  JiraStory,
  GitHubRepository,
  GitHubCommit,
  GitHubPullRequest,
  IntegrationJob,
  IntegrationCache,
  JobType,
  JobStatus,
  PullRequestState,
  // Unit 3: Reporting and Visualization types
  CalculatedMetric,
  Report,
  DashboardView,
  MetricType,
  ReportType,
  ReportFormat,
  ReportStatus,
  ViewType,
} from '@prisma/client';

// Extended types with relationships
export type FeatureWithRelations = Feature & {
  timeTracking?: TimeTracking[];
  hookEvents?: HookEvent[];
  estimate?: Estimate | null;
  jiraStory?: JiraStory | null;
  githubCommits?: GitHubCommit[];
  githubPRs?: GitHubPullRequest[];
  calculatedMetrics?: CalculatedMetric[];
};

export type GitHubRepositoryWithRelations = GitHubRepository & {
  commits?: GitHubCommit[];
  pullRequests?: GitHubPullRequest[];
};

export type GitHubCommitWithRelations = GitHubCommit & {
  repository?: GitHubRepository;
  feature?: Feature | null;
};

export type GitHubPullRequestWithRelations = GitHubPullRequest & {
  repository?: GitHubRepository;
  feature?: Feature | null;
};

export type CalculatedMetricWithRelations = CalculatedMetric & {
  feature?: Feature;
};

export type FeatureSummary = {
  totalMinutes: number;
  inceptionMinutes: number;
  constructionMinutes: number;
  testingMinutes: number;
};

export type HookDataSummary = {
  totalFileEdits: number;
  uniqueFiles: number;
  totalLinesAdded: number;
  totalLinesDeleted: number;
  netLinesChanged: number;
  totalPrompts: number;
  totalAgentExecutions: number;
  totalAgentTimeSeconds: number;
  averageAgentTimeSeconds: number;
};

// Unit 3: Reporting and Visualization summary types
export type MetricCalculationResult = {
  metricType: string;
  metricValue: number;
  formula: string;
  parameters: Record<string, any>;
};

export type DashboardData = {
  metrics: CalculatedMetric[];
  features: Feature[];
  summary: {
    totalFeatures: number;
    completedFeatures: number;
    totalTimeSaved: number;
    averageSpeedMultiplier: number;
    totalCostSavings: number;
  };
};

export type ReportGenerationParams = {
  reportType: string;
  format: string;
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  filters: Record<string, any>;
  userId: string;
};

export type ReportStatus = {
  id: string;
  status: string;
  progress?: number;
  fileUrl?: string;
  error?: string;
};
