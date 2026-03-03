import { DashboardViewRepository } from '../../../src/repositories/dashboard-view.repository';
import { prisma } from '../../../src/infrastructure/database';
import { ViewType } from '@prisma/client';

jest.mock('../../../src/infrastructure/database', () => ({
  prisma: {
    dashboardView: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('DashboardViewRepository', () => {
  let repository: DashboardViewRepository;

  beforeEach(() => {
    repository = new DashboardViewRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new dashboard view', async () => {
      const mockView = {
        id: '1',
        userId: 'user-1',
        name: 'My Dashboard',
        description: 'Test dashboard',
        viewType: ViewType.CUSTOM,
        layout: { columns: 12 },
        widgets: { widget1: { type: 'chart' } },
        filters: {},
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.dashboardView.create as jest.Mock).mockResolvedValue(mockView);

      const result = await repository.create({
        userId: 'user-1',
        name: 'My Dashboard',
        description: 'Test dashboard',
        viewType: ViewType.CUSTOM,
        layout: { columns: 12 },
        widgets: { widget1: { type: 'chart' } },
        filters: {},
      });

      expect(result).toEqual(mockView);
      expect(prisma.dashboardView.create).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find dashboard view by id', async () => {
      const mockView = {
        id: '1',
        userId: 'user-1',
        name: 'My Dashboard',
        description: 'Test dashboard',
        viewType: ViewType.CUSTOM,
        layout: { columns: 12 },
        widgets: {},
        filters: {},
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.dashboardView.findUnique as jest.Mock).mockResolvedValue(mockView);

      const result = await repository.findById('1');

      expect(result).toEqual(mockView);
      expect(prisma.dashboardView.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null if view not found', async () => {
      (prisma.dashboardView.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('999');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find all views for a user', async () => {
      const mockViews = [
        {
          id: '1',
          userId: 'user-1',
          name: 'Dashboard 1',
          description: null,
          viewType: ViewType.CUSTOM,
          layout: {},
          widgets: {},
          filters: {},
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.dashboardView.findMany as jest.Mock).mockResolvedValue(mockViews);

      const result = await repository.findByUserId('user-1');

      expect(result).toEqual(mockViews);
      expect(prisma.dashboardView.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('findDefaultByUserId', () => {
    it('should find default view for a user', async () => {
      const mockView = {
        id: '1',
        userId: 'user-1',
        name: 'Default Dashboard',
        description: null,
        viewType: ViewType.EXECUTIVE,
        layout: {},
        widgets: {},
        filters: {},
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.dashboardView.findFirst as jest.Mock).mockResolvedValue(mockView);

      const result = await repository.findDefaultByUserId('user-1');

      expect(result).toEqual(mockView);
      expect(prisma.dashboardView.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', isDefault: true },
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('should return null if no default view exists', async () => {
      (prisma.dashboardView.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await repository.findDefaultByUserId('user-1');

      expect(result).toBeNull();
    });
  });

  describe('findByUserIdAndType', () => {
    it('should find views by user and type', async () => {
      const mockViews = [
        {
          id: '1',
          userId: 'user-1',
          name: 'Executive Dashboard',
          description: null,
          viewType: ViewType.EXECUTIVE,
          layout: {},
          widgets: {},
          filters: {},
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.dashboardView.findMany as jest.Mock).mockResolvedValue(mockViews);

      const result = await repository.findByUserIdAndType('user-1', ViewType.EXECUTIVE);

      expect(result).toEqual(mockViews);
      expect(prisma.dashboardView.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', viewType: ViewType.EXECUTIVE },
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('setAsDefault', () => {
    it('should set a view as default and unset others', async () => {
      const mockView = {
        id: '1',
        userId: 'user-1',
        name: 'My Dashboard',
        description: null,
        viewType: ViewType.CUSTOM,
        layout: {},
        widgets: {},
        filters: {},
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.dashboardView.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.dashboardView.update as jest.Mock).mockResolvedValue(mockView);

      const result = await repository.setAsDefault('1', 'user-1');

      expect(result).toEqual(mockView);
      expect(prisma.dashboardView.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isDefault: true },
        data: { isDefault: false },
      });
      expect(prisma.dashboardView.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isDefault: true },
      });
    });
  });

  describe('unsetDefault', () => {
    it('should unset all default views for a user', async () => {
      (prisma.dashboardView.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      await repository.unsetDefault('user-1');

      expect(prisma.dashboardView.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isDefault: true },
        data: { isDefault: false },
      });
    });
  });

  describe('cloneView', () => {
    it('should clone an existing view', async () => {
      const originalView = {
        id: '1',
        userId: 'user-1',
        name: 'Original Dashboard',
        description: 'Original description',
        viewType: ViewType.CUSTOM,
        layout: { columns: 12 },
        widgets: { widget1: { type: 'chart' } },
        filters: { dateRange: '30d' },
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const clonedView = {
        id: '2',
        userId: 'user-2',
        name: 'Cloned Dashboard',
        description: 'Original description',
        viewType: ViewType.CUSTOM,
        layout: { columns: 12 },
        widgets: { widget1: { type: 'chart' } },
        filters: { dateRange: '30d' },
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.dashboardView.findUnique as jest.Mock).mockResolvedValue(originalView);
      (prisma.dashboardView.create as jest.Mock).mockResolvedValue(clonedView);

      const result = await repository.cloneView('1', 'user-2', 'Cloned Dashboard');

      expect(result).toEqual(clonedView);
      expect(prisma.dashboardView.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(prisma.dashboardView.create).toHaveBeenCalled();
    });

    it('should throw error if original view not found', async () => {
      (prisma.dashboardView.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        repository.cloneView('999', 'user-2', 'Cloned Dashboard')
      ).rejects.toThrow('Dashboard view not found');
    });
  });

  describe('update', () => {
    it('should update a dashboard view', async () => {
      const mockView = {
        id: '1',
        userId: 'user-1',
        name: 'Updated Dashboard',
        description: 'Updated description',
        viewType: ViewType.CUSTOM,
        layout: {},
        widgets: {},
        filters: {},
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.dashboardView.update as jest.Mock).mockResolvedValue(mockView);

      const result = await repository.update('1', { name: 'Updated Dashboard' });

      expect(result).toEqual(mockView);
    });
  });

  describe('delete', () => {
    it('should delete a dashboard view', async () => {
      const mockView = {
        id: '1',
        userId: 'user-1',
        name: 'My Dashboard',
        description: null,
        viewType: ViewType.CUSTOM,
        layout: {},
        widgets: {},
        filters: {},
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.dashboardView.delete as jest.Mock).mockResolvedValue(mockView);

      const result = await repository.delete('1');

      expect(result).toEqual(mockView);
    });
  });
});
