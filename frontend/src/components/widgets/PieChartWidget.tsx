import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import { PieChartData, ChartConfig } from '@/types/charts';

interface PieChartWidgetProps {
  data: PieChartData;
  config?: ChartConfig;
}

const DEFAULT_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function PieChartWidget({ data, config = {} }: PieChartWidgetProps) {
  const {
    title,
    colors = DEFAULT_COLORS,
    showLegend = true,
    height = 300,
  } = config;

  return (
    <Card>
      {title && (
        <CardHeader
          title={<Typography variant="h6">{title}</Typography>}
        />
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data.data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={(entry) => `${entry.name}: ${entry.value}`}
            >
              {data.data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
