import { MetricCalculationService } from '../../../src/services/metric-calculation.service';
import { calculatedMetricRepository } from '../../../src/repositories/calculated-metric.repository';
import { featureRepository } from '../../../src/repositories/feature.repository';
import { MetricType } from '@prisma/client';

jest.mock('../../../src/repositories/calculated-metric.repository');
jest.mock('../../../src/repositories/feature.repository');

describe('MetricCalculationService', () => {
  let service: MetricCalculationService;

  beforeEach(() => {
    service = new MetricCalculationService();
    jest.clearAllMocks();
  });

  const mockFeature = {
    id: 'feature-1',
    featureId: 'PROJ-123',
    name: 'Test Feature',
    status: 'COMPLETED',
    currentPhase: 'TESTING',
    startedAt: new Date('2024-01-01'),
    completedAt: new Date('2024-01-10'),
    totalDuration: 4800, // 80 hours in minutes
    timeTracking: [
      { durationMinutes: 2400 }, // 40 hours
      { durationMinutes: 2400 }, // 40 hours
    ],
    estimate: { totalHours: 100 },
    jiraStory: null,
    githubCommits: [],
    githubPRs: [],
  };

  describe('calculateMetric - TIME_SAVED', () => {
    it('should calculate time saved correctly', async () => {
      (featureRepository.findById as jest.Mock).mockResolvedValue(mockFeature);
      (calculatedMetricRepository.findByFeatureAndType as jest.Mock).mockResolvedValue(null);
      (calculatedMetricRepository.create as jest.Mock).mockResolvedValue({});

      const result = await service.calculateMetric('feature-1', MetricType.TIME_SAVED);

      expect(result.metricType).toBe(MetricType.TIME_SAVED);
      expect(result.metricValue).toBe(20); // 100 estimated - 80 actual
      expect(result.formula).toBe('estimate - actual');
      expect(result.parameters.estimatedHours).toBe(100);
      expect(result.parameters.actualHours).toBe(80);
    });

    it('should handle missing estimate', async () => {
      const featureNoEstimate = { ...mockFeature, estimate: null };
      (featureRepository.findById as jest.Mock).mockResolvedValue(featureNoEstimate);
      (calculatedMetricRepository.findByFeatureAndType as jest.Mock).mockResolvedValue(null);
      (calculatedMetricRepository.create as jest.Mock).mockResolvedValue({});

      const result = await service.calculateMetric('feature-1', MetricType.TIME_SAVED, {
        estimatedHours: 50,
      });

      expect(result.metricValue).toBe(-30); // 50 estimated - 80 actual (negative = overrun)
    });
  });

  describe('calculateMetric - SPEED_MULTIPLIER', () => {
    it('should calculate speed multiplier correctly', async () => {
      (featureRepository.findById as jest.Mock).mockResolvedValue(mockFeature);
      (calculatedMetricRepository.findByFeatureAndType as jest.Mock).mockResolvedValue(null);
      (calculatedMetricRepository.create as jest.Mock).mockResolvedValue({});

      const result = await service.calculateMetric('feature-1', MetricType.SPEED_MULTIPLIER);

      expect(result.metricType).toBe(MetricType.SPEED_MULTIPLIER);
      expect(result.metricValue).toBe(1.25); // 100 / 80
      expect(result.formula).toBe('estimate / actual');
    });

    it('should handle division by zero', async () => {
      const featureNoTime = { ...mockFeature, timeTracking: [] };
      (featureRepository.findById as jest.Mock).mockResolvedValue(featureNoTime);
      (calculatedMetricRepository.findByFeatureAndType as jest.Mock).mockResolvedValue(null);
      (calculatedMetricRepository.create as jest.Mock).mockResolvedValue({});

      const result = await service.calculateMetric('feature-1', MetricType.SPEED_MULTIPLIER);

      expect(result.metricValue).toBe(0);
      expect(result.parameters.error).toBe('Division by zero');
    });
  });

  describe('calculateMetric - COST_SAVINGS', () => {
    it('should calculate cost savings with default hourly rate', async () => {
      (featureRepository.findById as jest.Mock).mockResolvedValue(mockFeature);
      (calculatedMetricRepository.findByFeatureAndType as jest.Mock).mockResolvedValue(null);
      (calculatedMetricRepository.create as jest.Mock).mockResolvedValue({});

      const result = await service.calculateMetric('feature-1', MetricType.COST_SAVINGS);

      expect(result.metricType).toBe(MetricType.COST_SAVINGS);
      expect(result.metricValue).toBe(3000); // 20 hours * $150
      expect(result.formula).toBe('timeSaved * hourlyRate');
    });

    it('should calculate cost savings with custom hourly rate', async () => {
      (featureRepository.findById as jest.Mock).mockResolvedValue(mockFeature);
      (calculatedMetricRepository.findByFeatureAndType as jest.Mock).mockResolvedValue(null);
      (calculatedMetricRepository.create as jest.Mock).mockResolvedValue({});

      const result = await service.calculateMetric('feature-1', MetricType.COST_SAVINGS, {
        hourlyRate: 200,
      });

      expect(result.metricValue).toBe(4000); // 20 hours * $200
    });
  });

  describe('calculateMetric - CYCLE_TIME', () => {
    it('should calculate cycle time correctly', async () => {
      (featureRepository.findById as jest.Mock).mockResolvedValue(mockFeature);
      (calculatedMetricRepository.findByFeatureAndType as jest.Mock).mockResolvedValue(null);
      (calculatedMetricRepository.create as jest.Mock).mockResolvedValue({});

      const result = await service.calculateMetric('feature-1', MetricType.CYCLE_TIME);

      expect(result.metricType).toBe(MetricType.CYCLE_TIME);
      expect(result.metricValue).toBeGreaterThan(0);
      expect(result.formula).toBe('completedAt - startedAt');
    });

    it('should handle incomplete feature', async () => {
      const incompleteFeature = { ...mockFeature, completedAt: null };
      (featureRepository.findById as jest.Mock).mockResolvedValue(incompleteFeature);
      (calculatedMetricRepository.findByFeatureAndType as jest.Mock).mockResolvedValue(null);
      (calculatedMetricRepository.create as jest.Mock).mockResolvedValue({});

      const result = await service.calculateMetric('feature-1', MetricType.CYCLE_TIME);

      expect(result.metricValue).toBe(0);
      expect(result.parameters.error).toBe('Feature not completed');
    });
  });

  describe('calculateMultipleMetrics', () => {
    it('should calculate multiple metrics', async () => {
      (featureRepository.findById as jest.Mock).mockResolvedValue(mockFeature);
      (calculatedMetricRepository.findByFeatureAndType as jest.Mock).mockResolvedValue(null);
      (calculatedMetricRepository.create as jest.Mock).mockResolvedValue({});

      const results = await service.calculateMultipleMetrics('feature-1', [
        MetricType.TIME_SAVED,
        MetricType.SPEED_MULTIPLIER,
        MetricType.COST_SAVINGS,
      ]);

      expect(results).toHaveLength(3);
      expect(results[0].metricType).toBe(MetricType.TIME_SAVED);
      expect(results[1].metricType).toBe(MetricType.SPEED_MULTIPLIER);
      expect(results[2].metricType).toBe(MetricType.COST_SAVINGS);
    });

    it('should continue on individual metric errors', async () => {
      (featureRepository.findById as jest.Mock)
        .mockResolvedValueOnce(mockFeature)
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce(mockFeature);
      (calculatedMetricRepository.findByFeatureAndType as jest.Mock).mockResolvedValue(null);
      (calculatedMetricRepository.create as jest.Mock).mockResolvedValue({});

      const results = await service.calculateMultipleMetrics('feature-1', [
        MetricType.TIME_SAVED,
        MetricType.SPEED_MULTIPLIER,
        MetricType.COST_SAVINGS,
      ]);

      expect(results.length).toBeLessThan(3);
    });
  });

  describe('storeMetric', () => {
    it('should update existing metric', async () => {
      const existingMetric = { id: 'metric-1', metricType: MetricType.TIME_SAVED };
      (featureRepository.findById as jest.Mock).mockResolvedValue(mockFeature);
      (calculatedMetricRepository.findByFeatureAndType as jest.Mock).mockResolvedValue(existingMetric);
      (calculatedMetricRepository.update as jest.Mock).mockResolvedValue({});

      await service.calculateMetric('feature-1', MetricType.TIME_SAVED);

      expect(calculatedMetricRepository.update).toHaveBeenCalledWith(
        'metric-1',
        expect.objectContaining({
          metricValue: expect.any(Number),
          formula: expect.any(String),
        })
      );
    });

    it('should create new metric if not exists', async () => {
      (featureRepository.findById as jest.Mock).mockResolvedValue(mockFeature);
      (calculatedMetricRepository.findByFeatureAndType as jest.Mock).mockResolvedValue(null);
      (calculatedMetricRepository.create as jest.Mock).mockResolvedValue({});

      await service.calculateMetric('feature-1', MetricType.TIME_SAVED);

      expect(calculatedMetricRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metricType: MetricType.TIME_SAVED,
          metricValue: expect.any(Number),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should throw error for non-existent feature', async () => {
      (featureRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.calculateMetric('non-existent', MetricType.TIME_SAVED)
      ).rejects.toThrow('Feature not found');
    });

    it('should throw error for unknown metric type', async () => {
      (featureRepository.findById as jest.Mock).mockResolvedValue(mockFeature);

      await expect(
        service.calculateMetric('feature-1', 'UNKNOWN_METRIC' as MetricType)
      ).rejects.toThrow('Unknown metric type');
    });
  });
});
