import { ReportType, ReportFormat, ReportStatus } from '@prisma/client';
import { reportRepository } from '../repositories/report.repository';
import { featureRepository } from '../repositories/feature.repository';
import { calculatedMetricRepository } from '../repositories/calculated-metric.repository';
import { reportStorageService } from './report-storage.service';
import { pdfGenerator, PDFReportData } from './report-generators/pdf-generator';
import { excelGenerator, ExcelReportData } from './report-generators/excel-generator';
import { htmlGenerator, HTMLReportData } from './report-generators/html-generator';
import { config } from '../config';
import { logger } from '../infrastructure/logger';

export interface GenerateReportParams {
  reportType: ReportType;
  format: ReportFormat;
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  featureIds?: string[];
  filters?: Record<string, any>;
  includeCharts?: boolean;
  includeRawData?: boolean;
  generatedBy: string;
}

export class ReportGenerationService {
  async generateReport(params: GenerateReportParams): Promise<string> {
    const reportId = await this.createReportRecord(params);

    try {
      // Update status to generating
      await reportRepository.updateStatus(reportId, ReportStatus.GENERATING);

      // Generate report based on type
      const reportData = await this.prepareReportData(params);
      const fileBuffer = await this.generateReportFile(reportData, params.format);

      // Upload to storage
      const fileName = this.generateFileName(params.reportType, params.format);
      const { fileUrl, fileSize } = await reportStorageService.uploadReport(
        reportId,
        fileBuffer,
        fileName,
        this.getContentType(params.format)
      );

      // Calculate expiration date
      const expirationDays = config.get('REPORT_EXPIRATION_DAYS');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      // Update report with file info
      await reportRepository.updateFileInfo(reportId, fileUrl, fileSize);
      await reportRepository.update(reportId, { expiresAt });

      logger.info(`Report ${reportId} generated successfully`);
      return reportId;
    } catch (error) {
      logger.error(`Error generating report ${reportId}:`, error);
      await reportRepository.updateStatus(
        reportId,
        ReportStatus.FAILED,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  private async createReportRecord(params: GenerateReportParams): Promise<string> {
    const report = await reportRepository.create({
      reportType: params.reportType,
      format: params.format,
      generatedBy: params.generatedBy,
      parameters: {
        dateRangeStart: params.dateRangeStart,
        dateRangeEnd: params.dateRangeEnd,
        featureIds: params.featureIds,
        filters: params.filters,
        includeCharts: params.includeCharts,
        includeRawData: params.includeRawData,
      },
    });

    return report.id;
  }

  private async prepareReportData(params: GenerateReportParams): Promise<any> {
    switch (params.reportType) {
      case ReportType.FEATURE_SUMMARY:
        return this.prepareFeatureSummaryData(params);
      case ReportType.TIME_ANALYSIS:
        return this.prepareTimeAnalysisData(params);
      case ReportType.PRODUCTIVITY:
        return this.prepareProductivityData(params);
      case ReportType.COST_BENEFIT:
        return this.prepareCostBenefitData(params);
      case ReportType.QUALITY_METRICS:
        return this.prepareQualityMetricsData(params);
      case ReportType.VELOCITY_TRENDS:
        return this.prepareVelocityTrendsData(params);
      case ReportType.CUSTOM:
        return this.prepareCustomData(params);
      default:
        throw new Error(`Unknown report type: ${params.reportType}`);
    }
  }

  private async prepareFeatureSummaryData(params: GenerateReportParams) {
    const features = await this.getFilteredFeatures(params);
    const metrics = await this.getMetricsForFeatures(features.map(f => f.id));

    const summary = {
      totalFeatures: features.length,
      completedFeatures: features.filter(f => f.status === 'COMPLETED').length,
      inProgressFeatures: features.filter(f => f.status === 'IN_PROGRESS').length,
      totalTimeSaved: metrics
        .filter(m => m.metricType === 'TIME_SAVED')
        .reduce((sum, m) => sum + m.metricValue, 0),
    };

    const sections = [
      {
        title: 'Feature Overview',
        type: 'table' as const,
        content: {
          headers: ['Feature ID', 'Name', 'Status', 'Phase', 'Started', 'Completed'],
          rows: features.map(f => [
            f.featureId,
            f.name,
            f.status,
            f.currentPhase,
            f.startedAt ? f.startedAt.toLocaleDateString() : 'N/A',
            f.completedAt ? f.completedAt.toLocaleDateString() : 'N/A',
          ]),
        },
      },
      {
        title: 'Key Metrics',
        type: 'metrics' as const,
        content: this.aggregateMetrics(metrics),
      },
    ];

    return {
      title: 'Feature Summary Report',
      generatedAt: new Date(),
      dateRange: params.dateRangeStart && params.dateRangeEnd
        ? { start: params.dateRangeStart, end: params.dateRangeEnd }
        : undefined,
      summary,
      sections,
      includeCharts: params.includeCharts,
    };
  }

  private async prepareTimeAnalysisData(params: GenerateReportParams) {
    const features = await this.getFilteredFeatures(params);
    
    const summary = {
      totalFeatures: features.length,
      avgDuration: features.reduce((sum, f) => sum + (f.totalDuration || 0), 0) / features.length / 60,
      totalHours: features.reduce((sum, f) => sum + (f.totalDuration || 0), 0) / 60,
    };

    const sections = [
      {
        title: 'Time Breakdown by Feature',
        type: 'table' as const,
        content: {
          headers: ['Feature ID', 'Name', 'Duration (hours)', 'Inception', 'Construction', 'Testing'],
          rows: features.map(f => [
            f.featureId,
            f.name,
            ((f.totalDuration || 0) / 60).toFixed(2),
            'N/A', // Would need phase-specific data
            'N/A',
            'N/A',
          ]),
        },
      },
    ];

    return {
      title: 'Time Analysis Report',
      generatedAt: new Date(),
      dateRange: params.dateRangeStart && params.dateRangeEnd
        ? { start: params.dateRangeStart, end: params.dateRangeEnd }
        : undefined,
      summary,
      sections,
    };
  }

  private async prepareProductivityData(params: GenerateReportParams) {
    const features = await this.getFilteredFeatures(params);
    const metrics = await this.getMetricsForFeatures(features.map(f => f.id));

    const speedMetrics = metrics.filter(m => m.metricType === 'SPEED_MULTIPLIER');
    const avgSpeed = speedMetrics.length > 0
      ? speedMetrics.reduce((sum, m) => sum + m.metricValue, 0) / speedMetrics.length
      : 0;

    const summary = {
      totalFeatures: features.length,
      avgSpeedMultiplier: avgSpeed.toFixed(2),
      productivityGain: ((avgSpeed - 1) * 100).toFixed(2) + '%',
    };

    const sections = [
      {
        title: 'Productivity Metrics',
        type: 'table' as const,
        content: {
          headers: ['Feature ID', 'Speed Multiplier', 'Time Saved (hrs)', 'Productivity Gain'],
          rows: features.map(f => {
            const speed = metrics.find(m => m.featureId === f.id && m.metricType === 'SPEED_MULTIPLIER');
            const timeSaved = metrics.find(m => m.featureId === f.id && m.metricType === 'TIME_SAVED');
            return [
              f.featureId,
              speed ? speed.metricValue.toFixed(2) : 'N/A',
              timeSaved ? timeSaved.metricValue.toFixed(2) : 'N/A',
              speed ? ((speed.metricValue - 1) * 100).toFixed(2) + '%' : 'N/A',
            ];
          }),
        },
      },
    ];

    return {
      title: 'Productivity Report',
      generatedAt: new Date(),
      summary,
      sections,
    };
  }

  private async prepareCostBenefitData(params: GenerateReportParams) {
    const features = await this.getFilteredFeatures(params);
    const metrics = await this.getMetricsForFeatures(features.map(f => f.id));

    const costSavings = metrics
      .filter(m => m.metricType === 'COST_SAVINGS')
      .reduce((sum, m) => sum + m.metricValue, 0);

    const summary = {
      totalFeatures: features.length,
      totalCostSavings: `$${costSavings.toFixed(2)}`,
      avgSavingsPerFeature: `$${(costSavings / features.length).toFixed(2)}`,
    };

    const sections = [
      {
        title: 'Cost-Benefit Analysis',
        type: 'table' as const,
        content: {
          headers: ['Feature ID', 'Time Saved (hrs)', 'Cost Savings', 'ROI'],
          rows: features.map(f => {
            const timeSaved = metrics.find(m => m.featureId === f.id && m.metricType === 'TIME_SAVED');
            const cost = metrics.find(m => m.featureId === f.id && m.metricType === 'COST_SAVINGS');
            return [
              f.featureId,
              timeSaved ? timeSaved.metricValue.toFixed(2) : 'N/A',
              cost ? `$${cost.metricValue.toFixed(2)}` : 'N/A',
              'N/A', // Would need ROI calculation
            ];
          }),
        },
      },
    ];

    return {
      title: 'Cost-Benefit Analysis Report',
      generatedAt: new Date(),
      summary,
      sections,
    };
  }

  private async prepareQualityMetricsData(params: GenerateReportParams) {
    const features = await this.getFilteredFeatures(params);
    const metrics = await this.getMetricsForFeatures(features.map(f => f.id));

    const qualityMetrics = metrics.filter(m => m.metricType === 'QUALITY_SCORE');
    const avgQuality = qualityMetrics.length > 0
      ? qualityMetrics.reduce((sum, m) => sum + m.metricValue, 0) / qualityMetrics.length
      : 0;

    const summary = {
      totalFeatures: features.length,
      avgQualityScore: avgQuality.toFixed(2),
      highQualityFeatures: qualityMetrics.filter(m => m.metricValue >= 80).length,
    };

    const sections = [
      {
        title: 'Quality Metrics',
        type: 'table' as const,
        content: {
          headers: ['Feature ID', 'Quality Score', 'Defect Rate', 'Test Coverage'],
          rows: features.map(f => {
            const quality = metrics.find(m => m.featureId === f.id && m.metricType === 'QUALITY_SCORE');
            const defects = metrics.find(m => m.featureId === f.id && m.metricType === 'DEFECT_RATE');
            return [
              f.featureId,
              quality ? quality.metricValue.toFixed(2) : 'N/A',
              defects ? defects.metricValue.toFixed(2) + '%' : 'N/A',
              'N/A', // Would need test coverage data
            ];
          }),
        },
      },
    ];

    return {
      title: 'Quality Metrics Report',
      generatedAt: new Date(),
      summary,
      sections,
    };
  }

  private async prepareVelocityTrendsData(params: GenerateReportParams) {
    const features = await this.getFilteredFeatures(params);
    const metrics = await this.getMetricsForFeatures(features.map(f => f.id));

    const velocityMetrics = metrics.filter(m => m.metricType === 'VELOCITY');
    const avgVelocity = velocityMetrics.length > 0
      ? velocityMetrics.reduce((sum, m) => sum + m.metricValue, 0) / velocityMetrics.length
      : 0;

    const summary = {
      totalFeatures: features.length,
      avgVelocity: avgVelocity.toFixed(2),
      totalStoryPoints: velocityMetrics.reduce((sum, m) => sum + (m.parameters.storyPoints || 0), 0),
    };

    const sections = [
      {
        title: 'Velocity Trends',
        type: 'table' as const,
        content: {
          headers: ['Feature ID', 'Story Points', 'Duration (hrs)', 'Velocity'],
          rows: features.map(f => {
            const velocity = metrics.find(m => m.featureId === f.id && m.metricType === 'VELOCITY');
            return [
              f.featureId,
              velocity?.parameters.storyPoints || 'N/A',
              velocity?.parameters.actualHours?.toFixed(2) || 'N/A',
              velocity ? velocity.metricValue.toFixed(2) : 'N/A',
            ];
          }),
        },
      },
    ];

    return {
      title: 'Velocity Trends Report',
      generatedAt: new Date(),
      summary,
      sections,
    };
  }

  private async prepareCustomData(params: GenerateReportParams) {
    const features = await this.getFilteredFeatures(params);
    const metrics = await this.getMetricsForFeatures(features.map(f => f.id));

    return {
      title: 'Custom Report',
      generatedAt: new Date(),
      summary: {
        totalFeatures: features.length,
        totalMetrics: metrics.length,
      },
      sections: [
        {
          title: 'Features',
          type: 'table' as const,
          content: {
            headers: ['Feature ID', 'Name', 'Status'],
            rows: features.map(f => [f.featureId, f.name, f.status]),
          },
        },
      ],
    };
  }

  private async generateReportFile(data: any, format: ReportFormat): Promise<Buffer> {
    switch (format) {
      case ReportFormat.PDF:
        return pdfGenerator.generate(data as PDFReportData);
      case ReportFormat.EXCEL:
        return excelGenerator.generate(data as ExcelReportData);
      case ReportFormat.HTML:
        return htmlGenerator.generate(data as HTMLReportData);
      case ReportFormat.JSON:
        return Buffer.from(JSON.stringify(data, null, 2), 'utf-8');
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private async getFilteredFeatures(params: GenerateReportParams) {
    const where: any = {};

    if (params.featureIds && params.featureIds.length > 0) {
      where.id = { in: params.featureIds };
    }

    if (params.dateRangeStart || params.dateRangeEnd) {
      where.startedAt = {};
      if (params.dateRangeStart) {
        where.startedAt.gte = params.dateRangeStart;
      }
      if (params.dateRangeEnd) {
        where.startedAt.lte = params.dateRangeEnd;
      }
    }

    const maxFeatures = config.get('MAX_FEATURES_PER_REPORT');
    return featureRepository.findAll({
      where,
      take: maxFeatures,
      orderBy: { startedAt: 'desc' },
    });
  }

  private async getMetricsForFeatures(featureIds: string[]) {
    if (featureIds.length === 0) return [];

    return calculatedMetricRepository.findAll({
      where: {
        featureId: { in: featureIds },
      },
    });
  }

  private aggregateMetrics(metrics: any[]): Record<string, any> {
    const result: Record<string, any> = {};

    const metricTypes = [...new Set(metrics.map(m => m.metricType))];

    for (const type of metricTypes) {
      const typeMetrics = metrics.filter(m => m.metricType === type);
      const avg = typeMetrics.reduce((sum, m) => sum + m.metricValue, 0) / typeMetrics.length;
      result[type] = avg.toFixed(2);
    }

    return result;
  }

  private generateFileName(reportType: ReportType, format: ReportFormat): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = format.toLowerCase();
    return `${reportType.toLowerCase()}_${timestamp}.${extension}`;
  }

  private getContentType(format: ReportFormat): string {
    switch (format) {
      case ReportFormat.PDF:
        return 'application/pdf';
      case ReportFormat.EXCEL:
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case ReportFormat.HTML:
        return 'text/html';
      case ReportFormat.JSON:
        return 'application/json';
      default:
        return 'application/octet-stream';
    }
  }

  async getReportStatus(reportId: string) {
    return reportRepository.findById(reportId);
  }

  async deleteReport(reportId: string) {
    return reportStorageService.deleteReport(reportId);
  }
}

export const reportGenerationService = new ReportGenerationService();
