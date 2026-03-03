import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/database';
import { FeatureStatus, Phase, MetricType } from '@prisma/client';

describe('Dashboard API Integration Tests', () => {
  let testFeatureId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.calculatedMetric.deleteMany();
    await prisma.feature.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create test feature
    const feature = await prisma.feature.create({
      data: {
        featureId: 'TEST-001',
        name: 'Test Feature',
        status: FeatureStatus.COMPLETED,
        currentPhase: Phase.TESTING,
        startedAt: new Date('2024-01-01'),
        completedAt: new Date('2024-01-10'),
        totalDuration: 4800,
      },
    });
    testFeatureId = feature.id;

    // Create test metrics
    await prisma.calculatedMetric.createMany({
      data: [
        {
          featureId: testFeatureId,
          metricType: MetricType.TIME_SAVED,
          metricValue: 20,
          formula: 'estimate - actual',
          parameters: {},
        },
        {
          featureId: testFeatureId,
          metricType: MetricType.SPEED_MULTIPLIER,
          metricValue: 1.5,
          formula: 'estimate / actual',
          parameters: {},
        },
        {
          featureId: testFeatureId,
          metricType: MetricType.COST_SAVINGS,
          metricValue: 3000,
          formula: 'timeSaved * hourlyRate',
          parameters: {},
        },
      ],
    });
  });

  afterEach(async () => {
    await prisma.calculatedMetric.deleteMany();
    await prisma.feature.deleteMany();
  });

  describe('GET /api/dashboard', () => {
    it('should get aggregated dashboard data', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.features).toBeInstanceOf(Array);
      expect(response.body.data.metrics).toBeInstanceOf(Array);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.summary.totalFeatures).toBeGreaterThan(0);
    });

    it('should filter dashboard data by date range', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .query({
          dateRangeStart: '2024-01-01',
          dateRangeEnd: '2024-01-31',
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should filter dashboard data by feature', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .query({
          featureId: testFeatureId,
        })
        .expect(200);

      expect(response.body.data.features).toHaveLength(1);
    });
  });

  describe('GET /api/dashboard/widgets/:widgetType', () => {
    it('should get TIME_SAVED_CHART widget data', async () => {
      const response = await request(app)
        .get('/api/dashboard/widgets/TIME_SAVED_CHART')
        .expect(200);

      expect(response.body.widgetType).toBe('TIME_SAVED_CHART');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.average).toBeDefined();
    });

    it('should get SPEED_MULTIPLIER_CHART widget data', async () => {
      const response = await request(app)
        .get('/api/dashboard/widgets/SPEED_MULTIPLIER_CHART')
        .expect(200);

      expect(response.body.widgetType).toBe('SPEED_MULTIPLIER_CHART');
      expect(response.body.data.average).toBeDefined();
    });

    it('should get FEATURE_LIST widget data', async () => {
      const response = await request(app)
        .get('/api/dashboard/widgets/FEATURE_LIST')
        .expect(200);

      expect(response.body.widgetType).toBe('FEATURE_LIST');
      expect(response.body.data.features).toBeInstanceOf(Array);
    });

    it('should return 500 for unknown widget type', async () => {
      await request(app)
        .get('/api/dashboard/widgets/UNKNOWN_WIDGET')
        .expect(500);
    });
  });

  describe('POST /api/dashboard/refresh', () => {
    it('should trigger dashboard refresh', async () => {
      const response = await request(app)
        .post('/api/dashboard/refresh')
        .send({ reason: 'manual_refresh' })
        .expect(200);

      expect(response.body.message).toBe('Dashboard refresh triggered');
    });
  });

  describe('GET /api/dashboard/stats', () => {
    it('should get dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(200);

      expect(response.body.websocket).toBeDefined();
      expect(response.body.websocket.totalConnections).toBeDefined();
    });
  });
});
