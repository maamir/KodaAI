import { TimeTrackingRepository } from '../../../src/repositories/time-tracking.repository';
import { prisma } from '../../../src/infrastructure/database';
import { Phase } from '@prisma/client';

jest.mock('../../../src/infrastructure/database', () => ({
  prisma: {
    timeTracking: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('TimeTrackingRepository', () => {
  let repository: TimeTrackingRepository;

  beforeEach(() => {
    repository = new TimeTrackingRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create time tracking entry', async () => {
      const mockEntry = {
        id: '1',
        featureId: 'feature-1',
        phase: Phase.INCEPTION,
        startTime: new Date(),
        endTime: null,
        duration: 0,
        isPaused: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.timeTracking.create as jest.Mock).mockResolvedValue(mockEntry);

      const result = await repository.create({
        featureId: 'feature-1',
        phase: Phase.INCEPTION,
        startTime: new Date(),
      });

      expect(result).toEqual(mockEntry);
    });
  });

  describe('findByFeatureId', () => {
    it('should find all time tracking entries for a feature', async () => {
      const mockEntries = [
        {
          id: '1',
          featureId: 'feature-1',
          phase: Phase.INCEPTION,
          startTime: new Date(),
          endTime: new Date(),
          duration: 1800,
          isPaused: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          featureId: 'feature-1',
          phase: Phase.CONSTRUCTION,
          startTime: new Date(),
          endTime: null,
          duration: 0,
          isPaused: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.timeTracking.findMany as jest.Mock).mockResolvedValue(mockEntries);

      const result = await repository.findByFeatureId('feature-1');

      expect(result).toEqual(mockEntries);
      expect(prisma.timeTracking.findMany).toHaveBeenCalledWith({
        where: { featureId: 'feature-1' },
        orderBy: { startTime: 'asc' },
      });
    });
  });

  describe('findActiveTracking', () => {
    it('should find active time tracking entry', async () => {
      const mockEntry = {
        id: '1',
        featureId: 'feature-1',
        phase: Phase.CONSTRUCTION,
        startTime: new Date(),
        endTime: null,
        duration: 0,
        isPaused: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.timeTracking.findMany as jest.Mock).mockResolvedValue([mockEntry]);

      const result = await repository.findActiveTracking('feature-1');

      expect(result).toEqual(mockEntry);
      expect(prisma.timeTracking.findMany).toHaveBeenCalledWith({
        where: {
          featureId: 'feature-1',
          endTime: null,
        },
        take: 1,
      });
    });

    it('should return null if no active tracking', async () => {
      (prisma.timeTracking.findMany as jest.Mock).mockResolvedValue([]);

      const result = await repository.findActiveTracking('feature-1');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update time tracking entry', async () => {
      const mockEntry = {
        id: '1',
        featureId: 'feature-1',
        phase: Phase.INCEPTION,
        startTime: new Date(),
        endTime: new Date(),
        duration: 3600,
        isPaused: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.timeTracking.update as jest.Mock).mockResolvedValue(mockEntry);

      const result = await repository.update('1', {
        endTime: new Date(),
        duration: 3600,
      });

      expect(result).toEqual(mockEntry);
    });
  });
});
