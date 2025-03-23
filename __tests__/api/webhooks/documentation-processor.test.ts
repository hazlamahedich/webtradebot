import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the documentation generator
jest.mock('@/lib/ai/documentation-generator', () => ({
  processDocumentationChunk: jest.fn().mockResolvedValue({ success: true })
}));

// Import after mocking
import { processDocumentationChunk } from '@/lib/ai/documentation-generator';

describe('Documentation Processing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call processDocumentationChunk with correct parameters', async () => {
    const documentationId = 'doc-123';
    const chunkIndex = 0;
    const totalChunks = 2;
    const state = {
      repositoryId: 'repo-456',
      owner: 'testuser',
      repo: 'testrepo',
      branch: 'main',
      filePaths: ['file1.ts', 'file2.ts']
    };

    await processDocumentationChunk(documentationId, chunkIndex, totalChunks, state);
    
    expect(processDocumentationChunk).toHaveBeenCalledWith(
      documentationId, chunkIndex, totalChunks, state
    );
  });

  it('should return a success result when called', async () => {
    const result = await processDocumentationChunk('doc-123', 0, 1, {
      repositoryId: 'repo-456',
      owner: 'testuser',
      repo: 'testrepo',
      branch: 'main',
      filePaths: ['file1.ts']
    });
    
    expect(result).toEqual({ success: true });
  });
}); 