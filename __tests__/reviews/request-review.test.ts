import '@testing-library/jest-dom';
import { requestReview } from '@/app/dashboard/reviews/request/actions';

// Mock auth
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

// Mock GitHub client
jest.mock('@/lib/github/api', () => ({
  GitHubClient: jest.fn().mockImplementation(() => ({
    getPullRequest: jest.fn(),
  })),
}));

// Mock code review integration
jest.mock('@/lib/ai/pr-review-integration', () => ({
  createCodeReviewForPR: jest.fn(),
}));

describe('Manual Review Request', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should request a review for a valid PR', async () => {
    // Setup mocks
    const mockAuth = require('@/lib/auth').auth;
    mockAuth.mockResolvedValue({
      user: { id: 'user-123' },
      accessToken: 'github-token-123',
    });
    
    const mockGitHubClient = require('@/lib/github/api').GitHubClient;
    mockGitHubClient.mockImplementation(() => ({
      getPullRequest: jest.fn().mockResolvedValue({
        id: 'pr-123',
        number: 123,
        title: 'Test PR',
        body: 'PR description',
        state: 'open',
        html_url: 'https://github.com/test/repo/pull/123',
        user: {
          login: 'testuser',
          avatar_url: 'https://avatar-url',
        },
      }),
    }));
    
    const mockCreateCodeReview = require('@/lib/ai/pr-review-integration').createCodeReviewForPR;
    mockCreateCodeReview.mockResolvedValue({
      success: true,
      reviewId: 'review-123',
    });
    
    // Call the function
    const result = await requestReview({
      owner: 'test',
      repo: 'repo',
      pullNumber: 123,
    });
    
    // Verify results
    expect(result.success).toBe(true);
    expect(result.reviewId).toBe('review-123');
    
    // Verify GitHub client was called
    const GitHubClient = require('@/lib/github/api').GitHubClient;
    expect(GitHubClient).toHaveBeenCalledWith('github-token-123');
    
    // Verify createCodeReviewForPR was called with correct params
    const { createCodeReviewForPR } = require('@/lib/ai/pr-review-integration');
    expect(createCodeReviewForPR).toHaveBeenCalledWith(
      'test',
      'repo',
      123,
      expect.objectContaining({
        id: 'pr-123',
        number: 123,
        title: 'Test PR',
      })
    );
  });
  
  it('should return error when user is not authenticated', async () => {
    // Mock auth to return null (unauthenticated)
    const mockAuth = require('@/lib/auth').auth;
    mockAuth.mockResolvedValue(null);
    
    const result = await requestReview({
      owner: 'test',
      repo: 'repo',
      pullNumber: 123,
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('You must be logged in to request a review.');
    
    // Verify GitHub client was not called
    const GitHubClient = require('@/lib/github/api').GitHubClient;
    expect(GitHubClient).not.toHaveBeenCalled();
  });
  
  it('should return error when access token is missing', async () => {
    // Mock auth to return user but no token
    const mockAuth = require('@/lib/auth').auth;
    mockAuth.mockResolvedValue({
      user: { id: 'user-123' },
      // No accessToken
    });
    
    const result = await requestReview({
      owner: 'test',
      repo: 'repo',
      pullNumber: 123,
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('No GitHub access token found.');
  });
  
  it('should handle errors when fetching PR details', async () => {
    // Setup mocks
    const mockAuth = require('@/lib/auth').auth;
    mockAuth.mockResolvedValue({
      user: { id: 'user-123' },
      accessToken: 'github-token-123',
    });
    
    const mockGitHubClient = require('@/lib/github/api').GitHubClient;
    mockGitHubClient.mockImplementation(() => ({
      getPullRequest: jest.fn().mockRejectedValue(new Error('PR not found')),
    }));
    
    // Call the function
    const result = await requestReview({
      owner: 'test',
      repo: 'repo',
      pullNumber: 123,
    });
    
    // Verify error handling
    expect(result.success).toBe(false);
    expect(result.error).toContain('Could not fetch pull request details');
  });
  
  it('should handle errors from createCodeReviewForPR', async () => {
    // Setup mocks
    const mockAuth = require('@/lib/auth').auth;
    mockAuth.mockResolvedValue({
      user: { id: 'user-123' },
      accessToken: 'github-token-123',
    });
    
    const mockGitHubClient = require('@/lib/github/api').GitHubClient;
    mockGitHubClient.mockImplementation(() => ({
      getPullRequest: jest.fn().mockResolvedValue({
        id: 'pr-123',
        number: 123,
        title: 'Test PR',
        body: 'PR description',
        state: 'open',
        user: {
          login: 'testuser',
        },
      }),
    }));
    
    const mockCreateCodeReview = require('@/lib/ai/pr-review-integration').createCodeReviewForPR;
    mockCreateCodeReview.mockResolvedValue({
      success: false,
      error: 'Repository not found in database',
    });
    
    // Call the function
    const result = await requestReview({
      owner: 'test',
      repo: 'repo',
      pullNumber: 123,
    });
    
    // Verify error handling
    expect(result.success).toBe(false);
    expect(result.error).toBe('Repository not found in database');
  });
}); 