import { ChatOpenAI } from "@langchain/openai";
import { createLangChainModel } from "./llm-provider";

// Advanced model for code analysis - requires deep understanding of code patterns and potential issues
export const codeAnalysisModel = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0.1,
  maxTokens: 4000,
  streaming: true,
  callbacks: [
    {
      handleLLMStart: async () => {
        console.log("Starting code analysis...");
      },
      handleLLMEnd: async () => {
        console.log("Code analysis completed");
      },
    },
  ],
});

// Edge-optimized model for code analysis with reduced context
export const edgeCodeAnalysisModel = new ChatOpenAI({
  modelName: "gpt-4o-mini", // Smaller model
  temperature: 0.1,
  maxTokens: 2000, // Reduced token count
  streaming: true,
  callbacks: [
    {
      handleLLMStart: async () => {
        console.log("Starting edge code analysis...");
      },
      handleLLMEnd: async () => {
        console.log("Edge code analysis completed");
      },
    },
  ],
});

// Factory function to create models via LiteLLM provider
export async function createCodeAnalysisModel(options = {}) {
  return await createLangChainModel({
    modelName: "gpt-4o",
    temperature: 0.1,
    maxTokens: 4000,
    streaming: true,
    callbacks: [
      {
        handleLLMStart: async () => {
          console.log("Starting code analysis with LiteLLM...");
        },
        handleLLMEnd: async () => {
          console.log("Code analysis with LiteLLM completed");
        },
      },
    ],
    ...options
  });
}

// Factory function to create edge models via LiteLLM provider
export async function createEdgeCodeAnalysisModel(options = {}) {
  return await createLangChainModel({
    modelName: "gpt-4o-mini", // Smaller model
    temperature: 0.1,
    maxTokens: 2000, // Reduced token count
    streaming: true,
    callbacks: [
      {
        handleLLMStart: async () => {
          console.log("Starting edge code analysis with LiteLLM...");
        },
        handleLLMEnd: async () => {
          console.log("Edge code analysis with LiteLLM completed");
        },
      },
    ],
    ...options
  });
}

// Model for generating improvement suggestions - needs to be precise and actionable
export const improvementSuggestionModel = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0.2,
  maxTokens: 3500,
  streaming: true
});

// Edge-optimized model for suggestions
export const edgeImprovementModel = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.2,
  maxTokens: 1800,
  streaming: true
});

// Model for generating explanations - needs to be clear and user-friendly
export const explanationModel = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0.5,
  maxTokens: 2500,
  streaming: true
});

// Edge-optimized model for explanations
export const edgeExplanationModel = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.5,
  maxTokens: 1500,
  streaming: true
});

// Factory function for explanation models via LiteLLM
export async function createExplanationModel(options = {}) {
  return await createLangChainModel({
    modelName: "gpt-4o",
    temperature: 0.5,
    maxTokens: 2500,
    streaming: true,
    ...options
  });
}

// Factory function for edge explanation models via LiteLLM
export async function createEdgeExplanationModel(options = {}) {
  return await createLangChainModel({
    modelName: "gpt-4o-mini",
    temperature: 0.5,
    maxTokens: 1500,
    streaming: true,
    ...options
  });
}

// Model for generating summaries - needs to be concise but comprehensive
export const summaryModel = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0.3,
  maxTokens: 2000,
  streaming: true
});

// Edge-optimized model for summaries
export const edgeSummaryModel = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.3,
  maxTokens: 1200,
  streaming: true
});

// Factory function for summary models via LiteLLM
export async function createSummaryModel(options = {}) {
  return await createLangChainModel({
    modelName: "gpt-4o",
    temperature: 0.3,
    maxTokens: 2000,
    streaming: true,
    ...options
  });
}

// Factory function for edge summary models via LiteLLM
export async function createEdgeSummaryModel(options = {}) {
  return await createLangChainModel({
    modelName: "gpt-4o-mini",
    temperature: 0.3,
    maxTokens: 1200,
    streaming: true,
    ...options
  });
}

// Model for categorizing issues by severity and type
export const categorizeModel = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0.1,
  maxTokens: 1500,
  streaming: true
});

// Edge-optimized model for categorization
export const edgeCategorizeModel = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.1,
  maxTokens: 800,
  streaming: true
});

// Helper function to choose the right model based on environment
export const getOptimizedModel = (modelType: 'analysis' | 'improvement' | 'explanation' | 'summary' | 'categorize', isEdge = false) => {
  if (isEdge) {
    switch (modelType) {
      case 'analysis':
        return edgeCodeAnalysisModel;
      case 'improvement':
        return edgeImprovementModel;
      case 'explanation':
        return edgeExplanationModel;
      case 'summary':
        return edgeSummaryModel;
      case 'categorize':
        return edgeCategorizeModel;
    }
  } else {
    switch (modelType) {
      case 'analysis':
        return codeAnalysisModel;
      case 'improvement':
        return improvementSuggestionModel;
      case 'explanation':
        return explanationModel;
      case 'summary':
        return summaryModel;
      case 'categorize':
        return categorizeModel;
    }
  }
};

// For more complex code reviews that require deeper understanding
export const advancedReviewModel = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0.1,
  maxTokens: 8000,
}); 