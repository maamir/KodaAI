import { MetricType, FeatureStatus } from '@prisma/client';
import { featureRepository } from '../repositories/feature.repository';
import { calculatedMetricRepository } from '../repositories/calculated-metric.repository';
import { dashboardViewRepository } from '../repositories/dashboard-view.repository';
import { DashboardData } from '../types/entities';
import { logger } from '../infrastructure/logger';

interface DashboardFilters {
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  status?: FeatureStatus[];
  featureIds?: string[];
}

interface WidgetData {
  widgetId: string;
  widgetType: string;
  data: any;
  lastUpdated: Date;
}

export class DashboardAggregationService {
  async getDashboardData(
    userId: string,
    filters: DashboardFilters = {}
  ): Promise<DashboardData> {
    try {
      // 1. Get filtered features
      const features = await this.getFilteredFeatures(filters);

      // 2. Get metrics for filtered features
      const featureIds = features.map(f => f.id);
      const metrics = await this.getMetricsForFeatures(featureIds);

      // 3. Calculate summary statistics
      const summary = await this.calculateSummary(features, metrics);

      return {
        metrics,
        features,
        summary,
      };
    } catch (error) {
      logger.error('Error aggregating dashboard data:', error);
      throw error;
    }
  }

  async getWidgetData(
    widgetType: string,
    filters: DashboardFilters = {}
  ): Promise<WidgetData> {
    const features = await this.getFilteredFeatures(filters);
    const featureIds = features.map(f => f.id);

    let data: any;

    switch (widgetType) {
      case 'TIME_SAVED_CHART':
        data = await this.getTimeSavedChartData(featureIds);
        break;
      case 'SPEED_MULTIPLIER_CHART':
        data = await this.getSpeedMultiplierChartData(featureIds);
        break;
      case 'COST_SAVINGS_CHART':
        data = await this.getCostSavingsChartData(featureIds);
        break;
      case 'QUALITY_METRICS_CHART':
        data = await this.getQualityMetricsChartData(featureIds);
        break;
      case 'TREND_CHART':
        data = await this.getTrendChartData(featureIds, filters);
        break;
      case 'FEATURE_LIST':
        data = await this.getFeatureListData(features);
        break;
      case 'SUMMARY_STATS':
        data = await this.getSummaryStatsData(features, featureIds);
        break;
      default:
        throw new Error(`Unknown widget type: ${widgetType}`);
    }

    return {
      widgetId: `${widgetType}_${Date.now()}`,
      widgetType,
      data,
      lastUpdated: new Date(),
    };
  }

  private async getFilteredFeatures(filters: DashboardFilters) {
    const where: any = {};

    if (filters.dateRangeStart || filters.dateRangeEnd) {
      where.startedAt = {};
      if (filters.dateRangeStart) {
        where.startedAt.gte = filters.dateRangeStart;
      }
      if (filters.dateRangeEnd) {
        where.startedAt.lte = filters.dateRangeEnd;
      }
    }

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters.featureIds && filters.featureIds.length > 0) {
      where.id = { in: filters.featureIds };
    }

