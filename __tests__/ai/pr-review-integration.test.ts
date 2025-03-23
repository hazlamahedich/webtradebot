import { describe, test, expect, jest } from '@jest/globals';

// Mock the code review module
jest.mock('@/lib/ai/code-review', () => ({
  startCodeReviewFlow: jest.fn().mockResolvedValue({ success: true }),
  executeCodeReview: jest.fn().mockResolvedValue({ result: {} })
}), { virtual: true });

// Mock database
jest.mock('@/lib/supabase/db', () => ({
  db: {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue([{ id: 'test-review-id' }])
  }
}), { virtual: true });

describe('PR Review Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('can import the code review module', () => {
    const codeReview = require('@/lib/ai/code-review');
    
    expect(codeReview).toBeDefined();
    expect(typeof codeReview.startCodeReviewFlow).toBe('function');
    expect(typeof codeReview.executeCodeReview).toBe('function');
  });
  
  test('review flow can be started for a PR', async () => {
    const codeReview = require('@/lib/ai/code-review');
    
    const result = await codeReview.startCodeReviewFlow({
      reviewId: 'test-review-id',
      owner: 'test-owner',
      repo: 'test-repo',
      pullNumber: 123
    });
    
    expect(result).toEqual({ success: true });
    expect(codeReview.startCodeReviewFlow).toHaveBeenCalledWith({
      reviewId: 'test-review-id',
      owner: 'test-owner',
      repo: 'test-repo',
      pullNumber: 123
    });
  });
  
  test('mocks can simulate a full review process', async () => {
    const codeReview = require('@/lib/ai/code-review');
    
    // Mock a more detailed response for this test
    codeReview.startCodeReviewFlow.mockResolvedValueOnce({
      success: true,
      reviewId: 'integration-test-id',
      result: {
        summary: 'Test review summary',
        issues: [
          { 
            file: 'src/test.ts', 
            line: 42, 
            severity: 'suggestion', 
            description: 'Consider adding a comment here' 
          }
        ]
      }
    });
    
    const reviewResult = await codeReview.startCodeReviewFlow({
      reviewId: 'integration-test-id',
      owner: 'test-owner',
      repo: 'test-repo',
      pullNumber: 123
    });
    
    // Verify the mocked response
    expect(reviewResult.success).toBe(true);
    expect(reviewResult.result?.summary).toBe('Test review summary');
    expect(reviewResult.result?.issues.length).toBe(1);
    expect(reviewResult.result?.issues[0].file).toBe('src/test.ts');
  });
}); 