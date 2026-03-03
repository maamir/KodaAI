<img width="100" height="100" alt="Gemini_Generated_Image_k72grpk72grpk72g" src="https://github.com/user-attachments/assets/01ed9616-bd91-4adc-a187-12535a052d03" />

# AI Efficiency Tracker

Comprehensive platform for tracking AI-assisted development efficiency with Kiro integration, external tool integrations, and advanced reporting and visualization capabilities.

## Features

### Unit 1: Core Platform
- **Time Tracking**: Track development time per phase (inception, construction, testing)
- **Feature Identification**: Automatically detect features from branch names and commits
- **Kiro Hooks Integration**: Capture file edits, prompts, and agent execution time
- **Real-time Updates**: WebSocket-based live metrics
- **Metrics Calculation**: Time saved, speed multiplier, and efficiency metrics
- **Data Aggregation**: Combine data from multiple sources

### Unit 2: Integrations
- **Jira Integration**: Sync stories, track progress, update status
- **GitHub Integration**: Monitor commits, PRs, code reviews
- **Webhook Support**: Real-time event processing
- **OAuth Authentication**: Secure third-party connections
- **Background Jobs**: Async data synchronization

### Unit 3: Reporting and Visualization
- **Interactive Dashboards**: Role-based views (Developer, Manager, Executive)
- **Advanced Metrics**: 10 metric types including ROI, velocity, quality scores
- **Report Generation**: Multi-format reports (PDF, Excel, HTML)
- **Real-time Updates**: Live dashboard updates via WebSocket
- **Customizable Widgets**: Charts, tables, and data visualizations
- **React Frontend**: Modern, responsive UI with Material-UI

## Prerequisites

- Node.js 20+ LTS
- PostgreSQL 15+
- npm or yarn
- AWS Account (for S3 report storage - optional, has local fallback)
- Chrome/Chromium (for PDF generation via Puppeteer)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

```bash
# Copy environment variables
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL=postgresql://user:password@localhost:5432/ai_efficiency_tracker

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### 3. Configure AWS S3 (Optional)

For report storage, configure AWS S3 in `.env`:

```bash
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

If not configured, reports will be stored locally in `./reports/` directory.

### 4. Start Backend Server

```bash
npm run dev
```

The API will be available at `http://localhost:4000`

### 5. Start Frontend (Optional)

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /health` - Application health status
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

### Metrics
- `GET /metrics` - Prometheus metrics

### Feature Tracking
- `POST /api/features/start` - Start tracking a feature
- `POST /api/features/:id/complete` - Complete a feature
- `POST /api/features/:id/pause` - Pause tracking
- `POST /api/features/:id/resume` - Resume tracking
- `POST /api/features/:id/transition` - Transition to next phase
- `GET /api/features/:id` - Get feature details
- `GET /api/features` - List features

### Hook Events
- `POST /api/hook-events` - Record a hook event
- `GET /api/hook-events/:featureId` - Get hook events for a feature

### Integrations (Unit 2)
- `POST /api/integrations/jira/connect` - Connect Jira account
- `POST /api/integrations/github/connect` - Connect GitHub account
- `GET /api/integrations/jira/stories` - List Jira stories
- `GET /api/integrations/github/commits` - List GitHub commits
- `POST /api/integrations/sync` - Trigger manual sync

### Dashboards (Unit 3)
- `GET /api/dashboard/:viewType` - Get dashboard data
- `GET /api/dashboard/widgets/:widgetType` - Get widget data
- `POST /api/dashboard/:viewType/refresh` - Refresh dashboard
- `GET /api/dashboard/stats` - Get summary statistics

### Reports (Unit 3)
- `POST /api/reports/generate` - Generate report (async)
- `GET /api/reports/:id/status` - Get generation status
- `GET /api/reports/:id/download` - Get download URL
- `GET /api/reports` - List user reports
- `DELETE /api/reports/:id` - Delete report

### Metrics (Unit 3)
- `POST /api/metrics/:featureId/calculate` - Calculate metrics
- `GET /api/metrics/:featureId` - Get feature metrics
- `GET /api/metrics/:featureId/trend/:metricType` - Get metric trend

### Dashboard Configuration (Unit 3)
- `GET /api/dashboard-config/:viewType` - Get dashboard config
- `POST /api/dashboard-config` - Create custom dashboard
- `PUT /api/dashboard-config/:id` - Update dashboard
- `DELETE /api/dashboard-config/:id` - Delete dashboard

## Development

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Linting and Formatting

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Database Management

```bash
# Open Prisma Studio
npm run prisma:studio

# Create a new migration
npm run prisma:migrate

# Reset database
npx prisma migrate reset
```

## Deployment

### Docker

```bash
# Build image
docker build -t ai-efficiency-tracker .

# Run container
docker run -p 3000:3000 -p 3001:3001 --env-file .env ai-efficiency-tracker
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down
```

## Architecture

### Backend
- **Language**: TypeScript
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **WebSocket**: Socket.IO
- **Testing**: Jest + Supertest
- **Logging**: Winston
- **Metrics**: Prometheus (prom-client)
- **Job Queue**: Bull (Redis-based)
- **Report Generation**: Puppeteer (PDF), ExcelJS (Excel)
- **Storage**: AWS S3 (with local fallback)

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI v5
- **State Management**: TanStack Query + Zustand
- **Charts**: Recharts
- **Routing**: React Router v6
- **Testing**: Vitest + Testing Library

## Project Structure

```
Backend:
src/
├── config/                    # Configuration management
├── controllers/               # API controllers (Units 1-3)
├── infrastructure/            # Infrastructure (logger, database, websocket, metrics)
├── middleware/                # Express middleware
├── repositories/              # Data access layer (Units 1-3)
├── routes/                    # API routes (Units 1-3)
├── services/                  # Business logic services (Units 1-3)
│   └── report-generators/     # Report generators (PDF, Excel, HTML)
├── types/                     # TypeScript types and schemas
├── worker.ts                  # Background job processor
├── app.ts                     # Express app setup
└── index.ts                   # Application entry point

