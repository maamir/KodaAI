import { ReportType, ReportFormat, ReportStatus } from './entities';

export interface ReportGenerationRequest {
  reportType: ReportType;
  format: ReportFormat;
  title: string;
  description?: string;
  filters: ReportFilters;
  options?: ReportOptions;
}

export interface ReportFilters {
  dateRange?: { start: string; end: string };
  featureIds?: string[];
  statuses?: string[];
  userIds?: string[];
}

export interface ReportOptions {
  includeCharts?: boolean;
  includeRawData?: boolean;
  groupBy?: 'feature' | 'user' | 'week' | 'month';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReportListItem {
  id: string;
  reportType: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  title: string;
  description?: string;
  fileSize?: number;
  expiresAt?: string;
  generatedAt?: string;
  createdAt: string;
}

export interface ReportDetails extends ReportListItem {
  filters: ReportFilters;
  fileUrl?: string;
  error?: string;
}

export interface ReportProgress {
  reportId: string;
  status: ReportStatus;
  progress: number;
  message?: string;
  error?: string;
}
