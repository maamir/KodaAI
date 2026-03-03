import { TimeTracking, Phase, Prisma } from '@prisma/client';
import { prisma } from '../infrastructure/database';

export class TimeTrackingRepository {
  async create(data: Prisma.TimeTrackingCreateInput): Promise<TimeTracking> {
    return prisma.timeTracking.create({ data });
  }

  async findById(id: string): Promise<TimeTracking | null> {
    return prisma.timeTracking.findUnique({
      where: { id },
    });
  }

  async findActiveByFeatureId(featureId: string): Promise<TimeTracking | null> {
    return prisma.timeTracking.findFirst({
      where: {
        featureId,
        endTime: null,
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async findAllByFeatureId(featureId: string): Promise<TimeTracking[]> {
    return prisma.timeTracking.findMany({
      where: { featureId },
      orderBy: { startTime: 'asc' },
    });
  }

  async update(id: string, data: Prisma.TimeTrackingUpdateInput): Promise<TimeTracking> {
    return prisma.timeTracking.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<TimeTracking> {
    return prisma.timeTracking.delete({
      where: { id },
    });
  }
}

export const timeTrackingRepository = new TimeTrackingRepository();
