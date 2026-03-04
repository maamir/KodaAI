import { Grid, Typography } from '@mui/material';
import { useDashboardData } from '@/hooks/useDashboardData';
import { ViewType } from '@/types/entities';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { MetricCardWidget } from '@/components/widgets/MetricCardWidget';
import { SummaryStatsWidget } from '@/components/widgets/SummaryStatsWidget';
import { PieChartWidget } from '@/components/widgets/PieChartWidget';
import { usePageTracking } from '@/hooks/useAnalytics';

export function ExecutiveDashboard() {
  usePageTracking('Executive Dashboard');
  const { data, isLoading, error, refetch } = useDashboardData(ViewType.EXECUTIVE);

  if (isLoading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorAlert message="Failed to load dashboard" onRetry={() => refetch()} />;
  if (!data?.data) return null;

  const { summary } = data.data;

  // Provide default values for summary fields
  const totalCostSavings = summary?.totalCostSavings ?? 0;
  const avgSpeedMultiplier = summary?.avgSpeedMultiplier ?? 0;
  const totalFeatures = summary?.totalFeatures ?? 0;
  const totalTimeSaved = summary?.totalTimeSaved ?? 0;
  const avgQualityScore = summary?.avgQualityScore ?? 0;

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Executive Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCardWidget
            title="Total ROI"
            value={`$${totalCostSavings.toFixed(0)}`}
            trend="up"
            trendValue="+25%"
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCardWidget
            title="Productivity Gain"
            value={`${avgSpeedMultiplier.toFixed(2)}x`}
            trend="up"
            trendValue="+18%"
          />
        </Grid>
        <Grid item xs={12}>
          <SummaryStatsWidget
            title="Key Metrics"
            stats={[
              { label: 'Total Features', value: totalFeatures },
              { label: 'Time Saved', value: `${totalTimeSaved.toFixed(1)}h` },
              { label: 'Cost Savings', value: `$${totalCostSavings.toFixed(0)}` },
              { label: 'Quality Score', value: `${avgQualityScore.toFixed(1)}%` },
            ]}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <PieChartWidget
            data={{
              data: [
                { name: 'Completed', value: 45 },
                { name: 'In Progress', value: 30 },
                { name: 'Planned', value: 25 },
              ],
            }}
            config={{ title: 'Feature Status Distribution', height: 300 }}
          />
        </Grid>
      </Grid>
    </>
  );
}
