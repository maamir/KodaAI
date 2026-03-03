import { MetricType, ViewType } from './entities';

export enum WidgetType {
  TIME_SAVED_CHART = 'TIME_SAVED_CHART',
  SPEED_MULTIPLIER_CHART = 'SPEED_MULTIPLIER_CHART',
  COST_SAVINGS_CHART = 'COST_SAVINGS_CHART',
  QUALITY_METRICS_CHART = 'QUALITY_METRICS_CHART',
  TREND_CHART = 'TREND_CHART',
  FEATURE_LIST = 'FEATURE_LIST',
  SUMMARY_STATS = 'SUMMARY_STATS',
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  filters?: DashboardFilters;
  options?: Record<string, any>;
}

export interface DashboardFilters {
  dateRange?: { start: string; end: string };
  featureIds?: string[];
  statuses?: string[];
  metricTypes?: MetricType[];
}

export interface DashboardData {
  viewType: ViewType;
  widgets: WidgetData[];
  summary: SummaryStats;
  lastUpdated: string;
}

export interface WidgetData {
  widgetType: WidgetType;
  data: any;
  metadata?: {
    totalCount?: number;
    filteredCount?: number;
    calculatedAt?: string;
  };
}

export interface SummaryStats {
  totalFeatures: number;
  totalTimeSaved: number;
  avgSpeedMultiplier: number;
  totalCostSavings: number;
  avgQualityScore: number;
}

export interface TrendData {
  period: string;
  metrics: Record<MetricType, number>;
}

export interface DashboardViewConfig {
  id: string;
  userId: string;
  viewType: ViewType;
  name: string;
  description?: string;
  widgets: WidgetConfig[];
  filters: DashboardFilters;
  isDefault: boolean;
}
