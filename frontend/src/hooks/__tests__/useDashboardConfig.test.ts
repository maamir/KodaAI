import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  useDashboardView,
  useListDashboardViews,
  useWidgetTypes,
  useDefaultView,
  useCreateDashboardView,
  useUpdateDashboardView,
  useDeleteDashboardView,
  useSetDefaultView,
  useCloneDashboardView,
} from '../useDashboardConfig';
import * as dashboardConfigApi from '@/api/dashboard-config';
import { ViewType } from '@/types/entities';
import { WidgetType } from '@/types/dashboard';

vi.mock('@/api/dashboard-config');

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

describe('useDashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch dashboard view successfully', async () => {
    const mockView = {
      success: true,
      data: {
        id: 'view-1',
        userId: 'user-1',
        viewType: ViewType.DEVELOPER,
        name: 'My Dashboard',
        widgets: [],
        filters: {},
        isDefault: true,
      },
    };

    vi.mocked(dashboardConfigApi.getDashboardView).mockResolvedValue(mockView);

    const { result } = renderHook(() => useDashboardView(ViewType.DEVELOPER), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockView);
    expect(dashboardConfigApi.getDashboardView).toHaveBeenCalledWith(ViewType.DEVELOPER);
  });
});

describe('useListDashboardViews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list dashboard views successfully', async () => {
    const mockViews = {
      success: true,
      data: [
        { id: 'view-1', viewType: ViewType.DEVELOPER, name: 'Dev View' },
        { id: 'view-2', viewType: ViewType.MANAGER, name: 'Manager View' },
      ],
    };

    vi.mocked(dashboardConfigApi.listDashboardViews).mockResolvedValue(mockViews as any);

    const { result } = renderHook(() => useListDashboardViews(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockViews);
  });
});

describe('useWidgetTypes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch widget types successfully', async () => {
    const mockTypes = {
      success: true,
      data: [
        WidgetType.TIME_SAVED_CHART,
        WidgetType.SPEED_MULTIPLIER_CHART,
        WidgetType.SUMMARY_STATS,
      ],
    };

    vi.mocked(dashboardConfigApi.getWidgetTypes).mockResolvedValue(mockTypes);

    const { result } = renderHook(() => useWidgetTypes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockTypes);
  });
});

describe('useDefaultView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch default view successfully', async () => {
    const mockView = {
      success: true,
      data: {
        id: 'view-1',
        viewType: ViewType.EXECUTIVE,
        name: 'Default Executive View',
        isDefault: true,
      },
    };

    vi.mocked(dashboardConfigApi.getDefaultView).mockResolvedValue(mockView as any);

    const { result } = renderHook(() => useDefaultView(ViewType.EXECUTIVE), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockView);
  });
});

describe('useCreateDashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create dashboard view successfully', async () => {
    const mockView = {
      success: true,
      data: {
        id: 'view-1',
        userId: 'user-1',
        viewType: ViewType.CUSTOM,
        name: 'My Custom View',
        widgets: [],
        filters: {},
        isDefault: false,
      },
    };

    vi.mocked(dashboardConfigApi.createDashboardView).mockResolvedValue(mockView);

    const { result } = renderHook(() => useCreateDashboardView(), {
      wrapper: createWrapper(),
    });

    const config = {
      userId: 'user-1',
      viewType: ViewType.CUSTOM,
      name: 'My Custom View',
      widgets: [],
      filters: {},
      isDefault: false,
    };

    result.current.mutate(config);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(dashboardConfigApi.createDashboardView).toHaveBeenCalledWith(config);
  });
});

describe('useUpdateDashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update dashboard view successfully', async () => {
    const mockView = {
      success: true,
      data: {
        id: 'view-1',
        name: 'Updated View',
      },
    };

    vi.mocked(dashboardConfigApi.updateDashboardView).mockResolvedValue(mockView as any);

    const { result } = renderHook(() => useUpdateDashboardView(), {
      wrapper: createWrapper(),
    });

    const update = { id: 'view-1', config: { name: 'Updated View' } };
    result.current.mutate(update);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(dashboardConfigApi.updateDashboardView).toHaveBeenCalledWith('view-1', { name: 'Updated View' });
  });
});

describe('useDeleteDashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete dashboard view successfully', async () => {
    vi.mocked(dashboardConfigApi.deleteDashboardView).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useDeleteDashboardView(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('view-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(dashboardConfigApi.deleteDashboardView).toHaveBeenCalledWith('view-1');
  });
});

describe('useSetDefaultView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set default view successfully', async () => {
    vi.mocked(dashboardConfigApi.setDefaultView).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useSetDefaultView(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('view-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(dashboardConfigApi.setDefaultView).toHaveBeenCalledWith('view-1');
  });
});

describe('useCloneDashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clone dashboard view successfully', async () => {
    const mockClone = {
      success: true,
      data: {
        id: 'view-2',
        name: 'Cloned View',
      },
    };

    vi.mocked(dashboardConfigApi.cloneDashboardView).mockResolvedValue(mockClone as any);

    const { result } = renderHook(() => useCloneDashboardView(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 'view-1', name: 'Cloned View' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(dashboardConfigApi.cloneDashboardView).toHaveBeenCalledWith('view-1', 'Cloned View');
  });
});
