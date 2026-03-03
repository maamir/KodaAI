import { apiRequest } from './client';
import {
  ReportGenerationRequest,
  ReportListItem,
  ReportDetails,
  ReportProgress,
} from '@/types/reports';
import { ApiResponse, PaginationParams } from '@/types/api';

export async function generateReport(
  request: ReportGenerationRequest
): Promise<ApiResponse<{ reportId: string }>> {
  return apiRequest<{ reportId: string }>('post', '/reports/generate', request);
}

export async function getReportStatus(reportId: string): Promise<ApiResponse<ReportProgress>> {
  return apiRequest<ReportProgress>('get', `/reports/${reportId}/status`);
}

export async function getReportDownloadUrl(reportId: string): Promise<ApiResponse<{ url: string }>> {
  return apiRequest<{ url: string }>('get', `/reports/${reportId}/download`);
}

export async function listReports(
  params?: PaginationParams
): Promise<ApiResponse<ReportListItem[]>> {
  return apiRequest<ReportListItem[]>('get', '/reports', undefined, params);
}

export async function getReportDetails(reportId: string): Promise<ApiResponse<ReportDetails>> {
  return apiRequest<ReportDetails>('get', `/reports/${reportId}`);
}

export async function deleteReport(reportId: string): Promise<ApiResponse<void>> {
  return apiRequest<void>('delete', `/reports/${reportId}`);
}
