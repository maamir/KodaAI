-- CreateEnum
CREATE TYPE "FeatureStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "Phase" AS ENUM ('INCEPTION', 'CONSTRUCTION', 'TESTING');

-- CreateEnum
CREATE TYPE "HookEventType" AS ENUM ('FILE_EDIT', 'PROMPT_SUBMITTED', 'AGENT_EXECUTION');

-- CreateEnum
CREATE TYPE "EstimateSource" AS ENUM ('USER_INPUT', 'JIRA_STORY', 'CALCULATED');

-- CreateEnum
CREATE TYPE "ConfigType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('JIRA_SYNC', 'GITHUB_SYNC_COMMITS', 'GITHUB_SYNC_PRS', 'HOOK_EVENT_PROCESS', 'DATA_CONSISTENCY_CHECK');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PullRequestState" AS ENUM ('OPEN', 'CLOSED', 'MERGED');

-- CreateEnum
CREATE TYPE "MetricType" AS ENUM ('TIME_SAVED', 'SPEED_MULTIPLIER', 'COST_SAVINGS', 'PRODUCTIVITY_SCORE', 'QUALITY_SCORE', 'EFFICIENCY_RATIO', 'ROI_PERCENTAGE', 'FEATURE_VELOCITY', 'CODE_QUALITY_INDEX', 'COLLABORATION_SCORE');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('DEVELOPER_PERSONAL', 'TEAM_PRODUCTIVITY', 'FEATURE_DETAIL', 'EXECUTIVE_SUMMARY', 'QUARTERLY_REVIEW', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'EXCEL', 'HTML');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('GENERATING', 'GENERATED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ViewType" AS ENUM ('DEVELOPER', 'MANAGER', 'EXECUTIVE', 'CUSTOM');

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "FeatureStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "currentPhase" "Phase" NOT NULL DEFAULT 'INCEPTION',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "estimatedHours" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeTracking" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "phase" "Phase" NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "durationMinutes" INTEGER NOT NULL DEFAULT 0,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "pausedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HookEvent" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "eventType" "HookEventType" NOT NULL,
    "eventData" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estimate" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL,
    "inceptionHours" DOUBLE PRECISION,
    "constructionHours" DOUBLE PRECISION,
    "testingHours" DOUBLE PRECISION,
    "source" "EstimateSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Estimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuration" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" "ConfigType" NOT NULL,
    "description" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuration_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "JiraStory" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "jiraKey" TEXT NOT NULL,
    "storyPoints" DOUBLE PRECISION,
    "originalEstimate" INTEGER,
    "remainingEstimate" INTEGER,
    "timeSpent" INTEGER,
    "status" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JiraStory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubRepository" (
    "id" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubRepository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubCommit" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "featureId" TEXT,
    "sha" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorEmail" TEXT NOT NULL,
    "committedAt" TIMESTAMP(3) NOT NULL,
    "additions" INTEGER NOT NULL,
    "deletions" INTEGER NOT NULL,
    "totalChanges" INTEGER NOT NULL,
    "filesChanged" INTEGER NOT NULL,
    "branchName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubCommit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubPullRequest" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "featureId" TEXT,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "state" "PullRequestState" NOT NULL,
    "author" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "mergedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "approvalCount" INTEGER NOT NULL DEFAULT 0,
    "changesRequestedCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "reviewers" JSONB NOT NULL,
    "timeToFirstReview" INTEGER,
    "timeToMerge" INTEGER,
    "reviewIterations" INTEGER NOT NULL DEFAULT 0,
    "additions" INTEGER NOT NULL,
    "deletions" INTEGER NOT NULL,
    "filesChanged" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubPullRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationJob" (
    "id" TEXT NOT NULL,
    "jobType" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "cacheValue" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalculatedMetric" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "metricType" "MetricType" NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "formula" TEXT,
    "parameters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalculatedMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "format" "ReportFormat" NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'GENERATING',
    "generatedBy" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "metadata" JSONB,
    "generatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewType" "ViewType" NOT NULL,
    "name" TEXT NOT NULL,
    "configuration" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Feature_featureId_key" ON "Feature"("featureId");

-- CreateIndex
CREATE INDEX "Feature_featureId_idx" ON "Feature"("featureId");

-- CreateIndex
CREATE INDEX "Feature_status_idx" ON "Feature"("status");

-- CreateIndex
CREATE INDEX "Feature_startedAt_idx" ON "Feature"("startedAt");

-- CreateIndex
CREATE INDEX "TimeTracking_featureId_idx" ON "TimeTracking"("featureId");

-- CreateIndex
CREATE INDEX "TimeTracking_phase_idx" ON "TimeTracking"("phase");

-- CreateIndex
CREATE INDEX "TimeTracking_endTime_idx" ON "TimeTracking"("endTime");

-- CreateIndex
CREATE INDEX "HookEvent_featureId_idx" ON "HookEvent"("featureId");

-- CreateIndex
CREATE INDEX "HookEvent_timestamp_idx" ON "HookEvent"("timestamp");

-- CreateIndex
CREATE INDEX "HookEvent_processed_idx" ON "HookEvent"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "Estimate_featureId_key" ON "Estimate"("featureId");

-- CreateIndex
CREATE INDEX "Estimate_featureId_idx" ON "Estimate"("featureId");

-- CreateIndex
CREATE UNIQUE INDEX "JiraStory_featureId_key" ON "JiraStory"("featureId");

-- CreateIndex
CREATE UNIQUE INDEX "JiraStory_jiraKey_key" ON "JiraStory"("jiraKey");

-- CreateIndex
CREATE INDEX "JiraStory_featureId_idx" ON "JiraStory"("featureId");

-- CreateIndex
CREATE INDEX "JiraStory_jiraKey_idx" ON "JiraStory"("jiraKey");

-- CreateIndex
CREATE INDEX "JiraStory_lastSyncedAt_idx" ON "JiraStory"("lastSyncedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubRepository_fullName_key" ON "GitHubRepository"("fullName");

-- CreateIndex
CREATE INDEX "GitHubRepository_fullName_idx" ON "GitHubRepository"("fullName");

-- CreateIndex
CREATE INDEX "GitHubRepository_isActive_idx" ON "GitHubRepository"("isActive");

-- CreateIndex
CREATE INDEX "GitHubCommit_featureId_idx" ON "GitHubCommit"("featureId");

-- CreateIndex
CREATE INDEX "GitHubCommit_committedAt_idx" ON "GitHubCommit"("committedAt");

-- CreateIndex
CREATE INDEX "GitHubCommit_branchName_idx" ON "GitHubCommit"("branchName");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubCommit_repositoryId_sha_key" ON "GitHubCommit"("repositoryId", "sha");

-- CreateIndex
CREATE INDEX "GitHubPullRequest_featureId_idx" ON "GitHubPullRequest"("featureId");

-- CreateIndex
CREATE INDEX "GitHubPullRequest_state_idx" ON "GitHubPullRequest"("state");

-- CreateIndex
CREATE INDEX "GitHubPullRequest_mergedAt_idx" ON "GitHubPullRequest"("mergedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubPullRequest_repositoryId_number_key" ON "GitHubPullRequest"("repositoryId", "number");

-- CreateIndex
CREATE INDEX "IntegrationJob_status_idx" ON "IntegrationJob"("status");

-- CreateIndex
CREATE INDEX "IntegrationJob_scheduledAt_idx" ON "IntegrationJob"("scheduledAt");

-- CreateIndex
CREATE INDEX "IntegrationJob_priority_idx" ON "IntegrationJob"("priority");

-- CreateIndex
CREATE INDEX "IntegrationJob_jobType_idx" ON "IntegrationJob"("jobType");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationCache_cacheKey_key" ON "IntegrationCache"("cacheKey");

-- CreateIndex
CREATE INDEX "IntegrationCache_cacheKey_idx" ON "IntegrationCache"("cacheKey");

-- CreateIndex
CREATE INDEX "IntegrationCache_expiresAt_idx" ON "IntegrationCache"("expiresAt");

-- CreateIndex
CREATE INDEX "CalculatedMetric_featureId_idx" ON "CalculatedMetric"("featureId");

-- CreateIndex
CREATE INDEX "CalculatedMetric_metricType_idx" ON "CalculatedMetric"("metricType");

-- CreateIndex
CREATE INDEX "CalculatedMetric_calculatedAt_idx" ON "CalculatedMetric"("calculatedAt");

-- CreateIndex
CREATE INDEX "CalculatedMetric_featureId_metricType_calculatedAt_idx" ON "CalculatedMetric"("featureId", "metricType", "calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CalculatedMetric_featureId_metricType_key" ON "CalculatedMetric"("featureId", "metricType");

-- CreateIndex
CREATE INDEX "Report_generatedBy_idx" ON "Report"("generatedBy");

-- CreateIndex
CREATE INDEX "Report_generatedAt_idx" ON "Report"("generatedAt");

-- CreateIndex
CREATE INDEX "Report_reportType_idx" ON "Report"("reportType");

-- CreateIndex
CREATE INDEX "Report_expiresAt_idx" ON "Report"("expiresAt");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "DashboardView_userId_idx" ON "DashboardView"("userId");

-- CreateIndex
CREATE INDEX "DashboardView_viewType_idx" ON "DashboardView"("viewType");

-- CreateIndex
CREATE INDEX "DashboardView_userId_viewType_idx" ON "DashboardView"("userId", "viewType");

-- CreateIndex
CREATE INDEX "DashboardView_isDefault_idx" ON "DashboardView"("isDefault");

-- AddForeignKey
ALTER TABLE "TimeTracking" ADD CONSTRAINT "TimeTracking_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HookEvent" ADD CONSTRAINT "HookEvent_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraStory" ADD CONSTRAINT "JiraStory_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubCommit" ADD CONSTRAINT "GitHubCommit_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "GitHubRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubCommit" ADD CONSTRAINT "GitHubCommit_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubPullRequest" ADD CONSTRAINT "GitHubPullRequest_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "GitHubRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubPullRequest" ADD CONSTRAINT "GitHubPullRequest_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalculatedMetric" ADD CONSTRAINT "CalculatedMetric_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;
