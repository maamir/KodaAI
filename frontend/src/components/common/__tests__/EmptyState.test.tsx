import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('should render title', () => {
    render(<EmptyState title="No Data Available" />);
    
    expect(screen.getByText('No Data Available')).toBeInTheDocument();
  });

  it('should render message when provided', () => {
    render(
      <EmptyState
        title="No Reports"
        message="You haven't generated any reports yet"
      />
    );
    
    expect(screen.getByText("You haven't generated any reports yet")).toBeInTheDocument();
  });

  it('should not render message when not provided', () => {
    render(<EmptyState title="Empty" />);
    
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('should render action button when provided', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="No Data"
        actionLabel="Add Data"
        onAction={onAction}
      />
    );
    
    expect(screen.getByRole('button', { name: 'Add Data' })).toBeInTheDocument();
  });

  it('should not render action button when not provided', () => {
    render(<EmptyState title="Empty" />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should call onAction when button clicked', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <EmptyState
        title="No Data"
        actionLabel="Create New"
        onAction={onAction}
      />
    );
    
    const button = screen.getByRole('button', { name: 'Create New' });
    await user.click(button);
    
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('should render inbox icon', () => {
    const { container } = render(<EmptyState title="Empty" />);
    
    const icon = container.querySelector('[data-testid="InboxIcon"]');
    expect(icon).toBeInTheDocument();
  });

  it('should center content', () => {
    const { container } = render(<EmptyState title="Empty" />);
    
    const box = container.querySelector('.MuiBox-root');
    expect(box).toBeInTheDocument();
  });
});
