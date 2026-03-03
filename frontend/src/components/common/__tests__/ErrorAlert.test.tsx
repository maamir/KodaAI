import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ErrorAlert } from '../ErrorAlert';

describe('ErrorAlert', () => {
  it('should render error message', () => {
    render(<ErrorAlert message="Something went wrong" />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render default title', () => {
    render(<ErrorAlert message="Error occurred" />);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should render custom title', () => {
    render(<ErrorAlert title="Custom Error" message="Error occurred" />);
    
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
  });

  it('should render retry button when onRetry provided', () => {
    const onRetry = vi.fn();
    render(<ErrorAlert message="Failed to load" onRetry={onRetry} />);
    
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should not render retry button when onRetry not provided', () => {
    render(<ErrorAlert message="Failed to load" />);
    
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('should call onRetry when retry button clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorAlert message="Failed to load" onRetry={onRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should render as error severity', () => {
    const { container } = render(<ErrorAlert message="Error" />);
    
    const alert = container.querySelector('.MuiAlert-standardError');
    expect(alert).toBeInTheDocument();
  });
});
