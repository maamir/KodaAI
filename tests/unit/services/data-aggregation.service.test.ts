import { DataAggregationService } from '../../../src/services/data-aggregation.service';
import { FeatureRepository } from '../../../src/repositories/feature.repository';
import { TimeTrackingRepository } from '../../../src/repositories/time-tracking.repository';
import { HookEventRepository } from '../../../src/repositories/hook-event.repository';

jest.mock('../../../src/repositories/feature.repository');
jest.mock('../../../src/repositories/time-tracking.repository');
jest.mock('../../../src/repositories/hook-event.repository');

describe('DataAggregationService', () => {
  let service: DataAggregationService;
  let mockFeatureRepo: jest.Mocked<FeatureRepository>;
  let mockTimeRepo: jest.Mocked<TimeTrackingRepository>;
  let mockHookRepo: jest.Mocked<HookEventRepository>;

  beforeEach(() => {
    mockFeatureRepo = new FeatureRepository() as jest.Mocked<FeatureRepository>;
    mockTimeRepo = new TimeTrackingRepository() as jest.Mocked<TimeTrackingRepository>;
    mockHookRepo = new HookEventRepository() as jest.Mocked<HookEventRepository>;
    service = new DataAggregationService(mockFeatureRepo, mockTimeRepo, mockHookRepo);
    jest.clearAllMocks();
  });

  describe('aggregateFeatureMetrics', () => {
    it('should aggregate all metrics for a feature', async () => {
      const mockFeature = {
        id: '1',
        featureId: 'PROJ-123',
        name: 'Test Feature',
      };

      const mockTimeEntries = [
        { duration: 1800 },
        { duration: 3600 },
      ];

      const mockHookEvents = [
        { eventType: 'FILE_EDITED' },
        { eventType: 'FILE_EDITED' },
        { eventType: 'PROMPT_SUBMIT' },
      ];

      mockFeatureRepo.findById.mockResolvedValue(mockFeature as any);
      mockTimeRepo.findByFeatureId.mockResolvedValue(mockTimeEntries as any);
      mockHookRepo.findByFeatureId.mockResolvedValue(mockHookEvents as any);

      const result = await service.aggregateFeatureMetrics('1');

      expect(result).toMatchObject({
        featureId: 'PROJ-123',
        totalDuration: 5400,
        totalEvents: 3,
      });
    });
  });
});
