import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  calculateMetric,
  calculateBatchMetrics,
  getFeatureMetrics,
  getMetricTrend,
  listMetrics,
  deleteMetric,
} from '@/api/metrics';
import { MetricType } from '@/types/entities';
import { DateRangeParams } from '@/types/api';

export function useFeatureMetrics(featureId: string, params?: DateRangeParams) {
  return useQuery({
    queryKey: ['metrics', 'feature', featureId, params],
    queryFn: () => getFeatureMetrics(featureId, params),
    enabled: !!featureId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMetricTrend(
  featureId: string,
  metricType: MetricType,
  params?: DateRangeParams
) {
  return useQuery({
    queryKey: ['metrics', 'trend', featureId, metricType, params],
    queryFn: () => getMetricTrend(featureId, metricType, params),
    enabled: !!featureId && !!metricType,
    staleTime: 5 * 60 * 1000,
  });
}

export function useListMetrics(params?: any) {
  return useQuery({
    queryKey: ['metrics', 'list', params],
    queryFn: () => listMetrics(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCalculateMetric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ featureId, metricType }: { featureId: string; metricType: MetricType }) =>
      calculateMetric(featureId, metricType),
    onSuccess: (_, { featureId }) => {
      queryClient.invalidateQueries({ queryKey: ['metrics', 'feature', featureId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCalculateBatchMetrics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ featureId, metricTypes }: { featureId: string; metricTypes: MetricType[] }) =>
      calculateBatchMetrics(featureId, metricTypes),
    onSuccess: (_, { featureId }) => {
      queryClient.invalidateQueries({ queryKey: ['metrics', 'feature', featureId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteMetric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (metricId: string) => deleteMetric(metricId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
