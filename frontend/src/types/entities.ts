export enum MetricType {
  TIME_SAVED = 'TIME_SAVED',
  SPEED_MULTIPLIER = 'SPEED_MULTIPLIER',
  COST_SAVINGS = 'COST_SAVINGS',
  PRODUCTIVITY_GAIN = 'PRODUCTIVITY_GAIN',
  QUALITY_SCORE = 'QUALITY_SCORE',
  VELOCITY = 'VELOCITY',
  CYCLE_TIME = 'CYCLE_TIME',
  LEAD_TIME = 'LEAD_TIME',
  THROUGHPUT = 'THROUGHPUT',
  DEFECT_RATE = 'DEFECT_RATE',
}

export enum ReportType {
  DEVELOPER_PERSONAL = 'DEVELOPER_PERSONAL',
  TEAM_PRODUCTIVITY = 'TEAM_PRODUCTIVITY',
  EXECUTIVE_SUMMARY = 'EXECUTIVE_SUMMARY',
  COST_BENEFIT = 'COST_BENEFIT',
  QUALITY_METRICS = 'QUALITY_METRICS',
  VELOCITY_TRENDS = 'VELOCITY_TRENDS',
  CUSTOM = 'CUSTOM',
}

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  HTML = 'HTML',
  JSON = 'JSON',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum ViewType {
  DEVELOPER = 'DEVELOPER',
  MANAGER = 'MANAGER',
  EXECUTIVE = 'EXECUTIVE',
  CUSTOM = 'CUSTOM',
}

export interface CalculatedMetric {
  id: string;
  featureId: string;
  metricType: MetricType;
  value: number;
  formula: string;
  parameters: Record<string, any>;
  calculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  userId: string;
  reportType: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  title: string;
  description?: string;
  filters: Record<string, any>;
  fileUrl?: string;
  fileSize?: number;
  expiresAt?: string;
  generatedAt?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardView {
  id: string;
  userId: string;
  viewType: ViewType;
  name: string;
  description?: string;
  configuration: Record<string, any>;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Feature {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
