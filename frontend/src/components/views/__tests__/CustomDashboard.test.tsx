import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { CustomDashboard } from '../CustomDashboard';

vi.mock('@/hooks/useAnalytics', () => ({
  usePageTracking: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CustomDashboard', () => {
  it('should render dashboard title', () => {
    render(
      <MemoryRouter>
        <CustomDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Custom Dashboard')).toBeInTheDocument();
  });

  it('should render configure button', () => {
    render(
      <MemoryRouter>
        <CustomDashboard />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /configure dashboard/i })).toBeInTheDocument();
  });

  it('should render empty state', () => {
    render(
      <MemoryRouter>
        <CustomDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('No Custom Dashboard Configured')).toBeInTheDocument();
    expect(screen.getByText(/create a custom dashboard/i)).toBeInTheDocument();
  });

  it('should navigate to config when configure button clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CustomDashboard />
      </MemoryRouter>
    );

    const configButton = screen.getByRole('button', { name: /configure dashboard/i });
    await user.click(configButton);

    expect(mockNavigate).toHaveBeenCalledWith('/config');
  });

  it('should navigate to config when empty state action clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CustomDashboard />
      </MemoryRouter>
    );

    const configureNowButton = screen.getByRole('button', { name: /configure now/i });
    await user.click(configureNowButton);

    expect(mockNavigate).toHaveBeenCalledWith('/config');
  });
});
