import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { loggingMiddleware } from './middleware/logging.middleware';
import { metricsMiddleware } from './middleware/metrics.middleware';
import { errorHandler } from './middleware/error.middleware';
import featuresRoutes from './routes/features.routes';
import hookEventsRoutes from './routes/hook-events.routes';
import integrationsRoutes from './routes/integrations.routes';
import healthRoutes from './routes/health.routes';
import metricsRoutes from './routes/metrics.routes';
// Unit 3: Reporting and Visualization routes
import dashboardRoutes from './routes/dashboard.routes';
import reportsRoutes from './routes/reports.routes';
import metricsApiRoutes from './routes/metrics.routes';
import dashboardConfigRoutes from './routes/dashboard-config.routes';
import { config } from './config';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.get('DASHBOARD_URL') || '*',
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Logging and metrics
app.use(loggingMiddleware);
app.use(metricsMiddleware);

// Routes
app.use('/health', healthRoutes);
app.use('/metrics', metricsRoutes);
app.use('/api/features', featuresRoutes);
app.use('/api/hook-events', hookEventsRoutes);
app.use('/api/integrations', integrationsRoutes);
// Unit 3: Reporting and Visualization routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/metrics', metricsApiRoutes);
app.use('/api/dashboard-config', dashboardConfigRoutes);

// Error handling (must be last)
app.use(errorHandler);

export { app };