Frontend:
frontend/
├── src/
│   ├── api/                   # API client functions
│   ├── components/            # React components
│   │   ├── common/            # Reusable components
│   │   ├── config/            # Dashboard configuration
│   │   ├── reports/           # Report generation UI
│   │   ├── views/             # Dashboard views
│   │   └── widgets/           # Chart and data widgets
│   ├── hooks/                 # Custom React hooks
│   ├── router/                # React Router configuration
│   ├── store/                 # Zustand state management
│   ├── theme/                 # Material-UI theme
│   ├── types/                 # TypeScript types
│   ├── App.tsx                # Root component
│   └── main.tsx               # Entry point
├── public/                    # Static assets
└── index.html                 # HTML template

Tests:
tests/
├── unit/                      # Unit tests
│   ├── repositories/          # Repository tests
│   └── services/              # Service tests
└── integration/               # Integration tests

Database:
prisma/
├── schema.prisma              # Database schema (Units 1-3)
└── migrations/                # Database migrations

Documentation:
aidlc-docs/
├── construction/              # Construction phase docs
│   ├── core-platform/         # Unit 1 documentation
│   ├── integrations-module/   # Unit 2 documentation
│   └── reporting-visualization/ # Unit 3 documentation
└── inception/                 # Inception phase docs
```

## Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/aidlc

# Server
PORT=4000
NODE_ENV=development

# AWS S3 (Optional - for report storage)
AWS_REGION=us-east-1
AWS_S3_BUCKET=aidlc-reports
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Report Configuration
REPORT_EXPIRATION_DAYS=7
REPORT_MAX_SIZE_MB=50
REPORT_GENERATION_TIMEOUT_MS=300000

# Metric Calculation
METRIC_CALCULATION_BATCH_SIZE=10
METRIC_CALCULATION_TIMEOUT_MS=60000
HOURLY_RATE=100

# Dashboard
DASHBOARD_CACHE_TTL_SECONDS=300
DASHBOARD_MAX_WIDGETS=12
DASHBOARD_MAX_DATA_POINTS=1000

# Analytics (Optional)
ANALYTICS_ENABLED=false
ANALYTICS_API_KEY=

# Redis (for job queue)
REDIS_URL=redis://localhost:6379
```

### Frontend (frontend/.env)
```bash
VITE_API_BASE_URL=http://localhost:4000
VITE_WS_URL=http://localhost:4000
VITE_ANALYTICS_ENABLED=false
VITE_ENABLE_REAL_TIME_UPDATES=true
```

See `.env.example` and `frontend/.env.example` for all available options.

## Unit 3: Reporting and Visualization

### Dashboard Views

**Developer Dashboard**
- Personal productivity metrics
- Time saved and speed multiplier
- Feature completion trends
- Quality scores

**Manager Dashboard**
- Team performance comparison
- Cost savings analysis
- Velocity trends
- Resource utilization

**Executive Dashboard**
- ROI metrics and summaries
- High-level KPIs
- Strategic insights
- Business impact analysis

**Custom Dashboard**
- Configurable widget layout
- Personalized metrics
- Custom filters and date ranges

### Report Types

1. **Developer Personal** - Individual productivity report
2. **Team Productivity** - Team performance analysis
3. **Executive Summary** - High-level business metrics
4. **Cost Benefit** - ROI and cost savings analysis
5. **Quality Metrics** - Code quality and defect rates
6. **Velocity Trends** - Sprint velocity and throughput
7. **Custom** - User-defined report parameters

### Metric Types

1. **TIME_SAVED** - Hours saved vs manual work
2. **SPEED_MULTIPLIER** - Productivity multiplier
3. **COST_SAVINGS** - Dollar savings
4. **PRODUCTIVITY_GAIN** - Percentage improvement
5. **QUALITY_SCORE** - Code quality score
6. **VELOCITY** - Features per week
7. **CYCLE_TIME** - Days from start to completion
8. **LEAD_TIME** - Days from request to delivery
9. **THROUGHPUT** - Features per time period
10. **DEFECT_RATE** - Bugs per feature

### Frontend Development

See `frontend/README.md` for detailed frontend documentation including:
- Development setup
- Component structure
- Testing guidelines
- Deployment instructions

## Troubleshooting

### Backend Issues

**Database Connection**
```bash
# Check PostgreSQL is running
pg_isready

# Reset database
npx prisma migrate reset
```

**Report Generation**
```bash
# Check Puppeteer installation
npx puppeteer browsers install chrome

# Test local report storage
mkdir -p ./reports
```

### Frontend Issues

**Build Errors**
```bash
cd frontend
rm -rf node_modules
npm install
npm run type-check
```

**API Connection**
- Verify backend is running on port 4000
- Check CORS configuration
- Verify environment variables

## Contributing

1. Follow existing code patterns
2. Write tests for new features (70% coverage target)
3. Update documentation
4. Run linting and tests before committing

## Documentation

- **Frontend Guide**: `frontend/README.md`
- **API Documentation**: See API Endpoints section above

## License

Proprietary - All rights reserved
