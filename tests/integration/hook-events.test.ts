import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/database';
import { HookEventType } from '@prisma/client';

describe('Hook Events API Integration Tests', () => {
  let testFeatureId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.hookEvent.deleteMany();
    await prisma.feature.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create test feature
    const feature = await request(app)
      .post('/api/features/start')
      .send({
        branchName: 'feature/TEST-123-hook-events',
        commitMessage: 'Test',
      });
    testFeatureId = feature.body.id;
  });

  afterEach(async () => {
    await prisma.hookEvent.deleteMany();
    await prisma.feature.deleteMany();
  });

  describe('POST /api/hook-events', () => {
    it('should record a hook event', async () => {
      const response = await request(app)
        .post('/api/hook-events')
        .send({
          featureId: testFeatureId,
          eventType: HookEventType.FILE_EDITED,
          filePath: '/src/app.ts',
          metadata: { lines: 10 },
        })
        .expect(201);

      expect(response.body).toMatchObject({
        featureId: testFeatureId,
        eventType: HookEventType.FILE_EDITED,
        filePath: '/src/app.ts',
      });
    });

    it('should return 400 for invalid event type', async () => {
      await request(app)
        .post('/api/hook-events')
        .send({
          featureId: testFeatureId,
          eventType: 'INVALID_TYPE',
        })
        .expect(400);
    });
  });

  describe('GET /api/hook-events/:featureId', () => {
    it('should get all hook events for a feature', async () => {
      // Create multiple events
      await request(app)
        .post('/api/hook-events')
        .send({
          featureId: testFeatureId,
          eventType: HookEventType.FILE_EDITED,
          filePath: '/src/app.ts',
        });

      await request(app)
        .post('/api/hook-events')
        .send({
          featureId: testFeatureId,
          eventType: HookEventType.PROMPT_SUBMIT,
          metadata: { prompt: 'test' },
        });

      const response = await request(app)
        .get(`/api/hook-events/${testFeatureId}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /api/hook-events/:featureId/statistics', () => {
    it('should get event statistics', async () => {
      // Create events
      await request(app)
        .post('/api/hook-events')
        .send({
          featureId: testFeatureId,
          eventType: HookEventType.FILE_EDITED,
          filePath: '/src/app.ts',
        });

      const response = await request(app)
        .get(`/api/hook-events/${testFeatureId}/statistics`)
        .expect(200);

      expect(response.body).toMatchObject({
        totalEvents: 1,
        eventsByType: {
          [HookEventType.FILE_EDITED]: 1,
        },
      });
    });
  });
});
