import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  useFeatureMetrics,
  useMetricTrend,
  useListMetrics,
  useCalculateMetric,
  useCalculateBatchMetrics,
  useDeleteMetric,
} from '../useMetricData';
import * as metricsApi from '@/api/metrics';
import { MetricType } from '@/types/entities';

vi.mock('@/api/metrics');

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

describe('useFeatureMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch feature metrics successfully', async () => {
    const mockMetrics = {
      success: true,
      data: [
        {
          id: 'metric-1',
          featureId: 'feature-1',
          metricType: MetricType.TIME_SAVED,
          value: 10,
          formula: 'manual - ai',
          parameters: {},
          calculatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    vi.mocked(metricsApi.getFeatureMetrics).mockResolvedValue(mockMetrics);

    const { result } = renderHook(() => useFeatureMetrics('feature-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockMetrics);
    expect(metricsApi.getFeatureMetrics).toHaveBeenCalledWith('feature-1', undefined);
  });

  it('should not fetch when featureId is empty', () => {
    const { result } = renderHook(() => useFeatureMetrics(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(metricsApi.getFeatureMetrics).not.toHaveBeenCalled();
  });

  it('should pass date range params', async () => {
    const params = { startDate: '2024-01-01', endDate: '2024-12-31' };

    vi.mocked(metricsApi.getFeatureMetrics).mockResolvedValue({ success: true, data: [] });

    renderHook(() => useFeatureMetrics('feature-1', params), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(metricsApi.getFeatureMetrics).toHaveBeenCalledWith('feature-1', params);
    });
  });
});

describe('useMetricTrend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch metric trend successfully', async () => {
    const mockTrend = {
      success: true,
      data: {
        metricType: MetricType.SPEED_MULTIPLIER,
        dataPoints: [
          { date: '2024-01-01', value: 2.0 },
          { date: '2024-01-02', value: 2.5 },
        ],
      },
    };

    vi.mocked(metricsApi.getMetricTrend).mockResolvedValue(mockTrend);

    const { result } = renderHook(
      () => useMetricTrend('feature-1', MetricType.SPEED_MULTIPLIER),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockTrend);
  });

  it('should not fetch when featureId or metricType is missing', () => {
    const { result } = renderHook(() => useMetricTrend('', MetricType.TIME_SAVED), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useListMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list all metrics successfully', async () => {
    const mockMetrics = {
      success: true,
      data: [
        { id: 'metric-1', metricType: MetricType.TIME_SAVED, value: 10 },
        { id: 'metric-2', metricType: MetricType.COST_SAVINGS, value: 1000 },
      ],
    };

    vi.mocked(metricsApi.listMetrics).mockResolvedValue(mockMetrics as any);

    const { result } = renderHook(() => useListMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockMetrics);
  });
});

describe('useCalculateMetric', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate metric successfully', async () => {
    const mockResult = {
      success: true,
      data: {
        id: 'metric-1',
        featureId: 'feature-1',
        metricType: MetricType.TIME_SAVED,
        value: 15,
        formula: 'manual - ai',
        parameters: {},
        calculatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    vi.mocked(metricsApi.calculateMetric).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useCalculateMetric(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ featureId: 'feature-1', metricType: MetricType.TIME_SAVED });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(metricsApi.calculateMetric).toHaveBeenCalledWith('feature-1', MetricType.TIME_SAVED);
  });

  it('should handle calculation error', async () => {
    vi.mocked(metricsApi.calculateMetric).mockRejectedValue(new Error('Calculation failed'));

    const { result } = renderHook(() => useCalculateMetric(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ featureId: 'feature-1', metricType: MetricType.VELOCITY });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCalculateBatchMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate batch metrics successfully', async () => {
    const mockResult = {
      success: true,
      data: [
        { id: 'metric-1', metricType: MetricType.TIME_SAVED, value: 10 },
        { id: 'metric-2', metricType: MetricType.COST_SAVINGS, value: 1000 },
      ],
    };

    vi.mocked(metricsApi.calculateBatchMetrics).mockResolvedValue(mockResult as any);

    const { result } = renderHook(() => useCalculateBatchMetrics(), {
      wrapper: createWrapper(),
    });

    const metricTypes = [MetricType.TIME_SAVED, MetricType.COST_SAVINGS];
    result.current.mutate({ featureId: 'feature-1', metricTypes });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(metricsApi.calculateBatchMetrics).toHaveBeenCalledWith('feature-1', metricTypes);
  });
});

describe('useDeleteMetric', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete metric successfully', async () => {
    vi.mocked(metricsApi.deleteMetric).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useDeleteMetric(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('metric-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(metricsApi.deleteMetric).toHaveBeenCalledWith('metric-1');
  });

  it('should handle delete error', async () => {
    vi.mocked(metricsApi.deleteMetric).mockRejectedValue(new Error('Delete failed'));

    const { result } = renderHook(() => useDeleteMetric(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('metric-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
