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
} from '@prisma/client';

// Extended types with relationships
export type FeatureWithRelations = Feature & {
  timeTracking?: TimeTracking[];
  hookEvents?: HookEvent[];
  estimate?: Estimate | null;
  jiraStory?: JiraStory | null;
  githubCommits?: GitHubCommit[];
  githubPRs?: GitHubPullRequest[];
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
