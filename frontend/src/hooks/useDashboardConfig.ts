import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDashboardView,
  createDashboardView,
  updateDashboardView,
  deleteDashboardView,
  setDefaultView,
  cloneDashboardView,
  listDashboardViews,
  getWidgetTypes,
  getDefaultView,
} from '@/api/dashboard-config';
import { DashboardViewConfig } from '@/types/dashboard';
import { ViewType } from '@/types/entities';

export function useDashboardView(viewType: ViewType) {
  return useQuery({
    queryKey: ['dashboard-config', 'view', viewType],
    queryFn: () => getDashboardView(viewType),
    staleTime: 10 * 60 * 1000,
  });
}

export function useListDashboardViews() {
  return useQuery({
    queryKey: ['dashboard-config', 'list'],
    queryFn: listDashboardViews,
    staleTime: 10 * 60 * 1000,
  });
}

export function useWidgetTypes() {
  return useQuery({
    queryKey: ['dashboard-config', 'widget-types'],
    queryFn: getWidgetTypes,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useDefaultView(viewType: ViewType) {
  return useQuery({
    queryKey: ['dashboard-config', 'default', viewType],
    queryFn: () => getDefaultView(viewType),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateDashboardView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: Omit<DashboardViewConfig, 'id'>) => createDashboardView(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-config'] });
    },
  });
}

export function useUpdateDashboardView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, config }: { id: string; config: Partial<DashboardViewConfig> }) =>
      updateDashboardView(id, config),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-config'] });
    },
  });
}

export function useDeleteDashboardView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDashboardView(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-config'] });
    },
  });
}

export function useSetDefaultView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => setDefaultView(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-config'] });
    },
  });
}

export function useCloneDashboardView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => cloneDashboardView(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-config'] });
    },
  });
}
