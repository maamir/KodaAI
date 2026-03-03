import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportGeneratorUI } from '@/components/reports/ReportGeneratorUI';
import { ReportListTable } from '@/components/reports/ReportListTable';
import * as reportsApi from '@/api/reports';
import { ReportType, ReportFormat, ReportStatus } from '@/types/entities';

vi.mock('@/api/reports');
vi.mock('@/components/widgets/DataTableWidget', () => ({
  DataTableWidget: ({ data }: any) => (
    <div data-testid="data-table">Reports: {data.length}</div>
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
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Report Generation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate report and navigate to list', async () => {
    const user = userEvent.setup();

    vi.mocked(reportsApi.generateReport).mockResolvedValue({
      success: true,
      data: { reportId: 'report-123' },
    });

    render(<ReportGeneratorUI />, { wrapper: createWrapper() });

    const generateButton = screen.getByRole('button', { name: /generate sample report/i });
    await user.click(generateButton);

    await waitFor(() => {
      expect(reportsApi.generateReport).toHaveBeenCalledWith({
        reportType: ReportType.DEVELOPER_PERSONAL,
        format: ReportFormat.PDF,
        title: 'Sample Report',
        filters: {},
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/reports');
    });
  });

  it('should show loading state during generation', async () => {
    const user = userEvent.setup();

    vi.mocked(reportsApi.generateReport).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<ReportGeneratorUI />, { wrapper: createWrapper() });

    const generateButton = screen.getByRole('button', { name: /generate sample report/i });
    await user.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/generating report/i)).toBeInTheDocument();
    });
  });

  it('should handle generation errors', async () => {
    const user = userEvent.setup();

    vi.mocked(reportsApi.generateReport).mockRejectedValue(
      new Error('Generation failed')
    );

    render(<ReportGeneratorUI />, { wrapper: createWrapper() });

    const generateButton = screen.getByRole('button', { name: /generate sample report/i });
    await user.click(generateButton);

    // Error should be handled by the mutation
    await waitFor(() => {
      expect(reportsApi.generateReport).toHaveBeenCalled();
    });
  });
});

describe('Report List Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load and display report list', async () => {
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
        status: ReportStatus.COMPLETED,
        createdAt: '2024-02-15T10:00:00Z',
      },
    ];

    vi.mocked(reportsApi.listReports).mockResolvedValue({
      success: true,
      data: mockReports,
    });

    render(<ReportListTable />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });

    expect(screen.getByTestId('data-table')).toBeInTheDocument();
    expect(screen.getByText('Reports: 2')).toBeInTheDocument();
  });

  it('should show empty state when no reports', async () => {
    vi.mocked(reportsApi.listReports).mockResolvedValue({
      success: true,
      data: [],
    });

    render(<ReportListTable />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No Reports Yet')).toBeInTheDocument();
    });

    expect(screen.getByText(/generate your first report/i)).toBeInTheDocument();
  });

  it('should navigate to generator from empty state', async () => {
    const user = userEvent.setup();

    vi.mocked(reportsApi.listReports).mockResolvedValue({
      success: true,
      data: [],
    });

    render(<ReportListTable />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No Reports Yet')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button', { name: /generate report/i });
    await user.click(buttons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/reports/generate');
  });

  it('should handle API errors when loading reports', async () => {
    vi.mocked(reportsApi.listReports).mockRejectedValue(
      new Error('Failed to load')
    );

    render(<ReportListTable />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/failed to load reports/i)).toBeInTheDocument();
    });
  });

  it('should retry loading reports on error', async () => {
    const user = userEvent.setup();
    let callCount = 0;

    vi.mocked(reportsApi.listReports).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        success: true,
        data: [
          {
            id: 'report-1',
            title: 'Test Report',
            reportType: ReportType.EXECUTIVE_SUMMARY,
            format: ReportFormat.PDF,
            status: ReportStatus.COMPLETED,
            createdAt: '2024-01-15T10:00:00Z',
          },
        ],
      });
    });

    render(<ReportListTable />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/failed to load reports/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });

    expect(callCount).toBe(2);
  });
});
