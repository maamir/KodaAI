import { DashboardView, ViewType, Prisma } from '@prisma/client';
import { prisma } from '../infrastructure/database';

export class DashboardViewRepository {
  async create(data: Prisma.DashboardViewCreateInput): Promise<DashboardView> {
    return prisma.dashboardView.create({ data });
  }

  async findById(id: string): Promise<DashboardView | null> {
    return prisma.dashboardView.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<DashboardView[]> {
    return prisma.dashboardView.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findDefaultByUserId(userId: string): Promise<DashboardView | null> {
    return prisma.dashboardView.findFirst({
      where: { userId, isDefault: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findByUserIdAndType(userId: string, viewType: ViewType): Promise<DashboardView[]> {
    return prisma.dashboardView.findMany({
      where: { userId, viewType },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.DashboardViewWhereInput;
    orderBy?: Prisma.DashboardViewOrderByWithRelationInput;
  }): Promise<DashboardView[]> {
    return prisma.dashboardView.findMany(params);
  }

  async update(id: string, data: Prisma.DashboardViewUpdateInput): Promise<DashboardView> {
    return prisma.dashboardView.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<DashboardView> {
    return prisma.dashboardView.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.DashboardViewWhereInput): Promise<number> {
    return prisma.dashboardView.count({ where });
  }

  async setAsDefault(id: string, userId: string): Promise<DashboardView> {
    // First, unset all other defaults for this user
    await prisma.dashboardView.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    // Then set this one as default
    return prisma.dashboardView.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async unsetDefault(userId: string): Promise<void> {
    await prisma.dashboardView.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  async cloneView(id: string, userId: string, newName: string): Promise<DashboardView> {
    const original = await this.findById(id);
    if (!original) {
      throw new Error('Dashboard view not found');
    }

    return prisma.dashboardView.create({
      data: {
        userId,
        name: newName,
        description: original.description,
        viewType: original.viewType,
        layout: original.layout,
        widgets: original.widgets,
        filters: original.filters,
        isDefault: false,
      },
    });
  }
}

export const dashboardViewRepository = new DashboardViewRepository();
