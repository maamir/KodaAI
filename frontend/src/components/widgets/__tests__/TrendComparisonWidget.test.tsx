import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TrendComparisonWidget } from '../TrendComparisonWidget';

describe('TrendComparisonWidget', () => {
  const trends = [
    { label: 'Time Saved', current: 120, previous: 100, unit: 'h' },
    { label: 'Cost Savings', current: 5000, previous: 6000, unit: '$' },
    { label: 'Quality Score', current: 85, previous: 85, unit: '%' },
  ];

  it('should render title when provided', () => {
    render(<TrendComparisonWidget title="Monthly Trends" trends={trends} />);
    
    expect(screen.getByText('Monthly Trends')).toBeInTheDocument();
  });

  it('should render without title', () => {
    render(<TrendComparisonWidget trends={trends} />);
    
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should render all trend labels', () => {
    render(<TrendComparisonWidget trends={trends} />);
    
    expect(screen.getByText('Time Saved')).toBeInTheDocument();
    expect(screen.getByText('Cost Savings')).toBeInTheDocument();
    expect(screen.getByText('Quality Score')).toBeInTheDocument();
  });

  it('should render current values with units', () => {
    render(<TrendComparisonWidget trends={trends} />);
    
    expect(screen.getByText('120h')).toBeInTheDocument();
    expect(screen.getByText('5000$')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('should show positive trend with up arrow', () => {
    const { container } = render(<TrendComparisonWidget trends={trends} />);
    
    // Time Saved increased from 100 to 120 (+20%)
    expect(screen.getByText('+20.0%')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="TrendingUpIcon"]')).toBeInTheDocument();
  });

  it('should show negative trend with down arrow', () => {
    const { container } = render(<TrendComparisonWidget trends={trends} />);
    
    // Cost Savings decreased from 6000 to 5000 (-16.7%)
    expect(screen.getByText('-16.7%')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="TrendingDownIcon"]')).toBeInTheDocument();
  });

  it('should show no change with 0%', () => {
    render(<TrendComparisonWidget trends={trends} />);
    
    // Quality Score stayed at 85 (0%)
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('should handle zero previous value', () => {
    const trendsWithZero = [
      { label: 'New Metric', current: 50, previous: 0 },
    ];
    
    render(<TrendComparisonWidget trends={trendsWithZero} />);
    
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('should handle empty trends array', () => {
    const { container } = render(<TrendComparisonWidget trends={[]} />);
    
    expect(container.querySelector('.MuiCard-root')).toBeInTheDocument();
  });

  it('should render without units', () => {
    const trendsWithoutUnits = [
      { label: 'Count', current: 10, previous: 8 },
    ];
    
    render(<TrendComparisonWidget trends={trendsWithoutUnits} />);
    
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('+25.0%')).toBeInTheDocument();
  });
});
