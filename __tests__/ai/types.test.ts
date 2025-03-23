import { describe, test, expect } from '@jest/globals';

// Simple test to verify module structure
describe('AI Types', () => {
  test('module can be imported without errors', () => {
    expect(() => {
      // This just verifies the module can be imported
      require('@/lib/ai/types');
    }).not.toThrow();
  });
}); 