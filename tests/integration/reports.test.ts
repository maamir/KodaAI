import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/database';
import { ReportType, ReportFormat, ReportStatus, FeatureStatus, Phase } from '@prisma/client';

describe('Reports API Integration Tests', () => {
  let testFeatureId: string;
  let testReportId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.report.deleteMany();
    await prisma.feature.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create test feature
    const feature = await prisma.feature.create({
      data: {
        featureId: 'TEST-002',
        name: 'Test Feature for Reports',
        status: FeatureStatus.COMPLETED,
        currentPhase: Phase.TESTING,
        startedAt: new Date('2024-01-01'),
        completedAt: new Date('2024-01-10'),
        totalDuration: 4800,
      },
    });
    testFeatureId = feature.id;
  });

  afterEach(async () => {
    await prisma.report.deleteMany();
    await prisma.feature.deleteMany();
  });

  describe('POST /api/reports', () => {
    it('should generate a new PDF report', async () => {
      const response = await request(app)
        .post('/api/reports')
        .send({
          reportType: ReportType.FEATURE_SUMMARY,
          format: ReportFormat.PDF,
          featureIds: [testFeatureId],
          includeCharts: true,
        })
        .expect(202);

      expect(response.body.reportId).toBeDefined();
      expect(response.body.status).toBe('GENERATING');
      testReportId = response.body.reportId;
    });

    it('should generate an Excel report', async () => {
      const response = await request(app)
        .post('/api/reports')
        .send({
          reportType: ReportType.TIME_ANALYSIS,
          format: ReportFormat.EXCEL,
          dateRangeStart: '2024-01-01',
          dateRangeEnd: '2024-01-31',
        })
        .expect(202);

      expect(response.body.reportId).toBeDefined();
    });

    it('should generate an HTML report', async () => {
      const response = await request(app)
        .post('/api/reports')
        .send({
          reportType: ReportType.PRODUCTIVITY,
          format: ReportFormat.HTML,
        })
        .expect(202);

      expect(response.body.reportId).toBeDefined();
    });

    it('should return 400 for invalid report type', async () => {
      await request(app)
        .post('/api/reports')
        .send({
          reportType: 'INVALID_TYPE',
          format: ReportFormat.PDF,
        })
        .expect(400);
    });

    it('should return 400 for missing required fields', async () => {
      await request(app)
        .post('/api/reports')
        .send({
          reportType: ReportType.FEATURE_SUMMARY,
        })
        .expect(400);
    });
  });

  describe('GET /api/reports', () => {
    beforeEach(async () => {
      // Create test reports
      await prisma.report.createMany({
        data: [
          {
            reportType: ReportType.FEATURE_SUMMARY,
            format: ReportFormat.PDF,
            status: ReportStatus.COMPLETED,
            generatedBy: 'test-user',
            parameters: {},
          },
          {
            reportType: ReportType.TIME_ANALYSIS,
            format: ReportFormat.EXCEL,
            status: ReportStatus.PENDING,
            generatedBy: 'test-user',
            parameters: {},
          },
        ],
      });
    });

    it('should list reports with pagination', async () => {
      const response = await request(app)
        .get('/api/reports')
        .query({ page: 1, pageSize: 10 })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.pageSize).toBe(10);
    });

    it('should filter reports by type', async () => {
      const response = await request(app)
        .get('/api/reports')
        .query({ reportType: ReportType.FEATURE_SUMMARY })
        .expect(200);

      expect(response.body.data.every((r: any) => r.reportType === ReportType.FEATURE_SUMMARY)).toBe(true);
    });

    it('should filter reports by status', async () => {
      const response = await request(app)
        .get('/api/reports')
        .query({ status: ReportStatus.COMPLETED })
        .expect(200);

      expect(response.body.data.every((r: any) => r.status === ReportStatus.COMPLETED)).toBe(true);
    });
  });

  describe('GET /api/reports/:id', () => {
    beforeEach(async () => {
      const report = await prisma.report.create({
        data: {
          reportType: ReportType.FEATURE_SUMMARY,
          format: ReportFormat.PDF,
          status: ReportStatus.COMPLETED,
          generatedBy: 'test-user',
          parameters: {},
        },
      });
      testReportId = report.id;
    });

    it('should get report by id', async () => {
      const response = await request(app)
        .get(`/api/reports/${testReportId}`)
        .expect(200);

      expect(response.body.id).toBe(testReportId);
      expect(response.body.reportType).toBe(ReportType.FEATURE_SUMMARY);
    });

    it('should return 404 for non-existent report', async () => {
      await request(app)
        .get('/api/reports/non-existent-id')
        .expect(404);
    });
  });

  describe('GET /api/reports/:id/status', () => {
    beforeEach(async () => {
      const report = await prisma.report.create({
        data: {
          reportType: ReportType.FEATURE_SUMMARY,
          format: ReportFormat.PDF,
          status: ReportStatus.GENERATING,
          generatedBy: 'test-user',
          parameters: {},
        },
      });
      testReportId = report.id;
    });

    it('should get report status', async () => {
      const response = await request(app)
        .get(`/api/reports/${testReportId}/status`)
        .expect(200);

      expect(response.body.id).toBe(testReportId);
      expect(response.body.status).toBe(ReportStatus.GENERATING);
      expect(response.body.progress).toBeDefined();
    });
  });

  describe('GET /api/reports/:id/download', () => {
    beforeEach(async () => {
      const report = await prisma.report.create({
        data: {
          reportType: ReportType.FEATURE_SUMMARY,
          format: ReportFormat.PDF,
          status: ReportStatus.COMPLETED,
          fileUrl: 's3://bucket/report.pdf',
          fileSize: 1024,
          generatedBy: 'test-user',
          parameters: {},
        },
      });
      testReportId = report.id;
    });

    it('should get download URL for completed report', async () => {
      const response = await request(app)
        .get(`/api/reports/${testReportId}/download`)
        .expect(200);

      expect(response.body.downloadUrl).toBeDefined();
      expect(response.body.fileSize).toBe(1024);
    });

    it('should return 400 for non-completed report', async () => {
      const pendingReport = await prisma.report.create({
        data: {
          reportType: ReportType.FEATURE_SUMMARY,
          format: ReportFormat.PDF,
          status: ReportStatus.PENDING,
          generatedBy: 'test-user',
          parameters: {},
        },
      });

      await request(app)
        .get(`/api/reports/${pendingReport.id}/download`)
        .expect(400);
    });
  });

  describe('DELETE /api/reports/:id', () => {
    beforeEach(async () => {
      const report = await prisma.report.create({
        data: {
          reportType: ReportType.FEATURE_SUMMARY,
          format: ReportFormat.PDF,
          status: ReportStatus.COMPLETED,
          generatedBy: 'anonymous',
          parameters: {},
        },
      });
      testReportId = report.id;
    });

    it('should delete report', async () => {
      await request(app)
        .delete(`/api/reports/${testReportId}`)
        .expect(204);

      const deleted = await prisma.report.findUnique({
        where: { id: testReportId },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent report', async () => {
      await request(app)
        .delete('/api/reports/non-existent-id')
        .expect(404);
    });
  });
});
