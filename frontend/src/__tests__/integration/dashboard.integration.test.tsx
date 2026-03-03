import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DeveloperDashboard } from '@/components/views/DeveloperDashboard';
import * as dashboardApi from '@/api/dashboard';
import { ViewType } from '@/types/entities';

vi.mock('@/api/dashboard');
vi.mock('@/hooks/useAnalytics', () => ({
  usePageTracking: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should load and render dashboard with data', async () => {
    const mockDashboardData = {
      success: true,
      data: {
        viewType: ViewType.DEVELOPER,
        widgets: [
          {
            id: 'widget-1',
            type: 'TIME_SAVED_CHART',
            title: 'Time Saved',
            data: { labels: ['Week 1', 'Week 2'], values: [10, 15] },
          },
        ],
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

    vi.mocked(dashboardApi.getDashboardData).mockResolvedValue(mockDashboardData);

    render(<DeveloperDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Features')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(dashboardApi.getDashboardData).mockRejectedValue(
      new Error('Network error')
    );

    render(<DeveloperDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/failed to load dashboard/i)).toBeInTheDocument();
    });
  });

  it('should retry loading on error', async () => {
    const user = userEvent.setup();
    let callCount = 0;

    vi.mocked(dashboardApi.getDashboardData).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        success: true,
        data: {
          viewType: ViewType.DEVELOPER,
          widgets: [],
          summary: {
            totalFeatures: 5,
            totalTimeSaved: 25,
            avgSpeedMultiplier: 2.0,
            totalCostSavings: 2500,
            avgQualityScore: 80,
          },
          lastUpdated: new Date().toISOString(),
        },
      });
    });

    render(<DeveloperDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/failed to load dashboard/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
    });

    expect(callCount).toBe(2);
  });

  it('should display loading state initially', () => {
    vi.mocked(dashboardApi.getDashboardData).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<DeveloperDashboard />, { wrapper: createWrapper() });

    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it('should update summary metrics when data changes', async () => {
    const initialData = {
      success: true,
      data: {
        viewType: ViewType.DEVELOPER,
        widgets: [],
        summary: {
          totalFeatures: 10,
          totalTimeSaved: 50,
          avgSpeedMultiplier: 2.5,
          totalCostSavings: 5000,
          avgQualityScore: 85,
        },
        lastUpdated: new Date().toISOString(),
      },
    };

    vi.mocked(dashboardApi.getDashboardData).mockResolvedValue(initialData);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );

    render(<DeveloperDashboard />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    // Simulate data update
    const updatedData = {
      ...initialData,
      data: {
        ...initialData.data,
        summary: {
          ...initialData.data.summary,
          totalFeatures: 15,
        },
      },
    };

    vi.mocked(dashboardApi.getDashboardData).mockResolvedValue(updatedData);

    // Invalidate query to trigger refetch
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });

    await waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });
});
