import { ConsistencyCheckerService } from '../../../src/services/consistency-checker.service';
import { featureRepository } from '../../../src/repositories/feature.repository';
import { jiraStoryRepository } from '../../../src/repositories/jira-story.repository';
import { githubCommitRepository } from '../../../src/repositories/github-commit.repository';
import { JiraClient } from '../../../src/integrations/jira/jira-client';
import { GitHubClient } from '../../../src/integrations/github/github-client';

jest.mock('../../../src/repositories/feature.repository');
jest.mock('../../../src/repositories/jira-story.repository');
jest.mock('../../../src/repositories/github-commit.repository');
jest.mock('../../../src/integrations/jira/jira-client');
jest.mock('../../../src/integrations/github/github-client');

describe('ConsistencyCheckerService', () => {
  let consistencyChecker: ConsistencyCheckerService;
  let mockJiraClient: jest.Mocked<JiraClient>;
  let mockGitHubClient: jest.Mocked<GitHubClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJiraClient = new JiraClient() as jest.Mocked<JiraClient>;
    mockGitHubClient = new GitHubClient() as jest.Mocked<GitHubClient>;
    consistencyChecker = new ConsistencyCheckerService(mockJiraClient, mockGitHubClient);
  });

  describe('runCheck', () => {
    it('should check consistency for all features', async () => {
      const mockFeatures = [
        { id: 'feature-1', featureId: 'PROJ-123', name: 'Feature 1' },
        { id: 'feature-2', featureId: 'PROJ-456', name: 'Feature 2' },
      ];

      (featureRepository.findAll as jest.Mock).mockResolvedValue(mockFeatures);
      (jiraStoryRepository.findByFeatureId as jest.Mock).mockResolvedValue(null);
      (githubCommitRepository.findByFeatureId as jest.Mock).mockResolvedValue([]);

      const report = await consistencyChecker.runCheck();

      expect(report.featuresChecked).toBe(2);
      expect(featureRepository.findAll).toHaveBeenCalled();
    });

    it('should detect time estimate inconsistencies', async () => {
      const mockFeature = { id: 'feature-1', featureId: 'PROJ-123' };
      const mockJiraStory = {
        id: 'jira-1',
        featureId: 'feature-1',
        originalEstimate: 7200, // 2 hours
        lastSyncedAt: new Date(),
      };
      const mockJiraIssue = {
        fields: {
          timetracking: {
            originalEstimateSeconds: 14400, // 4 hours (100% variance)
          },
        },
      };

      (featureRepository.findAll as jest.Mock).mockResolvedValue([mockFeature]);
      (jiraStoryRepository.findByFeatureId as jest.Mock).mockResolvedValue(mockJiraStory);
      mockJiraClient.getIssue.mockResolvedValue(mockJiraIssue);
      (githubCommitRepository.findByFeatureId as jest.Mock).mockResolvedValue([]);

      const report = await consistencyChecker.runCheck();

      expect(report.inconsistenciesFound).toBeGreaterThan(0);
      expect(report.inconsistencies).toContainEqual(
        expect.objectContaining({
          type: 'time_estimate',
          featureId: 'feature-1',
        })
      );
    });

    it('should detect LOC metric inconsistencies', async () => {
      const mockFeature = { id: 'feature-1', featureId: 'PROJ-123' };
      const mockCommits = [
        { id: 'commit-1', totalChanges: 100, committedAt: new Date() },
        { id: 'commit-2', totalChanges: 50, committedAt: new Date() },
      ];

      (featureRepository.findAll as jest.Mock).mockResolvedValue([mockFeature]);
      (jiraStoryRepository.findByFeatureId as jest.Mock).mockResolvedValue(null);
      (githubCommitRepository.findByFeatureId as jest.Mock).mockResolvedValue(mockCommits);
      mockGitHubClient.listCommits.mockResolvedValue([
        { stats: { total: 200 } }, // Different from local (150)
      ]);

      const report = await consistencyChecker.runCheck();

      expect(report.inconsistenciesFound).toBeGreaterThan(0);
    });

    it('should resolve conflicts using timestamp-based strategy', async () => {
      const oldDate = new Date('2024-01-01');
      const newDate = new Date('2024-01-02');
      
      const mockFeature = { id: 'feature-1', featureId: 'PROJ-123' };
      const mockJiraStory = {
        id: 'jira-1',
        featureId: 'feature-1',
        originalEstimate: 7200,
        lastSyncedAt: oldDate, // Older
      };
      const mockJiraIssue = {
        fields: {
          timetracking: {
            originalEstimateSeconds: 14400,
          },
          updated: newDate.toISOString(), // Newer
        },
      };

      (featureRepository.findAll as jest.Mock).mockResolvedValue([mockFeature]);
      (jiraStoryRepository.findByFeatureId as jest.Mock).mockResolvedValue(mockJiraStory);
      mockJiraClient.getIssue.mockResolvedValue(mockJiraIssue);
      (githubCommitRepository.findByFeatureId as jest.Mock).mockResolvedValue([]);
      (jiraStoryRepository.update as jest.Mock).mockResolvedValue({});

      const report = await consistencyChecker.runCheck();

      // Should update local with external (newer timestamp)
      expect(jiraStoryRepository.update).toHaveBeenCalledWith(
        'jira-1',
        expect.objectContaining({
          originalEstimate: 14400,
        })
      );
    });

    it('should handle features without integration data', async () => {
      const mockFeature = { id: 'feature-1', featureId: 'PROJ-123' };

      (featureRepository.findAll as jest.Mock).mockResolvedValue([mockFeature]);
      (jiraStoryRepository.findByFeatureId as jest.Mock).mockResolvedValue(null);
      (githubCommitRepository.findByFeatureId as jest.Mock).mockResolvedValue([]);

      const report = await consistencyChecker.runCheck();

      expect(report.featuresChecked).toBe(1);
      expect(report.inconsistenciesFound).toBe(0);
    });

    it('should handle API errors gracefully', async () => {
      const mockFeature = { id: 'feature-1', featureId: 'PROJ-123' };
      const mockJiraStory = { id: 'jira-1', featureId: 'feature-1' };

      (featureRepository.findAll as jest.Mock).mockResolvedValue([mockFeature]);
      (jiraStoryRepository.findByFeatureId as jest.Mock).mockResolvedValue(mockJiraStory);
      mockJiraClient.getIssue.mockRejectedValue(new Error('API error'));
      (githubCommitRepository.findByFeatureId as jest.Mock).mockResolvedValue([]);

      const report = await consistencyChecker.runCheck();

      // Should continue checking other features
      expect(report.featuresChecked).toBe(1);
    });
  });

  describe('resolveConflict', () => {
    it('should use most recent timestamp', () => {
      const local = { value: 100, timestamp: new Date('2024-01-01') };
      const external = { value: 200, timestamp: new Date('2024-01-02') };

      const result = (consistencyChecker as any).resolveConflict(local, external);

      expect(result).toEqual(external);
    });

    it('should prefer Jira for estimates when timestamps equal', () => {
      const timestamp = new Date('2024-01-01');
      const local = { value: 100, timestamp, source: 'local' };
      const external = { value: 200, timestamp, source: 'jira' };

      const result = (consistencyChecker as any).resolveConflict(local, external);

      expect(result).toEqual(external);
    });

    it('should prefer GitHub for LOC when timestamps equal', () => {
      const timestamp = new Date('2024-01-01');
      const local = { value: 100, timestamp, source: 'local' };
      const external = { value: 200, timestamp, source: 'github' };

      const result = (consistencyChecker as any).resolveConflict(local, external);

      expect(result).toEqual(external);
    });
  });

  describe('calculateVariance', () => {
    it('should calculate percentage variance', () => {
      const variance = (consistencyChecker as any).calculateVariance(100, 120);
      expect(variance).toBe(20);
    });

    it('should handle zero baseline', () => {
      const variance = (consistencyChecker as any).calculateVariance(0, 100);
      expect(variance).toBe(100);
    });

    it('should return absolute variance', () => {
      const variance = (consistencyChecker as any).calculateVariance(120, 100);
      expect(variance).toBe(16.67); // Approximately
    });
  });

  describe('scheduleChecks', () => {
    it('should schedule daily consistency checks', () => {
      const cronSpy = jest.spyOn(require('node-cron'), 'schedule');

      consistencyChecker.scheduleChecks();

      expect(cronSpy).toHaveBeenCalledWith(
        '0 2 * * *', // Daily at 2 AM
        expect.any(Function)
      );
    });
  });
});
