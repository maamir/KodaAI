import { useEffect, useCallback } from 'react';

const ANALYTICS_ENABLED = import.meta.env.VITE_ANALYTICS_ENABLED === 'true';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

export function useAnalytics() {
  const trackEvent = useCallback((event: AnalyticsEvent) => {
    if (!ANALYTICS_ENABLED) return;

    console.log('[Analytics]', event.name, event.properties);
    // TODO: Integrate with analytics SDK (Mixpanel, Amplitude, etc.)
  }, []);

  const trackPageView = useCallback((pageName: string, properties?: Record<string, any>) => {
    trackEvent({
      name: 'page_view',
      properties: {
        page: pageName,
        ...properties,
      },
    });
  }, [trackEvent]);

  const trackWidgetInteraction = useCallback(
    (widgetType: string, action: string, properties?: Record<string, any>) => {
      trackEvent({
        name: 'widget_interaction',
        properties: {
          widget_type: widgetType,
          action,
          ...properties,
        },
      });
    },
    [trackEvent]
  );

  const trackReportGeneration = useCallback(
    (reportType: string, format: string, properties?: Record<string, any>) => {
      trackEvent({
        name: 'report_generated',
        properties: {
          report_type: reportType,
          format,
          ...properties,
        },
      });
    },
    [trackEvent]
  );

  const trackDashboardView = useCallback(
    (viewType: string, properties?: Record<string, any>) => {
      trackEvent({
        name: 'dashboard_viewed',
        properties: {
          view_type: viewType,
          ...properties,
        },
      });
    },
    [trackEvent]
  );

  return {
    trackEvent,
    trackPageView,
    trackWidgetInteraction,
    trackReportGeneration,
    trackDashboardView,
  };
}

export function usePageTracking(pageName: string, properties?: Record<string, any>) {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView(pageName, properties);
  }, [pageName, properties, trackPageView]);
}
