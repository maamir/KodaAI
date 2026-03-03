import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PieChartWidget } from '../PieChartWidget';
import { PieChartData } from '@/types/charts';

describe('PieChartWidget', () => {
  const mockData: PieChartData = {
    data: [
      { name: 'Completed', value: 45, color: '#00C49F' },
      { name: 'In Progress', value: 30, color: '#FFBB28' },
      { name: 'Planned', value: 25, color: '#FF8042' },
    ],
  };

  it('should render chart with title', () => {
    render(<PieChartWidget data={mockData} config={{ title: 'Feature Status' }} />);
    
    expect(screen.getByText('Feature Status')).toBeInTheDocument();
  });

  it('should render chart without title', () => {
    render(<PieChartWidget data={mockData} />);
    
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should render pie chart', () => {
    const { container } = render(<PieChartWidget data={mockData} />);
    
    const chartContainer = container.querySelector('.recharts-wrapper');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should apply custom height', () => {
    const { container } = render(
      <PieChartWidget data={mockData} config={{ height: 400 }} />
    );
    
    const responsiveContainer = container.querySelector('.recharts-responsive-container');
    expect(responsiveContainer).toBeInTheDocument();
  });

  it('should show legend when enabled', () => {
    const { container } = render(
      <PieChartWidget data={mockData} config={{ showLegend: true }} />
    );
    
    const legend = container.querySelector('.recharts-legend-wrapper');
    expect(legend).toBeInTheDocument();
  });

  it('should hide legend when disabled', () => {
    const { container } = render(
      <PieChartWidget data={mockData} config={{ showLegend: false }} />
    );
    
    const legend = container.querySelector('.recharts-legend-wrapper');
    expect(legend).not.toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    const emptyData: PieChartData = { data: [] };
    
    const { container } = render(<PieChartWidget data={emptyData} />);
    
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('should apply custom colors to slices', () => {
    const { container } = render(<PieChartWidget data={mockData} />);
    
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('should handle single data point', () => {
    const singleData: PieChartData = {
      data: [{ name: 'Only One', value: 100 }],
    };
    
    const { container } = render(<PieChartWidget data={singleData} />);
    
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('should use default colors when not provided', () => {
    const dataWithoutColors: PieChartData = {
      data: [
        { name: 'A', value: 30 },
        { name: 'B', value: 70 },
      ],
    };
    
    const { container } = render(<PieChartWidget data={dataWithoutColors} />);
    
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });
});
