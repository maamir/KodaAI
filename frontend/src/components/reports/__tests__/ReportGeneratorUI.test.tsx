import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportGeneratorUI } from '../ReportGeneratorUI';
import * as useReportsHook from '@/hooks/useReports';
import { ReportType, ReportFormat } from '@/types/entities';

vi.mock('@/hooks/useReports');

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

describe('ReportGeneratorUI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render report generator title', () => {
    vi.mocked(useReportsHook.useGenerateReport).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(<ReportGeneratorUI />, { wrapper: createWrapper() });

    expect(screen.getByText('Generate Report')).toBeInTheDocument();
  });

  it('should render placeholder message', () => {
    vi.mocked(useReportsHook.useGenerateReport).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(<ReportGeneratorUI />, { wrapper: createWrapper() });

    expect(screen.getByText(/report generation ui coming soon/i)).toBeInTheDocument();
  });

  it('should render generate button', () => {
    vi.mocked(useReportsHook.useGenerateReport).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(<ReportGeneratorUI />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: /generate sample report/i })).toBeInTheDocument();
  });

  it('should show loading spinner when generating', () => {
    vi.mocked(useReportsHook.useGenerateReport).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    } as any);

    render(<ReportGeneratorUI />, { wrapper: createWrapper() });

    expect(screen.getByText(/generating report/i)).toBeInTheDocument();
  });

  it('should call generateReport when button clicked', async () => {
    const user = userEvent.setup();
    const mutateMock = vi.fn();

    vi.mocked(useReportsHook.useGenerateReport).mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    } as any);

    render(<ReportGeneratorUI />, { wrapper: createWrapper() });

    const button = screen.getByRole('button', { name: /generate sample report/i });
    await user.click(button);

    expect(mutateMock).toHaveBeenCalledWith(
      {
        reportType: ReportType.DEVELOPER_PERSONAL,
        format: ReportFormat.PDF,
        title: 'Sample Report',
        filters: {},
      },
      expect.any(Object)
    );
  });

  it('should navigate to reports page on success', async () => {
    const user = userEvent.setup();
    let onSuccessCallback: (() => void) | undefined;

    const mutateMock = vi.fn((params, options) => {
      onSuccessCallback = options?.onSuccess;
    });

    vi.mocked(useReportsHook.useGenerateReport).mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    } as any);

    render(<ReportGeneratorUI />, { wrapper: createWrapper() });

    const button = screen.getByRole('button', { name: /generate sample report/i });
    await user.click(button);

    // Simulate success
    if (onSuccessCallback) {
      onSuccessCallback();
    }

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/reports');
    });
  });

  it('should not render generate button when loading', () => {
    vi.mocked(useReportsHook.useGenerateReport).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    } as any);

    render(<ReportGeneratorUI />, { wrapper: createWrapper() });

    expect(screen.queryByRole('button', { name: /generate sample report/i })).not.toBeInTheDocument();
  });

  it('should use default report type and format', async () => {
    const user = userEvent.setup();
    const mutateMock = vi.fn();

    vi.mocked(useReportsHook.useGenerateReport).mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    } as any);

    render(<ReportGeneratorUI />, { wrapper: createWrapper() });

    const button = screen.getByRole('button', { name: /generate sample report/i });
    await user.click(button);

    expect(mutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        reportType: ReportType.DEVELOPER_PERSONAL,
        format: ReportFormat.PDF,
      }),
      expect.any(Object)
    );
  });
});
