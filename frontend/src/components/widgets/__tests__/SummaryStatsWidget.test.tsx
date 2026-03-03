import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SummaryStatsWidget } from '../SummaryStatsWidget';

describe('SummaryStatsWidget', () => {
  const stats = [
    { label: 'Total Features', value: 100 },
    { label: 'Time Saved', value: '500h' },
    { label: 'Cost Savings', value: '$50,000', color: 'success.main' },
  ];

  it('should render title when provided', () => {
    render(<SummaryStatsWidget title="Key Metrics" stats={stats} />);
    
    expect(screen.getByText('Key Metrics')).toBeInTheDocument();
  });

  it('should render without title', () => {
    render(<SummaryStatsWidget stats={stats} />);
    
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should render all stat labels', () => {
    render(<SummaryStatsWidget stats={stats} />);
    
    expect(screen.getByText('Total Features')).toBeInTheDocument();
    expect(screen.getByText('Time Saved')).toBeInTheDocument();
    expect(screen.getByText('Cost Savings')).toBeInTheDocument();
  });

  it('should render all stat values', () => {
    render(<SummaryStatsWidget stats={stats} />);
    
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('500h')).toBeInTheDocument();
    expect(screen.getByText('$50,000')).toBeInTheDocument();
  });

  it('should handle numeric values', () => {
    const numericStats = [{ label: 'Count', value: 42 }];
    
    render(<SummaryStatsWidget stats={numericStats} />);
    
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should handle string values', () => {
    const stringStats = [{ label: 'Status', value: 'Active' }];
    
    render(<SummaryStatsWidget stats={stringStats} />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should handle empty stats array', () => {
    const { container } = render(<SummaryStatsWidget stats={[]} />);
    
    expect(container.querySelector('.MuiCard-root')).toBeInTheDocument();
  });

  it('should render stats in grid layout', () => {
    const { container } = render(<SummaryStatsWidget stats={stats} />);
    
    const grid = container.querySelector('.MuiGrid-container');
    expect(grid).toBeInTheDocument();
  });
});
