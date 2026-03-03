import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import { BarChartData, ChartConfig } from '@/types/charts';

interface BarChartWidgetProps {
  data: BarChartData;
  config?: ChartConfig;
}

export function BarChartWidget({ data, config = {} }: BarChartWidgetProps) {
  const {
    title,
    xAxisLabel,
    yAxisLabel,
    colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'],
    showLegend = true,
    showGrid = true,
    height = 300,
  } = config;

  const chartData = data.categories.map((category, index) => {
    const dataPoint: any = { name: category };
    data.series.forEach((series) => {
      dataPoint[series.name] = series.data[index] || 0;
    });
    return dataPoint;
  });

  return (
    <Card>
      {title && (
        <CardHeader
          title={<Typography variant="h6">{title}</Typography>}
        />
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined} />
            <YAxis label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined} />
            <Tooltip />
            {showLegend && <Legend />}
            {data.series.map((series, index) => (
              <Bar
                key={series.name}
                dataKey={series.name}
                fill={series.color || colors[index % colors.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
