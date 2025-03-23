import { RunnableSequence } from "@langchain/core/runnables";
import { StateGraph } from "@langchain/langgraph";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import { db } from "@/lib/supabase/db";
import { ChatOpenAI } from "@langchain/openai";
import { 
  codeAnalysisModel, 
  improvementSuggestionModel, 
  explanationModel 
} from "./models";
import { 
  codeAnalysisPrompt, 
  improvementSuggestionPrompt, 
  explanationPrompt, 
  summaryPrompt 
} from "./prompts";
import { GitHubClient } from "@/lib/github/api";
import { 
  CodeReviewRequest, 
  CodeAnalysisResult, 
  ImprovementSuggestion, 
  CodeExplanation, 
  ReviewSummary,
  CodeReviewResult,
  PullRequestDetails,
  CodeChange
} from "./types";
import { reviews } from "@/lib/supabase/schema";
import { reviewStatusEnum } from "@/lib/supabase/schema";

// Define the types for our workflow states
interface CodeReviewState {
  owner: string;
  repo: string;
  pullNumber: number;
  pullRequest: {
    title: string;
    description: string;
    base: string;
    head: string;
  };
  codeChanges: CodeChange[];
  analysis: CodeReviewAnalysis | null;
  result: CodeReviewResult | null;
}

// Define the types for code changes
interface CodeChange {
  filename: string;
  patch: string;
  // Add other properties as needed
}

// Define the types for code review analysis
interface CodeReviewAnalysis {
  // Define the structure of the analysis here
  issues: CodeIssue[];
}

interface CodeIssue {
  file: string;
  line?: number;
  severity: "critical" | "major" | "minor" | "suggestion";
  description: string;
  suggestion?: string;
}

// Define the types for the final review result
interface CodeReviewResult {
  summary: string;
  issues: CodeIssue[];
}

// Create processing flow
export async function createCodeReviewGraph() {
  // Model definition
  const model = new ChatOpenAI({
    modelName: "gpt-4-turbo-preview",
    temperature: 0,
  });

  // Analyze the code changes
  const analyzeCode = async (state: CodeReviewState) => {
    console.log("Analyzing code...");
    const { codeChanges, pullRequest } = state;
    
    // Implementation details for code analysis
    // For now, this is just a placeholder
    
    return {
      issues: []
    };
  };

  // Generate the final review from the analysis
  const generateFinalReview = async (state: CodeReviewState) => {
    console.log("Generating final review...");
    const { analysis, pullRequest } = state;
    
    // Implementation details for generating the final review
    // For now, this is just a placeholder
    
    return {
      summary: "Code review completed",
      issues: analysis?.issues || []
    };
  };

  // Create the workflow
  const workflow = new StateGraph<CodeReviewState>({
    channels: {
      owner: { value: (x) => x },
      repo: { value: (x) => x },
      pullNumber: { value: (x) => x },
      pullRequest: { value: (x) => x },
      codeChanges: { value: (x) => x },
      analysis: { value: (x) => x },
      result: { value: (x) => x }
    }
  });

  // Add nodes to our workflow
  workflow.addNode("analyze_code", analyzeCode);
  workflow.addNode("generate_final_review", generateFinalReview);

  // Set up the edges for flow control
  workflow.addEdge("analyze_code", "generate_final_review");
  workflow.setEntryPoint("analyze_code");

  // Compile the workflow
  const compiledWorkflow = workflow.compile();
  
  return compiledWorkflow;
}

// Interface for executing a code review
export async function executeCodeReview(owner: string, repo: string, pr_number: number, pr_title: string, pr_description: string, code_diff: string) {
  try {
    // Parse the code diff into code changes
    const codeChanges = parseCodeDiff(code_diff);
    
    // Set up the initial state
    const initialState: CodeReviewState = {
      owner,
      repo,
      pullNumber: pr_number,
      pullRequest: {
        title: pr_title,
        description: pr_description,
        base: "",
        head: ""
      },
      codeChanges,
      analysis: null,
      result: null
    };
    
    // Create and run the workflow
    const workflow = await createCodeReviewGraph();
    const result = await workflow.invoke(initialState);
    
    return result;
  } catch (error) {
    console.error("Error in code review:", error);
    throw error;
  }
}

// Helper function to parse code diff
function parseCodeDiff(codeDiff: string): CodeChange[] {
  // Implementation details for parsing the code diff
  // For now, return an empty array
  return [];
}

