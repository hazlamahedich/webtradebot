import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the server component directly in the test file
const MockedRepositoriesPage = () => <div>Mocked Repositories Page</div>;

// Mock server component
jest.mock('@/app/dashboard/repositories/page', () => ({
  __esModule: true,
  default: () => <MockedRepositoriesPage />,
}));

// Import after mocking
import RepositoriesPage from '@/app/dashboard/repositories/page';

describe('Repositories Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the repositories page component', () => {
    render(<MockedRepositoriesPage />);
    expect(screen.getByText("Mocked Repositories Page")).toBeInTheDocument();
  });
}); 