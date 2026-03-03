import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportListTable } from '../ReportListTable';
import * as useReportsHook from '@/hooks/useReports';
import { ReportType, ReportFormat, ReportStatus } from '@/types/entities';

vi.mock('@/hooks/useReports');
vi.mock('@/components/widgets/DataTableWidget', () => ({
  DataTableWidget: ({ columns, data }: any) => (
    <div data-testid="data-table">
      <div>Columns: {columns.length}</div>
      <div>Rows: {data.length}</div>
    </div>
  ),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ReportListTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner while fetching', () => {
    vi.mocked(useReportsHook.useListReports).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ReportListTable />, { wrapper: createWrapper() });

    expect(screen.getByText(/loading reports/i)).toBeInTheDocument();
  });

  it('should show error alert on fetch error', () => {
    const refetch = vi.fn();
    vi.mocked(useReportsHook.useListReports).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
      refetch,
    } as any);

    render(<ReportListTable />, { wrapper: createWrapper() });

    expect(screen.getByText(/failed to load reports/i)).toBeInTheDocument();
  });

  it('should call refetch when retry button clicked', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();

    vi.mocked(useReportsHook.useListReports).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
      refetch,
    } as any);

    render(<ReportListTable />, { wrapper: createWrapper() });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    expect(refetch).toHaveBeenCalled();
  });

  it('should render reports title', () => {
    vi.mocked(useReportsHook.useListReports).mockReturnValue({
      data: { success: true, data: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ReportListTable />, { wrapper: createWrapper() });

    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('should render generate report button', () => {
    vi.mocked(useReportsHook.useListReports).mockReturnValue({
      data: { success: true, data: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ReportListTable />, { wrapper: createWrapper() });

    const buttons = screen.getAllByRole('button', { name: /generate report/i });
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should navigate to generate page when button clicked', async () => {
    const user = userEvent.setup();

    vi.mocked(useReportsHook.useListReports).mockReturnValue({
      data: { success: true, data: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ReportListTable />, { wrapper: createWrapper() });

    const buttons = screen.getAllByRole('button', { name: /generate report/i });
    await user.click(buttons[0]); // Click the first button (header button)

    expect(mockNavigate).toHaveBeenCalledWith('/reports/generate');
  });

  it('should show empty state when no reports', () => {
    vi.mocked(useReportsHook.useListReports).mockReturnValue({
      data: { success: true, data: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ReportListTable />, { wrapper: createWrapper() });

    expect(screen.getByText('No Reports Yet')).toBeInTheDocument();
    expect(screen.getByText(/generate your first report/i)).toBeInTheDocument();
  });

  it('should navigate to generate page from empty state', async () => {
    const user = userEvent.setup();

    vi.mocked(useReportsHook.useListReports).mockReturnValue({
      data: { success: true, data: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ReportListTable />, { wrapper: createWrapper() });

    const buttons = screen.getAllByRole('button', { name: /generate report/i });
    await user.click(buttons[1]); // Click the second button (empty state button)

    expect(mockNavigate).toHaveBeenCalledWith('/reports/generate');
  });

  it('should render data table with reports', () => {
    const mockReports = [
      {
        id: 'report-1',
        title: 'Q1 Report',
        reportType: ReportType.DEVELOPER_PERSONAL,
        format: ReportFormat.PDF,
        status: ReportStatus.COMPLETED,
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 'report-2',
        title: 'Q2 Report',
        reportType: ReportType.TEAM_PRODUCTIVITY,
        format: ReportFormat.EXCEL,
        status: ReportStatus.GENERATING,
        createdAt: '2024-02-15T10:00:00Z',
      },
    ];

    vi.mocked(useReportsHook.useListReports).mockReturnValue({
      data: { success: true, data: mockReports },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ReportListTable />, { wrapper: createWrapper() });

    expect(screen.getByTestId('data-table')).toBeInTheDocument();
    expect(screen.getByText('Rows: 2')).toBeInTheDocument();
  });

  it('should pass correct columns to data table', () => {
    const mockReports = [
      {
        id: 'report-1',
        title: 'Test Report',
        reportType: ReportType.EXECUTIVE_SUMMARY,
        format: ReportFormat.HTML,
        status: ReportStatus.COMPLETED,
        createdAt: '2024-01-15T10:00:00Z',
      },
    ];

    vi.mocked(useReportsHook.useListReports).mockReturnValue({
      data: { success: true, data: mockReports },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ReportListTable />, { wrapper: createWrapper() });

    expect(screen.getByText('Columns: 5')).toBeInTheDocument();
  });

  it('should handle null data gracefully', () => {
    vi.mocked(useReportsHook.useListReports).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ReportListTable />, { wrapper: createWrapper() });

    expect(screen.getByText('No Reports Yet')).toBeInTheDocument();
  });

  it('should handle undefined data.data gracefully', () => {
    vi.mocked(useReportsHook.useListReports).mockReturnValue({
      data: { success: true, data: undefined },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<ReportListTable />, { wrapper: createWrapper() });

    expect(screen.getByText('No Reports Yet')).toBeInTheDocument();
  });
});