// Create LangGraph for code review
const createCodeReviewGraph = async (requestData: CodeReviewRequest) => {
  const { reviewId, owner, repo, pullNumber } = requestData;
  
  // Update review status to in_progress
  await db
    .update(reviews)
    .set({ 
      status: reviewStatusEnum.in_progress,
      updatedAt: new Date()
    })
    .where((r) => r.id.equals(reviewId));

  const graph = new StateGraph({
    channels: {
      state: CodeReviewState,
    },
  });

  // Initialize state
  graph.addNode("initialize", {
    run: async () => {
      return {
        reviewId,
        owner,
        repo,
        pullNumber,
        pullRequest: null,
        codeChanges: [],
        analysis: null,
        result: null,
      };
    },
  });

  // Fetch PR details and code changes
  graph.addNode("fetchPRData", {
    run: async (state) => {
      try {
        const { owner, repo, pullNumber } = state;
        // Get GitHub access token from session or config
        const accessToken = process.env.GITHUB_ACCESS_TOKEN as string;
        const githubClient = new GitHubClient(accessToken);
        
        // Fetch PR details
        const pullRequest = await githubClient.getPullRequest(owner, repo, pullNumber);
        
        // Fetch PR files
        const files = await githubClient.getPullRequestFiles(owner, repo, pullNumber);
        
        return {
          ...state,
          pullRequest,
          codeChanges: files,
        };
      } catch (error) {
        console.error("Error fetching PR data:", error);
        return {
          ...state,
          error: `Failed to fetch PR data: ${(error as Error).message}`,
        };
      }
    },
  });

  // Analyze code changes
  graph.addNode("analyzeCode", {
    run: async (state) => {
      try {
        const { pullRequest, codeChanges } = state;
        if (!pullRequest || codeChanges.length === 0) {
          throw new Error("Missing PR data or code changes");
        }

        // Prepare data for analysis
        const pr = pullRequest as PullRequestDetails;
        const changes = codeChanges as CodeChange[];
        
        // Create code diff text for analysis
        const codeDiff = changes
          .map((file) => `File: ${file.filename}\n${file.patch || "Binary file changed"}`)
          .join("\n\n");

        // Run code analysis with LLM
        const analysisChain = RunnableSequence.from([
          codeAnalysisPrompt,
          codeAnalysisModel,
          StructuredOutputParser.fromZodSchema(CodeAnalysisResultSchema),
        ]);

        const analysis = await analysisChain.invoke({
          repo_name: pr.base.repo.full_name,
          pr_number: pr.number,
          pr_title: pr.title,
          pr_description: pr.body || "No description provided",
          code_diff: codeDiff,
        });

        return {
          ...state,
          analysis,
        };
      } catch (error) {
        console.error("Error analyzing code:", error);
        return {
          ...state,
          error: `Failed to analyze code: ${(error as Error).message}`,
        };
      }
    },
  });

  // Generate improvement suggestions
  graph.addNode("generateSuggestions", {
    run: async (state) => {
      try {
        const { pullRequest, codeChanges, analysis } = state;
        if (!analysis) {
          throw new Error("Missing code analysis");
        }

        // Prepare data for suggestions
        const pr = pullRequest as PullRequestDetails;
        const changes = codeChanges as CodeChange[];
        
        // Create code diff text
        const codeDiff = changes
          .map((file) => `File: ${file.filename}\n${file.patch || "Binary file changed"}`)
          .join("\n\n");

        // Run improvement suggestion with LLM
        const suggestionChain = RunnableSequence.from([
          improvementSuggestionPrompt,
          improvementSuggestionModel,
          StructuredOutputParser.fromZodSchema(ImprovementSuggestionsSchema),
        ]);

        const suggestions = await suggestionChain.invoke({
          code_analysis: JSON.stringify(analysis),
          code_diff: codeDiff,
        });

        return {
          ...state,
          suggestions,
        };
      } catch (error) {
        console.error("Error generating suggestions:", error);
        return {
          ...state,
          error: `Failed to generate suggestions: ${(error as Error).message}`,
        };
      }
    },
  });

  // Generate plain English explanation
  graph.addNode("generateExplanation", {
    run: async (state) => {
      try {
        const { codeChanges } = state;
        if (codeChanges.length === 0) {
          throw new Error("Missing code changes");
        }

        // Prepare data for explanation
        const changes = codeChanges as CodeChange[];
        
        // Create code diff text
        const codeDiff = changes
          .map((file) => `File: ${file.filename}\n${file.patch || "Binary file changed"}`)
          .join("\n\n");

        // Run explanation with LLM
        const explanationChain = RunnableSequence.from([
          explanationPrompt,
          explanationModel,
          StructuredOutputParser.fromZodSchema(CodeExplanationSchema),
        ]);

        const explanation = await explanationChain.invoke({
          code_diff: codeDiff,
        });

        return {
          ...state,
          explanation,
        };
      } catch (error) {
        console.error("Error generating explanation:", error);
        return {
          ...state,
          error: `Failed to generate explanation: ${(error as Error).message}`,
        };
      }
    },
  });

  // Generate summary
  graph.addNode("generateSummary", {
    run: async (state) => {
      try {
        const { pullRequest, analysis, suggestions, codeChanges } = state;
        if (!analysis || !suggestions) {
          throw new Error("Missing analysis or suggestions");
        }

        // Prepare data for summary
        const pr = pullRequest as PullRequestDetails;
        const changes = codeChanges as CodeChange[];
        
        // Run summary with LLM
        const summaryChain = RunnableSequence.from([
          summaryPrompt,
          codeAnalysisModel,
          StructuredOutputParser.fromZodSchema(ReviewSummarySchema),
        ]);

        const summary = await summaryChain.invoke({
          pr_number: pr.number,
          pr_title: pr.title,
          files_changed: changes.length,
          additions: pr.additions,
          deletions: pr.deletions,
          code_analysis: JSON.stringify(analysis),
          improvement_suggestions: JSON.stringify(suggestions),
        });

        return {
          ...state,
          summary,
        };
      } catch (error) {
        console.error("Error generating summary:", error);
        return {
          ...state,
          error: `Failed to generate summary: ${(error as Error).message}`,
        };
      }
    },
  });

  // Store results in database
  graph.addNode("storeResults", {
    run: async (state) => {
      try {
        const { reviewId, analysis, suggestions, explanation, summary, error } = state;
        
        if (error) {
          // Update review status to failed
          await db
            .update(reviews)
            .set({ 
              status: reviewStatusEnum.failed,
              updatedAt: new Date(),
              error: error
            })
            .where((r) => r.id.equals(reviewId));
          return state;
        }

        // Store complete review results
        const reviewResult: CodeReviewResult = {
          analysis,
          suggestions,
          explanation,
          summary,
        };

        // Update review status to completed
        await db
          .update(reviews)
          .set({ 
            status: reviewStatusEnum.completed,
            updatedAt: new Date(),
            result: reviewResult
          })
          .where((r) => r.id.equals(reviewId));

        return state;
      } catch (error) {
        console.error("Error storing results:", error);
        
        // Update review status to failed
        await db
          .update(reviews)
          .set({ 
            status: reviewStatusEnum.failed,
            updatedAt: new Date(),
            error: `Failed to store results: ${(error as Error).message}`
          })
          .where((r) => r.id.equals(state.reviewId));
          
        return {
          ...state,
          error: `Failed to store results: ${(error as Error).message}`,
        };
      }
    },
  });

  // Define the workflow edges
  graph.addEdge("initialize", "fetchPRData");
  graph.addEdge("fetchPRData", "analyzeCode");
  graph.addEdge("analyzeCode", "generateSuggestions");
  graph.addEdge("generateSuggestions", "generateExplanation");
  graph.addEdge("generateExplanation", "generateSummary");
  graph.addEdge("generateSummary", "storeResults");

  // Error handling
  graph.addEdge({
    from: "fetchPRData",
    to: "storeResults",
    condition: (state) => !!state.error,
  });
  graph.addEdge({
    from: "analyzeCode",
    to: "storeResults",
    condition: (state) => !!state.error,
  });
  graph.addEdge({
    from: "generateSuggestions",
    to: "storeResults",
    condition: (state) => !!state.error,
  });
  graph.addEdge({
    from: "generateExplanation",
    to: "storeResults",
    condition: (state) => !!state.error,
  });
  graph.addEdge({
    from: "generateSummary",
    to: "storeResults",
    condition: (state) => !!state.error,
  });

  return graph.compile();
};

