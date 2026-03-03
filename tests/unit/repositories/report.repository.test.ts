import { ReportRepository } from '../../../src/repositories/report.repository';
import { prisma } from '../../../src/infrastructure/database';
import { ReportType, ReportFormat, ReportStatus } from '@prisma/client';

jest.mock('../../../src/infrastructure/database', () => ({
  prisma: {
    report: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('ReportRepository', () => {
  let repository: ReportRepository;

  beforeEach(() => {
    repository = new ReportRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new report', async () => {
      const mockReport = {
        id: '1',
        reportType: ReportType.FEATURE_SUMMARY,
        format: ReportFormat.PDF,
        status: ReportStatus.PENDING,
        fileUrl: null,
        fileSize: null,
        expiresAt: null,
        generatedBy: 'user-1',
        generatedAt: null,
        error: null,
        parameters: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.report.create as jest.Mock).mockResolvedValue(mockReport);

      const result = await repository.create({
        reportType: ReportType.FEATURE_SUMMARY,
        format: ReportFormat.PDF,
        generatedBy: 'user-1',
        parameters: {},
      });

      expect(result).toEqual(mockReport);
      expect(prisma.report.create).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find report by id', async () => {
      const mockReport = {
        id: '1',
        reportType: ReportType.FEATURE_SUMMARY,
        format: ReportFormat.PDF,
        status: ReportStatus.COMPLETED,
        fileUrl: 'https://example.com/report.pdf',
        fileSize: 1024,
        expiresAt: new Date(),
        generatedBy: 'user-1',
        generatedAt: new Date(),
        error: null,
        parameters: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.report.findUnique as jest.Mock).mockResolvedValue(mockReport);

      const result = await repository.findById('1');

      expect(result).toEqual(mockReport);
      expect(prisma.report.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null if report not found', async () => {
      (prisma.report.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('999');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find all reports for a user', async () => {
      const mockReports = [
        {
          id: '1',
          reportType: ReportType.FEATURE_SUMMARY,
          format: ReportFormat.PDF,
          status: ReportStatus.COMPLETED,
          fileUrl: 'https://example.com/report.pdf',
          fileSize: 1024,
          expiresAt: new Date(),
          generatedBy: 'user-1',
          generatedAt: new Date(),
          error: null,
          parameters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.report.findMany as jest.Mock).mockResolvedValue(mockReports);

      const result = await repository.findByUserId('user-1');

      expect(result).toEqual(mockReports);
      expect(prisma.report.findMany).toHaveBeenCalledWith({
        where: { generatedBy: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findByStatus', () => {
    it('should find reports by status', async () => {
      const mockReports = [
        {
          id: '1',
          reportType: ReportType.FEATURE_SUMMARY,
          format: ReportFormat.PDF,
          status: ReportStatus.PENDING,
          fileUrl: null,
          fileSize: null,
          expiresAt: null,
          generatedBy: 'user-1',
          generatedAt: null,
          error: null,
          parameters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.report.findMany as jest.Mock).mockResolvedValue(mockReports);

      const result = await repository.findByStatus(ReportStatus.PENDING);

      expect(result).toEqual(mockReports);
      expect(prisma.report.findMany).toHaveBeenCalledWith({
        where: { status: ReportStatus.PENDING },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('findPendingReports', () => {
    it('should find all pending and generating reports', async () => {
      const mockReports = [
        {
          id: '1',
          reportType: ReportType.FEATURE_SUMMARY,
          format: ReportFormat.PDF,
          status: ReportStatus.GENERATING,
          fileUrl: null,
          fileSize: null,
          expiresAt: null,
          generatedBy: 'user-1',
          generatedAt: null,
          error: null,
          parameters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.report.findMany as jest.Mock).mockResolvedValue(mockReports);

      const result = await repository.findPendingReports();

      expect(result).toEqual(mockReports);
      expect(prisma.report.findMany).toHaveBeenCalled();
    });
  });

  describe('deleteExpired', () => {
    it('should delete expired reports', async () => {
      (prisma.report.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await repository.deleteExpired();

      expect(result).toBe(3);
      expect(prisma.report.deleteMany).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update report status', async () => {
      const mockReport = {
        id: '1',
        reportType: ReportType.FEATURE_SUMMARY,
        format: ReportFormat.PDF,
        status: ReportStatus.COMPLETED,
        fileUrl: null,
        fileSize: null,
        expiresAt: null,
        generatedBy: 'user-1',
        generatedAt: new Date(),
        error: null,
        parameters: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.report.update as jest.Mock).mockResolvedValue(mockReport);

      const result = await repository.updateStatus('1', ReportStatus.COMPLETED);

      expect(result).toEqual(mockReport);
      expect(prisma.report.update).toHaveBeenCalled();
    });

    it('should update report status with error', async () => {
      const mockReport = {
        id: '1',
        reportType: ReportType.FEATURE_SUMMARY,
        format: ReportFormat.PDF,
        status: ReportStatus.FAILED,
        fileUrl: null,
        fileSize: null,
        expiresAt: null,
        generatedBy: 'user-1',
        generatedAt: null,
        error: 'Generation failed',
        parameters: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.report.update as jest.Mock).mockResolvedValue(mockReport);

      const result = await repository.updateStatus('1', ReportStatus.FAILED, 'Generation failed');

      expect(result).toEqual(mockReport);
    });
  });

  describe('updateFileInfo', () => {
    it('should update report file information', async () => {
      const mockReport = {
        id: '1',
        reportType: ReportType.FEATURE_SUMMARY,
        format: ReportFormat.PDF,
        status: ReportStatus.COMPLETED,
        fileUrl: 'https://example.com/report.pdf',
        fileSize: 2048,
        expiresAt: null,
        generatedBy: 'user-1',
        generatedAt: new Date(),
        error: null,
        parameters: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.report.update as jest.Mock).mockResolvedValue(mockReport);

      const result = await repository.updateFileInfo('1', 'https://example.com/report.pdf', 2048);

      expect(result).toEqual(mockReport);
      expect(prisma.report.update).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a report', async () => {
      const mockReport = {
        id: '1',
        reportType: ReportType.FEATURE_SUMMARY,
        format: ReportFormat.PDF,
        status: ReportStatus.COMPLETED,
        fileUrl: 'https://example.com/report.pdf',
        fileSize: 1024,
        expiresAt: new Date(),
        generatedBy: 'user-1',
        generatedAt: new Date(),
        error: null,
        parameters: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.report.update as jest.Mock).mockResolvedValue(mockReport);

      const result = await repository.update('1', { status: ReportStatus.COMPLETED });

      expect(result).toEqual(mockReport);
    });
  });

  describe('delete', () => {
    it('should delete a report', async () => {
      const mockReport = {
        id: '1',
        reportType: ReportType.FEATURE_SUMMARY,
        format: ReportFormat.PDF,
        status: ReportStatus.COMPLETED,
        fileUrl: 'https://example.com/report.pdf',
        fileSize: 1024,
        expiresAt: new Date(),
        generatedBy: 'user-1',
        generatedAt: new Date(),
        error: null,
        parameters: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.report.delete as jest.Mock).mockResolvedValue(mockReport);

      const result = await repository.delete('1');

      expect(result).toEqual(mockReport);
    });
  });
});
