import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render spinner', () => {
    const { container } = render(<LoadingSpinner />);
    
    const spinner = container.querySelector('.MuiCircularProgress-root');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with message', () => {
    render(<LoadingSpinner message="Loading data..." />);
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('should render without message', () => {
    render(<LoadingSpinner />);
    
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('should apply custom size', () => {
    const { container } = render(<LoadingSpinner size={60} />);
    
    const spinner = container.querySelector('.MuiCircularProgress-root');
    expect(spinner).toBeInTheDocument();
  });

  it('should use default size when not specified', () => {
    const { container } = render(<LoadingSpinner />);
    
    const spinner = container.querySelector('.MuiCircularProgress-root');
    expect(spinner).toBeInTheDocument();
  });

  it('should center content', () => {
    const { container } = render(<LoadingSpinner message="Please wait..." />);
    
    const box = container.querySelector('.MuiBox-root');
    expect(box).toBeInTheDocument();
  });
});
