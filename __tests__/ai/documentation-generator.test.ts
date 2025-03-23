import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import * as documentationPrompts from '@/lib/ai/documentation-prompts';

// Mock database operations
jest.mock('@/lib/supabase/db', () => ({
  db: {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockResolvedValue([{ 
      id: 'doc-123', 
      repository_id: 'repo-123',
      status: 'pending',
      owner: 'testOwner',
      repo: 'testRepo',
      branch: 'main'
    }]),
    execute: jest.fn().mockResolvedValue([{ id: 'doc-123' }])
  },
  eq: jest.fn(),
  documentationRequests: { id: 'column' }
}));

// Create mocks for our functions to test
const mockProcessFetchAndParse = jest.fn().mockResolvedValue({
  success: true,
  files: ['file1.ts', 'file2.ts'],
  components: [{ name: 'Component1', path: 'src/Component1.tsx' }],
  metadata: {
    totalFiles: 2,
    processingTime: 100,
    fileTypes: { ts: 1, tsx: 1 }
  }
});

// Mock any other dependencies
jest.mock('@/lib/github/api', () => ({
  getRepositoryFiles: jest.fn().mockResolvedValue(['file1.ts', 'file2.ts']),
  getFileContent: jest.fn().mockResolvedValue('console.log("test");')
}));

// Mock LangChain
jest.mock('@langchain/core/runnables', () => ({
  RunnableSequence: {
    from: jest.fn().mockReturnValue({
      invoke: jest.fn().mockResolvedValue({
        content: 'Mock documentation content',
        components: [{ name: 'Component1', description: 'Test component' }]
      })
    })
  }
}));

describe('Documentation Generator', () => {
  let docGenerator;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      const originalModule = jest.requireActual('@/lib/ai/documentation-generator');
      docGenerator = {
        ...originalModule,
        processFetchAndParse: mockProcessFetchAndParse
      };
    });
  });

  test('module can be imported without errors', () => {
    expect(docGenerator).toBeDefined();
  });
  
  test('startDocumentationGeneration retrieves documentation request from database', async () => {
    const mockDbSelect = require('@/lib/supabase/db').db.select;
    const result = await docGenerator.startDocumentationGeneration({
      documentationId: 'doc-123',
      repositoryId: 'repo-123',
      owner: 'testOwner',
      repo: 'testRepo',
      branch: 'main',
      filePaths: ['file1.ts'],
      userId: 'user-123'
    });
    
    expect(mockDbSelect).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });
  
  test('processDocumentationChunk processes files in chunks', async () => {
    const result = await docGenerator.processDocumentationChunk({
      documentationId: 'doc-123',
      startIndex: 0,
      endIndex: 2,
      totalFiles: 10,
      chunkSize: 2,
      chunkIndex: 0,
      totalChunks: 5
    });
    
    expect(mockProcessFetchAndParse).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });
  
  test('handles errors in startDocumentationGeneration', async () => {
    const mockDbSelect = require('@/lib/supabase/db').db.select;
    mockDbSelect.mockRejectedValueOnce(new Error('Database error'));
    
    const result = await docGenerator.startDocumentationGeneration({
      documentationId: 'doc-123',
      repositoryId: 'repo-123',
      owner: 'testOwner',
      repo: 'testRepo',
      branch: 'main',
      filePaths: ['file1.ts'],
      userId: 'user-123'
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Error');
  });
  
  test('handles errors in processDocumentationChunk', async () => {
    mockProcessFetchAndParse.mockRejectedValueOnce(new Error('Processing error'));
    
    const result = await docGenerator.processDocumentationChunk({
      documentationId: 'doc-123',
      startIndex: 0,
      endIndex: 2,
      totalFiles: 10,
      chunkSize: 2,
      chunkIndex: 0,
      totalChunks: 5
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Error');
  });
  
  test('handles large repositories by chunking', async () => {
    const largeMockFiles = Array(505).fill().map((_, i) => `file${i}.ts`);
    mockProcessFetchAndParse.mockResolvedValueOnce({
      success: true,
      files: largeMockFiles,
      components: [],
      metadata: {
        totalFiles: largeMockFiles.length,
        processingTime: 500,
        fileTypes: { ts: largeMockFiles.length }
      }
    });
    
    const result = await docGenerator.processDocumentationChunk({
      documentationId: 'doc-123',
      startIndex: 0,
      endIndex: 100,
      totalFiles: 505,
      chunkSize: 100,
      chunkIndex: 0,
      totalChunks: 6
    });
    
    expect(result).toEqual({ success: true });
  });
}); 