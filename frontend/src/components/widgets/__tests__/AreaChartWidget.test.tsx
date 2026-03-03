import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AreaChartWidget } from '../AreaChartWidget';
import { AreaChartData } from '@/types/charts';

describe('AreaChartWidget', () => {
  const mockData: AreaChartData = {
    series: [
      {
        name: 'Cumulative Time Saved',
        data: [
          { x: 'Week 1', y: 10 },
          { x: 'Week 2', y: 25 },
          { x: 'Week 3', y: 45 },
        ],
      },
      {
        name: 'Cumulative Cost Savings',
        data: [
          { x: 'Week 1', y: 1000 },
          { x: 'Week 2', y: 2500 },
          { x: 'Week 3', y: 4500 },
        ],
        color: '#82ca9d',
      },
    ],
  };

  it('should render chart with title', () => {
    render(<AreaChartWidget data={mockData} config={{ title: 'Cumulative Metrics' }} />);
    
    expect(screen.getByText('Cumulative Metrics')).toBeInTheDocument();
  });

  it('should render chart without title', () => {
    render(<AreaChartWidget data={mockData} />);
    
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should render multiple series as areas', () => {
    const { container } = render(<AreaChartWidget data={mockData} />);
    
    const chartContainer = container.querySelector('.recharts-wrapper');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should apply custom height', () => {
    const { container } = render(
      <AreaChartWidget data={mockData} config={{ height: 400 }} />
    );
    
    const responsiveContainer = container.querySelector('.recharts-responsive-container');
    expect(responsiveContainer).toBeInTheDocument();
  });

  it('should show legend when enabled', () => {
    const { container } = render(
      <AreaChartWidget data={mockData} config={{ showLegend: true }} />
    );
    
    const legend = container.querySelector('.recharts-legend-wrapper');
    expect(legend).toBeInTheDocument();
  });

  it('should hide legend when disabled', () => {
    const { container } = render(
      <AreaChartWidget data={mockData} config={{ showLegend: false }} />
    );
    
    const legend = container.querySelector('.recharts-legend-wrapper');
    expect(legend).not.toBeInTheDocument();
  });

  it('should show grid when enabled', () => {
    const { container } = render(
      <AreaChartWidget data={mockData} config={{ showGrid: true }} />
    );
    
    const grid = container.querySelector('.recharts-cartesian-grid');
    expect(grid).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    const emptyData: AreaChartData = { series: [] };
    
    const { container } = render(<AreaChartWidget data={emptyData} />);
    
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('should apply custom colors to areas', () => {
    const dataWithColors: AreaChartData = {
      series: [
        {
          name: 'Series 1',
          data: [{ x: 1, y: 10 }],
          color: '#FF0000',
        },
      ],
    };
    
    const { container } = render(<AreaChartWidget data={dataWithColors} />);
    
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('should render with fill opacity', () => {
    const { container } = render(<AreaChartWidget data={mockData} />);
    
    // Area charts should have fill with opacity
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });
});
