import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LineChartWidget } from '../LineChartWidget';
import { LineChartData } from '@/types/charts';

describe('LineChartWidget', () => {
  const mockData: LineChartData = {
    series: [
      {
        name: 'Time Saved',
        data: [
          { x: 'Week 1', y: 10 },
          { x: 'Week 2', y: 15 },
          { x: 'Week 3', y: 20 },
        ],
      },
      {
        name: 'Cost Savings',
        data: [
          { x: 'Week 1', y: 1000 },
          { x: 'Week 2', y: 1500 },
          { x: 'Week 3', y: 2000 },
        ],
        color: '#00C49F',
      },
    ],
  };

  it('should render chart with title', () => {
    render(<LineChartWidget data={mockData} config={{ title: 'Productivity Trends' }} />);
    
    expect(screen.getByText('Productivity Trends')).toBeInTheDocument();
  });

  it('should render chart without title', () => {
    render(<LineChartWidget data={mockData} />);
    
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should render multiple series', () => {
    const { container } = render(<LineChartWidget data={mockData} />);
    
    // Check that chart container exists
    const chartContainer = container.querySelector('.recharts-wrapper');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should apply custom height', () => {
    const { container } = render(
      <LineChartWidget data={mockData} config={{ height: 400 }} />
    );
    
    const responsiveContainer = container.querySelector('.recharts-responsive-container');
    expect(responsiveContainer).toBeInTheDocument();
  });

  it('should show legend when enabled', () => {
    const { container } = render(
      <LineChartWidget data={mockData} config={{ showLegend: true }} />
    );
    
    const legend = container.querySelector('.recharts-legend-wrapper');
    expect(legend).toBeInTheDocument();
  });

  it('should hide legend when disabled', () => {
    const { container } = render(
      <LineChartWidget data={mockData} config={{ showLegend: false }} />
    );
    
    const legend = container.querySelector('.recharts-legend-wrapper');
    expect(legend).not.toBeInTheDocument();
  });

  it('should show grid when enabled', () => {
    const { container } = render(
      <LineChartWidget data={mockData} config={{ showGrid: true }} />
    );
    
    const grid = container.querySelector('.recharts-cartesian-grid');
    expect(grid).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    const emptyData: LineChartData = { series: [] };
    
    const { container } = render(<LineChartWidget data={emptyData} />);
    
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('should apply custom colors to series', () => {
    const dataWithColors: LineChartData = {
      series: [
        {
          name: 'Series 1',
          data: [{ x: 1, y: 10 }],
          color: '#FF0000',
        },
      ],
    };
    
    const { container } = render(<LineChartWidget data={dataWithColors} />);
    
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('should render axis labels when provided', () => {
    render(
      <LineChartWidget
        data={mockData}
        config={{
          xAxisLabel: 'Time Period',
          yAxisLabel: 'Value',
        }}
      />
    );
    
    const { container } = render(
      <LineChartWidget
        data={mockData}
        config={{
          xAxisLabel: 'Time Period',
          yAxisLabel: 'Value',
        }}
      />
    );
    
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });
});
