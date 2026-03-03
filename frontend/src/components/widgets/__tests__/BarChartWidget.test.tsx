import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BarChartWidget } from '../BarChartWidget';
import { BarChartData } from '@/types/charts';

describe('BarChartWidget', () => {
  const mockData: BarChartData = {
    categories: ['Feature A', 'Feature B', 'Feature C'],
    series: [
      {
        name: 'Time Saved',
        data: [10, 15, 20],
      },
      {
        name: 'Cost Savings',
        data: [1000, 1500, 2000],
        color: '#82ca9d',
      },
    ],
  };

  it('should render chart with title', () => {
    render(<BarChartWidget data={mockData} config={{ title: 'Feature Comparison' }} />);
    
    expect(screen.getByText('Feature Comparison')).toBeInTheDocument();
  });

  it('should render chart without title', () => {
    render(<BarChartWidget data={mockData} />);
    
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should render multiple series as bars', () => {
    const { container } = render(<BarChartWidget data={mockData} />);
    
    const chartContainer = container.querySelector('.recharts-wrapper');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should apply custom height', () => {
    const { container } = render(
      <BarChartWidget data={mockData} config={{ height: 400 }} />
    );
    
    const responsiveContainer = container.querySelector('.recharts-responsive-container');
    expect(responsiveContainer).toBeInTheDocument();
  });

  it('should show legend when enabled', () => {
    const { container } = render(
      <BarChartWidget data={mockData} config={{ showLegend: true }} />
    );
    
    const legend = container.querySelector('.recharts-legend-wrapper');
    expect(legend).toBeInTheDocument();
  });

  it('should hide legend when disabled', () => {
    const { container } = render(
      <BarChartWidget data={mockData} config={{ showLegend: false }} />
    );
    
    const legend = container.querySelector('.recharts-legend-wrapper');
    expect(legend).not.toBeInTheDocument();
  });

  it('should show grid when enabled', () => {
    const { container } = render(
      <BarChartWidget data={mockData} config={{ showGrid: true }} />
    );
    
    const grid = container.querySelector('.recharts-cartesian-grid');
    expect(grid).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    const emptyData: BarChartData = { categories: [], series: [] };
    
    const { container } = render(<BarChartWidget data={emptyData} />);
    
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('should apply custom colors to bars', () => {
    const dataWithColors: BarChartData = {
      categories: ['A', 'B'],
      series: [
        {
          name: 'Series 1',
          data: [10, 20],
          color: '#FF0000',
        },
      ],
    };
    
    const { container } = render(<BarChartWidget data={dataWithColors} />);
    
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('should handle mismatched data lengths', () => {
    const mismatchedData: BarChartData = {
      categories: ['A', 'B', 'C'],
      series: [
        {
          name: 'Series 1',
          data: [10, 20], // Only 2 values for 3 categories
        },
      ],
    };
    
    const { container } = render(<BarChartWidget data={mismatchedData} />);
    
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });
});
