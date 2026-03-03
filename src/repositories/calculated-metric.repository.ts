import { CalculatedMetric, MetricType, Prisma } from '@prisma/client';
import { prisma } from '../infrastructure/database';
import { CalculatedMetricWithRelations } from '../types/entities';

export class CalculatedMetricRepository {
  async create(data: Prisma.CalculatedMetricCreateInput): Promise<CalculatedMetric> {
    return prisma.calculatedMetric.create({ data });
  }

  async findById(id: string): Promise<CalculatedMetricWithRelations | null> {
    return prisma.calculatedMetric.findUnique({
      where: { id },
      include: {
        feature: true,
      },
    });
  }

  async findByFeatureId(featureId: string): Promise<CalculatedMetric[]> {
    return prisma.calculatedMetric.findMany({
      where: { featureId },
      orderBy: { calculatedAt: 'desc' },
    });
  }

  async findByFeatureAndType(
    featureId: string,
    metricType: MetricType
  ): Promise<CalculatedMetric | null> {
    return prisma.calculatedMetric.findFirst({
      where: { featureId, metricType },
      orderBy: { calculatedAt: 'desc' },
    });
  }

  async findValidMetrics(featureId: string): Promise<CalculatedMetric[]> {
    const now = new Date();
    return prisma.calculatedMetric.findMany({
      where: {
        featureId,
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } },
        ],
      },
      orderBy: { calculatedAt: 'desc' },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.CalculatedMetricWhereInput;
    orderBy?: Prisma.CalculatedMetricOrderByWithRelationInput;
  }): Promise<CalculatedMetric[]> {
    return prisma.calculatedMetric.findMany(params);
  }

  async update(id: string, data: Prisma.CalculatedMetricUpdateInput): Promise<CalculatedMetric> {
    return prisma.calculatedMetric.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<CalculatedMetric> {
    return prisma.calculatedMetric.delete({
      where: { id },
    });
  }

  async deleteExpired(): Promise<number> {
    const now = new Date();
    const result = await prisma.calculatedMetric.deleteMany({
      where: {
        validUntil: { lt: now },
      },
    });
    return result.count;
  }

  async count(where?: Prisma.CalculatedMetricWhereInput): Promise<number> {
    return prisma.calculatedMetric.count({ where });
  }

  async findLatestByType(metricType: MetricType, limit: number = 10): Promise<CalculatedMetric[]> {
    return prisma.calculatedMetric.findMany({
      where: { metricType },
      orderBy: { calculatedAt: 'desc' },
      take: limit,
    });
  }

  async findMetricTrend(
    featureId: string,
    metricType: MetricType,
    startDate: Date,
    endDate: Date
  ): Promise<CalculatedMetric[]> {
    return prisma.calculatedMetric.findMany({
      where: {
        featureId,
        metricType,
        calculatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { calculatedAt: 'asc' },
    });
  }
}

export const calculatedMetricRepository = new CalculatedMetricRepository();
