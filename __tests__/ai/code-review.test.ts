import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock database
jest.mock('@/lib/supabase/db', () => ({
  db: {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ success: true } as any)
  },
  reviews: {}
}));

// Mock GitHub API
jest.mock('@/lib/github/api', () => ({
  GitHubClient: jest.fn().mockImplementation(() => ({
    getPullRequest: jest.fn().mockResolvedValue({
      title: 'Test PR',
      description: 'Test description'
    } as any),
    getPullRequestFiles: jest.fn().mockResolvedValue([] as any)
  }))
}));

// Mock the LangGraph/LangChain classes
jest.mock('@langchain/langgraph', () => ({
  StateGraph: jest.fn().mockImplementation(() => ({
    addNode: jest.fn().mockReturnThis(),
    addEdge: jest.fn().mockReturnThis(),
    setEntryPoint: jest.fn().mockReturnThis(),
    compile: jest.fn().mockReturnValue({
      invoke: jest.fn().mockResolvedValue({} as any)
    })
  }))
}));

jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({} as any))
}));

describe('Code Review Module', () => {
  test('module can be imported without errors', () => {
    // Using dynamic import to avoid the identifier conflict
    jest.isolateModules(() => {
      const codeReview = require('@/lib/ai/code-review');
      expect(codeReview).toBeDefined();
      expect(typeof codeReview.startCodeReviewFlow).toBe('function');
      expect(typeof codeReview.executeCodeReview).toBe('function');
    });
  });

  test('startCodeReviewFlow handles success case', async () => {
    jest.isolateModules(async () => {
      const mockDb = require('@/lib/supabase/db').db;
      mockDb.execute.mockResolvedValueOnce({ success: true } as any);
      
      const codeReview = require('@/lib/ai/code-review');
      
      const result = await codeReview.startCodeReviewFlow({
        reviewId: 'test-review-id',
        owner: 'test-owner',
        repo: 'test-repo',
        pullNumber: 123
      });
      
      expect(result).toHaveProperty('success');
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  test('executeCodeReview processes a code review', async () => {
    jest.isolateModules(async () => {
      const codeReview = require('@/lib/ai/code-review');
      
      const result = await codeReview.executeCodeReview(
        'test-owner',
        'test-repo',
        123,
        'Test PR',
        'Test description',
        'diff content'
      );
      
      expect(result).toBeDefined();
    });
  });
}); 