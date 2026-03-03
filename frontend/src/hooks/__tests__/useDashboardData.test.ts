import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDashboardData, useWidgetData, useRefreshDashboard, useDashboardStats } from '../useDashboardData';
import * as dashboardApi from '@/api/dashboard';
import { ViewType } from '@/types/entities';
import { WidgetType } from '@/types/dashboard';

vi.mock('@/api/dashboard');

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

describe('useDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch dashboard data successfully', async () => {
    const mockData = {
      success: true,
      data: {
        viewType: ViewType.DEVELOPER,
        widgets: [],
        summary: {
          totalFeatures: 10,
          totalTimeSaved: 100,
          avgSpeedMultiplier: 2.5,
          totalCostSavings: 5000,
          avgQualityScore: 85,
        },
        lastUpdated: new Date().toISOString(),
      },
    };

    vi.mocked(dashboardApi.getDashboardData).mockResolvedValue(mockData);

    const { result } = renderHook(() => useDashboardData(ViewType.DEVELOPER), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(dashboardApi.getDashboardData).toHaveBeenCalledWith(ViewType.DEVELOPER, undefined);
  });

  it('should handle dashboard data fetch error', async () => {
    const mockError = new Error('Failed to fetch dashboard');
    vi.mocked(dashboardApi.getDashboardData).mockRejectedValue(mockError);

    const { result } = renderHook(() => useDashboardData(ViewType.DEVELOPER), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeTruthy();
  });

  it('should pass filters to dashboard data fetch', async () => {
    const filters = {
      dateRange: { start: '2024-01-01', end: '2024-12-31' },
      featureIds: ['feature-1'],
    };

    vi.mocked(dashboardApi.getDashboardData).mockResolvedValue({
      success: true,
      data: {} as any,
    });

    renderHook(() => useDashboardData(ViewType.MANAGER, filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(dashboardApi.getDashboardData).toHaveBeenCalledWith(ViewType.MANAGER, filters);
    });
  });
});

describe('useWidgetData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch widget data successfully', async () => {
    const mockData = {
      success: true,
      data: {
        widgetType: WidgetType.TIME_SAVED_CHART,
        data: { series: [] },
      },
    };

    vi.mocked(dashboardApi.getWidgetData).mockResolvedValue(mockData);

    const { result } = renderHook(() => useWidgetData(WidgetType.TIME_SAVED_CHART), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(dashboardApi.getWidgetData).toHaveBeenCalledWith(WidgetType.TIME_SAVED_CHART, undefined);
  });

  it('should handle widget data fetch error', async () => {
    vi.mocked(dashboardApi.getWidgetData).mockRejectedValue(new Error('Widget error'));

    const { result } = renderHook(() => useWidgetData(WidgetType.SUMMARY_STATS), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useRefreshDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should refresh dashboard successfully', async () => {
    vi.mocked(dashboardApi.refreshDashboard).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useRefreshDashboard(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(ViewType.EXECUTIVE);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(dashboardApi.refreshDashboard).toHaveBeenCalledWith(ViewType.EXECUTIVE);
  });

  it('should handle refresh error', async () => {
    vi.mocked(dashboardApi.refreshDashboard).mockRejectedValue(new Error('Refresh failed'));

    const { result } = renderHook(() => useRefreshDashboard(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(ViewType.DEVELOPER);

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch dashboard stats successfully', async () => {
    const mockStats = {
      success: true,
      data: {
        totalUsers: 50,
        totalFeatures: 200,
        totalReports: 100,
      },
    };

    vi.mocked(dashboardApi.getDashboardStats).mockResolvedValue(mockStats);

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockStats);
  });

  it('should handle stats fetch error', async () => {
    vi.mocked(dashboardApi.getDashboardStats).mockRejectedValue(new Error('Stats error'));

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
