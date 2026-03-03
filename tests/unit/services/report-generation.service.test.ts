import { ReportGenerationService } from '../../../src/services/report-generation.service';
import { reportRepository } from '../../../src/repositories/report.repository';
import { featureRepository } from '../../../src/repositories/feature.repository';
import { calculatedMetricRepository } from '../../../src/repositories/calculated-metric.repository';
import { reportStorageService } from '../../../src/services/report-storage.service';
import { ReportType, ReportFormat, ReportStatus } from '@prisma/client';

jest.mock('../../../src/repositories/report.repository');
jest.mock('../../../src/repositories/feature.repository');
jest.mock('../../../src/repositories/calculated-metric.repository');
jest.mock('../../../src/services/report-storage.service');
jest.mock('../../../src/services/report-generators/pdf-generator');
jest.mock('../../../src/services/report-generators/excel-generator');
jest.mock('../../../src/services/report-generators/html-generator');

describe('ReportGenerationService', () => {
  let service: ReportGenerationService;

  beforeEach(() => {
    service = new ReportGenerationService();
    jest.clearAllMocks();
  });

  const mockReport = {
    id: 'report-1',
    reportType: ReportType.FEATURE_SUMMARY,
    format: ReportFormat.PDF,
    status: ReportStatus.PENDING,
    generatedBy: 'user-1',
    parameters: {},
    fileUrl: null,
    fileSize: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFeatures = [
    {
      id: 'feature-1',
      featureId: 'PROJ-123',
      name: 'Feature 1',
      status: 'COMPLETED',
      currentPhase: 'TESTING',
      startedAt: new Date(),
      completedAt: new Date(),
      totalDuration: 4800,
    },
  ];

  const mockMetrics = [
    {
      id: 'metric-1',
      featureId: 'feature-1',
      metricType: 'TIME_SAVED',
      metricValue: 20,
      calculatedAt: new Date(),
    },
  ];

  describe('generateReport', () => {
    it('should generate PDF report successfully', async () => {
      (reportRepository.create as jest.Mock).mockResolvedValue(mockReport);
      (reportRepository.updateStatus as jest.Mock).mockResolvedValue(mockReport);
      (featureRepository.findAll as jest.Mock).mockResolvedValue(mockFeatures);
      (calculatedMetricRepository.findAll as jest.Mock).mockResolvedValue(mockMetrics);
      (reportStorageService.uploadReport as jest.Mock).mockResolvedValue({
        fileUrl: 's3://bucket/report.pdf',
        fileSize: 1024,
      });
      (reportRepository.updateFileInfo as jest.Mock).mockResolvedValue(mockReport);
      (reportRepository.update as jest.Mock).mockResolvedValue(mockReport);

      const reportId = await service.generateReport({
        reportType: ReportType.FEATURE_SUMMARY,
        format: ReportFormat.PDF,
        generatedBy: 'user-1',
      });

      expect(reportId).toBe('report-1');
      expect(reportRepository.create).toHaveBeenCalled();
      expect(reportRepository.updateStatus).toHaveBeenCalledWith('report-1', ReportStatus.GENERATING);
      expect(reportStorageService.uploadReport).toHaveBeenCalled();
      expect(reportRepository.updateFileInfo).toHaveBeenCalled();
    });

    it('should generate Excel report successfully', async () => {
      (reportRepository.create as jest.Mock).mockResolvedValue({
        ...mockReport,
        format: ReportFormat.EXCEL,
      });
      (reportRepository.updateStatus as jest.Mock).mockResolvedValue(mockReport);
      (featureRepository.findAll as jest.Mock).mockResolvedValue(mockFeatures);
      (calculatedMetricRepository.findAll as jest.Mock).mockResolvedValue(mockMetrics);
      (reportStorageService.uploadReport as jest.Mock).mockResolvedValue({
        fileUrl: 's3://bucket/report.xlsx',
        fileSize: 2048,
      });
      (reportRepository.updateFileInfo as jest.Mock).mockResolvedValue(mockReport);
      (reportRepository.update as jest.Mock).mockResolvedValue(mockReport);

      const reportId = await service.generateReport({
        reportType: ReportType.FEATURE_SUMMARY,
        format: ReportFormat.EXCEL,
        generatedBy: 'user-1',
      });

      expect(reportId).toBe('report-1');
    });

    it('should handle generation errors', async () => {
      (reportRepository.create as jest.Mock).mockResolvedValue(mockReport);
      (reportRepository.updateStatus as jest.Mock).mockResolvedValue(mockReport);
      (featureRepository.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        service.generateReport({
          reportType: ReportType.FEATURE_SUMMARY,
          format: ReportFormat.PDF,
          generatedBy: 'user-1',
        })
      ).rejects.toThrow('Database error');

      expect(reportRepository.updateStatus).toHaveBeenCalledWith(
        'report-1',
        ReportStatus.FAILED,
        'Database error'
      );
    });
  });

  describe('prepareReportData', () => {
    it('should prepare FEATURE_SUMMARY data', async () => {
      (featureRepository.findAll as jest.Mock).mockResolvedValue(mockFeatures);
      (calculatedMetricRepository.findAll as jest.Mock).mockResolvedValue(mockMetrics);

      const data = await (service as any).prepareReportData({
        reportType: ReportType.FEATURE_SUMMARY,
        format: ReportFormat.PDF,
        generatedBy: 'user-1',
      });

      expect(data.title).toBe('Feature Summary Report');
      expect(data.summary).toBeDefined();
      expect(data.sections).toBeDefined();
      expect(data.sections.length).toBeGreaterThan(0);
    });

    it('should prepare TIME_ANALYSIS data', async () => {
      (featureRepository.findAll as jest.Mock).mockResolvedValue(mockFeatures);

      const data = await (service as any).prepareReportData({
        reportType: ReportType.TIME_ANALYSIS,
        format: ReportFormat.PDF,
        generatedBy: 'user-1',
      });

      expect(data.title).toBe('Time Analysis Report');
      expect(data.summary.totalHours).toBeDefined();
    });

    it('should prepare PRODUCTIVITY data', async () => {
      (featureRepository.findAll as jest.Mock).mockResolvedValue(mockFeatures);
      (calculatedMetricRepository.findAll as jest.Mock).mockResolvedValue(mockMetrics);

      const data = await (service as any).prepareReportData({
        reportType: ReportType.PRODUCTIVITY,
        format: ReportFormat.PDF,
        generatedBy: 'user-1',
      });

      expect(data.title).toBe('Productivity Report');
      expect(data.summary.avgSpeedMultiplier).toBeDefined();
    });

    it('should prepare COST_BENEFIT data', async () => {
      (featureRepository.findAll as jest.Mock).mockResolvedValue(mockFeatures);
      (calculatedMetricRepository.findAll as jest.Mock).mockResolvedValue(mockMetrics);

      const data = await (service as any).prepareReportData({
        reportType: ReportType.COST_BENEFIT,
        format: ReportFormat.PDF,
        generatedBy: 'user-1',
      });

      expect(data.title).toBe('Cost-Benefit Analysis Report');
      expect(data.summary.totalCostSavings).toBeDefined();
    });
  });

  describe('getFilteredFeatures', () => {
    it('should apply feature ID filter', async () => {
      (featureRepository.findAll as jest.Mock).mockResolvedValue(mockFeatures);

      await (service as any).getFilteredFeatures({
        featureIds: ['feature-1', 'feature-2'],
      });

      expect(featureRepository.findAll).toHaveBeenCalledWith({
        where: expect.objectContaining({
          id: { in: ['feature-1', 'feature-2'] },
        }),
        take: expect.any(Number),
        orderBy: { startedAt: 'desc' },
      });
    });

    it('should apply date range filter', async () => {
      (featureRepository.findAll as jest.Mock).mockResolvedValue(mockFeatures);

      await (service as any).getFilteredFeatures({
        dateRangeStart: new Date('2024-01-01'),
        dateRangeEnd: new Date('2024-01-31'),
      });

      expect(featureRepository.findAll).toHaveBeenCalledWith({
        where: expect.objectContaining({
          startedAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        }),
        take: expect.any(Number),
        orderBy: { startedAt: 'desc' },
      });
    });

    it('should respect max features limit', async () => {
      (featureRepository.findAll as jest.Mock).mockResolvedValue(mockFeatures);

      await (service as any).getFilteredFeatures({});

      expect(featureRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          take: expect.any(Number),
        })
      );
    });
  });

  describe('generateFileName', () => {
    it('should generate PDF filename', () => {
      const filename = (service as any).generateFileName(
        ReportType.FEATURE_SUMMARY,
        ReportFormat.PDF
      );

      expect(filename).toMatch(/^feature_summary_.*\.pdf$/);
    });

    it('should generate Excel filename', () => {
      const filename = (service as any).generateFileName(
        ReportType.TIME_ANALYSIS,
        ReportFormat.EXCEL
      );

      expect(filename).toMatch(/^time_analysis_.*\.excel$/);
    });
  });

  describe('getContentType', () => {
    it('should return correct content type for PDF', () => {
      const contentType = (service as any).getContentType(ReportFormat.PDF);
      expect(contentType).toBe('application/pdf');
    });

    it('should return correct content type for Excel', () => {
      const contentType = (service as any).getContentType(ReportFormat.EXCEL);
      expect(contentType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should return correct content type for HTML', () => {
      const contentType = (service as any).getContentType(ReportFormat.HTML);
      expect(contentType).toBe('text/html');
    });

    it('should return correct content type for JSON', () => {
      const contentType = (service as any).getContentType(ReportFormat.JSON);
      expect(contentType).toBe('application/json');
    });
  });

  describe('getReportStatus', () => {
    it('should return report status', async () => {
      (reportRepository.findById as jest.Mock).mockResolvedValue(mockReport);

      const status = await service.getReportStatus('report-1');

      expect(status).toEqual(mockReport);
      expect(reportRepository.findById).toHaveBeenCalledWith('report-1');
    });
  });

  describe('deleteReport', () => {
    it('should delete report', async () => {
      (reportStorageService.deleteReport as jest.Mock).mockResolvedValue(undefined);

      await service.deleteReport('report-1');

      expect(reportStorageService.deleteReport).toHaveBeenCalledWith('report-1');
    });
  });
});
