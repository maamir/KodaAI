import { FeatureRepository } from '../../../src/repositories/feature.repository';
import { prisma } from '../../../src/infrastructure/database';
import { FeatureStatus, Phase } from '@prisma/client';

jest.mock('../../../src/infrastructure/database', () => ({
  prisma: {
    feature: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('FeatureRepository', () => {
  let repository: FeatureRepository;

  beforeEach(() => {
    repository = new FeatureRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new feature', async () => {
      const mockFeature = {
        id: '1',
        featureId: 'PROJ-123',
        name: 'Test Feature',
        status: FeatureStatus.IN_PROGRESS,
        currentPhase: Phase.INCEPTION,
        startedAt: new Date(),
        completedAt: null,
        totalDuration: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.feature.create as jest.Mock).mockResolvedValue(mockFeature);

      const result = await repository.create({
        featureId: 'PROJ-123',
        name: 'Test Feature',
      });

      expect(result).toEqual(mockFeature);
      expect(prisma.feature.create).toHaveBeenCalledWith({
        data: {
          featureId: 'PROJ-123',
          name: 'Test Feature',
        },
      });
    });
  });

  describe('findById', () => {
    it('should find feature by id', async () => {
      const mockFeature = {
        id: '1',
        featureId: 'PROJ-123',
        name: 'Test Feature',
        status: FeatureStatus.IN_PROGRESS,
        currentPhase: Phase.INCEPTION,
        startedAt: new Date(),
        completedAt: null,
        totalDuration: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.feature.findUnique as jest.Mock).mockResolvedValue(mockFeature);

      const result = await repository.findById('1');

      expect(result).toEqual(mockFeature);
      expect(prisma.feature.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          timeTracking: true,
          hookEvents: true,
          estimates: true,
        },
      });
    });

    it('should return null if feature not found', async () => {
      (prisma.feature.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('999');

      expect(result).toBeNull();
    });
  });

  describe('findByFeatureId', () => {
    it('should find feature by featureId', async () => {
      const mockFeature = {
        id: '1',
        featureId: 'PROJ-123',
        name: 'Test Feature',
        status: FeatureStatus.IN_PROGRESS,
        currentPhase: Phase.INCEPTION,
        startedAt: new Date(),
        completedAt: null,
        totalDuration: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.feature.findUnique as jest.Mock).mockResolvedValue(mockFeature);

      const result = await repository.findByFeatureId('PROJ-123');

      expect(result).toEqual(mockFeature);
    });
  });

  describe('update', () => {
    it('should update feature', async () => {
      const mockFeature = {
        id: '1',
        featureId: 'PROJ-123',
        name: 'Updated Feature',
        status: FeatureStatus.COMPLETED,
        currentPhase: Phase.TESTING,
        startedAt: new Date(),
        completedAt: new Date(),
        totalDuration: 3600,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.feature.update as jest.Mock).mockResolvedValue(mockFeature);

      const result = await repository.update('1', {
        name: 'Updated Feature',
        status: FeatureStatus.COMPLETED,
      });

      expect(result).toEqual(mockFeature);
    });
  });
});
