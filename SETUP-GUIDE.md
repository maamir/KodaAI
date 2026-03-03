# AIDLC Platform - Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
# Backend dependencies
npm install

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Setup Database

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# Minimum required:
# DATABASE_URL=postgresql://user:password@localhost:5432/aidlc
# REDIS_URL=redis://localhost:6379
# PORT=4000

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name initial_setup
```

### 3. Setup Frontend

```bash
cd frontend

# Copy environment file
cp .env.example .env

# Edit .env (defaults should work)
# VITE_API_BASE_URL=http://localhost:4000
# VITE_WS_URL=http://localhost:4000

cd ..
```

### 4. Start Services

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Health**: http://localhost:4000/health
- **Metrics**: http://localhost:4000/metrics

## Optional: AWS S3 Setup

For report storage (optional - has local fallback):

```bash
# Add to .env
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

If not configured, reports will be stored in `./reports/` directory.

## Verification Checklist

### Backend
- [ ] Server starts on port 4000
- [ ] Database connection successful
- [ ] Health check returns 200: `curl http://localhost:4000/health`
- [ ] Metrics endpoint accessible: `curl http://localhost:4000/metrics`
- [ ] WebSocket server running

### Frontend
- [ ] Dev server starts on port 3000
- [ ] Application loads in browser
- [ ] No console errors
- [ ] Can navigate between dashboard views
- [ ] Theme switching works

### Integration
- [ ] Frontend can connect to backend API
- [ ] WebSocket connection established
- [ ] Dashboard loads data
- [ ] No CORS errors

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Change PORT in .env
PORT=4001
```

**Database connection failed:**
```bash
# Verify PostgreSQL is running
pg_isready

# Check DATABASE_URL format
# postgresql://user:password@host:port/database
```

**Prisma errors:**
```bash
# Regenerate client
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

**Report generation fails:**
```bash
# Install Chromium for Puppeteer
npx puppeteer browsers install chrome

# Or use system Chrome
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
```

### Frontend Issues

**Build errors:**
```bash
cd frontend
rm -rf node_modules
npm install
npm run type-check
```

**API connection errors:**
- Verify backend is running on port 4000
- Check VITE_API_BASE_URL in frontend/.env
- Check browser console for CORS errors

**WebSocket connection fails:**
- Verify VITE_WS_URL matches backend URL
- Check browser console for connection errors
- Verify backend WebSocket server is running

## Development Workflow

### Backend Development

```bash
# Run in development mode (auto-reload)
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Open Prisma Studio
npm run prisma:studio
```

### Frontend Development

```bash
cd frontend

# Run dev server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Type check
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

## Database Management

### View Data
```bash
# Open Prisma Studio (GUI)
npm run prisma:studio
```

### Migrations
```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Seed Data (Optional)
```bash
# Create seed script in prisma/seed.ts
# Then run:
npx prisma db seed
```

## Testing the Application

### 1. Test Dashboard Views

Navigate to:
- http://localhost:3000/dashboard/developer
- http://localhost:3000/dashboard/manager
- http://localhost:3000/dashboard/executive
- http://localhost:3000/dashboard/custom

### 2. Test Report Generation

1. Go to http://localhost:3000/reports/generate
2. Select report type and format
3. Click "Generate Report"
4. Check status at http://localhost:3000/reports

### 3. Test Metrics Calculation

Use API directly:
```bash
# Create a feature first (via API or Prisma Studio)
# Then calculate metrics:
curl -X POST http://localhost:4000/api/metrics/FEATURE_ID/calculate \
  -H "Content-Type: application/json" \
  -d '{"metricType": "TIME_SAVED"}'
```

### 4. Test Real-Time Updates

1. Open dashboard in browser
2. Open browser console
3. Trigger metric calculation via API
4. Watch for WebSocket updates in console

## Production Deployment

See deployment workflows:
- `.github/workflows/deploy-backend.yml`
- `.github/workflows/deploy-frontend.yml`

### Backend Deployment
1. Build Docker image
2. Push to ECR
3. Run migrations
4. Deploy to ECS

### Frontend Deployment
1. Build production bundle
2. Upload to S3
3. Invalidate CloudFront cache

## Environment Variables Reference

### Backend (.env)
```bash
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/aidlc
PORT=4000
REDIS_URL=redis://localhost:6379

# Optional - AWS S3
AWS_REGION=us-east-1
AWS_S3_BUCKET=aidlc-reports
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Optional - Configuration
REPORT_EXPIRATION_DAYS=7
METRIC_CALCULATION_BATCH_SIZE=10
DASHBOARD_CACHE_TTL_SECONDS=300
ANALYTICS_ENABLED=false
```

### Frontend (frontend/.env)
```bash
# Required
VITE_API_BASE_URL=http://localhost:4000
VITE_WS_URL=http://localhost:4000

# Optional
VITE_ANALYTICS_ENABLED=false
VITE_ENABLE_REAL_TIME_UPDATES=true
```

## Getting Help

### Documentation
- Main README: `README.md`
- Frontend README: `frontend/README.md`
- Code Summary: `aidlc-docs/construction/reporting-visualization/code/code-summary.md`
- Completion Report: `UNIT-3-COMPLETION-REPORT.md`

### Common Issues
- Check logs in `logs/` directory
- Check browser console for frontend errors
- Check terminal output for backend errors
- Verify all environment variables are set

### Debug Mode
```bash
# Backend with debug logging
LOG_LEVEL=debug npm run dev

# Frontend with source maps
cd frontend
npm run dev
```

## Next Steps After Setup

1. ✅ Verify application runs
2. ✅ Test basic functionality
3. ⏳ Add sample data
4. ⏳ Test report generation
5. ⏳ Test dashboard views
6. ⏳ Configure AWS S3 (optional)
7. ⏳ Write frontend tests (Steps 46-49)
8. ⏳ Deploy to staging
9. ⏳ User acceptance testing
10. ⏳ Production deployment

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review documentation files
3. Check GitHub issues
4. Review code comments

---

**Ready to start?** Run the Quick Start commands above!
