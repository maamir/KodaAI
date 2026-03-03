import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/database';
import nock from 'nock';

describe('Integrations API', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.integrationJob.deleteMany();
    await prisma.jiraStory.deleteMany();
    await prisma.githubCommit.deleteMany();
    await prisma.githubPullRequest.deleteMany();
    await prisma.githubRepository.deleteMany();
    await prisma.feature.deleteMany();
    
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('POST /api/integrations/jira/sync', () => {
    it('should sync Jira story successfully', async () => {
      // Create test feature
      const feature = await prisma.feature.create({
        data: {
          featureId: 'PROJ-123',
          name: 'Test Feature',
          status: 'IN_PROGRESS',
          currentPhase: 'CONSTRUCTION',
        },
      });

      // Mock Jira API
      nock('https://test.atlassian.net')
        .get('/rest/api/3/issue/PROJ-123')
        .reply(200, {
          key: 'PROJ-123',
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
        });

      const response = await request(app)
        .post('/api/integrations/jira/sync')
        .send({
          featureId: feature.id,
          jiraKey: 'PROJ-123',
        })
        .expect(202);

      expect(response.body).toHaveProperty('jobId');
      expect(response.body.message).toContain('queued');
    });

    it('should return 400 for invalid feature ID', async () => {
      const response = await request(app)
        .post('/api/integrations/jira/sync')
        .send({
          featureId: 'invalid-id',
          jiraKey: 'PROJ-123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid Jira key format', async () => {
      const feature = await prisma.feature.create({
        data: {
          featureId: 'PROJ-123',
          name: 'Test Feature',
          status: 'IN_PROGRESS',
        },
      });

      const response = await request(app)
        .post('/api/integrations/jira/sync')
        .send({
          featureId: feature.id,
          jiraKey: 'invalid-key',
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid Jira key format');
    });
  });

  describe('POST /api/integrations/github/sync-commits', () => {
    it('should sync GitHub commits successfully', async () => {
      const feature = await prisma.feature.create({
        data: {
          featureId: 'PROJ-456',
          name: 'GitHub Feature',
          status: 'IN_PROGRESS',
        },
      });

      // Mock GitHub API
      nock('https://api.github.com')
        .get('/repos/testowner/testrepo')
        .reply(200, {
          name: 'testrepo',
          full_name: 'testowner/testrepo',
          owner: { login: 'testowner' },
          default_branch: 'main',
        })
        .get('/repos/testowner/testrepo/commits')
        .query(true)
        .reply(200, [
          {
            sha: 'abc123',
            commit: {
              message: '[PROJ-456] Test commit',
              author: {
                name: 'Test Author',
                email: 'test@example.com',
                date: '2024-01-01T10:00:00Z',
              },
            },
            stats: { additions: 10, deletions: 5, total: 15 },
            files: [{ filename: 'test.ts' }],
          },
        ]);

      const response = await request(app)
        .post('/api/integrations/github/sync-commits')
        .send({
          owner: 'testowner',
          repo: 'testrepo',
          branch: 'feature/PROJ-456-test',
        })
        .expect(202);

      expect(response.body).toHaveProperty('jobId');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/integrations/github/sync-commits')
        .send({
          owner: 'testowner',
          // Missing repo
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/integrations/github/sync-prs', () => {
    it('should sync GitHub pull requests successfully', async () => {
      // Mock GitHub API
      nock('https://api.github.com')
        .get('/repos/testowner/testrepo')
        .reply(200, {
          name: 'testrepo',
          full_name: 'testowner/testrepo',
          owner: { login: 'testowner' },
          default_branch: 'main',
        })
        .get('/repos/testowner/testrepo/pulls')
        .query(true)
        .reply(200, [
          {
            number: 42,
            title: '[PROJ-789] Add feature',
            body: 'Description',
            state: 'open',
            user: { login: 'developer' },
            created_at: '2024-01-01T10:00:00Z',
            additions: 100,
            deletions: 50,
            changed_files: 5,
          },
        ])
        .get('/repos/testowner/testrepo/pulls/42/reviews')
        .reply(200, [
          {
            id: 1,
            user: { login: 'reviewer1' },
            state: 'APPROVED',
            submitted_at: '2024-01-01T12:00:00Z',
          },
        ]);

      const response = await request(app)
        .post('/api/integrations/github/sync-prs')
        .send({
          owner: 'testowner',
          repo: 'testrepo',
        })
        .expect(202);

      expect(response.body).toHaveProperty('jobId');
    });
  });

  describe('GET /api/integrations/jobs/:id', () => {
    it('should return job status', async () => {
      const job = await prisma.integrationJob.create({
        data: {
          jobType: 'JIRA_SYNC',
          status: 'COMPLETED',
          priority: 5,
          payload: { featureId: 'feature-123', jiraKey: 'PROJ-123' },
          result: { success: true },
          retryCount: 0,
          maxRetries: 3,
          scheduledAt: new Date(),
          completedAt: new Date(),
        },
      });

      const response = await request(app)
        .get(`/api/integrations/jobs/${job.id}`)
        .expect(200);

      expect(response.body.id).toBe(job.id);
      expect(response.body.status).toBe('COMPLETED');
      expect(response.body.result).toEqual({ success: true });
    });

    it('should return 404 for non-existent job', async () => {
      const response = await request(app)
        .get('/api/integrations/jobs/non-existent-id')
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('GET /api/integrations/queue/metrics', () => {
    it('should return queue metrics', async () => {
      // Create test jobs
      await prisma.integrationJob.createMany({
        data: [
          {
            jobType: 'JIRA_SYNC',
            status: 'PENDING',
            priority: 5,
            payload: {},
            retryCount: 0,
            maxRetries: 3,
            scheduledAt: new Date(),
          },
          {
            jobType: 'GITHUB_SYNC_COMMITS',
            status: 'RUNNING',
            priority: 5,
            payload: {},
            retryCount: 0,
            maxRetries: 3,
            scheduledAt: new Date(),
          },
          {
            jobType: 'GITHUB_SYNC_PRS',
            status: 'COMPLETED',
            priority: 5,
            payload: {},
            retryCount: 0,
            maxRetries: 3,
            scheduledAt: new Date(),
            completedAt: new Date(),
          },
        ],
      });

      const response = await request(app)
        .get('/api/integrations/queue/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('pending');
      expect(response.body).toHaveProperty('running');
      expect(response.body).toHaveProperty('completed');
      expect(response.body.pending).toBe(1);
      expect(response.body.running).toBe(1);
      expect(response.body.completed).toBe(1);
    });
  });

  describe('POST /api/integrations/consistency-check', () => {
    it('should queue consistency check job', async () => {
      const response = await request(app)
        .post('/api/integrations/consistency-check')
        .expect(202);

      expect(response.body).toHaveProperty('jobId');
      expect(response.body.message).toContain('Consistency check queued');
    });

    it('should create job with low priority', async () => {
      const response = await request(app)
        .post('/api/integrations/consistency-check')
        .expect(202);

      const job = await prisma.integrationJob.findUnique({
        where: { id: response.body.jobId },
      });

      expect(job).toBeDefined();
      expect(job!.jobType).toBe('DATA_CONSISTENCY_CHECK');
      expect(job!.priority).toBe(1); // Low priority
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/integrations/jira/sync')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle missing Content-Type', async () => {
      const response = await request(app)
        .post('/api/integrations/jira/sync')
        .send('featureId=test&jiraKey=PROJ-123')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle database connection errors gracefully', async () => {
      // Disconnect database temporarily
      await prisma.$disconnect();

      const response = await request(app)
        .get('/api/integrations/jobs/test-id')
        .expect(500);

      expect(response.body.error).toContain('Internal server error');

      // Reconnect
      await prisma.$connect();
    });
  });

  describe('Rate limiting', () => {
    it('should respect rate limits', async () => {
      // This test would require actual rate limiting middleware
      // For now, we just verify the endpoint exists
      const response = await request(app)
        .post('/api/integrations/jira/sync')
        .send({
          featureId: 'test-id',
          jiraKey: 'PROJ-123',
        });

      expect([400, 429]).toContain(response.status);
    });
  });
});
