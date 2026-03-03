import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboardData, getWidgetData, refreshDashboard, getDashboardStats } from '@/api/dashboard';
import { DashboardFilters, WidgetType } from '@/types/dashboard';
import { ViewType } from '@/types/entities';

export function useDashboardData(viewType: ViewType, filters?: DashboardFilters) {
  return useQuery({
    queryKey: ['dashboard', viewType, filters],
    queryFn: () => getDashboardData(viewType, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

export function useWidgetData(widgetType: WidgetType, filters?: DashboardFilters) {
  return useQuery({
    queryKey: ['widget', widgetType, filters],
    queryFn: () => getWidgetData(widgetType, filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRefreshDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (viewType: ViewType) => refreshDashboard(viewType),
    onSuccess: (_, viewType) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', viewType] });
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
