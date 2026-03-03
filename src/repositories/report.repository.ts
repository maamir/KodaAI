import { Report, ReportType, ReportFormat, ReportStatus, Prisma } from '@prisma/client';
import { prisma } from '../infrastructure/database';

export class ReportRepository {
  async create(data: Prisma.ReportCreateInput): Promise<Report> {
    return prisma.report.create({ data });
  }

  async findById(id: string): Promise<Report | null> {
    return prisma.report.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<Report[]> {
    return prisma.report.findMany({
      where: { generatedBy: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStatus(status: ReportStatus): Promise<Report[]> {
    return prisma.report.findMany({
      where: { status },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findPendingReports(): Promise<Report[]> {
    return prisma.report.findMany({
      where: {
        status: { in: [ReportStatus.PENDING, ReportStatus.GENERATING] },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ReportWhereInput;
    orderBy?: Prisma.ReportOrderByWithRelationInput;
  }): Promise<Report[]> {
    return prisma.report.findMany(params);
  }

  async update(id: string, data: Prisma.ReportUpdateInput): Promise<Report> {
    return prisma.report.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Report> {
    return prisma.report.delete({
      where: { id },
    });
  }

  async deleteExpired(): Promise<number> {
    const now = new Date();
    const result = await prisma.report.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });
    return result.count;
  }

  async count(where?: Prisma.ReportWhereInput): Promise<number> {
    return prisma.report.count({ where });
  }

  async findByTypeAndFormat(
    reportType: ReportType,
    format: ReportFormat
  ): Promise<Report[]> {
    return prisma.report.findMany({
      where: { reportType, format },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRecentReports(userId: string, limit: number = 10): Promise<Report[]> {
    return prisma.report.findMany({
      where: { generatedBy: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async updateStatus(
    id: string,
    status: ReportStatus,
    error?: string
  ): Promise<Report> {
    return prisma.report.update({
      where: { id },
      data: {
        status,
        error,
        ...(status === ReportStatus.COMPLETED && { generatedAt: new Date() }),
      },
    });
  }

  async updateFileInfo(
    id: string,
    fileUrl: string,
    fileSize: number
  ): Promise<Report> {
    return prisma.report.update({
      where: { id },
      data: {
        fileUrl,
        fileSize,
        status: ReportStatus.COMPLETED,
        generatedAt: new Date(),
      },
    });
  }
}

export const reportRepository = new ReportRepository();
