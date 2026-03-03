import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/database';
import { FeatureStatus, Phase, MetricType } from '@prisma/client';

describe('Metrics API Integration Tests', () => {
  let testFeatureId: string;
  let testMetricId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.calculatedMetric.deleteMany();
    await prisma.feature.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create test feature with time tracking
    const feature = await prisma.feature.create({
      data: {
        featureId: 'TEST-003',
        name: 'Test Feature for Metrics',
        status: FeatureStatus.IN_PROGRESS,
        currentPhase: Phase.CONSTRUCTION,
        startedAt: new Date('2024-01-01'),
        totalDuration: 2400, // 40 hours in minutes
        timeTracking: {
          create: [
            {
              phase: Phase.INCEPTION,
              startTime: new Date('2024-01-01'),
              endTime: new Date('2024-01-02'),
              durationMinutes: 1200,
              isPaused: false,
            },
            {
              phase: Phase.CONSTRUCTION,
              startTime: new Date('2024-01-03'),
              endTime: null,
              durationMinutes: 1200,
              isPaused: false,
            },
          ],
        },
        estimate: {
          create: {
            totalHours: 100,
            source: 'MANUAL',
          },
        },
      },
    });
    testFeatureId = feature.id;
  });

  afterEach(async () => {
    await prisma.calculatedMetric.deleteMany();
    await prisma.timeTracking.deleteMany();
    await prisma.estimate.deleteMany();
    await prisma.feature.deleteMany();
  });

  describe('POST /api/metrics/calculate', () => {
    it('should calculate TIME_SAVED metric', async () => {
      const response = await request(app)
        .post('/api/metrics/calculate')
        .send({
          featureId: testFeatureId,
          metricType: MetricType.TIME_SAVED,
        })
        .expect(200);

      expect(response.body.metricType).toBe(MetricType.TIME_SAVED);
      expect(response.body.metricValue).toBeDefined();
      expect(response.body.formula).toBe('estimate - actual');
    });

    it('should calculate SPEED_MULTIPLIER metric', async () => {
      const response = await request(app)
        .post('/api/metrics/calculate')
        .send({
          featureId: testFeatureId,
          metricType: MetricType.SPEED_MULTIPLIER,
        })
        .expect(200);

      expect(response.body.metricType).toBe(MetricType.SPEED_MULTIPLIER);
      expect(response.body.formula).toBe('estimate / actual');
    });

    it('should calculate COST_SAVINGS metric', async () => {
      const response = await request(app)
        .post('/api/metrics/calculate')
        .send({
          featureId: testFeatureId,
          metricType: MetricType.COST_SAVINGS,
          parameters: { hourlyRate: 200 },
        })
        .expect(200);

      expect(response.body.metricType).toBe(MetricType.COST_SAVINGS);
      expect(response.body.formula).toBe('timeSaved * hourlyRate');
    });

    it('should return 400 for invalid metric type', async () => {
      await request(app)
        .post('/api/metrics/calculate')
        .send({
          featureId: testFeatureId,
          metricType: 'INVALID_TYPE',
        })
        .expect(400);
    });

    it('should return 400 for missing featureId', async () => {
      await request(app)
        .post('/api/metrics/calculate')
        .send({
          metricType: MetricType.TIME_SAVED,
        })
        .expect(400);
    });
  });

  describe('POST /api/metrics/calculate-batch', () => {
    it('should calculate multiple metrics', async () => {
      const response = await request(app)
        .post('/api/metrics/calculate-batch')
        .send({
          featureId: testFeatureId,
          metricTypes: [
            MetricType.TIME_SAVED,
            MetricType.SPEED_MULTIPLIER,
            MetricType.COST_SAVINGS,
          ],
        })
        .expect(200);

      expect(response.body.featureId).toBe(testFeatureId);
      expect(response.body.metricsCalculated).toBe(3);
      expect(response.body.results).toHaveLength(3);
    });

    it('should calculate all metrics when metricTypes not specified', async () => {
      const response = await request(app)
        .post('/api/metrics/calculate-batch')
        .send({
          featureId: testFeatureId,
        })
        .expect(200);

      expect(response.body.metricsCalculated).toBeGreaterThan(0);
    });
  });

  describe('GET /api/metrics', () => {
    beforeEach(async () => {
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
        ],
      });
    });

    it('should list metrics with pagination', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .query({ page: 1, pageSize: 10 })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
    });

    it('should filter metrics by feature', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .query({ featureId: testFeatureId })
        .expect(200);

      expect(response.body.data.every((m: any) => m.featureId === testFeatureId)).toBe(true);
    });

    it('should filter metrics by type', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .query({ metricType: MetricType.TIME_SAVED })
        .expect(200);

      expect(response.body.data.every((m: any) => m.metricType === MetricType.TIME_SAVED)).toBe(true);
    });

    it('should filter metrics by date range', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .query({
          dateRangeStart: '2024-01-01',
          dateRangeEnd: '2024-12-31',
        })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/metrics/feature/:featureId', () => {
    beforeEach(async () => {
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
        ],
      });
    });

    it('should get all metrics for a feature', async () => {
      const response = await request(app)
        .get(`/api/metrics/feature/${testFeatureId}`)
        .expect(200);

      expect(response.body.featureId).toBe(testFeatureId);
      expect(response.body.metrics).toHaveLength(2);
      expect(response.body.count).toBe(2);
    });
  });

  describe('GET /api/metrics/feature/:featureId/:metricType', () => {
    beforeEach(async () => {
      const metric = await prisma.calculatedMetric.create({
        data: {
          featureId: testFeatureId,
          metricType: MetricType.TIME_SAVED,
          metricValue: 20,
          formula: 'estimate - actual',
          parameters: {},
        },
      });
      testMetricId = metric.id;
    });

    it('should get specific metric for a feature', async () => {
      const response = await request(app)
        .get(`/api/metrics/feature/${testFeatureId}/${MetricType.TIME_SAVED}`)
        .expect(200);

      expect(response.body.featureId).toBe(testFeatureId);
      expect(response.body.metricType).toBe(MetricType.TIME_SAVED);
    });

    it('should return 404 for non-existent metric', async () => {
      await request(app)
        .get(`/api/metrics/feature/${testFeatureId}/${MetricType.DEFECT_RATE}`)
        .expect(404);
    });
  });

  describe('GET /api/metrics/trend/:featureId/:metricType', () => {
    beforeEach(async () => {
      // Create metrics over time
      await prisma.calculatedMetric.createMany({
        data: [
          {
            featureId: testFeatureId,
            metricType: MetricType.SPEED_MULTIPLIER,
            metricValue: 1.2,
            formula: 'estimate / actual',
            parameters: {},
            calculatedAt: new Date('2024-01-01'),
          },
          {
            featureId: testFeatureId,
            metricType: MetricType.SPEED_MULTIPLIER,
            metricValue: 1.5,
            formula: 'estimate / actual',
            parameters: {},
            calculatedAt: new Date('2024-01-15'),
          },
          {
            featureId: testFeatureId,
            metricType: MetricType.SPEED_MULTIPLIER,
            metricValue: 1.8,
            formula: 'estimate / actual',
            parameters: {},
            calculatedAt: new Date('2024-01-30'),
          },
        ],
      });
    });

    it('should get metric trend over time', async () => {
      const response = await request(app)
        .get(`/api/metrics/trend/${testFeatureId}/${MetricType.SPEED_MULTIPLIER}`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
        .expect(200);

      expect(response.body.featureId).toBe(testFeatureId);
      expect(response.body.metricType).toBe(MetricType.SPEED_MULTIPLIER);
      expect(response.body.dataPoints).toHaveLength(3);
      expect(response.body.trend).toMatch(/INCREASING|DECREASING|STABLE/);
      expect(response.body.changePercentage).toBeDefined();
    });

    it('should return 400 for missing date range', async () => {
      await request(app)
        .get(`/api/metrics/trend/${testFeatureId}/${MetricType.SPEED_MULTIPLIER}`)
        .expect(400);
    });
  });

  describe('DELETE /api/metrics/:id', () => {
    beforeEach(async () => {
      const metric = await prisma.calculatedMetric.create({
        data: {
          featureId: testFeatureId,
          metricType: MetricType.TIME_SAVED,
          metricValue: 20,
          formula: 'estimate - actual',
          parameters: {},
        },
      });
      testMetricId = metric.id;
    });

    it('should delete metric', async () => {
      await request(app)
        .delete(`/api/metrics/${testMetricId}`)
        .expect(204);

      const deleted = await prisma.calculatedMetric.findUnique({
        where: { id: testMetricId },
      });
      expect(deleted).toBeNull();
    });
  });
});
