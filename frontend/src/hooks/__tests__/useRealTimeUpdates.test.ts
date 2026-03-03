import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRealTimeUpdates } from '../useRealTimeUpdates';
import { io } from 'socket.io-client';

vi.mock('socket.io-client');

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

describe('useRealTimeUpdates', () => {
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      on: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
      connected: false,
    };

    vi.mocked(io).mockReturnValue(mockSocket as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize WebSocket connection when enabled', () => {
    renderHook(() => useRealTimeUpdates({ enabled: true }), {
      wrapper: createWrapper(),
    });

    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        transports: ['websocket'],
        reconnection: true,
      })
    );
  });

  it('should not initialize WebSocket when disabled', () => {
    renderHook(() => useRealTimeUpdates({ enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(io).not.toHaveBeenCalled();
  });

  it('should set isConnected to true on connect event', async () => {
    const { result } = renderHook(() => useRealTimeUpdates({ enabled: true }), {
      wrapper: createWrapper(),
    });

    // Simulate connect event
    const connectHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'connect'
    )?.[1];
    
    if (connectHandler) {
      connectHandler();
    }

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should set isConnected to false on disconnect event', async () => {
    const { result } = renderHook(() => useRealTimeUpdates({ enabled: true }), {
      wrapper: createWrapper(),
    });

    // Simulate disconnect event
    const disconnectHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'disconnect'
    )?.[1];
    
    if (disconnectHandler) {
      disconnectHandler();
    }

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });

  it('should set error on connect_error event', async () => {
    const { result } = renderHook(() => useRealTimeUpdates({ enabled: true }), {
      wrapper: createWrapper(),
    });

    // Simulate connect_error event
    const errorHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'connect_error'
    )?.[1];
    
    if (errorHandler) {
      errorHandler(new Error('Connection failed'));
    }

    await waitFor(() => {
      expect(result.current.error).toBe('Connection failed');
      expect(result.current.isConnected).toBe(false);
    });
  });

  it('should subscribe to dashboard when dashboardId provided', () => {
    renderHook(() => useRealTimeUpdates({ enabled: true, dashboardId: 'dashboard-1' }), {
      wrapper: createWrapper(),
    });

    // Simulate connect event
    const connectHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'connect'
    )?.[1];
    
    if (connectHandler) {
      connectHandler();
    }

    expect(mockSocket.emit).toHaveBeenCalledWith('subscribe_dashboard', {
      dashboardId: 'dashboard-1',
    });
  });

  it('should subscribe to features when featureIds provided', () => {
    renderHook(
      () => useRealTimeUpdates({ enabled: true, featureIds: ['feature-1', 'feature-2'] }),
      { wrapper: createWrapper() }
    );

    // Simulate connect event
    const connectHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'connect'
    )?.[1];
    
    if (connectHandler) {
      connectHandler();
    }

    expect(mockSocket.emit).toHaveBeenCalledWith('subscribe_feature', {
      featureId: 'feature-1',
    });
    expect(mockSocket.emit).toHaveBeenCalledWith('subscribe_feature', {
      featureId: 'feature-2',
    });
  });

  it('should listen for metrics:updated event', () => {
    renderHook(() => useRealTimeUpdates({ enabled: true }), {
      wrapper: createWrapper(),
    });

    const metricsHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'metrics:updated'
    );

    expect(metricsHandler).toBeDefined();
  });

  it('should listen for report:ready event', () => {
    renderHook(() => useRealTimeUpdates({ enabled: true }), {
      wrapper: createWrapper(),
    });

    const reportHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'report:ready'
    );

    expect(reportHandler).toBeDefined();
  });

  it('should listen for report:failed event', () => {
    renderHook(() => useRealTimeUpdates({ enabled: true }), {
      wrapper: createWrapper(),
    });

    const reportFailedHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'report:failed'
    );

    expect(reportFailedHandler).toBeDefined();
  });

  it('should listen for dashboard:updated event', () => {
    renderHook(() => useRealTimeUpdates({ enabled: true }), {
      wrapper: createWrapper(),
    });

    const dashboardHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'dashboard:updated'
    );

    expect(dashboardHandler).toBeDefined();
  });

  it('should unsubscribe and disconnect on unmount', () => {
    const { unmount } = renderHook(
      () => useRealTimeUpdates({ enabled: true, dashboardId: 'dashboard-1', featureIds: ['feature-1'] }),
      { wrapper: createWrapper() }
    );

    unmount();

    expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe_dashboard', {
      dashboardId: 'dashboard-1',
    });
    expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe_feature', {
      featureId: 'feature-1',
    });
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('should return socket instance', () => {
    const { result } = renderHook(() => useRealTimeUpdates({ enabled: true }), {
      wrapper: createWrapper(),
    });

    expect(result.current.socket).toBe(mockSocket);
  });
});
