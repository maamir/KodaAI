import { Request, Response, NextFunction } from 'express';
import { dashboardAggregationService } from '../services/dashboard-aggregation.service';
import { realTimeUpdateService } from '../services/real-time-update.service';
import { dashboardDataSchema } from '../types/schemas';
import { logger } from '../infrastructure/logger';

export class DashboardController {
  /**
   * GET /api/dashboard/:viewType
   * Get aggregated dashboard data
   */
  async getDashboardData(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'anonymous';
      const { viewType } = req.params;
      const validation = dashboardDataSchema.safeParse(req.query);

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        });
      }

      const { featureId, dateRangeStart, dateRangeEnd, metricTypes } = validation.data;

      const filters: any = {};
      if (featureId) filters.featureIds = [featureId];
      if (dateRangeStart) filters.dateRangeStart = dateRangeStart;
      if (dateRangeEnd) filters.dateRangeEnd = dateRangeEnd;
      if (viewType) filters.viewType = viewType.toUpperCase();

      const data = await dashboardAggregationService.getDashboardData(userId, filters);

      res.json({
        data,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Error getting dashboard data:', error);
      next(error);
    }
  }

  /**
   * GET /api/dashboard/widgets/:widgetType
   * Get specific widget data
   */
  async getWidgetData(req: Request, res: Response, next: NextFunction) {
    try {
      const { widgetType } = req.params;
      const validation = dashboardDataSchema.safeParse(req.query);

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        });
      }

      const { featureId, dateRangeStart, dateRangeEnd } = validation.data;

      const filters: any = {};
      if (featureId) filters.featureIds = [featureId];
      if (dateRangeStart) filters.dateRangeStart = dateRangeStart;
      if (dateRangeEnd) filters.dateRangeEnd = dateRangeEnd;

      const widgetData = await dashboardAggregationService.getWidgetData(widgetType, filters);

      res.json(widgetData);
    } catch (error) {
      logger.error('Error getting widget data:', error);
      next(error);
    }
  }

  /**
   * POST /api/dashboard/refresh
   * Trigger dashboard refresh
   */
  async refreshDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { reason } = req.body;

      realTimeUpdateService.broadcastDashboardRefresh(userId, reason);

      res.json({
        message: 'Dashboard refresh triggered',
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Error refreshing dashboard:', error);
      next(error);
    }
  }

  /**
   * GET /api/dashboard/stats
   * Get dashboard statistics
   */
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = realTimeUpdateService.getConnectionStats();

      res.json({
        websocket: stats,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Error getting dashboard stats:', error);
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
