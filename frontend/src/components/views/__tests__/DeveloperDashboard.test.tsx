import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeveloperDashboard } from '../DeveloperDashboard';
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

describe('DeveloperDashboard', () => {
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

    render(<DeveloperDashboard />, { wrapper: createWrapper() });

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

    render(<DeveloperDashboard />, { wrapper: createWrapper() });

    expect(screen.getByText(/failed to load dashboard/i)).toBeInTheDocument();
  });

  it('should render dashboard with data', async () => {
    const mockData = {
      success: true,
      data: {
        viewType: ViewType.DEVELOPER,
        widgets: [],
        summary: {
          totalFeatures: 10,
          totalTimeSaved: 50.5,
          avgSpeedMultiplier: 2.5,
          totalCostSavings: 5000,
          avgQualityScore: 85.5,
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

    render(<DeveloperDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
    });
  });

  it('should display metric cards with summary data', async () => {
    const mockData = {
      success: true,
      data: {
        viewType: ViewType.DEVELOPER,
        widgets: [],
        summary: {
          totalFeatures: 15,
          totalTimeSaved: 100.5,
          avgSpeedMultiplier: 3.2,
          totalCostSavings: 10000,
          avgQualityScore: 90.0,
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

    render(<DeveloperDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Total Features')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('Time Saved')).toBeInTheDocument();
      expect(screen.getByText(/100\.5h/)).toBeInTheDocument();
    });
  });

  it('should call useDashboardData with DEVELOPER view type', () => {
    const useDashboardDataSpy = vi.mocked(dashboardHooks.useDashboardData);
    useDashboardDataSpy.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<DeveloperDashboard />, { wrapper: createWrapper() });

    expect(useDashboardDataSpy).toHaveBeenCalledWith(ViewType.DEVELOPER, undefined);
  });

  it('should not render when data is null', () => {
    vi.mocked(dashboardHooks.useDashboardData).mockReturnValue({
      data: { success: true, data: null },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const { container } = render(<DeveloperDashboard />, { wrapper: createWrapper() });

    expect(container.firstChild).toBeNull();
  });
});
