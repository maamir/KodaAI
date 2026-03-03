import { apiRequest } from './client';
import { CalculatedMetric, MetricType } from '@/types/entities';
import { ApiResponse, DateRangeParams } from '@/types/api';

export async function calculateMetric(
  featureId: string,
  metricType: MetricType
): Promise<ApiResponse<CalculatedMetric>> {
  return apiRequest<CalculatedMetric>('post', `/metrics/${featureId}/calculate`, { metricType });
}

export async function calculateBatchMetrics(
  featureId: string,
  metricTypes: MetricType[]
): Promise<ApiResponse<CalculatedMetric[]>> {
  return apiRequest<CalculatedMetric[]>('post', `/metrics/${featureId}/calculate-batch`, {
    metricTypes,
  });
}

export async function getFeatureMetrics(
  featureId: string,
  params?: DateRangeParams
): Promise<ApiResponse<CalculatedMetric[]>> {
  return apiRequest<CalculatedMetric[]>('get', `/metrics/${featureId}`, undefined, params);
}

export async function getMetricTrend(
  featureId: string,
  metricType: MetricType,
  params?: DateRangeParams
): Promise<ApiResponse<any>> {
  return apiRequest<any>('get', `/metrics/${featureId}/trend/${metricType}`, undefined, params);
}

export async function listMetrics(params?: any): Promise<ApiResponse<CalculatedMetric[]>> {
  return apiRequest<CalculatedMetric[]>('get', '/metrics', undefined, params);
}

export async function deleteMetric(metricId: string): Promise<ApiResponse<void>> {
  return apiRequest<void>('delete', `/metrics/${metricId}`);
}
