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

export function getMetricsRegistry() {
  return promClient.register;
}
