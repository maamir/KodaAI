import { Grid, Typography } from '@mui/material';
import { useDashboardData } from '@/hooks/useDashboardData';
import { ViewType } from '@/types/entities';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { MetricCardWidget } from '@/components/widgets/MetricCardWidget';
import { LineChartWidget } from '@/components/widgets/LineChartWidget';
import { usePageTracking } from '@/hooks/useAnalytics';

export function DeveloperDashboard() {
  usePageTracking('Developer Dashboard');
  const { data, isLoading, error, refetch } = useDashboardData(ViewType.DEVELOPER);

  if (isLoading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorAlert message="Failed to load dashboard" onRetry={() => refetch()} />;
  if (!data?.data) return null;

  const { summary } = data.data;

  // Provide default values for summary fields
  const totalFeatures = summary?.totalFeatures ?? 0;
  const totalTimeSaved = summary?.totalTimeSaved ?? 0;
  const avgSpeedMultiplier = summary?.avgSpeedMultiplier ?? 0;
  const avgQualityScore = summary?.avgQualityScore ?? 0;

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Developer Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCardWidget
            title="Total Features"
            value={totalFeatures}
            trend="up"
            trendValue="+5%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCardWidget
            title="Time Saved"
            value={`${totalTimeSaved.toFixed(1)}h`}
            trend="up"
            trendValue="+12%"
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCardWidget
            title="Speed Multiplier"
            value={`${avgSpeedMultiplier.toFixed(2)}x`}
            trend="up"
            trendValue="+8%"
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCardWidget
            title="Quality Score"
            value={`${avgQualityScore.toFixed(1)}%`}
            trend="flat"
            color="info.main"
          />
        </Grid>
        <Grid item xs={12}>
          <LineChartWidget
            data={{ series: [{ name: 'Time Saved', data: [] }] }}
            config={{ title: 'Time Saved Trend', height: 300 }}
          />
        </Grid>
      </Grid>
    </>
  );
}