    return featureRepository.findAll({ where });
  }

  private async getMetricsForFeatures(featureIds: string[]) {
    if (featureIds.length === 0) return [];

    return calculatedMetricRepository.findAll({
      where: {
        featureId: { in: featureIds },
      },
    });
  }

  private async calculateSummary(features: any[], metrics: any[]) {
    const completedFeatures = features.filter(f => f.status === FeatureStatus.COMPLETED);

    const timeSavedMetrics = metrics.filter(m => m.metricType === MetricType.TIME_SAVED);
    const speedMultiplierMetrics = metrics.filter(m => m.metricType === MetricType.SPEED_MULTIPLIER);
    const costSavingsMetrics = metrics.filter(m => m.metricType === MetricType.COST_SAVINGS);

    const totalTimeSaved = timeSavedMetrics.reduce((sum, m) => sum + m.metricValue, 0);
    const averageSpeedMultiplier = speedMultiplierMetrics.length > 0
      ? speedMultiplierMetrics.reduce((sum, m) => sum + m.metricValue, 0) / speedMultiplierMetrics.length
      : 0;
    const totalCostSavings = costSavingsMetrics.reduce((sum, m) => sum + m.metricValue, 0);

    return {
      totalFeatures: features.length,
      completedFeatures: completedFeatures.length,
      totalTimeSaved,
      averageSpeedMultiplier,
      totalCostSavings,
    };
  }

  private async getTimeSavedChartData(featureIds: string[]) {
    const metrics = await calculatedMetricRepository.findAll({
      where: {
        featureId: { in: featureIds },
        metricType: MetricType.TIME_SAVED,
      },
    });

    const total = metrics.reduce((sum, m) => sum + m.metricValue, 0);
    const average = metrics.length > 0 ? total / metrics.length : 0;

    return {
      total,
      average,
      count: metrics.length,
      dataPoints: metrics.map(m => ({
        featureId: m.featureId,
        value: m.metricValue,
        calculatedAt: m.calculatedAt,
      })),
    };
  }

  private async getSpeedMultiplierChartData(featureIds: string[]) {
    const metrics = await calculatedMetricRepository.findAll({
      where: {
        featureId: { in: featureIds },
        metricType: MetricType.SPEED_MULTIPLIER,
      },
    });

    if (metrics.length === 0) {
      return { average: 0, min: 0, max: 0, count: 0 };
    }

    const values = metrics.map(m => m.metricValue);
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      average,
      min,
      max,
      count: metrics.length,
      dataPoints: metrics.map(m => ({
        featureId: m.featureId,
        value: m.metricValue,
      })),
    };
  }

  private async getCostSavingsChartData(featureIds: string[]) {
    const metrics = await calculatedMetricRepository.findAll({
      where: {
        featureId: { in: featureIds },
        metricType: MetricType.COST_SAVINGS,
      },
    });

    const total = metrics.reduce((sum, m) => sum + m.metricValue, 0);

    // Group by month
    const byMonth: Record<string, number> = {};
    metrics.forEach(m => {
      const month = m.calculatedAt.toISOString().substring(0, 7); // YYYY-MM
      byMonth[month] = (byMonth[month] || 0) + m.metricValue;
    });

    return {
      total,
      byMonth,
      dataPoints: metrics.map(m => ({
        featureId: m.featureId,
        value: m.metricValue,
        calculatedAt: m.calculatedAt,
      })),
    };
  }

  private async getQualityMetricsChartData(featureIds: string[]) {
    const qualityMetrics = await calculatedMetricRepository.findAll({
      where: {
        featureId: { in: featureIds },
        metricType: MetricType.QUALITY_SCORE,
      },
    });

    const defectMetrics = await calculatedMetricRepository.findAll({
      where: {
        featureId: { in: featureIds },
        metricType: MetricType.DEFECT_RATE,
      },
    });

    const avgQuality = qualityMetrics.length > 0
      ? qualityMetrics.reduce((sum, m) => sum + m.metricValue, 0) / qualityMetrics.length
      : 0;

    const avgDefectRate = defectMetrics.length > 0
      ? defectMetrics.reduce((sum, m) => sum + m.metricValue, 0) / defectMetrics.length
      : 0;

    return {
      avgQualityScore: avgQuality,
      avgDefectRate,
      qualityDataPoints: qualityMetrics.map(m => ({
        featureId: m.featureId,
        value: m.metricValue,
      })),
      defectDataPoints: defectMetrics.map(m => ({
        featureId: m.featureId,
        value: m.metricValue,
      })),
    };
  }

  private async getTrendChartData(featureIds: string[], filters: DashboardFilters) {
    const startDate = filters.dateRangeStart || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
    const endDate = filters.dateRangeEnd || new Date();

    const metrics = await calculatedMetricRepository.findAll({
      where: {
        featureId: { in: featureIds },
        metricType: MetricType.SPEED_MULTIPLIER,
        calculatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { calculatedAt: 'asc' },
    });

    // Group by week
    const byWeek: Record<string, { sum: number; count: number }> = {};
    metrics.forEach(m => {
      const week = this.getWeekKey(m.calculatedAt);
      if (!byWeek[week]) {
        byWeek[week] = { sum: 0, count: 0 };
      }
      byWeek[week].sum += m.metricValue;
      byWeek[week].count += 1;
    });

    const trendData = Object.entries(byWeek).map(([week, data]) => ({
      week,
      average: data.sum / data.count,
      count: data.count,
    }));

    // Calculate trend direction
    let trend: 'INCREASING' | 'DECREASING' | 'STABLE' = 'STABLE';
    if (trendData.length >= 2) {
      const firstHalf = trendData.slice(0, Math.floor(trendData.length / 2));
      const secondHalf = trendData.slice(Math.floor(trendData.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, d) => sum + d.average, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, d) => sum + d.average, 0) / secondHalf.length;
      
      const change = ((secondAvg - firstAvg) / firstAvg) * 100;
      
      if (change > 5) trend = 'INCREASING';
      else if (change < -5) trend = 'DECREASING';
    }

    return {
      trendData,
      trend,
      startDate,
      endDate,
    };
  }

  private async getFeatureListData(features: any[]) {
    // Get top 10 most recent features
    const recentFeatures = features
      .sort((a, b) => (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0))
      .slice(0, 10);

    // Fetch key metrics for each feature
    const enrichedFeatures = await Promise.all(
      recentFeatures.map(async (feature) => {
        const timeSaved = await calculatedMetricRepository.findByFeatureAndType(
          feature.id,
          MetricType.TIME_SAVED
        );
        const speedMultiplier = await calculatedMetricRepository.findByFeatureAndType(
          feature.id,
          MetricType.SPEED_MULTIPLIER
        );
        const costSavings = await calculatedMetricRepository.findByFeatureAndType(
          feature.id,
          MetricType.COST_SAVINGS
        );

        return {
          ...feature,
          metrics: {
            timeSaved: timeSaved?.metricValue || 0,
            speedMultiplier: speedMultiplier?.metricValue || 0,
            costSavings: costSavings?.metricValue || 0,
          },
        };
      })
    );

    return {
      features: enrichedFeatures,
      total: features.length,
    };
  }

  private async getSummaryStatsData(features: any[], featureIds: string[]) {
    const summary = await this.calculateSummary(features, await this.getMetricsForFeatures(featureIds));

    // Add additional stats
    const inProgressFeatures = features.filter(f => f.status === FeatureStatus.IN_PROGRESS);
    const pausedFeatures = features.filter(f => f.status === FeatureStatus.PAUSED);

    return {
      ...summary,
      inProgressFeatures: inProgressFeatures.length,
      pausedFeatures: pausedFeatures.length,
      completionRate: features.length > 0
        ? (summary.completedFeatures / features.length) * 100
        : 0,
    };
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  async getUserDashboardView(userId: string, viewType: string) {
    return dashboardViewRepository.findByUserIdAndType(userId, viewType as any);
  }

  async getDefaultDashboardView(userId: string) {
    return dashboardViewRepository.findDefaultByUserId(userId);
  }
}

export const dashboardAggregationService = new DashboardAggregationService();
