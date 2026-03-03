import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAnalytics, usePageTracking } from '../useAnalytics';

// Mock console.log to verify analytics calls
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('useAnalytics', () => {
  beforeEach(() => {
    mockConsoleLog.mockClear();
  });

  describe('trackEvent', () => {
    it('should track event with name and properties', () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackEvent({
        name: 'button_clicked',
        properties: { button_id: 'submit' },
      });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[Analytics]',
        'button_clicked',
        { button_id: 'submit' }
      );
    });

    it('should track event without properties', () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackEvent({ name: 'page_loaded' });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[Analytics]',
        'page_loaded',
        undefined
      );
    });
  });

  describe('trackPageView', () => {
    it('should track page view with page name', () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackPageView('Dashboard');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[Analytics]',
        'page_view',
        { page: 'Dashboard' }
      );
    });

    it('should track page view with additional properties', () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackPageView('Dashboard', { view_type: 'developer' });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[Analytics]',
        'page_view',
        { page: 'Dashboard', view_type: 'developer' }
      );
    });
  });

  describe('trackWidgetInteraction', () => {
    it('should track widget interaction', () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackWidgetInteraction('time_saved_chart', 'click');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[Analytics]',
        'widget_interaction',
        { widget_type: 'time_saved_chart', action: 'click' }
      );
    });

    it('should track widget interaction with additional properties', () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackWidgetInteraction('metric_card', 'hover', { metric_type: 'time_saved' });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[Analytics]',
        'widget_interaction',
        { widget_type: 'metric_card', action: 'hover', metric_type: 'time_saved' }
      );
    });
  });

  describe('trackReportGeneration', () => {
    it('should track report generation', () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackReportGeneration('executive_summary', 'pdf');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[Analytics]',
        'report_generated',
        { report_type: 'executive_summary', format: 'pdf' }
      );
    });

    it('should track report generation with additional properties', () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackReportGeneration('team_productivity', 'excel', { features_count: 10 });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[Analytics]',
        'report_generated',
        { report_type: 'team_productivity', format: 'excel', features_count: 10 }
      );
    });
  });

  describe('trackDashboardView', () => {
    it('should track dashboard view', () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackDashboardView('developer');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[Analytics]',
        'dashboard_viewed',
        { view_type: 'developer' }
      );
    });

    it('should track dashboard view with additional properties', () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackDashboardView('manager', { widgets_count: 6 });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[Analytics]',
        'dashboard_viewed',
        { view_type: 'manager', widgets_count: 6 }
      );
    });
  });
});

describe('usePageTracking', () => {
  beforeEach(() => {
    mockConsoleLog.mockClear();
  });

  it('should track page view on mount', () => {
    renderHook(() => usePageTracking('Home'));

    expect(mockConsoleLog).toHaveBeenCalledWith(
      '[Analytics]',
      'page_view',
      { page: 'Home' }
    );
  });

  it('should track page view with properties', () => {
    renderHook(() => usePageTracking('Dashboard', { view_type: 'executive' }));

    expect(mockConsoleLog).toHaveBeenCalledWith(
      '[Analytics]',
      'page_view',
      { page: 'Dashboard', view_type: 'executive' }
    );
  });

  it('should track page view when page name changes', () => {
    const { rerender } = renderHook(
      ({ pageName }) => usePageTracking(pageName),
      { initialProps: { pageName: 'Home' } }
    );

    expect(mockConsoleLog).toHaveBeenCalledWith(
      '[Analytics]',
      'page_view',
      { page: 'Home' }
    );

    mockConsoleLog.mockClear();

    rerender({ pageName: 'Dashboard' });

    expect(mockConsoleLog).toHaveBeenCalledWith(
      '[Analytics]',
      'page_view',
      { page: 'Dashboard' }
    );
  });
});