// Helper function to start code review workflow
export async function startCodeReviewFlow(requestData: CodeReviewRequest) {
  try {
    console.log(`Starting code review for PR #${requestData.pullNumber}`);
    
    const workflow = await createCodeReviewGraph(requestData);
    // Run the workflow asynchronously
    workflow.run({ state: {} });
    
    return { success: true, reviewId: requestData.reviewId };
  } catch (error) {
    console.error("Error starting code review workflow:", error);
    
    // Update review status to failed
    await db
      .update(reviews)
      .set({ 
        status: reviewStatusEnum.failed,
        updatedAt: new Date(),
        error: `Workflow error: ${(error as Error).message}`
      })
      .where((r) => r.id.equals(requestData.reviewId));
      
    return { success: false, error: (error as Error).message };
  }
}

// Zod schemas for structured output parsing
const CodeAnalysisResultSchema = z.object({
  bugs: z.array(z.object({
    description: z.string(),
    location: z.string(),
    severity: z.enum(["high", "medium", "low"]),
  })),
  codeQuality: z.array(z.object({
    description: z.string(),
    location: z.string(),
    impact: z.string(),
  })),
  performance: z.array(z.object({
    description: z.string(),
    location: z.string(),
    impact: z.string(),
  })),
  security: z.array(z.object({
    description: z.string(),
    location: z.string(),
    severity: z.enum(["high", "medium", "low"]),
  })),
  architecture: z.array(z.object({
    description: z.string(),
    impact: z.string(),
  })),
});

const ImprovementSuggestionsSchema = z.array(z.object({
  target: z.string(),
  description: z.string(),
  rationale: z.string(),
  codeExample: z.string().optional(),
  location: z.string().optional(),
}));

const CodeExplanationSchema = z.object({
  summary: z.string(),
  functionalChanges: z.string(),
  impact: z.string(),
  technicalDecisions: z.string(),
  architecturalContext: z.string(),
});

const ReviewSummarySchema = z.object({
  overview: z.string(),
  keyPoints: z.array(z.string()),
  qualityAssessment: z.string(),
  suggestedReviewers: z.array(z.string()).optional(),
}); 