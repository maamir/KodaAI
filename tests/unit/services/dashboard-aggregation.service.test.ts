import { DashboardAggregationService } from '../../../src/services/dashboard-aggregation.service';
import { featureRepository } from '../../../src/repositories/feature.repository';
import { calculatedMetricRepository } from '../../../src/repositories/calculated-metric.repository';
import { FeatureStatus, MetricType } from '@prisma/client';

jest.mock('../../../src/repositories/feature.repository');
jest.mock('../../../src/repositories/calculated-metric.repository');

describe('DashboardAggregationService', () => {
  let service: DashboardAggregationService;

  beforeEach(() => {
    service = new DashboardAggregationService();
    jest.clearAllMocks();
  });

  const mockFeatures = [
    {
      id: 'feature-1',
      featureId: 'PROJ-123',
      name: 'Feature 1',
      status: FeatureStatus.COMPLETED,
      startedAt: new Date('2024-01-01'),
      completedAt: new Date('2024-01-10'),
    },
    {
      id: 'feature-2',
      featureId: 'PROJ-124',
      name: 'Feature 2',
      status: FeatureStatus.IN_PROGRESS,
      startedAt: new Date('2024-01-15'),
      completedAt: null,
    },
  ];

  const mockMetrics = [
    {
      id: 'metric-1',
      featureId: 'feature-1',
      metricType: MetricType.TIME_SAVED,
      metricValue: 20,
      calculatedAt: new Date(),
    },
    {
      id: 'metric-2',
      featureId: 'feature-1',
      metricType: MetricType.SPEED_MULTIPLIER,
      metricValue: 1.5,
      calculatedAt: new Date(),
    },
    {
      id: 'metric-3',
      featureId: 'feature-1',
      metricType: MetricType.COST_SAVINGS,
      metricValue: 3000,
      calculatedAt: new Date(),
    },
  ];

  describe('getDashboardData', () => {
    it('should aggregate dashboard data successfully', async () => {
      (featureRepository.findAll as jest.Mock).mockResolvedValue(mockFeatures);
      (calculatedMetricRepository.findAll as jest.Mock).mockResolvedValue(mockMetrics);

      const result = await service.getDashboardData('user-1');

      expect(result.features).toHaveLength(2);
      expect(result.metrics).toHaveLength(3);
      expect(result.summary.totalFeatures).toBe(2);
      expect(result.summary.completedFeatures).toBe(1);
      expect(result.summary.totalTimeSaved).toBe(20);
      expect(result.summary.totalCostSavings).toBe(3000);
    });

    it('should apply date range filters', async () => {
      (featureRepository.findAll as jest.Mock).mockResolvedValue(mockFeatures);
      (calculatedMetricRepository.findAll as jest.Mock).mockResolvedValue(mockMetrics);

      await service.getDashboardData('user-1', {
        dateRangeStart: new Date('2024-01-01'),
        dateRangeEnd: new Date('2024-01-31'),
      });

      expect(featureRepository.findAll).toHaveBeenCalledWith({
        where: expect.objectContaining({
          startedAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        }),
      });
    });

    it('should apply status filters', async () => {
      (featureRepository.findAll as jest.Mock).mockResolvedValue(mockFeatures);
      (calculatedMetricRepository.findAll as jest.Mock).mockResolvedValue(mockMetrics);

      await service.getDashboardData('user-1', {
        status: [FeatureStatus.COMPLETED],
      });

      expect(featureRepository.findAll).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: { in: [FeatureStatus.COMPLETED] },
        }),
      });
    });
  });

  describe('getWidgetData - TIME_SAVED_CHART', () => {
    it('should return time saved chart data', async () => {
      (featureRepository.findAll as jest.Mock).mockResolvedValue(mockFeatures);
      (calculatedMetricRepository.findAll as jest.Mock).mockResolvedValue([mockMetrics[0]]);

      const result = await service.getWidgetData('TIME_SAVED_CHART');

      expect(result.widgetType).toBe('TIME_SAVED_CHART');
      expect(result.data.total).toBe(20);
      expect(result.data.average).toBe(20);
      expect(result.data.count).toBe(1);
      expect(result.data.dataPoints).toHaveLength(1);
    });
  });

  describe('getWidgetData - SPEED_MULTIPLIER_CHART', () => {
    it('should return speed multiplier chart data', async () => {
      (featureRepository.findAll as jest.Mock).mockResolvedValue(mockFeatures);
      (calculatedMetricRepository.findAll as jest.Mock).mockResolvedValue([mockMetrics[1]]);

      const result = await service.getWidgetData('SPEED_MULTIPLIER_CHART');

      expect(result.widgetType).toBe('SPEED_MULTIPLIER_CHART');
      expect(result.data.average).toBe(1.5);
      expect(result.data.min).toBe(1.5);
      expect(result.data.max).toBe(1.5);
    });

    it('should handle empty metrics', async () => {
      (featureRepository.findAll as jest.Mock).mockResolvedValue(mockFeatures);
      (calculatedMetricRepository.findAll as jest.Mock).mockResolvedValue([]);

      const result = await service.getWidgetData('SPEED_MULTIPLIER_CHART');

      expect(result.data.average).toBe(0);
      expect(result.data.count).toBe(0);
    });
  });

  describe('getWidgetData - COST_SAVINGS_CHART', () => {
    it('should return cost savings chart data with monthly breakdown', async () => {
      (featureRepository.findAll as jest.Mock).mockResolvedValue(mockFeatures);
      (calculatedMetricRepository.findAll as jest.Mock).mockResolvedValue([mockMetrics[2]]);

      const result = await service.getWidgetData('COST_SAVINGS_CHART');

      expect(result.widgetType).toBe('COST_SAVINGS_CHART');
      expect(result.data.total).toBe(3000);
      expect(result.data.byMonth).toBeDefined();
    });
  });

  describe('getWidgetData - FEATURE_LIST', () => {
    it('should return feature list with metrics', async () => {
      (featureRepository.findAll as jest.Mock).mockResolvedValue(mockFeatures);
      (calculatedMetricRepository.findByFeatureAndType as jest.Mock)
        .mockResolvedValueOnce(mockMetrics[0])
        .mockResolvedValueOnce(mockMetrics[1])
        .mockResolvedValueOnce(mockMetrics[2]);

      const result = await service.getWidgetData('FEATURE_LIST');

      expect(result.widgetType).toBe('FEATURE_LIST');
      expect(result.data.features).toBeDefined();
      expect(result.data.total).toBe(2);
    });

    it('should limit to 10 features', async () => {
      const manyFeatures = Array(15).fill(null).map((_, i) => ({
        ...mockFeatures[0],
        id: `feature-${i}`,
        featureId: `PROJ-${i}`,
      }));
      (featureRepository.findAll as jest.Mock).mockResolvedValue(manyFeatures);
      (calculatedMetricRepository.findByFeatureAndType as jest.Mock).mockResolvedValue(null);

      const result = await service.getWidgetData('FEATURE_LIST');

      expect(result.data.features.length).toBeLessThanOrEqual(10);
    });
  });

  describe('getWidgetData - SUMMARY_STATS', () => {
    it('should return summary statistics', async () => {
      (featureRepository.findAll as jest.Mock).mockResolvedValue(mockFeatures);
      (calculatedMetricRepository.findAll as jest.Mock).mockResolvedValue(mockMetrics);

      const result = await service.getWidgetData('SUMMARY_STATS');

      expect(result.widgetType).toBe('SUMMARY_STATS');
      expect(result.data.totalFeatures).toBe(2);
      expect(result.data.completedFeatures).toBe(1);
      expect(result.data.inProgressFeatures).toBe(1);
      expect(result.data.completionRate).toBe(50);
    });
  });

  describe('getWidgetData - TREND_CHART', () => {
    it('should return trend data with weekly grouping', async () => {
      const metricsWithDates = [
        { ...mockMetrics[1], calculatedAt: new Date('2024-01-01') },
        { ...mockMetrics[1], calculatedAt: new Date('2024-01-08') },
        { ...mockMetrics[1], calculatedAt: new Date('2024-01-15') },
      ];
      (featureRepository.findAll as jest.Mock).mockResolvedValue(mockFeatures);
      (calculatedMetricRepository.findAll as jest.Mock).mockResolvedValue(metricsWithDates);

      const result = await service.getWidgetData('TREND_CHART', {
        dateRangeStart: new Date('2024-01-01'),
        dateRangeEnd: new Date('2024-01-31'),
      });

      expect(result.widgetType).toBe('TREND_CHART');
      expect(result.data.trendData).toBeDefined();
      expect(result.data.trend).toMatch(/INCREASING|DECREASING|STABLE/);
    });
  });

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      (featureRepository.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        service.getDashboardData('user-1')
      ).rejects.toThrow('Database error');
    });

    it('should throw error for unknown widget type', async () => {
      (featureRepository.findAll as jest.Mock).mockResolvedValue(mockFeatures);

      await expect(
        service.getWidgetData('UNKNOWN_WIDGET')
      ).rejects.toThrow('Unknown widget type');
    });
  });

  describe('calculateSummary', () => {
    it('should calculate summary with zero metrics', async () => {
      (featureRepository.findAll as jest.Mock).mockResolvedValue(mockFeatures);
      (calculatedMetricRepository.findAll as jest.Mock).mockResolvedValue([]);

      const result = await service.getDashboardData('user-1');

      expect(result.summary.totalTimeSaved).toBe(0);
      expect(result.summary.averageSpeedMultiplier).toBe(0);
      expect(result.summary.totalCostSavings).toBe(0);
    });
  });
});
