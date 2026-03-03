import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutiveDashboard } from '../ExecutiveDashboard';
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

describe('ExecutiveDashboard', () => {
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

    render(<ExecutiveDashboard />, { wrapper: createWrapper() });

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

    render(<ExecutiveDashboard />, { wrapper: createWrapper() });

    expect(screen.getByText(/failed to load dashboard/i)).toBeInTheDocument();
  });

  it('should render dashboard with data', async () => {
    const mockData = {
      success: true,
      data: {
        viewType: ViewType.EXECUTIVE,
        widgets: [],
        summary: {
          totalFeatures: 100,
          totalTimeSaved: 500,
          avgSpeedMultiplier: 3.0,
          totalCostSavings: 100000,
          avgQualityScore: 92,
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

    render(<ExecutiveDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Executive Dashboard')).toBeInTheDocument();
    });
  });

  it('should display ROI metrics', async () => {
    const mockData = {
      success: true,
      data: {
        viewType: ViewType.EXECUTIVE,
        widgets: [],
        summary: {
          totalFeatures: 100,
          totalTimeSaved: 500,
          avgSpeedMultiplier: 3.0,
          totalCostSavings: 100000,
          avgQualityScore: 92,
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

    render(<ExecutiveDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Total ROI')).toBeInTheDocument();
      expect(screen.getByText('$100000')).toBeInTheDocument();
    });
  });

  it('should call useDashboardData with EXECUTIVE view type', () => {
    const useDashboardDataSpy = vi.mocked(dashboardHooks.useDashboardData);
    useDashboardDataSpy.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ExecutiveDashboard />, { wrapper: createWrapper() });

    expect(useDashboardDataSpy).toHaveBeenCalledWith(ViewType.EXECUTIVE, undefined);
  });

  it('should render summary stats widget', async () => {
    const mockData = {
      success: true,
      data: {
        viewType: ViewType.EXECUTIVE,
        widgets: [],
        summary: {
          totalFeatures: 100,
          totalTimeSaved: 500,
          avgSpeedMultiplier: 3.0,
          totalCostSavings: 100000,
          avgQualityScore: 92,
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

    render(<ExecutiveDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Key Metrics')).toBeInTheDocument();
    });
  });

  it('should render pie chart widget', async () => {
    const mockData = {
      success: true,
      data: {
        viewType: ViewType.EXECUTIVE,
        widgets: [],
        summary: {
          totalFeatures: 100,
          totalTimeSaved: 500,
          avgSpeedMultiplier: 3.0,
          totalCostSavings: 100000,
          avgQualityScore: 92,
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

    render(<ExecutiveDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Feature Status Distribution')).toBeInTheDocument();
    });
  });
});
