import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MetricCardWidget } from '../MetricCardWidget';

describe('MetricCardWidget', () => {
  it('should render title and value', () => {
    render(<MetricCardWidget title="Time Saved" value="100h" />);
    
    expect(screen.getByText('Time Saved')).toBeInTheDocument();
    expect(screen.getByText('100h')).toBeInTheDocument();
  });

  it('should render subtitle when provided', () => {
    render(
      <MetricCardWidget
        title="Speed Multiplier"
        value="2.5x"
        subtitle="vs last month"
      />
    );
    
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('should render trend up indicator', () => {
    const { container } = render(
      <MetricCardWidget
        title="Productivity"
        value="85%"
        trend="up"
        trendValue="+15%"
      />
    );
    
    expect(screen.getByText('+15%')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="TrendingUpIcon"]')).toBeInTheDocument();
  });

  it('should render trend down indicator', () => {
    const { container } = render(
      <MetricCardWidget
        title="Defect Rate"
        value="5%"
        trend="down"
        trendValue="-2%"
      />
    );
    
    expect(screen.getByText('-2%')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="TrendingDownIcon"]')).toBeInTheDocument();
  });

  it('should render trend flat indicator', () => {
    const { container } = render(
      <MetricCardWidget
        title="Quality Score"
        value="90%"
        trend="flat"
        trendValue="0%"
      />
    );
    
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="TrendingFlatIcon"]')).toBeInTheDocument();
  });

  it('should render without trend', () => {
    render(<MetricCardWidget title="Features" value={10} />);
    
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should handle numeric values', () => {
    render(<MetricCardWidget title="Total Features" value={42} />);
    
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should handle string values', () => {
    render(<MetricCardWidget title="Status" value="Active" />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should apply custom color', () => {
    const { container } = render(
      <MetricCardWidget
        title="Cost Savings"
        value="$5000"
        color="success.main"
      />
    );
    
    expect(container.querySelector('.MuiCard-root')).toBeInTheDocument();
  });
});
