import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/database';

describe('Features API Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.feature.deleteMany();
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.feature.deleteMany();
  });

  describe('POST /api/features/start', () => {
    it('should start tracking a new feature', async () => {
      const response = await request(app)
        .post('/api/features/start')
        .send({
          branchName: 'feature/PROJ-123-test',
          commitMessage: 'Initial commit',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        featureId: 'PROJ-123',
        status: 'IN_PROGRESS',
        currentPhase: 'INCEPTION',
      });
    });

    it('should return 400 for invalid request', async () => {
      await request(app)
        .post('/api/features/start')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/features/:id/transition', () => {
    it('should transition feature to next phase', async () => {
      // Create feature first
      const createResponse = await request(app)
        .post('/api/features/start')
        .send({
          branchName: 'feature/PROJ-456-test',
          commitMessage: 'Test',
        });

      const featureId = createResponse.body.id;

      // Transition to CONSTRUCTION
      const response = await request(app)
        .post(`/api/features/${featureId}/transition`)
        .send({ phase: 'CONSTRUCTION' })
        .expect(200);

      expect(response.body.currentPhase).toBe('CONSTRUCTION');
    });
  });

  describe('POST /api/features/:id/complete', () => {
    it('should complete feature tracking', async () => {
      // Create feature
      const createResponse = await request(app)
        .post('/api/features/start')
        .send({
          branchName: 'feature/PROJ-789-test',
          commitMessage: 'Test',
        });

      const featureId = createResponse.body.id;

      // Complete feature
      const response = await request(app)
        .post(`/api/features/${featureId}/complete`)
        .expect(200);

      expect(response.body.status).toBe('COMPLETED');
      expect(response.body.completedAt).toBeTruthy();
    });
  });

  describe('GET /api/features/:id', () => {
    it('should get feature by id', async () => {
      // Create feature
      const createResponse = await request(app)
        .post('/api/features/start')
        .send({
          branchName: 'feature/PROJ-999-test',
          commitMessage: 'Test',
        });

      const featureId = createResponse.body.id;

      // Get feature
      const response = await request(app)
        .get(`/api/features/${featureId}`)
        .expect(200);

      expect(response.body.id).toBe(featureId);
    });

    it('should return 404 for non-existent feature', async () => {
      await request(app)
        .get('/api/features/non-existent-id')
        .expect(404);
    });
  });
});
