import { apiRequest } from './client';
import { DashboardViewConfig, WidgetType } from '@/types/dashboard';
import { ViewType } from '@/types/entities';
import { ApiResponse } from '@/types/api';

export async function getDashboardView(
  viewType: ViewType
): Promise<ApiResponse<DashboardViewConfig>> {
  return apiRequest<DashboardViewConfig>('get', `/dashboard-config/${viewType}`);
}

export async function createDashboardView(
  config: Omit<DashboardViewConfig, 'id'>
): Promise<ApiResponse<DashboardViewConfig>> {
  return apiRequest<DashboardViewConfig>('post', '/dashboard-config', config);
}

export async function updateDashboardView(
  id: string,
  config: Partial<DashboardViewConfig>
): Promise<ApiResponse<DashboardViewConfig>> {
  return apiRequest<DashboardViewConfig>('put', `/dashboard-config/${id}`, config);
}

export async function deleteDashboardView(id: string): Promise<ApiResponse<void>> {
  return apiRequest<void>('delete', `/dashboard-config/${id}`);
}

export async function setDefaultView(id: string): Promise<ApiResponse<void>> {
  return apiRequest<void>('post', `/dashboard-config/${id}/set-default`);
}

export async function cloneDashboardView(
  id: string,
  name: string
): Promise<ApiResponse<DashboardViewConfig>> {
  return apiRequest<DashboardViewConfig>('post', `/dashboard-config/${id}/clone`, { name });
}

export async function listDashboardViews(): Promise<ApiResponse<DashboardViewConfig[]>> {
  return apiRequest<DashboardViewConfig[]>('get', '/dashboard-config');
}

export async function getWidgetTypes(): Promise<ApiResponse<WidgetType[]>> {
  return apiRequest<WidgetType[]>('get', '/dashboard-config/widget-types');
}

export async function getDefaultView(
  viewType: ViewType
): Promise<ApiResponse<DashboardViewConfig>> {
  return apiRequest<DashboardViewConfig>('get', `/dashboard-config/default/${viewType}`);
}
