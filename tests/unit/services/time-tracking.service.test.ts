import { TimeTrackingService } from '../../../src/services/time-tracking.service';
import { TimeTrackingRepository } from '../../../src/repositories/time-tracking.repository';
import { Phase } from '@prisma/client';

jest.mock('../../../src/repositories/time-tracking.repository');

describe('TimeTrackingService', () => {
  let service: TimeTrackingService;
  let mockRepository: jest.Mocked<TimeTrackingRepository>;

  beforeEach(() => {
    mockRepository = new TimeTrackingRepository() as jest.Mocked<TimeTrackingRepository>;
    service = new TimeTrackingService(mockRepository);
    jest.clearAllMocks();
  });

  describe('startTracking', () => {
    it('should start time tracking for a phase', async () => {
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

      mockRepository.create.mockResolvedValue(mockEntry);

      const result = await service.startTracking('feature-1', Phase.INCEPTION);

      expect(result).toEqual(mockEntry);
      expect(mockRepository.create).toHaveBeenCalledWith({
        featureId: 'feature-1',
        phase: Phase.INCEPTION,
        startTime: expect.any(Date),
        duration: 0,
        isPaused: false,
      });
    });
  });

  describe('pauseTracking', () => {
    it('should pause active tracking', async () => {
      const activeEntry = {
        id: '1',
        featureId: 'feature-1',
        phase: Phase.CONSTRUCTION,
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
        endTime: null,
        duration: 0,
        isPaused: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedEntry = { ...activeEntry, isPaused: true, duration: 3600 };

      mockRepository.findActiveTracking.mockResolvedValue(activeEntry);
      mockRepository.update.mockResolvedValue(updatedEntry);

      const result = await service.pauseTracking('feature-1');

      expect(result).toEqual(updatedEntry);
      expect(mockRepository.update).toHaveBeenCalledWith('1', {
        isPaused: true,
        duration: expect.any(Number),
      });
    });

    it('should throw error if no active tracking', async () => {
      mockRepository.findActiveTracking.mockResolvedValue(null);

      await expect(service.pauseTracking('feature-1'))
        .rejects.toThrow('No active time tracking found');
    });
  });

  describe('resumeTracking', () => {
    it('should resume paused tracking', async () => {
      const pausedEntry = {
        id: '1',
        featureId: 'feature-1',
        phase: Phase.CONSTRUCTION,
        startTime: new Date(),
        endTime: null,
        duration: 1800,
        isPaused: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const resumedEntry = { ...pausedEntry, isPaused: false };

      mockRepository.findActiveTracking.mockResolvedValue(pausedEntry);
      mockRepository.update.mockResolvedValue(resumedEntry);

      const result = await service.resumeTracking('feature-1');

      expect(result).toEqual(resumedEntry);
      expect(mockRepository.update).toHaveBeenCalledWith('1', {
        isPaused: false,
      });
    });
  });

  describe('completeTracking', () => {
    it('should complete active tracking', async () => {
      const activeEntry = {
        id: '1',
        featureId: 'feature-1',
        phase: Phase.TESTING,
        startTime: new Date(Date.now() - 7200000), // 2 hours ago
        endTime: null,
        duration: 0,
        isPaused: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const completedEntry = { ...activeEntry, endTime: new Date(), duration: 7200 };

      mockRepository.findActiveTracking.mockResolvedValue(activeEntry);
      mockRepository.update.mockResolvedValue(completedEntry);

      const result = await service.completeTracking('feature-1');

      expect(result).toEqual(completedEntry);
      expect(mockRepository.update).toHaveBeenCalledWith('1', {
        endTime: expect.any(Date),
        duration: expect.any(Number),
      });
    });
  });

  describe('calculateTotalDuration', () => {
    it('should calculate total duration across all phases', async () => {
      const entries = [
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
          endTime: new Date(),
          duration: 3600,
          isPaused: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.findByFeatureId.mockResolvedValue(entries);

      const result = await service.calculateTotalDuration('feature-1');

      expect(result).toBe(5400); // 1800 + 3600
    });
  });
});
