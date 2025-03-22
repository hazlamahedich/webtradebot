import { render, screen } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import Home from '../app/page';

// Mock the next-auth useSession hook
jest.mock('next-auth/react');

describe('Home Page', () => {
  it('renders the main heading', () => {
    // Mock the useSession hook to return unauthenticated
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<Home />);
    
    // Check if the main heading is rendered
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('displays sign-in button for unauthenticated users', () => {
    // Mock the useSession hook to return unauthenticated
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<Home />);
    
    // Look for a sign-in button or link
    const signInButton = screen.getByRole('button', { name: /sign in/i }) || 
                         screen.getByRole('link', { name: /sign in/i });
    expect(signInButton).toBeInTheDocument();
  });

  it('displays dashboard link for authenticated users', () => {
    // Mock the useSession hook to return authenticated
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { name: 'Test User' },
        expires: '2023-01-01T00:00:00.000Z',
      },
      status: 'authenticated',
    });

    render(<Home />);
    
    // Look for a dashboard button or link
    const dashboardLink = screen.getByRole('button', { name: /dashboard/i }) || 
                          screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toBeInTheDocument();
  });
}); 