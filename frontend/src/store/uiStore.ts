import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DashboardFilters } from '@/types/dashboard';

interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  filters: DashboardFilters;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setFilters: (filters: DashboardFilters) => void;
  resetFilters: () => void;
}

const defaultFilters: DashboardFilters = {
  dateRange: undefined,
  featureIds: undefined,
  statuses: undefined,
  metricTypes: undefined,
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarOpen: true,
      filters: defaultFilters,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setFilters: (filters) => set({ filters }),
      resetFilters: () => set({ filters: defaultFilters }),
    }),
    {
      name: 'aidlc-ui-store',
      partialize: (state) => ({ theme: state.theme, sidebarOpen: state.sidebarOpen }),
    }
  )
);
