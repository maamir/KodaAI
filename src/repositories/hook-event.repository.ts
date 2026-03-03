import { HookEvent, HookEventType, Prisma } from '@prisma/client';
import { prisma } from '../infrastructure/database';

export class HookEventRepository {
  async create(data: Prisma.HookEventCreateInput): Promise<HookEvent> {
    return prisma.hookEvent.create({ data });
  }

  async findById(id: string): Promise<HookEvent | null> {
    return prisma.hookEvent.findUnique({
      where: { id },
    });
  }

  async findAllByFeatureId(featureId: string): Promise<HookEvent[]> {
    return prisma.hookEvent.findMany({
      where: { featureId },
      orderBy: { timestamp: 'asc' },
    });
  }

  async findUnprocessed(): Promise<HookEvent[]> {
    return prisma.hookEvent.findMany({
      where: { processed: false },
      orderBy: { timestamp: 'asc' },
    });
  }

  async update(id: string, data: Prisma.HookEventUpdateInput): Promise<HookEvent> {
    return prisma.hookEvent.update({
      where: { id },
      data,
    });
  }

  async markAsProcessed(id: string): Promise<HookEvent> {
    return this.update(id, {
      processed: true,
      processedAt: new Date(),
    });
  }

  async delete(id: string): Promise<HookEvent> {
    return prisma.hookEvent.delete({
      where: { id },
    });
  }
}

export const hookEventRepository = new HookEventRepository();
