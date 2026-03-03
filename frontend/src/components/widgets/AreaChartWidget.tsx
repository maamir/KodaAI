import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import { AreaChartData, ChartConfig } from '@/types/charts';

interface AreaChartWidgetProps {
  data: AreaChartData;
  config?: ChartConfig;
}

export function AreaChartWidget({ data, config = {} }: AreaChartWidgetProps) {
  const {
    title,
    xAxisLabel,
    yAxisLabel,
    colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'],
    showLegend = true,
    showGrid = true,
    height = 300,
  } = config;

  const chartData = data.series[0]?.data.map((point, index) => {
    const dataPoint: any = { name: point.x };
    data.series.forEach((series) => {
      dataPoint[series.name] = series.data[index]?.y || 0;
    });
    return dataPoint;
  }) || [];

  return (
    <Card>
      {title && (
        <CardHeader
          title={<Typography variant="h6">{title}</Typography>}
        />
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined} />
            <YAxis label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined} />
            <Tooltip />
            {showLegend && <Legend />}
            {data.series.map((series, index) => (
              <Area
                key={series.name}
                type="monotone"
                dataKey={series.name}
                stroke={series.color || colors[index % colors.length]}
                fill={series.color || colors[index % colors.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
