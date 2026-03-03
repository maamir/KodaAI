import { Feature, FeatureStatus, Phase, Prisma } from '@prisma/client';
import { prisma } from '../infrastructure/database';
import { FeatureWithRelations } from '../types/entities';

export class FeatureRepository {
  async create(data: Prisma.FeatureCreateInput): Promise<Feature> {
    return prisma.feature.create({ data });
  }

  async findById(id: string): Promise<FeatureWithRelations | null> {
    return prisma.feature.findUnique({
      where: { id },
      include: {
        timeTracking: true,
        hookEvents: true,
        estimate: true,
      },
    });
  }

  async findByFeatureId(featureId: string): Promise<Feature | null> {
    return prisma.feature.findUnique({
      where: { featureId },
    });
  }

  async findActiveFeature(): Promise<Feature | null> {
    return prisma.feature.findFirst({
      where: { status: FeatureStatus.IN_PROGRESS },
      orderBy: { startedAt: 'desc' },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.FeatureWhereInput;
    orderBy?: Prisma.FeatureOrderByWithRelationInput;
  }): Promise<Feature[]> {
    return prisma.feature.findMany(params);
  }

  async update(id: string, data: Prisma.FeatureUpdateInput): Promise<Feature> {
    return prisma.feature.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Feature> {
    return prisma.feature.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.FeatureWhereInput): Promise<number> {
    return prisma.feature.count({ where });
  }
}

export const featureRepository = new FeatureRepository();
