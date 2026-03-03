import { config } from '../config';
import { logger } from '../infrastructure/logger';

export interface AnalyticsEvent {
  eventType: string;
  eventData: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
}

export interface AnalyticsEventResponse {
  eventId: string;
  eventType: string;
  timestamp: Date;
  success: boolean;
}

export class AnalyticsService {
  private enabled: boolean;
  private apiKey: string | undefined;
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL_MS = 30000; // 30 seconds

  constructor() {
    this.enabled = config.get('ANALYTICS_ENABLED');
    this.apiKey = config.get('ANALYTICS_API_KEY');

    if (this.enabled && !this.apiKey) {
      logger.warn('Analytics enabled but API key not configured');
      this.enabled = false;
    }

    if (this.enabled) {
      this.startBatchProcessor();
      logger.info('Analytics service initialized');
    }
  }

  /**
   * Track an analytics event
   */
  async trackEvent(event: Omit<AnalyticsEvent, 'timestamp'>): Promise<AnalyticsEventResponse> {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: new Date(),
    };

    const eventId = this.generateEventId();

    if (!this.enabled) {
      logger.debug('Analytics disabled, event not tracked', { eventType: event.eventType });
      return {
        eventId,
        eventType: event.eventType,
        timestamp: fullEvent.timestamp,
        success: false,
      };
    }

    try {
      // Add to queue for batch processing
      this.eventQueue.push(fullEvent);

      // If queue is full, flush immediately
      if (this.eventQueue.length >= this.BATCH_SIZE) {
        await this.flushEvents();
      }

      logger.debug('Analytics event queued', {
        eventId,
        eventType: event.eventType,
        queueSize: this.eventQueue.length,
      });

      return {
        eventId,
        eventType: event.eventType,
        timestamp: fullEvent.timestamp,
        success: true,
      };
    } catch (error) {
      logger.error('Error tracking analytics event:', error);
      return {
        eventId,
        eventType: event.eventType,
        timestamp: fullEvent.timestamp,
        success: false,
      };
    }
  }

  /**
   * Track dashboard view event
   */
  async trackDashboardView(userId: string, viewType: string, sessionId?: string) {
    return this.trackEvent({
      eventType: 'dashboard_view',
      eventData: {
        viewType,
        action: 'view',
      },
      userId,
      sessionId,
    });
  }

  /**
   * Track report generation event
   */
  async trackReportGeneration(
    userId: string,
    reportType: string,
    format: string,
    success: boolean,
    duration?: number
  ) {
    return this.trackEvent({
      eventType: 'report_generation',
      eventData: {
        reportType,
        format,
        success,
        duration,
      },
      userId,
    });
  }

  /**
   * Track metric calculation event
   */
  async trackMetricCalculation(featureId: string, metricType: string, duration: number) {
    return this.trackEvent({
      eventType: 'metric_calculation',
      eventData: {
        featureId,
        metricType,
        duration,
      },
    });
  }

  /**
   * Track widget interaction event
   */
  async trackWidgetInteraction(
    userId: string,
    widgetType: string,
    action: string,
    sessionId?: string
  ) {
    return this.trackEvent({
      eventType: 'widget_interaction',
      eventData: {
        widgetType,
        action,
      },
      userId,
      sessionId,
    });
  }

  /**
   * Track feature view event
   */
  async trackFeatureView(userId: string, featureId: string, sessionId?: string) {
    return this.trackEvent({
      eventType: 'feature_view',
      eventData: {
        featureId,
      },
      userId,
      sessionId,
    });
  }

  /**
   * Track dashboard configuration change
   */
  async trackDashboardConfigChange(
    userId: string,
    viewId: string,
    changeType: 'create' | 'update' | 'delete'
  ) {
    return this.trackEvent({
      eventType: 'dashboard_config_change',
      eventData: {
        viewId,
        changeType,
      },
      userId,
    });
  }

  /**
   * Track error event
   */
  async trackError(
    errorType: string,
    errorMessage: string,
    context?: Record<string, any>,
    userId?: string
  ) {
    return this.trackEvent({
      eventType: 'error',
      eventData: {
        errorType,
        errorMessage,
        context,
      },
      userId,
    });
  }

  /**
   * Track performance metric
   */
  async trackPerformance(
    metricName: string,
    value: number,
    unit: string,
    context?: Record<string, any>
  ) {
    return this.trackEvent({
      eventType: 'performance',
      eventData: {
        metricName,
        value,
        unit,
        context,
      },
    });
  }

  /**
   * Flush queued events to analytics backend
   */
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const eventsToFlush = this.eventQueue.splice(0, this.BATCH_SIZE);

    try {
      // In a real implementation, this would send to an analytics service
      // For now, we'll just log the events
      await this.sendToAnalyticsBackend(eventsToFlush);

      logger.debug(`Flushed ${eventsToFlush.length} analytics events`);
    } catch (error) {
      logger.error('Error flushing analytics events:', error);
      // Re-queue failed events
      this.eventQueue.unshift(...eventsToFlush);
    }
  }

  /**
   * Send events to analytics backend
   */
  private async sendToAnalyticsBackend(events: AnalyticsEvent[]): Promise<void> {
    // This is a placeholder for actual analytics backend integration
    // In production, this would send to services like:
    // - Google Analytics
    // - Mixpanel
    // - Segment
    // - Custom analytics backend

    if (!this.apiKey) {
      logger.debug('No analytics API key configured, events logged locally');
      return;
    }

    // Simulate API call
    logger.debug('Analytics events batch', {
      count: events.length,
      eventTypes: events.map(e => e.eventType),
    });

    // In production, you would do something like:
    // await fetch('https://analytics-api.example.com/events', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ events }),
    // });
  }

  /**
   * Start batch processor for periodic event flushing
   */
  private startBatchProcessor(): void {
    this.flushInterval = setInterval(() => {
      this.flushEvents().catch(error => {
        logger.error('Error in batch processor:', error);
      });
    }, this.FLUSH_INTERVAL_MS);

    logger.debug('Analytics batch processor started');
  }

  /**
   * Stop batch processor
   */
  stopBatchProcessor(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
      logger.debug('Analytics batch processor stopped');
    }
  }

  /**
   * Flush all pending events and stop processor
   */
  async shutdown(): Promise<void> {
    this.stopBatchProcessor();
    await this.flushEvents();
    logger.info('Analytics service shut down');
  }

  /**
   * Get analytics statistics
   */
  getStats(): {
    enabled: boolean;
    queueSize: number;
    batchSize: number;
    flushInterval: number;
  } {
    return {
      enabled: this.enabled,
      queueSize: this.eventQueue.length,
      batchSize: this.BATCH_SIZE,
      flushInterval: this.FLUSH_INTERVAL_MS,
    };
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Enable or disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled && !this.flushInterval) {
      this.startBatchProcessor();
    } else if (!enabled && this.flushInterval) {
      this.stopBatchProcessor();
    }
    logger.info(`Analytics ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

export const analyticsService = new AnalyticsService();

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  await analyticsService.shutdown();
});

process.on('SIGINT', async () => {
  await analyticsService.shutdown();
});
