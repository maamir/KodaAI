import { CalculatedMetricRepository } from '../../../src/repositories/calculated-metric.repository';
import { prisma } from '../../../src/infrastructure/database';
import { MetricType } from '@prisma/client';

jest.mock('../../../src/infrastructure/database', () => ({
  prisma: {
    calculatedMetric: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('CalculatedMetricRepository', () => {
  let repository: CalculatedMetricRepository;

  beforeEach(() => {
    repository = new CalculatedMetricRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new calculated metric', async () => {
      const mockMetric = {
        id: '1',
        featureId: 'feature-1',
        metricType: MetricType.TIME_SAVED,
        metricValue: 120,
        formula: 'estimated - actual',
        parameters: { estimated: 200, actual: 80 },
        calculatedAt: new Date(),
        validUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.calculatedMetric.create as jest.Mock).mockResolvedValue(mockMetric);

      const result = await repository.create({
        feature: { connect: { id: 'feature-1' } },
        metricType: MetricType.TIME_SAVED,
        metricValue: 120,
        formula: 'estimated - actual',
        parameters: { estimated: 200, actual: 80 },
      });

      expect(result).toEqual(mockMetric);
      expect(prisma.calculatedMetric.create).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find metric by id with relations', async () => {
      const mockMetric = {
        id: '1',
        featureId: 'feature-1',
        metricType: MetricType.TIME_SAVED,
        metricValue: 120,
        formula: 'estimated - actual',
        parameters: {},
        calculatedAt: new Date(),
        validUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        feature: { id: 'feature-1', name: 'Test Feature' },
      };

      (prisma.calculatedMetric.findUnique as jest.Mock).mockResolvedValue(mockMetric);

      const result = await repository.findById('1');

      expect(result).toEqual(mockMetric);
      expect(prisma.calculatedMetric.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { feature: true },
      });
    });

    it('should return null if metric not found', async () => {
      (prisma.calculatedMetric.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('999');

      expect(result).toBeNull();
    });
  });

  describe('findByFeatureId', () => {
    it('should find all metrics for a feature', async () => {
      const mockMetrics = [
        {
          id: '1',
          featureId: 'feature-1',
          metricType: MetricType.TIME_SAVED,
          metricValue: 120,
          formula: 'test',
          parameters: {},
          calculatedAt: new Date(),
          validUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.calculatedMetric.findMany as jest.Mock).mockResolvedValue(mockMetrics);

      const result = await repository.findByFeatureId('feature-1');

      expect(result).toEqual(mockMetrics);
      expect(prisma.calculatedMetric.findMany).toHaveBeenCalledWith({
        where: { featureId: 'feature-1' },
        orderBy: { calculatedAt: 'desc' },
      });
    });
  });

  describe('findByFeatureAndType', () => {
    it('should find latest metric by feature and type', async () => {
      const mockMetric = {
        id: '1',
        featureId: 'feature-1',
        metricType: MetricType.TIME_SAVED,
        metricValue: 120,
        formula: 'test',
        parameters: {},
        calculatedAt: new Date(),
        validUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.calculatedMetric.findFirst as jest.Mock).mockResolvedValue(mockMetric);

      const result = await repository.findByFeatureAndType('feature-1', MetricType.TIME_SAVED);

      expect(result).toEqual(mockMetric);
      expect(prisma.calculatedMetric.findFirst).toHaveBeenCalledWith({
        where: { featureId: 'feature-1', metricType: MetricType.TIME_SAVED },
        orderBy: { calculatedAt: 'desc' },
      });
    });
  });

  describe('findValidMetrics', () => {
    it('should find all valid metrics for a feature', async () => {
      const mockMetrics = [
        {
          id: '1',
          featureId: 'feature-1',
          metricType: MetricType.TIME_SAVED,
          metricValue: 120,
          formula: 'test',
          parameters: {},
          calculatedAt: new Date(),
          validUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.calculatedMetric.findMany as jest.Mock).mockResolvedValue(mockMetrics);

      const result = await repository.findValidMetrics('feature-1');

      expect(result).toEqual(mockMetrics);
      expect(prisma.calculatedMetric.findMany).toHaveBeenCalled();
    });
  });

  describe('deleteExpired', () => {
    it('should delete expired metrics', async () => {
      (prisma.calculatedMetric.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });

      const result = await repository.deleteExpired();

      expect(result).toBe(5);
      expect(prisma.calculatedMetric.deleteMany).toHaveBeenCalled();
    });
  });

  describe('findMetricTrend', () => {
    it('should find metric trend over time', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockMetrics = [
        {
          id: '1',
          featureId: 'feature-1',
          metricType: MetricType.TIME_SAVED,
          metricValue: 100,
          formula: 'test',
          parameters: {},
          calculatedAt: new Date('2024-01-15'),
          validUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.calculatedMetric.findMany as jest.Mock).mockResolvedValue(mockMetrics);

      const result = await repository.findMetricTrend(
        'feature-1',
        MetricType.TIME_SAVED,
        startDate,
        endDate
      );

      expect(result).toEqual(mockMetrics);
      expect(prisma.calculatedMetric.findMany).toHaveBeenCalledWith({
        where: {
          featureId: 'feature-1',
          metricType: MetricType.TIME_SAVED,
          calculatedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { calculatedAt: 'asc' },
      });
    });
  });

  describe('update', () => {
    it('should update a metric', async () => {
      const mockMetric = {
        id: '1',
        featureId: 'feature-1',
        metricType: MetricType.TIME_SAVED,
        metricValue: 150,
        formula: 'updated',
        parameters: {},
        calculatedAt: new Date(),
        validUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.calculatedMetric.update as jest.Mock).mockResolvedValue(mockMetric);

      const result = await repository.update('1', { metricValue: 150 });

      expect(result).toEqual(mockMetric);
    });
  });

  describe('delete', () => {
    it('should delete a metric', async () => {
      const mockMetric = {
        id: '1',
        featureId: 'feature-1',
        metricType: MetricType.TIME_SAVED,
        metricValue: 120,
        formula: 'test',
        parameters: {},
        calculatedAt: new Date(),
        validUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.calculatedMetric.delete as jest.Mock).mockResolvedValue(mockMetric);

      const result = await repository.delete('1');

      expect(result).toEqual(mockMetric);
    });
  });
});
