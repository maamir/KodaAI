export interface ChartDataPoint {
  label: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  values: Record<string, number>;
}

export interface ChartConfig {
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  height?: number;
}

export interface LineChartData {
  series: {
    name: string;
    data: { x: string | number; y: number }[];
    color?: string;
  }[];
}

export interface BarChartData {
  categories: string[];
  series: {
    name: string;
    data: number[];
    color?: string;
  }[];
}

export interface PieChartData {
  data: {
    name: string;
    value: number;
    color?: string;
  }[];
}

export interface AreaChartData {
  series: {
    name: string;
    data: { x: string | number; y: number }[];
    color?: string;
  }[];
}
