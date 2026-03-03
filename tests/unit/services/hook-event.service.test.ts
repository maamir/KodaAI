import { HookEventService } from '../../../src/services/hook-event.service';
import { HookEventRepository } from '../../../src/repositories/hook-event.repository';
import { HookEventType } from '@prisma/client';

jest.mock('../../../src/repositories/hook-event.repository');

describe('HookEventService', () => {
  let service: HookEventService;
  let mockRepository: jest.Mocked<HookEventRepository>;

  beforeEach(() => {
    mockRepository = new HookEventRepository() as jest.Mocked<HookEventRepository>;
    service = new HookEventService(mockRepository);
    jest.clearAllMocks();
  });

  describe('recordEvent', () => {
    it('should record hook event', async () => {
      const mockEvent = {
        id: '1',
        featureId: 'feature-1',
        eventType: HookEventType.FILE_EDITED,
        filePath: '/src/app.ts',
        metadata: { lines: 10 },
        timestamp: new Date(),
        createdAt: new Date(),
      };

      mockRepository.create.mockResolvedValue(mockEvent);

      const result = await service.recordEvent({
        featureId: 'feature-1',
        eventType: HookEventType.FILE_EDITED,
        filePath: '/src/app.ts',
        metadata: { lines: 10 },
      });

      expect(result).toEqual(mockEvent);
    });
  });

  describe('getEventsByFeature', () => {
    it('should get all events for a feature', async () => {
      const mockEvents = [
        {
          id: '1',
          featureId: 'feature-1',
          eventType: HookEventType.FILE_EDITED,
          filePath: '/src/app.ts',
          metadata: {},
          timestamp: new Date(),
          createdAt: new Date(),
        },
      ];

      mockRepository.findByFeatureId.mockResolvedValue(mockEvents);

      const result = await service.getEventsByFeature('feature-1');

      expect(result).toEqual(mockEvents);
    });
  });

  describe('getEventStatistics', () => {
    it('should calculate event statistics', async () => {
      const mockEvents = [
        {
          id: '1',
          featureId: 'feature-1',
          eventType: HookEventType.FILE_EDITED,
          filePath: '/src/app.ts',
          metadata: {},
          timestamp: new Date(),
          createdAt: new Date(),
        },
        {
          id: '2',
          featureId: 'feature-1',
          eventType: HookEventType.FILE_EDITED,
          filePath: '/src/index.ts',
          metadata: {},
          timestamp: new Date(),
          createdAt: new Date(),
        },
        {
          id: '3',
          featureId: 'feature-1',
          eventType: HookEventType.PROMPT_SUBMIT,
          filePath: null,
          metadata: {},
          timestamp: new Date(),
          createdAt: new Date(),
        },
      ];

      mockRepository.findByFeatureId.mockResolvedValue(mockEvents);

      const result = await service.getEventStatistics('feature-1');

      expect(result).toEqual({
        totalEvents: 3,
        eventsByType: {
          [HookEventType.FILE_EDITED]: 2,
          [HookEventType.PROMPT_SUBMIT]: 1,
        },
        uniqueFiles: 2,
      });
    });
  });
});
