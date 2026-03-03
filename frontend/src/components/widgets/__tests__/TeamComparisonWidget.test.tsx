import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TeamComparisonWidget } from '../TeamComparisonWidget';

describe('TeamComparisonWidget', () => {
  const members = [
    { name: 'Developer 1', value: 85, maxValue: 100, color: '#1976d2' },
    { name: 'Developer 2', value: 92, maxValue: 100, color: '#2e7d32' },
    { name: 'Developer 3', value: 78, maxValue: 100, color: '#ed6c02' },
  ];

  it('should render title when provided', () => {
    render(<TeamComparisonWidget title="Team Performance" members={members} />);
    
    expect(screen.getByText('Team Performance')).toBeInTheDocument();
  });

  it('should render without title', () => {
    render(<TeamComparisonWidget members={members} />);
    
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should render all team member names', () => {
    render(<TeamComparisonWidget members={members} />);
    
    expect(screen.getByText('Developer 1')).toBeInTheDocument();
    expect(screen.getByText('Developer 2')).toBeInTheDocument();
    expect(screen.getByText('Developer 3')).toBeInTheDocument();
  });

  it('should render all team member values', () => {
    render(<TeamComparisonWidget members={members} />);
    
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('92')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
  });

  it('should render progress bars', () => {
    const { container } = render(<TeamComparisonWidget members={members} />);
    
    const progressBars = container.querySelectorAll('.MuiLinearProgress-root');
    expect(progressBars.length).toBe(3);
  });

  it('should render with unit suffix', () => {
    render(<TeamComparisonWidget members={members} unit="%" />);
    
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
  });

  it('should render without unit suffix', () => {
    render(<TeamComparisonWidget members={members} />);
    
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('should handle empty members array', () => {
    const { container } = render(<TeamComparisonWidget members={[]} />);
    
    expect(container.querySelector('.MuiCard-root')).toBeInTheDocument();
  });

  it('should handle single member', () => {
    const singleMember = [{ name: 'Solo Dev', value: 100, maxValue: 100 }];
    
    render(<TeamComparisonWidget members={singleMember} />);
    
    expect(screen.getByText('Solo Dev')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});
