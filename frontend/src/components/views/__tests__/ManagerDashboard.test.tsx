import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManagerDashboard } from '../ManagerDashboard';
import * as dashboardHooks from '@/hooks/useDashboardData';
import { ViewType } from '@/types/entities';

vi.mock('@/hooks/useDashboardData');
vi.mock('@/hooks/useAnalytics', () => ({
  usePageTracking: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('ManagerDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner while fetching data', () => {
    vi.mocked(dashboardHooks.useDashboardData).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ManagerDashboard />, { wrapper: createWrapper() });

    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it('should show error alert on fetch error', () => {
    const refetch = vi.fn();
    vi.mocked(dashboardHooks.useDashboardData).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
      refetch,
    } as any);

    render(<ManagerDashboard />, { wrapper: createWrapper() });

    expect(screen.getByText(/failed to load dashboard/i)).toBeInTheDocument();
  });

  it('should render dashboard with data', async () => {
    const mockData = {
      success: true,
      data: {
        viewType: ViewType.MANAGER,
        widgets: [],
        summary: {
          totalFeatures: 50,
          totalTimeSaved: 200,
          avgSpeedMultiplier: 2.8,
          totalCostSavings: 25000,
          avgQualityScore: 88,
        },
        lastUpdated: new Date().toISOString(),
      },
    };

    vi.mocked(dashboardHooks.useDashboardData).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ManagerDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Manager Dashboard')).toBeInTheDocument();
    });
  });

  it('should display team productivity metrics', async () => {
    const mockData = {
      success: true,
      data: {
        viewType: ViewType.MANAGER,
        widgets: [],
        summary: {
          totalFeatures: 50,
          totalTimeSaved: 200,
          avgSpeedMultiplier: 2.8,
          totalCostSavings: 25000,
          avgQualityScore: 88,
        },
        lastUpdated: new Date().toISOString(),
      },
    };

    vi.mocked(dashboardHooks.useDashboardData).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ManagerDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Team Productivity')).toBeInTheDocument();
      expect(screen.getByText(/2\.80x/)).toBeInTheDocument();
    });
  });

  it('should call useDashboardData with MANAGER view type', () => {
    const useDashboardDataSpy = vi.mocked(dashboardHooks.useDashboardData);
    useDashboardDataSpy.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ManagerDashboard />, { wrapper: createWrapper() });

    expect(useDashboardDataSpy).toHaveBeenCalledWith(ViewType.MANAGER, undefined);
  });

  it('should render team comparison widget', async () => {
    const mockData = {
      success: true,
      data: {
        viewType: ViewType.MANAGER,
        widgets: [],
        summary: {
          totalFeatures: 50,
          totalTimeSaved: 200,
          avgSpeedMultiplier: 2.8,
          totalCostSavings: 25000,
          avgQualityScore: 88,
        },
        lastUpdated: new Date().toISOString(),
      },
    };

    vi.mocked(dashboardHooks.useDashboardData).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ManagerDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Team Performance')).toBeInTheDocument();
    });
  });
});
