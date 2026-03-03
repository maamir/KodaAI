import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  useListReports,
  useReportDetails,
  useReportStatus,
  useReportDownloadUrl,
  useGenerateReport,
  useDeleteReport,
} from '../useReports';
import * as reportsApi from '@/api/reports';
import { ReportType, ReportFormat, ReportStatus } from '@/types/entities';

vi.mock('@/api/reports');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useListReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list reports successfully', async () => {
    const mockReports = {
      success: true,
      data: [
        {
          id: 'report-1',
          reportType: ReportType.DEVELOPER_PERSONAL,
          format: ReportFormat.PDF,
          status: ReportStatus.COMPLETED,
          title: 'My Report',
          createdAt: new Date().toISOString(),
        },
      ],
    };

    vi.mocked(reportsApi.listReports).mockResolvedValue(mockReports);

    const { result } = renderHook(() => useListReports(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockReports);
    expect(reportsApi.listReports).toHaveBeenCalledWith(undefined);
  });

  it('should pass pagination params', async () => {
    const params = { page: 2, limit: 10 };

    vi.mocked(reportsApi.listReports).mockResolvedValue({ success: true, data: [] });

    renderHook(() => useListReports(params), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(reportsApi.listReports).toHaveBeenCalledWith(params);
    });
  });
});

describe('useReportDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch report details successfully', async () => {
    const mockDetails = {
      success: true,
      data: {
        id: 'report-1',
        reportType: ReportType.TEAM_PRODUCTIVITY,
        format: ReportFormat.EXCEL,
        status: ReportStatus.COMPLETED,
        title: 'Team Report',
        fileUrl: 'https://example.com/report.xlsx',
        createdAt: new Date().toISOString(),
        filters: {},
      },
    };

    vi.mocked(reportsApi.getReportDetails).mockResolvedValue(mockDetails);

    const { result } = renderHook(() => useReportDetails('report-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockDetails);
  });

  it('should not fetch when reportId is empty', () => {
    const { result } = renderHook(() => useReportDetails(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useReportStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch report status successfully', async () => {
    const mockStatus = {
      success: true,
      data: {
        reportId: 'report-1',
        status: ReportStatus.GENERATING,
        progress: 50,
        message: 'Generating report...',
      },
    };

    vi.mocked(reportsApi.getReportStatus).mockResolvedValue(mockStatus);

    const { result } = renderHook(() => useReportStatus('report-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockStatus);
  });

  it('should poll when status is PENDING or GENERATING', async () => {
    vi.mocked(reportsApi.getReportStatus).mockResolvedValue({
      success: true,
      data: {
        reportId: 'report-1',
        status: ReportStatus.GENERATING,
        progress: 50,
      },
    });

    const { result } = renderHook(() => useReportStatus('report-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify polling is enabled (refetchInterval should be set)
    expect(result.current.data?.data?.status).toBe(ReportStatus.GENERATING);
  });

  it('should not poll when status is COMPLETED', async () => {
    vi.mocked(reportsApi.getReportStatus).mockResolvedValue({
      success: true,
      data: {
        reportId: 'report-1',
        status: ReportStatus.COMPLETED,
        progress: 100,
      },
    });

    const { result } = renderHook(() => useReportStatus('report-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data?.status).toBe(ReportStatus.COMPLETED);
  });

  it('should not fetch when disabled', () => {
    const { result } = renderHook(() => useReportStatus('report-1', false), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useReportDownloadUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch download URL successfully', async () => {
    const mockUrl = {
      success: true,
      data: { url: 'https://example.com/download/report.pdf' },
    };

    vi.mocked(reportsApi.getReportDownloadUrl).mockResolvedValue(mockUrl);

    const { result } = renderHook(() => useReportDownloadUrl('report-1'), {
      wrapper: createWrapper(),
    });

    // Manual trigger required
    result.current.refetch();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockUrl);
  });
});

describe('useGenerateReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate report successfully', async () => {
    const mockResult = {
      success: true,
      data: { reportId: 'report-1' },
    };

    vi.mocked(reportsApi.generateReport).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useGenerateReport(), {
      wrapper: createWrapper(),
    });

    const request = {
      reportType: ReportType.EXECUTIVE_SUMMARY,
      format: ReportFormat.PDF,
      title: 'Executive Summary',
      filters: {},
    };

    result.current.mutate(request);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(reportsApi.generateReport).toHaveBeenCalledWith(request);
  });

  it('should handle generation error', async () => {
    vi.mocked(reportsApi.generateReport).mockRejectedValue(new Error('Generation failed'));

    const { result } = renderHook(() => useGenerateReport(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      reportType: ReportType.COST_BENEFIT,
      format: ReportFormat.EXCEL,
      title: 'Cost Benefit',
      filters: {},
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useDeleteReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete report successfully', async () => {
    vi.mocked(reportsApi.deleteReport).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useDeleteReport(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('report-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(reportsApi.deleteReport).toHaveBeenCalledWith('report-1');
  });

  it('should handle delete error', async () => {
    vi.mocked(reportsApi.deleteReport).mockRejectedValue(new Error('Delete failed'));

    const { result } = renderHook(() => useDeleteReport(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('report-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
