import { HookEventRepository } from '../../../src/repositories/hook-event.repository';
import { prisma } from '../../../src/infrastructure/database';
import { HookEventType } from '@prisma/client';

jest.mock('../../../src/infrastructure/database', () => ({
  prisma: {
    hookEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('HookEventRepository', () => {
  let repository: HookEventRepository();

  beforeEach(() => {
    repository = new HookEventRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create hook event', async () => {
      const mockEvent = {
        id: '1',
        featureId: 'feature-1',
        eventType: HookEventType.FILE_EDITED,
        filePath: '/src/app.ts',
        metadata: { lines: 10 },
        timestamp: new Date(),
        createdAt: new Date(),
      };

      (prisma.hookEvent.create as jest.Mock).mockResolvedValue(mockEvent);

      const result = await repository.create({
        featureId: 'feature-1',
        eventType: HookEventType.FILE_EDITED,
        filePath: '/src/app.ts',
        metadata: { lines: 10 },
      });

      expect(result).toEqual(mockEvent);
    });
  });

  describe('findByFeatureId', () => {
    it('should find all hook events for a feature', async () => {
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
          eventType: HookEventType.PROMPT_SUBMIT,
          filePath: null,
          metadata: { prompt: 'test' },
          timestamp: new Date(),
          createdAt: new Date(),
        },
      ];

      (prisma.hookEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const result = await repository.findByFeatureId('feature-1');

      expect(result).toEqual(mockEvents);
    });
  });

  describe('findByEventType', () => {
    it('should find hook events by type', async () => {
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

      (prisma.hookEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const result = await repository.findByEventType('feature-1', HookEventType.FILE_EDITED);

      expect(result).toEqual(mockEvents);
    });
  });

  describe('countByFeatureId', () => {
    it('should count hook events for a feature', async () => {
      (prisma.hookEvent.count as jest.Mock).mockResolvedValue(42);

      const result = await repository.countByFeatureId('feature-1');

      expect(result).toBe(42);
    });
  });
});
