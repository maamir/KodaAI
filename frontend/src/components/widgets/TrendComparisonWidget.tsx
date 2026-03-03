import { Card, CardContent, CardHeader, Typography, Box, Chip } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface TrendItem {
  label: string;
  current: number;
  previous: number;
  unit?: string;
}

interface TrendComparisonWidgetProps {
  title?: string;
  trends: TrendItem[];
}

export function TrendComparisonWidget({ title, trends }: TrendComparisonWidgetProps) {
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <Card>
      {title && (
        <CardHeader title={<Typography variant="h6">{title}</Typography>} />
      )}
      <CardContent>
        {trends.map((trend, index) => {
          const change = calculateChange(trend.current, trend.previous);
          const isPositive = change > 0;
          const isNegative = change < 0;

          return (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                pb: 2,
                borderBottom: index < trends.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {trend.label}
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {trend.current}{trend.unit || ''}
                </Typography>
              </Box>
              <Chip
                icon={isPositive ? <TrendingUp /> : isNegative ? <TrendingDown /> : undefined}
                label={`${change > 0 ? '+' : ''}${change.toFixed(1)}%`}
                color={isPositive ? 'success' : isNegative ? 'error' : 'default'}
                size="small"
              />
            </Box>
          );
        })}
      </CardContent>
    </Card>
  );
}
