# AIDLC Frontend - Reporting and Visualization

React-based frontend application for the AI Development Lifecycle Platform's reporting and visualization features.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Material-UI** - Component library
- **Recharts** - Chart visualization
- **TanStack Query** - Server state management
- **Socket.IO Client** - Real-time updates
- **Zustand** - UI state management
- **React Router** - Navigation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:4000`

### Installation

```bash
cd frontend
npm install
```

### Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Configure the following variables:

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_WS_URL=http://localhost:4000
VITE_ANALYTICS_ENABLED=false
VITE_ENABLE_REAL_TIME_UPDATES=true
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

### Testing

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

Run tests in watch mode:

```bash
npm run test:watch
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run type-check
```

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API client functions
│   ├── components/       # React components
│   │   ├── common/       # Reusable components
│   │   ├── config/       # Dashboard configuration UI
│   │   ├── reports/      # Report generation UI
│   │   ├── views/        # Dashboard views
│   │   └── widgets/      # Chart and data widgets
│   ├── hooks/            # Custom React hooks
│   ├── router/           # React Router configuration
│   ├── store/            # Zustand state management
│   ├── theme/            # Material-UI theme
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx           # Root component
│   └── main.tsx          # Entry point
├── public/               # Static assets
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies
```

## Features

### Dashboard Views

- **Developer Dashboard** - Personal metrics and productivity tracking
- **Manager Dashboard** - Team performance and comparison
- **Executive Dashboard** - ROI metrics and high-level summaries
- **Custom Dashboard** - Configurable widgets and layout

### Reports

- Generate reports in multiple formats (PDF, Excel, HTML)
- Track report generation status
- Download and manage reports
- Scheduled report generation

### Real-Time Updates

- WebSocket connection for live metric updates
- Automatic dashboard refresh on data changes
- Report status notifications

### Widgets

#### Chart Widgets
- Line Chart - Trend visualization
- Bar Chart - Comparison visualization
- Pie Chart - Distribution visualization
- Area Chart - Cumulative visualization

#### Data Widgets
- Metric Cards - Key performance indicators
- Data Tables - Sortable data display
- Summary Stats - Aggregated metrics
- Team Comparison - Performance comparison
- Trend Comparison - Period-over-period analysis

## Development Guidelines

### Component Structure

Components follow this pattern:

```tsx
import { ComponentProps } from '@mui/material';

interface MyComponentProps {
  // Props definition
}

export function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // Component logic
  return (
    // JSX
  );
}
```

### API Integration

Use React Query hooks for data fetching:

```tsx
import { useDashboardData } from '@/hooks/useDashboardData';

function MyComponent() {
  const { data, isLoading, error } = useDashboardData(ViewType.DEVELOPER);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Failed to load" />;
  
  return <div>{/* Render data */}</div>;
}
```

### State Management

Use Zustand for UI state:

```tsx
import { useUIStore } from '@/store/uiStore';

function MyComponent() {
  const { theme, setTheme } = useUIStore();
  
  return (
    <button onClick={() => setTheme('dark')}>
      Switch to Dark Mode
    </button>
  );
}
```

### Styling

Use Material-UI's `sx` prop for styling:

```tsx
<Box sx={{ p: 2, bgcolor: 'background.paper' }}>
  Content
</Box>
```

## Testing

### Unit Tests

Test individual components and hooks:

```tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Integration Tests

Test component interactions and data flow.

## Performance Optimization

- Code splitting by route and feature
- Lazy loading for heavy components
- React Query caching (5-minute stale time)
- Memoization for expensive computations
- Virtual scrolling for large lists

## Accessibility

- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus management

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Deployment

The frontend is deployed as a static site to AWS S3 + CloudFront.

Build command:
```bash
npm run build
```

Deploy to S3:
```bash
aws s3 sync dist/ s3://your-bucket-name --delete
```

Invalidate CloudFront cache:
```bash
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## Troubleshooting

### API Connection Issues

- Verify backend is running on the configured URL
- Check CORS configuration on backend
- Verify environment variables are set correctly

### WebSocket Connection Issues

- Ensure WebSocket URL is correct
- Check firewall/proxy settings
- Verify backend WebSocket server is running

### Build Issues

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check TypeScript errors: `npm run type-check`

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation as needed
4. Ensure all tests pass before committing

## License

Proprietary - All rights reserved
