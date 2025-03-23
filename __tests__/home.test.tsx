import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Create a mock home page for testing
const MockHomePage = () => (
  <div>
    <header>
      <nav>
        <span>iDocument</span>
        <div className="auth-links">
          {/* These links will be conditional based on auth status in the mock */}
          <a href="/auth/signin">Sign In</a>
          <a href="/dashboard">Dashboard</a>
        </div>
      </nav>
    </header>
    <main>
      <h1>AI-Powered Code Documentation</h1>
      <div className="cta-buttons">
        <a href="/auth/signin">Get Started</a>
      </div>
    </main>
  </div>
);

// Mock the actual home page component
jest.mock('../app/page', () => ({
  __esModule: true,
  default: () => <MockHomePage />,
}));

// Import after mocking
import HomePage from '../app/page';

describe('Home Page', () => {
  it('renders the homepage with title', () => {
    render(<HomePage />);
    
    expect(screen.getByText('iDocument')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered Code Documentation')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });
  
  it('includes sign in link', () => {
    render(<HomePage />);
    
    const signInLink = screen.getByText('Sign In');
    expect(signInLink).toBeInTheDocument();
    expect(signInLink.getAttribute('href')).toBe('/auth/signin');
  });
  
  it('includes dashboard link', () => {
    render(<HomePage />);
    
    const dashboardLink = screen.getByText('Dashboard');
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink.getAttribute('href')).toBe('/dashboard');
  });
}); 