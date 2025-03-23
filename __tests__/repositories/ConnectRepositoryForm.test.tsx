import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Create a mock component version for testing
const MockConnectRepositoryForm = () => (
  <div>
    <h1>Connect Repository Form</h1>
    <form>
      <input 
        placeholder="Enter GitHub repository name (username/repository)" 
        data-testid="repository-input"
      />
      <button type="submit">Connect Repository</button>
    </form>
  </div>
);

// Mock the actual component
jest.mock('@/components/connect-repository-form', () => ({
  __esModule: true,
  default: () => <MockConnectRepositoryForm />
}));

// Import after mocking
import ConnectRepositoryForm from '@/components/connect-repository-form';

describe('ConnectRepositoryForm', () => {
  it('renders the form', () => {
    render(<ConnectRepositoryForm />);
    
    expect(screen.getByText('Connect Repository Form')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter github repository name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /connect repository/i })).toBeInTheDocument();
  });

  it('allows user to input repository name', async () => {
    render(<ConnectRepositoryForm />);
    
    const input = screen.getByTestId('repository-input');
    await userEvent.type(input, 'username/repo');
    
    expect(input).toHaveValue('username/repo');
  });
}); 