import { JiraClient } from '../../../../src/integrations/jira/jira-client';
import { credentialManager } from '../../../../src/integrations/common/credential-manager';
import { rateLimiter } from '../../../../src/integrations/common/rate-limiter';
import { cacheManager } from '../../../../src/integrations/common/cache-manager';
import nock from 'nock';

jest.mock('../../../../src/integrations/common/credential-manager');
jest.mock('../../../../src/integrations/common/rate-limiter');
jest.mock('../../../../src/integrations/common/cache-manager');

describe('JiraClient', () => {
  let jiraClient: JiraClient;
  const mockBaseUrl = 'https://test.atlassian.net';
  const mockEmail = 'test@example.com';
  const mockToken = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();

    (credentialManager.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'JIRA_BASE_URL') return mockBaseUrl;
      if (key === 'JIRA_EMAIL') return mockEmail;
      if (key === 'JIRA_API_TOKEN') return mockToken;
      return '';
    });

    (rateLimiter.checkAndWait as jest.Mock).mockResolvedValue(undefined);
    (rateLimiter.updateFromHeaders as jest.Mock).mockReturnValue(undefined);
    (cacheManager.get as jest.Mock).mockResolvedValue(null);
    (cacheManager.set as jest.Mock).mockResolvedValue(undefined);

    jiraClient = new JiraClient();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('getIssue', () => {
    it('should fetch issue from Jira API', async () => {
      const issueKey = 'PROJ-123';
      const mockIssue = {
        key: issueKey,
        fields: {
          summary: 'Test Issue',
          status: { name: 'In Progress' },
          customfield_10016: 5,
          timetracking: {
            originalEstimate: '2h',
            remainingEstimate: '1h',
            timeSpent: '1h',
          },
        },
      };

      nock(mockBaseUrl)
        .get(`/rest/api/3/issue/${issueKey}`)
        .reply(200, mockIssue, {
          'X-RateLimit-Remaining': '100',
          'X-RateLimit-Reset': String(Date.now() / 1000 + 3600),
        });

      const result = await jiraClient.getIssue(issueKey);

      expect(result).toEqual(mockIssue);
      expect(rateLimiter.checkAndWait).toHaveBeenCalledWith('jira');
      expect(rateLimiter.updateFromHeaders).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should return cached issue if available', async () => {
      const issueKey = 'PROJ-123';
      const cachedIssue = {
        key: issueKey,
        fields: { summary: 'Cached Issue' },
      };

      (cacheManager.get as jest.Mock).mockResolvedValue(cachedIssue);

      const result = await jiraClient.getIssue(issueKey);

      expect(result).toEqual(cachedIssue);
      expect(rateLimiter.checkAndWait).not.toHaveBeenCalled();
    });

    it('should handle 404 error', async () => {
      const issueKey = 'PROJ-999';

      nock(mockBaseUrl)
        .get(`/rest/api/3/issue/${issueKey}`)
        .reply(404, { errorMessages: ['Issue does not exist'] });

      await expect(jiraClient.getIssue(issueKey)).rejects.toThrow('Issue does not exist');
    });

    it('should retry on 500 error', async () => {
      const issueKey = 'PROJ-123';
      const mockIssue = { key: issueKey, fields: {} };

      nock(mockBaseUrl)
        .get(`/rest/api/3/issue/${issueKey}`)
        .reply(500)
        .get(`/rest/api/3/issue/${issueKey}`)
        .reply(200, mockIssue);

      const result = await jiraClient.getIssue(issueKey);

      expect(result).toEqual(mockIssue);
    });

    it('should handle rate limit error', async () => {
      const issueKey = 'PROJ-123';

      nock(mockBaseUrl)
        .get(`/rest/api/3/issue/${issueKey}`)
        .reply(429, { errorMessages: ['Rate limit exceeded'] });

      await expect(jiraClient.getIssue(issueKey)).rejects.toThrow();
    });
  });

  describe('searchIssues', () => {
    it('should search issues with JQL', async () => {
      const jql = 'project = PROJ';
      const mockResponse = {
        issues: [
          { key: 'PROJ-1', fields: { summary: 'Issue 1' } },
          { key: 'PROJ-2', fields: { summary: 'Issue 2' } },
        ],
        total: 2,
      };

      nock(mockBaseUrl)
        .post('/rest/api/3/search', { jql })
        .reply(200, mockResponse);

      const result = await jiraClient.searchIssues(jql);

      expect(result).toEqual(mockResponse.issues);
      expect(result).toHaveLength(2);
    });

    it('should handle empty search results', async () => {
      const jql = 'project = EMPTY';

      nock(mockBaseUrl)
        .post('/rest/api/3/search', { jql })
        .reply(200, { issues: [], total: 0 });

      const result = await jiraClient.searchIssues(jql);

      expect(result).toEqual([]);
    });
  });

  describe('testConnection', () => {
    it('should successfully test connection', async () => {
      nock(mockBaseUrl)
        .get('/rest/api/3/myself')
        .reply(200, { accountId: '123', emailAddress: mockEmail });

      await expect(jiraClient.testConnection()).resolves.not.toThrow();
    });

    it('should fail on invalid credentials', async () => {
      nock(mockBaseUrl)
        .get('/rest/api/3/myself')
        .reply(401, { errorMessages: ['Unauthorized'] });

      await expect(jiraClient.testConnection()).rejects.toThrow();
    });
  });
});
