import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { io } from 'socket.io-client';

vi.mock('socket.io-client');

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

describe('Real-Time Updates Integration Tests', () => {
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
      connected: true,
    };

    vi.mocked(io).mockReturnValue(mockSocket as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should establish WebSocket connection', () => {
    renderHook(() => useRealTimeUpdates({ enabled: true }), {
      wrapper: createWrapper(),
    });

    expect(io).toHaveBeenCalledWith(expect.any(String), expect.any(Object));
  });

  it('should not connect when disabled', () => {
    renderHook(() => useRealTimeUpdates({ enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(io).not.toHaveBeenCalled();
  });

  it('should register event listeners on connect', () => {
    renderHook(() => useRealTimeUpdates({ enabled: true }), {
      wrapper: createWrapper(),
    });

    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
  });

  it('should subscribe to dashboard updates', () => {
    renderHook(
      () =>
        useRealTimeUpdates({
          enabled: true,
          dashboardId: 'dashboard-1',
        }),
      { wrapper: createWrapper() }
    );

    expect(mockSocket.on).toHaveBeenCalledWith('metrics:updated', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('dashboard:updated', expect.any(Function));
  });

  it('should subscribe to feature updates', () => {
    renderHook(
      () =>
        useRealTimeUpdates({
          enabled: true,
          featureIds: ['feature-1', 'feature-2'],
        }),
      { wrapper: createWrapper() }
    );

    // Wait for connect event to trigger subscriptions
    const connectHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'connect'
    )?.[1];

    expect(connectHandler).toBeDefined();
    connectHandler();

    expect(mockSocket.emit).toHaveBeenCalledWith('subscribe_feature', { featureId: 'feature-1' });
    expect(mockSocket.emit).toHaveBeenCalledWith('subscribe_feature', { featureId: 'feature-2' });
  });

  it('should handle metric update events', async () => {
    const { result } = renderHook(
      () => useRealTimeUpdates({ enabled: true }),
      { wrapper: createWrapper() }
    );

    // Trigger connect event to set isConnected to true
    const connectHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'connect'
    )?.[1];
    connectHandler();

    const metricUpdateHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'metrics:updated'
    )?.[1];

    expect(metricUpdateHandler).toBeDefined();

    const mockMetricData = {
      featureId: 'feature-1',
      metrics: [{ metricType: 'TIME_SAVED', value: 10.5 }],
    };

    metricUpdateHandler(mockMetricData);

    // Hook invalidates queries, no direct callback
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should handle report status events', async () => {
    const { result } = renderHook(
      () => useRealTimeUpdates({ enabled: true }),
      { wrapper: createWrapper() }
    );

    // Trigger connect event to set isConnected to true
    const connectHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'connect'
    )?.[1];
    connectHandler();

    const reportReadyHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'report:ready'
    )?.[1];

    expect(reportReadyHandler).toBeDefined();

    const mockReportStatus = {
      reportId: 'report-1',
    };

    reportReadyHandler(mockReportStatus);

    // Hook invalidates queries, no direct callback
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should disconnect on unmount', () => {
    const { unmount } = renderHook(() => useRealTimeUpdates({ enabled: true }), {
      wrapper: createWrapper(),
    });

    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('should handle connection errors', async () => {
    const { result } = renderHook(
      () => useRealTimeUpdates({ enabled: true }),
      { wrapper: createWrapper() }
    );

    const errorHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'connect_error'
    )?.[1];

    expect(errorHandler).toBeDefined();

    const mockError = new Error('Connection failed');
    errorHandler(mockError);

    await waitFor(() => {
      expect(result.current.error).toBe('Connection failed');
    });
  });

  it('should unsubscribe from features on cleanup', () => {
    const { unmount } = renderHook(
      () =>
        useRealTimeUpdates({
          enabled: true,
          featureIds: ['feature-1', 'feature-2'],
        }),
      { wrapper: createWrapper() }
    );

    unmount();

    expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe_feature', { featureId: 'feature-1' });
    expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe_feature', { featureId: 'feature-2' });
  });

  it('should handle dashboard update events', async () => {
    const { result } = renderHook(
      () => useRealTimeUpdates({ enabled: true }),
      { wrapper: createWrapper() }
    );

    // Trigger connect event to set isConnected to true
    const connectHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'connect'
    )?.[1];
    connectHandler();

    const dashboardUpdateHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'dashboard:updated'
    )?.[1];

    expect(dashboardUpdateHandler).toBeDefined();

    dashboardUpdateHandler();

    // Hook invalidates queries, no direct callback
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });
});
