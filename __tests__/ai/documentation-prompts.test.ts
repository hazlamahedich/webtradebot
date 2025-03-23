import { describe, test, expect } from '@jest/globals';

describe('Documentation Prompts', () => {
  test('prompts can be imported without errors', () => {
    const { documentationPrompts } = require('@/lib/ai/documentation-prompts');
    expect(documentationPrompts).toBeDefined();
  });
  
  test('exports expected prompts', () => {
    const { documentationPrompts } = require('@/lib/ai/documentation-prompts');
    
    const expectedPrompts = [
      'codeAnalysisPrompt',
      'documentationGenerationPrompt',
      'qualityAssessmentPrompt',
      'missingDocsPrompt',
      'diagramGenerationPrompt'
    ];
    
    // Check that at least some of these prompts are exported
    const exportedPromptNames = Object.keys(documentationPrompts);
    expect(exportedPromptNames.length).toBeGreaterThan(0);
    
    // Check for the expected prompts
    expectedPrompts.forEach(promptName => {
      expect(documentationPrompts).toHaveProperty(promptName);
    });
  });
  
  test('prompts have expected structure', () => {
    const { documentationPrompts } = require('@/lib/ai/documentation-prompts');
    
    // Check each prompt structure
    Object.values(documentationPrompts).forEach(prompt => {
      // Check for PromptTemplate structure
      expect(prompt).toHaveProperty('template');
      expect(typeof prompt.template).toBe('string');
      expect(typeof prompt.format).toBe('function');
    });
  });
  
  test('prompts contain expected instructions', () => {
    const { documentationPrompts } = require('@/lib/ai/documentation-prompts');
    
    // Check content of specific prompts
    expect(documentationPrompts.codeAnalysisPrompt.template).toContain('code analyzer');
    expect(documentationPrompts.documentationGenerationPrompt.template).toContain('documentation writer');
    expect(documentationPrompts.qualityAssessmentPrompt.template).toContain('quality assessment');
    expect(documentationPrompts.missingDocsPrompt.template).toContain('gap analyzer');
    expect(documentationPrompts.diagramGenerationPrompt.template).toContain('diagram');
  });
}); 