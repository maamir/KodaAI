import { GitHubCommitsSyncService } from '../../../../src/integrations/github/github-commits-sync.service';
import { GitHubClient } from '../../../../src/integrations/github/github-client';
import { githubRepositoryRepository } from '../../../../src/repositories/github-repository.repository';
import { githubCommitRepository } from '../../../../src/repositories/github-commit.repository';
import { featureRepository } from '../../../../src/repositories/feature.repository';

jest.mock('../../../../src/integrations/github/github-client');
jest.mock('../../../../src/repositories/github-repository.repository');
jest.mock('../../../../src/repositories/github-commit.repository');
jest.mock('../../../../src/repositories/feature.repository');

describe('GitHubCommitsSyncService', () => {
  let syncService: GitHubCommitsSyncService;
  let mockGitHubClient: jest.Mocked<GitHubClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGitHubClient = new GitHubClient() as jest.Mocked<GitHubClient>;
    syncService = new GitHubCommitsSyncService(mockGitHubClient);
  });

  describe('syncCommits', () => {
    it('should sync commits from GitHub to database', async () => {
      const owner = 'testowner';
      const repo = 'testrepo';
      const branch = 'feature/PROJ-123-test';
      const mockRepo = {
        id: 'repo-123',
        owner,
        name: repo,
        fullName: `${owner}/${repo}`,
        defaultBranch: 'main',
      };
      const mockCommits = [
        {
          sha: 'abc123',
          commit: {
            message: '[PROJ-123] Test commit',
            author: { name: 'Test Author', email: 'test@example.com', date: '2024-01-01' },
          },
          stats: { additions: 10, deletions: 5, total: 15 },
          files: [{ filename: 'test.ts' }],
        },
      ];
      const mockFeature = { id: 'feature-123', featureId: 'PROJ-123' };

      (githubRepositoryRepository.findByFullName as jest.Mock).mockResolvedValue(mockRepo);
      mockGitHubClient.listCommits.mockResolvedValue(mockCommits);
      (featureRepository.findByJiraKey as jest.Mock).mockResolvedValue(mockFeature);
      (githubCommitRepository.upsert as jest.Mock).mockResolvedValue({
        id: 'commit-123',
        repositoryId: mockRepo.id,
        featureId: mockFeature.id,
        sha: 'abc123',
        message: '[PROJ-123] Test commit',
        author: 'Test Author',
        authorEmail: 'test@example.com',
        committedAt: new Date('2024-01-01'),
        additions: 10,
        deletions: 5,
        totalChanges: 15,
        filesChanged: 1,
        branchName: branch,
      });

      const result = await syncService.syncCommits(owner, repo, { branch });

      expect(result.commitCount).toBe(1);
      expect(result.totalAdditions).toBe(10);
      expect(result.totalDeletions).toBe(5);
      expect(mockGitHubClient.listCommits).toHaveBeenCalledWith(owner, repo, { sha: branch });
      expect(githubCommitRepository.upsert).toHaveBeenCalled();
    });

    it('should create repository if not exists', async () => {
      const owner = 'testowner';
      const repo = 'testrepo';
      const mockRepoData = {
        name: repo,
        full_name: `${owner}/${repo}`,
        owner: { login: owner },
        default_branch: 'main',
      };

      (githubRepositoryRepository.findByFullName as jest.Mock).mockResolvedValue(null);
      mockGitHubClient.getRepository.mockResolvedValue(mockRepoData);
      (githubRepositoryRepository.create as jest.Mock).mockResolvedValue({
        id: 'repo-123',
        owner,
        name: repo,
        fullName: `${owner}/${repo}`,
        defaultBranch: 'main',
      });
      mockGitHubClient.listCommits.mockResolvedValue([]);

      await syncService.syncCommits(owner, repo, {});

      expect(mockGitHubClient.getRepository).toHaveBeenCalledWith(owner, repo);
      expect(githubRepositoryRepository.create).toHaveBeenCalled();
    });

    it('should match feature ID from branch name', async () => {
      const owner = 'testowner';
      const repo = 'testrepo';
      const branch = 'feature/PROJ-456-add-feature';
      const mockRepo = { id: 'repo-123', fullName: `${owner}/${repo}` };
      const mockCommits = [
        {
          sha: 'def456',
          commit: {
            message: 'Add feature',
            author: { name: 'Dev', email: 'dev@example.com', date: '2024-01-01' },
          },
          stats: { additions: 20, deletions: 10, total: 30 },
          files: [{ filename: 'feature.ts' }, { filename: 'test.ts' }],
        },
      ];
      const mockFeature = { id: 'feature-456', featureId: 'PROJ-456' };

      (githubRepositoryRepository.findByFullName as jest.Mock).mockResolvedValue(mockRepo);
      mockGitHubClient.listCommits.mockResolvedValue(mockCommits);
      (featureRepository.findByJiraKey as jest.Mock).mockResolvedValue(mockFeature);
      (githubCommitRepository.upsert as jest.Mock).mockResolvedValue({});

      const result = await syncService.syncCommits(owner, repo, { branch });

      expect(featureRepository.findByJiraKey).toHaveBeenCalledWith('PROJ-456');
      expect(result.commitCount).toBe(1);
    });

    it('should handle commits without feature association', async () => {
      const owner = 'testowner';
      const repo = 'testrepo';
      const mockRepo = { id: 'repo-123', fullName: `${owner}/${repo}` };
      const mockCommits = [
        {
          sha: 'xyz789',
          commit: {
            message: 'Regular commit',
            author: { name: 'Dev', email: 'dev@example.com', date: '2024-01-01' },
          },
          stats: { additions: 5, deletions: 2, total: 7 },
          files: [{ filename: 'file.ts' }],
        },
      ];

      (githubRepositoryRepository.findByFullName as jest.Mock).mockResolvedValue(mockRepo);
      mockGitHubClient.listCommits.mockResolvedValue(mockCommits);
      (featureRepository.findByJiraKey as jest.Mock).mockResolvedValue(null);
      (githubCommitRepository.upsert as jest.Mock).mockResolvedValue({});

      const result = await syncService.syncCommits(owner, repo, {});

      expect(result.commitCount).toBe(1);
      expect(githubCommitRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          featureId: null,
        })
      );
    });

    it('should handle GitHub API errors', async () => {
      const owner = 'testowner';
      const repo = 'nonexistent';

      (githubRepositoryRepository.findByFullName as jest.Mock).mockResolvedValue(null);
      mockGitHubClient.getRepository.mockRejectedValue(new Error('Repository not found'));

      await expect(syncService.syncCommits(owner, repo, {})).rejects.toThrow(
        'Repository not found'
      );
    });
  });

  describe('extractFeatureId', () => {
    it('should extract feature ID from branch name', () => {
      const branchName = 'feature/PROJ-123-add-login';
      const result = (syncService as any).extractFeatureId(branchName, '');
      expect(result).toBe('PROJ-123');
    });

    it('should extract feature ID from commit message', () => {
      const message = '[PROJ-456] Implement feature';
      const result = (syncService as any).extractFeatureId('', message);
      expect(result).toBe('PROJ-456');
    });

    it('should return null if no feature ID found', () => {
      const result = (syncService as any).extractFeatureId('main', 'Regular commit');
      expect(result).toBeNull();
    });
  });
});
