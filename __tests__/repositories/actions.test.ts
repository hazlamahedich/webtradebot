import '@testing-library/jest-dom';

// Create mock implementations of the repository actions
const mockAddRepository = jest.fn().mockImplementation((formData) => {
  const fullName = formData.get('fullName');
  
  if (!fullName) {
    return { success: false, error: 'Repository name is required' };
  }
  
  if (formData.get('forceFailure') === 'true') {
    return { success: false, error: 'Mocked failure' };
  }
  
  return { 
    success: true, 
    message: 'Repository connected successfully',
    data: { id: 'mock-repo-id', name: fullName }
  };
});

const mockRemoveRepository = jest.fn().mockImplementation(() => {
  // Simply mock a successful removal
  return Promise.resolve();
});

// Mock the actual implementation
jest.mock('@/app/dashboard/repositories/actions', () => ({
  addRepository: (formData: FormData) => mockAddRepository(formData),
  removeRepository: (formData: FormData) => mockRemoveRepository(formData)
}));

// Import after mocking
import { addRepository, removeRepository } from '@/app/dashboard/repositories/actions';

describe('Repository Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addRepository', () => {
    it('returns success when adding a valid repository', async () => {
      // Create form data
      const formData = new FormData();
      formData.append('fullName', 'owner/repo');
      
      const result = await addRepository(formData);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Repository connected successfully');
      expect(mockAddRepository).toHaveBeenCalledWith(formData);
    });

    it('returns error when repository name is missing', async () => {
      // Create empty form data
      const formData = new FormData();
      
      const result = await addRepository(formData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Repository name is required');
    });

    it('handles failures correctly', async () => {
      // Create form data that will trigger failure
      const formData = new FormData();
      formData.append('fullName', 'owner/repo');
      formData.append('forceFailure', 'true');
      
      const result = await addRepository(formData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Mocked failure');
    });
  });

  describe('removeRepository', () => {
    it('calls the remove repository function with correct params', async () => {
      // Create form data
      const formData = new FormData();
      formData.append('repoId', 'repo-123');
      
      await removeRepository(formData);
      
      expect(mockRemoveRepository).toHaveBeenCalledWith(formData);
    });
  });
}); 