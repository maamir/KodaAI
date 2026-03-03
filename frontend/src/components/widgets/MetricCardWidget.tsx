import { Card, CardContent, Typography, Box } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';

interface MetricCardWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  color?: string;
}

export function MetricCardWidget({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color = 'primary.main',
}: MetricCardWidgetProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : TrendingFlat;
  const trendColor = trend === 'up' ? 'success.main' : trend === 'down' ? 'error.main' : 'text.secondary';

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div" sx={{ color, fontWeight: 'bold', my: 1 }}>
          {value}
        </Typography>
        {(subtitle || trend) && (
          <Box display="flex" alignItems="center" gap={1}>
            {trend && (
              <Box display="flex" alignItems="center" sx={{ color: trendColor }}>
                <TrendIcon fontSize="small" />
                {trendValue && (
                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                    {trendValue}
                  </Typography>
                )}
              </Box>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
