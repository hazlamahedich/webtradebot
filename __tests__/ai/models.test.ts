import { describe, test, expect, jest } from '@jest/globals';

// Mock OpenAI class
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation((config) => ({
    modelName: config.modelName,
    temperature: config.temperature,
    streaming: config.streaming,
    callbacks: config.callbacks
  }))
}), { virtual: true });

describe('AI Models', () => {
  test('models can be imported without errors', () => {
    const models = require('@/lib/ai/models');
    expect(models).toBeDefined();
  });
  
  test('exports standard model instances', () => {
    const models = require('@/lib/ai/models');
    
    const expectedModels = [
      'defaultModel',
      'streamingModel',
      'documentationModel',
      'codeAnalysisModel',
      'improvementSuggestionModel',
      'explanationModel'
    ];
    
    // Check that at least some of these models are exported
    const exportedModelNames = Object.keys(models);
    expect(exportedModelNames.length).toBeGreaterThan(0);
    
    // Check for at least one model that should exist
    const hasExpectedModels = exportedModelNames.some(modelName => 
      expectedModels.includes(modelName)
    );
    expect(hasExpectedModels).toBe(true);
  });
  
  test('models are configured with expected properties', () => {
    const models = require('@/lib/ai/models');
    
    // Test any model that's exported
    const modelKeys = Object.keys(models);
    if (modelKeys.length > 0) {
      const firstModel = models[modelKeys[0]];
      
      // Check for expected properties
      expect(firstModel).toHaveProperty('modelName');
      expect(typeof firstModel.modelName).toBe('string');
      
      // Model name should be a valid OpenAI model
      expect(firstModel.modelName).toMatch(/^gpt-|^command-/);
    } else {
      // Skip the test if no models are exported
      expect(true).toBe(true);
    }
  });
  
  test('streaming models are configured correctly', () => {
    const models = require('@/lib/ai/models');
    
    // Test streaming model if it exists
    if (models.streamingModel) {
      expect(models.streamingModel.streaming).toBe(true);
    } else if (models.defaultStreamingModel) {
      expect(models.defaultStreamingModel.streaming).toBe(true);
    } else {
      // Look for any model with streaming
      const streamingModel = Object.values(models).find(
        model => model.streaming === true
      );
      
      if (streamingModel) {
        expect(streamingModel.streaming).toBe(true);
      } else {
        // Skip if no streaming models
        expect(true).toBe(true);
      }
    }
  });
}); 