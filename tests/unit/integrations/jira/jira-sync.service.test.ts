import { JiraSyncService } from '../../../../src/integrations/jira/jira-sync.service';
import { JiraClient } from '../../../../src/integrations/jira/jira-client';
import { jiraStoryRepository } from '../../../../src/repositories/jira-story.repository';
import { featureRepository } from '../../../../src/repositories/feature.repository';

jest.mock('../../../../src/integrations/jira/jira-client');
jest.mock('../../../../src/repositories/jira-story.repository');
jest.mock('../../../../src/repositories/feature.repository');

describe('JiraSyncService', () => {
  let jiraSyncService: JiraSyncService;
  let mockJiraClient: jest.Mocked<JiraClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJiraClient = new JiraClient() as jest.Mocked<JiraClient>;
    jiraSyncService = new JiraSyncService(mockJiraClient);
  });

  describe('syncStory', () => {
    it('should sync Jira story to database', async () => {
      const featureId = 'feature-123';
      const jiraKey = 'PROJ-123';
      const mockFeature = { id: featureId, featureId: jiraKey, name: 'Test Feature' };
      const mockJiraIssue = {
        key: jiraKey,
        fields: {
          summary: 'Test Story',
          status: { name: 'In Progress' },
          customfield_10016: 5,
          timetracking: {
            originalEstimateSeconds: 7200,
            remainingEstimateSeconds: 3600,
            timeSpentSeconds: 3600,
          },
        },
      };

      (featureRepository.findById as jest.Mock).mockResolvedValue(mockFeature);
      mockJiraClient.getIssue.mockResolvedValue(mockJiraIssue);
      (jiraStoryRepository.upsert as jest.Mock).mockResolvedValue({
        id: 'jira-story-123',
        featureId,
        jiraKey,
        storyPoints: 5,
        originalEstimate: 7200,
        remainingEstimate: 3600,
        timeSpent: 3600,
        status: 'In Progress',
        summary: 'Test Story',
        lastSyncedAt: new Date(),
      });

      const result = await jiraSyncService.syncStory(featureId, jiraKey);

      expect(result).toBeDefined();
      expect(result.jiraKey).toBe(jiraKey);
      expect(result.storyPoints).toBe(5);
      expect(featureRepository.findById).toHaveBeenCalledWith(featureId);
      expect(mockJiraClient.getIssue).toHaveBeenCalledWith(jiraKey);
      expect(jiraStoryRepository.upsert).toHaveBeenCalled();
    });

    it('should throw error if feature not found', async () => {
      const featureId = 'non-existent';
      const jiraKey = 'PROJ-123';

      (featureRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(jiraSyncService.syncStory(featureId, jiraKey)).rejects.toThrow(
        'Feature not found'
      );
    });

    it('should handle missing story points', async () => {
      const featureId = 'feature-123';
      const jiraKey = 'PROJ-123';
      const mockFeature = { id: featureId, featureId: jiraKey };
      const mockJiraIssue = {
        key: jiraKey,
        fields: {
          summary: 'Test Story',
          status: { name: 'To Do' },
          customfield_10016: null,
          timetracking: {},
        },
      };

      (featureRepository.findById as jest.Mock).mockResolvedValue(mockFeature);
      mockJiraClient.getIssue.mockResolvedValue(mockJiraIssue);
      (jiraStoryRepository.upsert as jest.Mock).mockResolvedValue({
        id: 'jira-story-123',
        featureId,
        jiraKey,
        storyPoints: null,
        originalEstimate: null,
        remainingEstimate: null,
        timeSpent: null,
        status: 'To Do',
        summary: 'Test Story',
        lastSyncedAt: new Date(),
      });

      const result = await jiraSyncService.syncStory(featureId, jiraKey);

      expect(result.storyPoints).toBeNull();
      expect(result.originalEstimate).toBeNull();
    });

    it('should handle Jira API errors', async () => {
      const featureId = 'feature-123';
      const jiraKey = 'PROJ-999';
      const mockFeature = { id: featureId, featureId: jiraKey };

      (featureRepository.findById as jest.Mock).mockResolvedValue(mockFeature);
      mockJiraClient.getIssue.mockRejectedValue(new Error('Issue not found'));

      await expect(jiraSyncService.syncStory(featureId, jiraKey)).rejects.toThrow(
        'Issue not found'
      );
    });
  });

  describe('extractStoryPoints', () => {
    it('should extract story points from custom field', () => {
      const fields = { customfield_10016: 8 };
      const result = (jiraSyncService as any).extractStoryPoints(fields);
      expect(result).toBe(8);
    });

    it('should return null if story points not set', () => {
      const fields = { customfield_10016: null };
      const result = (jiraSyncService as any).extractStoryPoints(fields);
      expect(result).toBeNull();
    });
  });

  describe('extractTimeEstimates', () => {
    it('should extract time estimates in seconds', () => {
      const fields = {
        timetracking: {
          originalEstimateSeconds: 14400,
          remainingEstimateSeconds: 7200,
          timeSpentSeconds: 7200,
        },
      };
      const result = (jiraSyncService as any).extractTimeEstimates(fields);
      expect(result).toEqual({
        originalEstimate: 14400,
        remainingEstimate: 7200,
        timeSpent: 7200,
      });
    });

    it('should handle missing time tracking', () => {
      const fields = { timetracking: {} };
      const result = (jiraSyncService as any).extractTimeEstimates(fields);
      expect(result).toEqual({
        originalEstimate: null,
        remainingEstimate: null,
        timeSpent: null,
      });
    });
  });
});
