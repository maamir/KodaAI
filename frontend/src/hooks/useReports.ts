import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  generateReport,
  getReportStatus,
  getReportDownloadUrl,
  listReports,
  getReportDetails,
  deleteReport,
} from '@/api/reports';
import { ReportGenerationRequest } from '@/types/reports';
import { PaginationParams } from '@/types/api';

export function useListReports(params?: PaginationParams) {
  return useQuery({
    queryKey: ['reports', 'list', params],
    queryFn: () => listReports(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useReportDetails(reportId: string) {
  return useQuery({
    queryKey: ['reports', 'details', reportId],
    queryFn: () => getReportDetails(reportId),
    enabled: !!reportId,
    staleTime: 1 * 60 * 1000,
  });
}

export function useReportStatus(reportId: string, enabled = true) {
  return useQuery({
    queryKey: ['reports', 'status', reportId],
    queryFn: () => getReportStatus(reportId),
    enabled: !!reportId && enabled,
    refetchInterval: (query) => {
      const status = query?.state?.data?.data?.status;
      return status === 'PENDING' || status === 'GENERATING' ? 2000 : false;
    },
    staleTime: 0,
  });
}

export function useReportDownloadUrl(reportId: string) {
  return useQuery({
    queryKey: ['reports', 'download', reportId],
    queryFn: () => getReportDownloadUrl(reportId),
    enabled: false, // Manual trigger
    staleTime: 5 * 60 * 1000,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ReportGenerationRequest) => generateReport(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'list'] });
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportId: string) => deleteReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'list'] });
    },
  });
}
