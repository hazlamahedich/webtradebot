import { ChatOpenAI } from "@langchain/openai";

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