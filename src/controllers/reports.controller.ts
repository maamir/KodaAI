import { Request, Response, NextFunction } from 'express';
import { reportGenerationService } from '../services/report-generation.service';
import { reportStorageService } from '../services/report-storage.service';
import { reportRepository } from '../repositories/report.repository';
import { generateReportSchema, reportQuerySchema } from '../types/schemas';
import { ReportStatus } from '@prisma/client';
import { NotFoundError } from '../infrastructure/errors';
import { logger } from '../infrastructure/logger';

export class ReportsController {
  /**
   * POST /api/reports
   * Generate a new report
   */
  async generateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'anonymous';
      const validation = generateReportSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        });
      }

      const params = {
        ...validation.data,
        generatedBy: userId,
      };

      const reportId = await reportGenerationService.generateReport(params);

      res.status(202).json({
        reportId,
        status: 'GENERATING',
        message: 'Report generation started',
      });
    } catch (error) {
      logger.error('Error generating report:', error);
      next(error);
    }
  }

  /**
   * GET /api/reports/:id
   * Get report status and details
   */
  async getReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const report = await reportRepository.findById(id);

      if (!report) {
        throw new NotFoundError('Report not found');
      }

      res.json(report);
    } catch (error) {
      logger.error('Error getting report:', error);
      next(error);
    }
  }

  /**
   * GET /api/reports
   * List reports with pagination
   */
  async listReports(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'anonymous';
      const validation = reportQuerySchema.safeParse(req.query);

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        });
      }

      const { page, pageSize, reportType, status, generatedBy } = validation.data;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (reportType) where.reportType = reportType;
      if (status) where.status = status;
      if (generatedBy) where.generatedBy = generatedBy;
      else where.generatedBy = userId; // Default to user's own reports

      const [reports, total] = await Promise.all([
        reportRepository.findAll({ skip, take: pageSize, where, orderBy: { createdAt: 'desc' } }),
        reportRepository.count(where),
      ]);

      res.json({
        data: reports,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      logger.error('Error listing reports:', error);
      next(error);
    }
  }

  /**
   * GET /api/reports/:id/download
   * Get signed download URL for report
   */
  async getDownloadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const report = await reportRepository.findById(id);

      if (!report) {
        throw new NotFoundError('Report not found');
      }

      if (report.status !== ReportStatus.COMPLETED) {
        return res.status(400).json({
          error: 'Report is not ready for download',
          status: report.status,
        });
      }

      const downloadUrl = await reportStorageService.getSignedDownloadUrl(id);

      res.json({
        downloadUrl,
        expiresAt: report.expiresAt,
        fileSize: report.fileSize,
        format: report.format,
      });
    } catch (error) {
      logger.error('Error getting download URL:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/reports/:id
   * Delete a report
   */
  async deleteReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'anonymous';

      const report = await reportRepository.findById(id);

      if (!report) {
        throw new NotFoundError('Report not found');
      }

      // Check authorization
      if (report.generatedBy !== userId) {
        return res.status(403).json({
          error: 'Unauthorized to delete this report',
        });
      }

      await reportGenerationService.deleteReport(id);

      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting report:', error);
      next(error);
    }
  }

  /**
   * GET /api/reports/:id/status
   * Get report generation status
   */
  async getReportStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const report = await reportRepository.findById(id);

      if (!report) {
        throw new NotFoundError('Report not found');
      }

      res.json({
        id: report.id,
        status: report.status,
        progress: report.status === ReportStatus.GENERATING ? 50 : 100,
        fileUrl: report.fileUrl,
        error: report.error,
      });
    } catch (error) {
      logger.error('Error getting report status:', error);
      next(error);
    }
  }
}

export const reportsController = new ReportsController();
