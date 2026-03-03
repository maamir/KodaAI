import { Grid, Typography } from '@mui/material';
import { useDashboardData } from '@/hooks/useDashboardData';
import { ViewType } from '@/types/entities';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { MetricCardWidget } from '@/components/widgets/MetricCardWidget';
import { BarChartWidget } from '@/components/widgets/BarChartWidget';
import { TeamComparisonWidget } from '@/components/widgets/TeamComparisonWidget';
import { usePageTracking } from '@/hooks/useAnalytics';

export function ManagerDashboard() {
  usePageTracking('Manager Dashboard');
  const { data, isLoading, error, refetch } = useDashboardData(ViewType.MANAGER);

  if (isLoading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorAlert message="Failed to load dashboard" onRetry={() => refetch()} />;
  if (!data?.data) return null;

  const { summary } = data.data;

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Manager Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCardWidget
            title="Team Productivity"
            value={`${summary.avgSpeedMultiplier.toFixed(2)}x`}
            trend="up"
            trendValue="+15%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCardWidget
            title="Cost Savings"
            value={`$${summary.totalCostSavings.toFixed(0)}`}
            trend="up"
            trendValue="+20%"
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TeamComparisonWidget
            title="Team Performance"
            members={[
              { name: 'Developer 1', value: 85, maxValue: 100, color: '#1976d2' },
              { name: 'Developer 2', value: 92, maxValue: 100, color: '#2e7d32' },
              { name: 'Developer 3', value: 78, maxValue: 100, color: '#ed6c02' },
            ]}
            unit="%"
          />
        </Grid>
        <Grid item xs={12}>
          <BarChartWidget
            data={{
              categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
              series: [{ name: 'Features Completed', data: [5, 7, 6, 8] }],
            }}
            config={{ title: 'Weekly Feature Completion', height: 300 }}
          />
        </Grid>
      </Grid>
    </>
  );
}
