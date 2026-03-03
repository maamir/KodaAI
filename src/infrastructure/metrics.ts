import promClient from 'prom-client';

// Initialize default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({
  prefix: 'ai_efficiency_tracker_',
});

// HTTP metrics
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

export const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestErrors = new promClient.Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'error_code'],
});

// WebSocket metrics
export const websocketConnections = new promClient.Gauge({
  name: 'websocket_connections_total',
  help: 'Number of active WebSocket connections',
});

export const websocketMessages = new promClient.Counter({
  name: 'websocket_messages_total',
  help: 'Total number of WebSocket messages sent',
  labelNames: ['event_type'],
});

// Business metrics
export const activeFeatures = new promClient.Gauge({
  name: 'active_features_total',
  help: 'Number of features currently being tracked',
});

export const hookEventsProcessed = new promClient.Counter({
  name: 'hook_events_processed_total',
  help: 'Total number of hook events processed',
  labelNames: ['event_type'],
});

// Database metrics
export const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
});

export const databaseConnections = new promClient.Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
});

// Unit 3: Reporting and Visualization metrics
export const metricsCalculated = new promClient.Counter({
  name: 'metrics_calculated_total',
  help: 'Total number of metrics calculated',
  labelNames: ['metric_type'],
});

export const metricCalculationDuration = new promClient.Histogram({
  name: 'metric_calculation_duration_seconds',
  help: 'Duration of metric calculations in seconds',
  labelNames: ['metric_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

export const reportsGenerated = new promClient.Counter({
  name: 'reports_generated_total',
  help: 'Total number of reports generated',
  labelNames: ['report_type', 'format', 'status'],
});

export const reportGenerationDuration = new promClient.Histogram({
  name: 'report_generation_duration_seconds',
  help: 'Duration of report generation in seconds',
  labelNames: ['report_type', 'format'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
});

export const reportStorageSize = new promClient.Gauge({
  name: 'report_storage_size_bytes',
  help: 'Total size of stored reports in bytes',
});

export const dashboardViews = new promClient.Counter({
  name: 'dashboard_views_total',
  help: 'Total number of dashboard views',
  labelNames: ['view_type'],
});

export const dashboardRefreshes = new promClient.Counter({
  name: 'dashboard_refreshes_total',
  help: 'Total number of dashboard refreshes',
});

export const analyticsEvents = new promClient.Counter({
  name: 'analytics_events_total',
  help: 'Total number of analytics events tracked',
  labelNames: ['event_type'],
});

export const realtimeUpdates = new promClient.Counter({
  name: 'realtime_updates_total',
  help: 'Total number of real-time updates broadcast',
  labelNames: ['update_type'],
});

export function getMetricsRegistry() {
  return promClient.register;
}
