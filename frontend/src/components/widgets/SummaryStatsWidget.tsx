import { Card, CardContent, CardHeader, Typography, Grid, Box, Divider } from '@mui/material';

interface StatItem {
  label: string;
  value: string | number;
  color?: string;
}

interface SummaryStatsWidgetProps {
  title?: string;
  stats: StatItem[];
}

export function SummaryStatsWidget({ title, stats }: SummaryStatsWidgetProps) {
  return (
    <Card>
      {title && (
        <CardHeader title={<Typography variant="h6">{title}</Typography>} />
      )}
      <CardContent>
        <Grid container spacing={2}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {stat.label}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ color: stat.color || 'text.primary', fontWeight: 'bold' }}
                >
                  {stat.value}
                </Typography>
              </Box>
              {index < stats.length - 1 && (
                <Divider sx={{ mt: 2, display: { xs: 'block', sm: 'none' } }} />
              )}
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
