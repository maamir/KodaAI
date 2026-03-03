# AI Efficiency Tracker

Track AI-assisted development efficiency with Kiro integration, measuring time saved, code metrics, and productivity gains.

## Features

- **Time Tracking**: Track development time per phase (inception, construction, testing)
- **Feature Identification**: Automatically detect features from branch names and commits
- **Kiro Hooks Integration**: Capture file edits, prompts, and agent execution time
- **Real-time Updates**: WebSocket-based live metrics
- **Metrics Calculation**: Time saved, speed multiplier, and efficiency metrics
- **Data Aggregation**: Combine data from multiple sources

## Prerequisites

- Node.js 20+ LTS
- PostgreSQL 15+
- npm or yarn

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

### 3. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`
WebSocket server will be available at `http://localhost:3001`

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

- **Language**: TypeScript
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **WebSocket**: Socket.IO
- **Testing**: Jest + Supertest
- **Logging**: Winston
- **Metrics**: Prometheus (prom-client)

## Project Structure

```
src/
├── config/           # Configuration management
├── controllers/      # API controllers
├── infrastructure/   # Infrastructure components (logger, database, websocket)
├── middleware/       # Express middleware
├── repositories/     # Data access layer
├── routes/           # API routes
├── services/         # Business logic services
├── types/            # TypeScript types and schemas
├── app.ts            # Express app setup
└── index.ts          # Application entry point

tests/
├── unit/             # Unit tests
└── integration/      # Integration tests

prisma/
├── schema.prisma     # Database schema
└── migrations/       # Database migrations
```

## Environment Variables

See `.env.example` for all available configuration options.

## License

MIT
