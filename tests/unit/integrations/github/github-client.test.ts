import { GitHubClient } from '../../../../src/integrations/github/github-client';
import { credentialManager } from '../../../../src/integrations/common/credential-manager';
import { rateLimiter } from '../../../../src/integrations/common/rate-limiter';
import { cacheManager } from '../../../../src/integrations/common/cache-manager';
import nock from 'nock';

jest.mock('../../../../src/integrations/common/credential-manager');
jest.mock('../../../../src/integrations/common/rate-limiter');
jest.mock('../../../../src/integrations/common/cache-manager');

describe('GitHubClient', () => {
  let githubClient: GitHubClient;
  const mockToken = 'ghp_test_token';

  beforeEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();

    (credentialManager.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'GITHUB_TOKEN') return mockToken;
      return '';
    });

    (rateLimiter.checkAndWait as jest.Mock).mockResolvedValue(undefined);
    (rateLimiter.updateFromHeaders as jest.Mock).mockReturnValue(undefined);
    (cacheManager.get as jest.Mock).mockResolvedValue(null);
    (cacheManager.set as jest.Mock).mockResolvedValue(undefined);

    githubClient = new GitHubClient();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('getRepository', () => {
    it('should fetch repository from GitHub API', async () => {
      const owner = 'testowner';
      const repo = 'testrepo';
      const mockRepo = {
        id: 123,
        name: repo,
        full_name: `${owner}/${repo}`,
        owner: { login: owner },
        default_branch: 'main',
      };

      nock('https://api.github.com')
        .get(`/repos/${owner}/${repo}`)
        .reply(200, mockRepo, {
          'X-RateLimit-Remaining': '5000',
          'X-RateLimit-Reset': String(Date.now() / 1000 + 3600),
        });

      const result = await githubClient.getRepository(owner, repo);

      expect(result).toEqual(mockRepo);
      expect(rateLimiter.checkAndWait).toHaveBeenCalledWith('github');
      expect(rateLimiter.updateFromHeaders).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should return cached repository if available', async () => {
      const owner = 'testowner';
      const repo = 'testrepo';
      const cachedRepo = { name: repo, full_name: `${owner}/${repo}` };

      (cacheManager.get as jest.Mock).mockResolvedValue(cachedRepo);

      const result = await githubClient.getRepository(owner, repo);

      expect(result).toEqual(cachedRepo);
      expect(rateLimiter.checkAndWait).not.toHaveBeenCalled();
    });

    it('should handle 404 error', async () => {
      const owner = 'testowner';
      const repo = 'nonexistent';

      nock('https://api.github.com')
        .get(`/repos/${owner}/${repo}`)
        .reply(404, { message: 'Not Found' });

      await expect(githubClient.getRepository(owner, repo)).rejects.toThrow();
    });
  });

  describe('listCommits', () => {
    it('should fetch commits from GitHub API', async () => {
      const owner = 'testowner';
      const repo = 'testrepo';
      const mockCommits = [
        {
          sha: 'abc123',
          commit: {
            message: 'Test commit',
            author: { name: 'Test Author', email: 'test@example.com', date: '2024-01-01' },
          },
          stats: { additions: 10, deletions: 5, total: 15 },
          files: [{ filename: 'test.ts' }],
        },
      ];

      nock('https://api.github.com')
        .get(`/repos/${owner}/${repo}/commits`)
        .query(true)
        .reply(200, mockCommits);

      const result = await githubClient.listCommits(owner, repo, {});

      expect(result).toEqual(mockCommits);
      expect(result).toHaveLength(1);
    });

    it('should handle pagination', async () => {
      const owner = 'testowner';
      const repo = 'testrepo';
      const mockCommits = Array(100).fill({
        sha: 'abc123',
        commit: { message: 'Test' },
      });

      nock('https://api.github.com')
        .get(`/repos/${owner}/${repo}/commits`)
        .query({ per_page: 100, page: 1 })
        .reply(200, mockCommits);

      const result = await githubClient.listCommits(owner, repo, { per_page: 100, page: 1 });

      expect(result).toHaveLength(100);
    });
  });

  describe('getPullRequest', () => {
    it('should fetch pull request from GitHub API', async () => {
      const owner = 'testowner';
      const repo = 'testrepo';
      const prNumber = 42;
      const mockPR = {
        number: prNumber,
        title: 'Test PR',
        state: 'open',
        user: { login: 'testuser' },
        created_at: '2024-01-01',
        merged_at: null,
        additions: 100,
        deletions: 50,
        changed_files: 5,
      };

      nock('https://api.github.com')
        .get(`/repos/${owner}/${repo}/pulls/${prNumber}`)
        .reply(200, mockPR);

      const result = await githubClient.getPullRequest(owner, repo, prNumber);

      expect(result).toEqual(mockPR);
      expect(result.number).toBe(prNumber);
    });

    it('should handle closed PR', async () => {
      const owner = 'testowner';
      const repo = 'testrepo';
      const prNumber = 42;
      const mockPR = {
        number: prNumber,
        state: 'closed',
        merged_at: '2024-01-02',
      };

      nock('https://api.github.com')
        .get(`/repos/${owner}/${repo}/pulls/${prNumber}`)
        .reply(200, mockPR);

      const result = await githubClient.getPullRequest(owner, repo, prNumber);

      expect(result.state).toBe('closed');
      expect(result.merged_at).toBeDefined();
    });
  });

  describe('listReviews', () => {
    it('should fetch PR reviews from GitHub API', async () => {
      const owner = 'testowner';
      const repo = 'testrepo';
      const prNumber = 42;
      const mockReviews = [
        {
          id: 1,
          user: { login: 'reviewer1' },
          state: 'APPROVED',
          submitted_at: '2024-01-01',
        },
        {
          id: 2,
          user: { login: 'reviewer2' },
          state: 'CHANGES_REQUESTED',
          submitted_at: '2024-01-02',
        },
      ];

      nock('https://api.github.com')
        .get(`/repos/${owner}/${repo}/pulls/${prNumber}/reviews`)
        .reply(200, mockReviews);

      const result = await githubClient.listReviews(owner, repo, prNumber);

      expect(result).toEqual(mockReviews);
      expect(result).toHaveLength(2);
    });

    it('should handle PR with no reviews', async () => {
      const owner = 'testowner';
      const repo = 'testrepo';
      const prNumber = 42;

      nock('https://api.github.com')
        .get(`/repos/${owner}/${repo}/pulls/${prNumber}/reviews`)
        .reply(200, []);

      const result = await githubClient.listReviews(owner, repo, prNumber);

      expect(result).toEqual([]);
    });
  });

  describe('testConnection', () => {
    it('should successfully test connection', async () => {
      nock('https://api.github.com')
        .get('/user')
        .reply(200, { login: 'testuser', id: 123 });

      await expect(githubClient.testConnection()).resolves.not.toThrow();
    });

    it('should fail on invalid token', async () => {
      nock('https://api.github.com')
        .get('/user')
        .reply(401, { message: 'Bad credentials' });

      await expect(githubClient.testConnection()).rejects.toThrow();
    });
  });
});
