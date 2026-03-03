import { GitHubPRsSyncService } from '../../../../src/integrations/github/github-prs-sync.service';
import { GitHubClient } from '../../../../src/integrations/github/github-client';
import { githubRepositoryRepository } from '../../../../src/repositories/github-repository.repository';
import { githubPullRequestRepository } from '../../../../src/repositories/github-pull-request.repository';
import { featureRepository } from '../../../../src/repositories/feature.repository';

jest.mock('../../../../src/integrations/github/github-client');
jest.mock('../../../../src/repositories/github-repository.repository');
jest.mock('../../../../src/repositories/github-pull-request.repository');
jest.mock('../../../../src/repositories/feature.repository');

describe('GitHubPRsSyncService', () => {
  let syncService: GitHubPRsSyncService;
  let mockGitHubClient: jest.Mocked<GitHubClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGitHubClient = new GitHubClient() as jest.Mocked<GitHubClient>;
    syncService = new GitHubPRsSyncService(mockGitHubClient);
  });

  describe('syncPullRequests', () => {
    it('should sync pull requests with review metrics', async () => {
      const owner = 'testowner';
      const repo = 'testrepo';
      const mockRepo = { id: 'repo-123', fullName: `${owner}/${repo}` };
      const mockPRs = [
        {
          number: 42,
          title: '[PROJ-123] Add feature',
          body: 'Description',
          state: 'open',
          user: { login: 'developer' },
          created_at: '2024-01-01T10:00:00Z',
          merged_at: null,
          closed_at: null,
          additions: 100,
          deletions: 50,
          changed_files: 5,
        },
      ];
      const mockReviews = [
        {
          id: 1,
          user: { login: 'reviewer1' },
          state: 'APPROVED',
          submitted_at: '2024-01-01T12:00:00Z',
        },
        {
          id: 2,
          user: { login: 'reviewer2' },
          state: 'CHANGES_REQUESTED',
          submitted_at: '2024-01-01T11:00:00Z',
        },
      ];
      const mockFeature = { id: 'feature-123', featureId: 'PROJ-123' };

      (githubRepositoryRepository.findByFullName as jest.Mock).mockResolvedValue(mockRepo);
      mockGitHubClient.listPullRequests.mockResolvedValue(mockPRs);
      mockGitHubClient.listReviews.mockResolvedValue(mockReviews);
      (featureRepository.findByJiraKey as jest.Mock).mockResolvedValue(mockFeature);
      (githubPullRequestRepository.upsert as jest.Mock).mockResolvedValue({
        id: 'pr-123',
        repositoryId: mockRepo.id,
        featureId: mockFeature.id,
        number: 42,
        title: '[PROJ-123] Add feature',
        state: 'OPEN',
        reviewCount: 2,
        approvalCount: 1,
        changesRequestedCount: 1,
        timeToFirstReview: 3600,
      });

      const result = await syncService.syncPullRequests(owner, repo, {});

      expect(result.prCount).toBe(1);
      expect(mockGitHubClient.listPullRequests).toHaveBeenCalledWith(owner, repo, {});
      expect(mockGitHubClient.listReviews).toHaveBeenCalledWith(owner, repo, 42);
      expect(githubPullRequestRepository.upsert).toHaveBeenCalled();
    });

    it('should calculate review metrics correctly', async () => {
      const owner = 'testowner';
      const repo = 'testrepo';
      const mockRepo = { id: 'repo-123', fullName: `${owner}/${repo}` };
      const createdAt = new Date('2024-01-01T10:00:00Z');
      const firstReviewAt = new Date('2024-01-01T11:30:00Z');
      const mergedAt = new Date('2024-01-02T10:00:00Z');
      
      const mockPRs = [
        {
          number: 42,
          title: 'Test PR',
          state: 'closed',
          user: { login: 'dev' },
          created_at: createdAt.toISOString(),
          merged_at: mergedAt.toISOString(),
          closed_at: mergedAt.toISOString(),
          additions: 50,
          deletions: 25,
          changed_files: 3,
        },
      ];
      const mockReviews = [
        {
          id: 1,
          user: { login: 'reviewer1' },
          state: 'APPROVED',
          submitted_at: firstReviewAt.toISOString(),
        },
      ];

      (githubRepositoryRepository.findByFullName as jest.Mock).mockResolvedValue(mockRepo);
      mockGitHubClient.listPullRequests.mockResolvedValue(mockPRs);
      mockGitHubClient.listReviews.mockResolvedValue(mockReviews);
      (featureRepository.findByJiraKey as jest.Mock).mockResolvedValue(null);
      (githubPullRequestRepository.upsert as jest.Mock).mockImplementation((data) => {
        expect(data.timeToFirstReview).toBe(5400); // 1.5 hours in seconds
        expect(data.timeToMerge).toBe(86400); // 24 hours in seconds
        return Promise.resolve(data);
      });

      await syncService.syncPullRequests(owner, repo, {});

      expect(githubPullRequestRepository.upsert).toHaveBeenCalled();
    });

    it('should count review types correctly', async () => {
      const owner = 'testowner';
      const repo = 'testrepo';
      const mockRepo = { id: 'repo-123', fullName: `${owner}/${repo}` };
      const mockPRs = [
        {
          number: 42,
          title: 'Test PR',
          state: 'open',
          user: { login: 'dev' },
          created_at: '2024-01-01',
          additions: 10,
          deletions: 5,
          changed_files: 2,
        },
      ];
      const mockReviews = [
        { id: 1, user: { login: 'r1' }, state: 'APPROVED', submitted_at: '2024-01-01' },
        { id: 2, user: { login: 'r2' }, state: 'APPROVED', submitted_at: '2024-01-01' },
        { id: 3, user: { login: 'r3' }, state: 'CHANGES_REQUESTED', submitted_at: '2024-01-01' },
        { id: 4, user: { login: 'r4' }, state: 'COMMENTED', submitted_at: '2024-01-01' },
      ];

      (githubRepositoryRepository.findByFullName as jest.Mock).mockResolvedValue(mockRepo);
      mockGitHubClient.listPullRequests.mockResolvedValue(mockPRs);
      mockGitHubClient.listReviews.mockResolvedValue(mockReviews);
      (featureRepository.findByJiraKey as jest.Mock).mockResolvedValue(null);
      (githubPullRequestRepository.upsert as jest.Mock).mockImplementation((data) => {
        expect(data.reviewCount).toBe(4);
        expect(data.approvalCount).toBe(2);
        expect(data.changesRequestedCount).toBe(1);
        expect(data.reviewers).toEqual(['r1', 'r2', 'r3', 'r4']);
        return Promise.resolve(data);
      });

      await syncService.syncPullRequests(owner, repo, {});
    });

    it('should handle PRs without reviews', async () => {
      const owner = 'testowner';
      const repo = 'testrepo';
      const mockRepo = { id: 'repo-123', fullName: `${owner}/${repo}` };
      const mockPRs = [
        {
          number: 42,
          title: 'Test PR',
          state: 'open',
          user: { login: 'dev' },
          created_at: '2024-01-01',
          additions: 10,
          deletions: 5,
          changed_files: 2,
        },
      ];

      (githubRepositoryRepository.findByFullName as jest.Mock).mockResolvedValue(mockRepo);
      mockGitHubClient.listPullRequests.mockResolvedValue(mockPRs);
      mockGitHubClient.listReviews.mockResolvedValue([]);
      (featureRepository.findByJiraKey as jest.Mock).mockResolvedValue(null);
      (githubPullRequestRepository.upsert as jest.Mock).mockImplementation((data) => {
        expect(data.reviewCount).toBe(0);
        expect(data.approvalCount).toBe(0);
        expect(data.timeToFirstReview).toBeNull();
        return Promise.resolve(data);
      });

      await syncService.syncPullRequests(owner, repo, {});
    });

    it('should match feature ID from PR title', async () => {
      const owner = 'testowner';
      const repo = 'testrepo';
      const mockRepo = { id: 'repo-123', fullName: `${owner}/${repo}` };
      const mockPRs = [
        {
          number: 42,
          title: '[PROJ-789] Implement feature',
          state: 'open',
          user: { login: 'dev' },
          created_at: '2024-01-01',
          additions: 10,
          deletions: 5,
          changed_files: 2,
        },
      ];
      const mockFeature = { id: 'feature-789', featureId: 'PROJ-789' };

      (githubRepositoryRepository.findByFullName as jest.Mock).mockResolvedValue(mockRepo);
      mockGitHubClient.listPullRequests.mockResolvedValue(mockPRs);
      mockGitHubClient.listReviews.mockResolvedValue([]);
      (featureRepository.findByJiraKey as jest.Mock).mockResolvedValue(mockFeature);
      (githubPullRequestRepository.upsert as jest.Mock).mockResolvedValue({});

      await syncService.syncPullRequests(owner, repo, {});

      expect(featureRepository.findByJiraKey).toHaveBeenCalledWith('PROJ-789');
    });

    it('should handle GitHub API errors', async () => {
      const owner = 'testowner';
      const repo = 'nonexistent';

      (githubRepositoryRepository.findByFullName as jest.Mock).mockResolvedValue(null);
      mockGitHubClient.getRepository.mockRejectedValue(new Error('Repository not found'));

      await expect(syncService.syncPullRequests(owner, repo, {})).rejects.toThrow(
        'Repository not found'
      );
    });
  });

  describe('calculateReviewMetrics', () => {
    it('should calculate time to first review', () => {
      const createdAt = new Date('2024-01-01T10:00:00Z');
      const reviews = [
        { submitted_at: '2024-01-01T12:00:00Z', state: 'APPROVED' },
        { submitted_at: '2024-01-01T11:00:00Z', state: 'COMMENTED' },
      ];

      const result = (syncService as any).calculateReviewMetrics(createdAt, reviews);

      expect(result.timeToFirstReview).toBe(3600); // 1 hour
    });

    it('should return null for time to first review if no reviews', () => {
      const createdAt = new Date('2024-01-01T10:00:00Z');
      const reviews: any[] = [];

      const result = (syncService as any).calculateReviewMetrics(createdAt, reviews);

      expect(result.timeToFirstReview).toBeNull();
    });
  });
});
