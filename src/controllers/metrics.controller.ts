import { Request, Response, NextFunction } from 'express';
import { metricCalculationService } from '../services/metric-calculation.service';
import { calculatedMetricRepository } from '../repositories/calculated-metric.repository';
import { realTimeUpdateService } from '../services/real-time-update.service';
import { calculateMetricSchema, metricQuerySchema } from '../types/schemas';
import { MetricType } from '@prisma/client';
import { logger } from '../infrastructure/logger';

export class MetricsController {
  /**
   * POST /api/metrics/calculate
   * Calculate metrics for a feature
   */
  async calculateMetric(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = calculateMetricSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        });
      }

      const { featureId, metricType, parameters } = validation.data;

      const result = await metricCalculationService.calculateMetric(
        featureId,
        metricType,
        parameters
      );

      // Broadcast metric update
      realTimeUpdateService.broadcastMetricUpdate({
        featureId,
        metricType: result.metricType,
        metricValue: result.metricValue,
        calculatedAt: new Date(),
      });

      res.json(result);
    } catch (error) {
      logger.error('Error calculating metric:', error);
      next(error);
    }
  }

  /**
   * POST /api/metrics/calculate-batch
   * Calculate multiple metrics for a feature
   */
  async calculateBatchMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const { featureId, metricTypes, parameters } = req.body;

      if (!featureId) {
        return res.status(400).json({
          error: 'featureId is required',
        });
      }

      const results = await metricCalculationService.calculateMultipleMetrics(
        featureId,
        metricTypes || Object.values(MetricType),
        parameters
      );

      // Broadcast batch update
      realTimeUpdateService.broadcastMetricBatch(
        results.map(r => ({
          featureId,
          metricType: r.metricType,
          metricValue: r.metricValue,
          calculatedAt: new Date(),
        }))
      );

      res.json({
        featureId,
        metricsCalculated: results.length,
        results,
      });
    } catch (error) {
      logger.error('Error calculating batch metrics:', error);
      next(error);
    }
  }

  /**
   * GET /api/metrics
   * Get metrics with filtering and pagination
   */
  async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = metricQuerySchema.safeParse(req.query);

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        });
      }

      const { page, pageSize, featureId, metricType, dateRangeStart, dateRangeEnd } = validation.data;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (featureId) where.featureId = featureId;
      if (metricType) where.metricType = metricType;
      if (dateRangeStart || dateRangeEnd) {
        where.calculatedAt = {};
        if (dateRangeStart) where.calculatedAt.gte = dateRangeStart;
        if (dateRangeEnd) where.calculatedAt.lte = dateRangeEnd;
      }

      const [metrics, total] = await Promise.all([
        calculatedMetricRepository.findAll({
          skip,
          take: pageSize,
          where,
          orderBy: { calculatedAt: 'desc' },
        }),
        calculatedMetricRepository.count(where),
      ]);

      res.json({
        data: metrics,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      logger.error('Error getting metrics:', error);
      next(error);
    }
  }

  /**
   * GET /api/metrics/feature/:featureId
   * Get all metrics for a specific feature
   */
  async getFeatureMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const { featureId } = req.params;

      const metrics = await calculatedMetricRepository.findByFeatureId(featureId);

      res.json({
        featureId,
        metrics,
        count: metrics.length,
      });
    } catch (error) {
      logger.error('Error getting feature metrics:', error);
      next(error);
    }
  }

  /**
   * GET /api/metrics/feature/:featureId/:metricType
   * Get specific metric for a feature
   */
  async getFeatureMetric(req: Request, res: Response, next: NextFunction) {
    try {
      const { featureId, metricType } = req.params;

      const metric = await calculatedMetricRepository.findByFeatureAndType(
        featureId,
        metricType as MetricType
      );

      if (!metric) {
        return res.status(404).json({
          error: 'Metric not found',
        });
      }

      res.json(metric);
    } catch (error) {
      logger.error('Error getting feature metric:', error);
      next(error);
    }
  }

  /**
   * GET /api/metrics/trend/:featureId/:metricType
   * Get metric trend over time
   */
  async getMetricTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const { featureId, metricType } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: 'startDate and endDate are required',
        });
      }

      const metrics = await calculatedMetricRepository.findMetricTrend(
        featureId,
        metricType as MetricType,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      // Calculate trend
      let trend: 'INCREASING' | 'DECREASING' | 'STABLE' = 'STABLE';
      if (metrics.length >= 2) {
        const firstValue = metrics[0].metricValue;
        const lastValue = metrics[metrics.length - 1].metricValue;
        const change = ((lastValue - firstValue) / firstValue) * 100;

        if (change > 5) trend = 'INCREASING';
        else if (change < -5) trend = 'DECREASING';
      }

      res.json({
        featureId,
        metricType,
        dataPoints: metrics.map(m => ({
          date: m.calculatedAt,
          value: m.metricValue,
        })),
        trend,
        changePercentage: metrics.length >= 2
          ? ((metrics[metrics.length - 1].metricValue - metrics[0].metricValue) / metrics[0].metricValue) * 100
          : 0,
      });
    } catch (error) {
      logger.error('Error getting metric trend:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/metrics/:id
   * Delete a calculated metric
   */
  async deleteMetric(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await calculatedMetricRepository.delete(id);

      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting metric:', error);
      next(error);
    }
  }
}

export const metricsController = new MetricsController();
