import { apiRequest } from './client';
import { DashboardData, WidgetData, WidgetType, DashboardFilters } from '@/types/dashboard';
import { ViewType } from '@/types/entities';
import { ApiResponse } from '@/types/api';

export async function getDashboardData(
  viewType: ViewType,
  filters?: DashboardFilters
): Promise<ApiResponse<DashboardData>> {
  return apiRequest<DashboardData>('get', `/dashboard/${viewType}`, undefined, filters);
}

export async function getWidgetData(
  widgetType: WidgetType,
  filters?: DashboardFilters
): Promise<ApiResponse<WidgetData>> {
  return apiRequest<WidgetData>('get', `/dashboard/widgets/${widgetType}`, undefined, filters);
}

export async function refreshDashboard(viewType: ViewType): Promise<ApiResponse<void>> {
  return apiRequest<void>('post', `/dashboard/${viewType}/refresh`);
}

export async function getDashboardStats(): Promise<ApiResponse<any>> {
  return apiRequest<any>('get', '/dashboard/stats');
}
