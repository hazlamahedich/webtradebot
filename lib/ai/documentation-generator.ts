import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { StateGraph } from "langchain/graphs";
import { defineState } from "langchain/graphs";
import { z } from "zod";
import { codeAnalysisModel } from "./models";
import { documentationPrompts } from "./documentation-prompts";
import {
  CodeAnalysisForDocs,
  ComponentDocumentation,
  Documentation,
  DocumentationDiagram,
  DocumentationRequest as DocRequest,
  DocumentationResult as DocResult,
  MissingDocumentation,
  QualityAssessment
} from "./types";

// Define workflow state for documentation generation
const DocumentationState = defineState({
  repositoryId: "string",
  owner: "string",
  repo: "string",
  branch: "string",
  filePaths: "array",
  codeContent: "array",
  parsedComponents: "object",
  codeAnalysis: "object",
  documentation: "object",
  qualityAssessment: "object",
  missingDocs: "array",
  diagrams: "array",
  error: "string?",
});

// Zod schemas for structured output parsing
const CodeComponentSchema = z.object({
  type: z.enum(["function", "class", "module", "interface", "type", "constant", "variable"]),
  name: z.string(),
  signature: z.string().optional(),
  location: z.object({
    filePath: z.string(),
    startLine: z.number(),
    endLine: z.number(),
  }),
  dependencies: z.array(z.string()).optional(),
  parent: z.string().optional(),
  children: z.array(z.string()).optional(),
  existingDocs: z.string().optional(),
});

const CodeAnalysisSchema = z.object({
  components: z.array(CodeComponentSchema),
  relationships: z.array(z.object({
    source: z.string(),
    target: z.string(),
    type: z.enum(["imports", "extends", "implements", "uses", "contains"]),
  })),
  patterns: z.array(z.object({
    name: z.string(),
    description: z.string(),
    components: z.array(z.string()),
  })),
  architecture: z.object({
    layers: z.array(z.string()),
    modules: z.array(z.string()),
    description: z.string(),
  }),
});

const DocumentationSchema = z.object({
  overview: z.string(),
  components: z.array(z.object({
    componentId: z.string(),
    description: z.string(),
    usage: z.string(),
    parameters: z.array(z.object({
      name: z.string(),
      type: z.string(),
      description: z.string(),
      required: z.boolean(),
    })).optional(),
    returnType: z.string().optional(),
    returnDescription: z.string().optional(),
    examples: z.array(z.string()).optional(),
  })),
  architecture: z.string(),
  usageGuide: z.string(),
  setup: z.string().optional(),
});

const QualityAssessmentSchema = z.object({
  score: z.number(), // 0-100
  coverage: z.number(), // 0-100
  clarity: z.number(), // 0-100
  completeness: z.number(), // 0-100
  consistency: z.number(), // 0-100
  improvements: z.array(z.object({
    componentId: z.string(),
    suggestion: z.string(),
    priority: z.enum(["high", "medium", "low"]),
  })),
});

const MissingDocumentationSchema = z.object({
  componentId: z.string(),
  type: z.string(),
  location: z.object({
    filePath: z.string(),
    startLine: z.number(),
    endLine: z.number(),
  }),
  impact: z.string(),
  severity: z.enum(["critical", "high", "medium", "low"]),
  template: z.string(),
});

/**
 * Creates a documentation generation workflow using LangGraph
 */
export const createDocumentationGraph = async (requestData: {
  repositoryId: string;
  owner: string;
  repo: string;
  branch: string;
  filePaths: string[];
}) => {
  // Initialize the state graph
  const graph = new StateGraph({
    channels: DocumentationState,
  });

  // Initialize state
  graph.addNode("initialize", {
    run: async () => {
      return {
        repositoryId: requestData.repositoryId,
        owner: requestData.owner,
        repo: requestData.repo,
        branch: requestData.branch,
        filePaths: requestData.filePaths,
        codeContent: [],
        parsedComponents: { components: [] },
        codeAnalysis: { components: [], relationships: [], patterns: [], architecture: { layers: [], modules: [], description: "" } },
        documentation: { overview: "", components: [], architecture: "", usageGuide: "", setup: "" },
        qualityAssessment: { score: 0, coverage: 0, clarity: 0, completeness: 0, consistency: 0, improvements: [] },
        missingDocs: [],
        diagrams: [],
      };
    },
  });

  // Fetch code content
  graph.addNode("fetchCode", {
    run: async (state) => {
      try {
        // Here we'd use GitHub API to fetch code content
        // For now, this is a placeholder
        const codeContent: { path: string; content: string }[] = [];
        
        // Simulated code fetching - in a real implementation, we'd use the GitHub API
        for (const path of state.filePaths) {
          // This would be replaced with actual GitHub API calls
          codeContent.push({
            path,
            content: `// Placeholder for ${path} content`,
          });
        }

        return {
          ...state,
          codeContent,
        };
      } catch (error) {
        console.error("Error fetching code:", error);
        return {
          ...state,
          error: `Failed to fetch code: ${(error as Error).message}`,
        };
      }
    },
  });

  // Parse code for components
  graph.addNode("parseCode", {
    run: async (state) => {
      try {
        const { codeContent } = state;
        
        // Use language-specific parsers based on file extensions
        // This would be a more sophisticated implementation in production
        const parsedComponents = {
          components: codeContent.map((file, index) => ({
            type: "module" as const,
            name: file.path.split("/").pop() || "",
            location: {
              filePath: file.path,
              startLine: 1,
              endLine: file.content.split("\n").length,
            },
            existingDocs: "",
          })),
        };

        return {
          ...state,
          parsedComponents,
        };
      } catch (error) {
        console.error("Error parsing code:", error);
        return {
          ...state,
          error: `Failed to parse code: ${(error as Error).message}`,
        };
      }
    },
  });

  // Analyze code structure
  graph.addNode("analyzeCode", {
    run: async (state) => {
      try {
        const { codeContent, parsedComponents } = state;
        
        // Create a prompt for the LLM to analyze the code structure
        const codeString = codeContent
          .map((file) => `File: ${file.path}\n\n${file.content}`)
          .join("\n\n");
        
        // Use the code analysis prompt with the LLM
        const analysisChain = RunnableSequence.from([
          documentationPrompts.codeAnalysisPrompt,
          codeAnalysisModel,
          StructuredOutputParser.fromZodSchema(CodeAnalysisSchema),
        ]);

        const analysis = await analysisChain.invoke({
          code: codeString,
          components: JSON.stringify(parsedComponents.components),
        });

        return {
          ...state,
          codeAnalysis: analysis,
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

  // Generate documentation
  graph.addNode("generateDocumentation", {
    run: async (state) => {
      try {
        const { codeContent, codeAnalysis } = state;
        
        // Use the documentation generation prompt with the LLM
        const documentationChain = RunnableSequence.from([
          documentationPrompts.documentationGenerationPrompt,
          codeAnalysisModel,
          StructuredOutputParser.fromZodSchema(DocumentationSchema),
        ]);

        const documentation = await documentationChain.invoke({
          code: codeContent.map((file) => `File: ${file.path}\n\n${file.content}`).join("\n\n"),
          analysis: JSON.stringify(codeAnalysis),
        });

        return {
          ...state,
          documentation,
        };
      } catch (error) {
        console.error("Error generating documentation:", error);
        return {
          ...state,
          error: `Failed to generate documentation: ${(error as Error).message}`,
        };
      }
    },
  });

  // Assess documentation quality
  graph.addNode("assessQuality", {
    run: async (state) => {
      try {
        const { documentation, codeAnalysis } = state;
        
        // Use the quality assessment prompt with the LLM
        const qualityChain = RunnableSequence.from([
          documentationPrompts.qualityAssessmentPrompt,
          codeAnalysisModel,
          StructuredOutputParser.fromZodSchema(QualityAssessmentSchema),
        ]);

        const qualityAssessment = await qualityChain.invoke({
          documentation: JSON.stringify(documentation),
          analysis: JSON.stringify(codeAnalysis),
        });

        return {
          ...state,
          qualityAssessment,
        };
      } catch (error) {
        console.error("Error assessing documentation quality:", error);
        return {
          ...state,
          error: `Failed to assess documentation quality: ${(error as Error).message}`,
        };
      }
    },
  });

  // Detect missing documentation
  graph.addNode("detectMissingDocs", {
    run: async (state) => {
      try {
        const { codeAnalysis, documentation } = state;
        
        // Create a prompt for the LLM to identify missing documentation
        const missingDocsChain = RunnableSequence.from([
          documentationPrompts.missingDocsPrompt,
          codeAnalysisModel,
          StructuredOutputParser.fromZodSchema(z.array(MissingDocumentationSchema)),
        ]);

        const missingDocs = await missingDocsChain.invoke({
          documentation: JSON.stringify(documentation),
          analysis: JSON.stringify(codeAnalysis),
        });

        return {
          ...state,
          missingDocs,
        };
      } catch (error) {
        console.error("Error detecting missing documentation:", error);
        return {
          ...state,
          error: `Failed to detect missing documentation: ${(error as Error).message}`,
          // Provide empty array to avoid null pointer issues
          missingDocs: [],
        };
      }
    },
  });

  // Generate diagrams
  graph.addNode("generateDiagrams", {
    run: async (state) => {
      try {
        const { codeAnalysis } = state;
        
        // In a real implementation, we would use tools like Mermaid.js or PlantUML
        // to generate diagrams based on code relationships
        
        // For now, we'll just create placeholder text representations
        const classDiagram = `
          classDiagram
          class Example {
            +String data
            +method()
          }
        `;
        
        const componentDiagram = `
          graph TD
          A[Component A] --> B[Component B]
          A --> C[Component C]
          B --> D[Component D]
          C --> D
        `;
        
        const diagrams = [
          { type: "class", content: classDiagram },
          { type: "component", content: componentDiagram },
        ];

        return {
          ...state,
          diagrams,
        };
      } catch (error) {
        console.error("Error generating diagrams:", error);
        return {
          ...state,
          error: `Failed to generate diagrams: ${(error as Error).message}`,
        };
      }
    },
  });

  // Connect the nodes
  graph.addEdge("initialize", "fetchCode");
  graph.addEdge("fetchCode", "parseCode");
  graph.addEdge("parseCode", "analyzeCode");
  graph.addEdge("analyzeCode", "generateDocumentation");
  graph.addEdge("generateDocumentation", "assessQuality");
  graph.addEdge("assessQuality", "detectMissingDocs");
  graph.addEdge("detectMissingDocs", "generateDiagrams");

  // Compile the graph
  const app = await graph.compile();
  
  return app;
};

// Types for the documentation generator
export interface DocumentationRequest {
  repositoryId: string;
  owner: string;
  repo: string;
  branch: string;
  filePaths: string[];
}

export interface DocumentationResult {
  repositoryId: string;
  documentation: Documentation;
  qualityAssessment: QualityAssessment;
  missingDocs: MissingDocumentation[];
  diagrams: DocumentationDiagram[];
  error?: string;
}

// Function to generate documentation - original implementation
export async function generateDocumentation(
  request: DocRequest
): Promise<DocResult> {
  try {
    const app = await createDocumentationGraph(request);
    const result = await app.invoke({
      repositoryId: request.repositoryId,
      owner: request.owner,
      repo: request.repo,
      branch: request.branch,
      filePaths: request.filePaths,
    });

    return {
      repositoryId: result.repositoryId,
      documentation: result.documentation,
      qualityAssessment: result.qualityAssessment,
      missingDocs: result.missingDocs,
      diagrams: result.diagrams,
      error: result.error,
    };
  } catch (error) {
    console.error("Documentation generation error:", error);
    throw new Error(`Failed to generate documentation: ${(error as Error).message}`);
  }
}

// New function: Start documentation generation process - breaks work into chunks
export async function startDocumentationGeneration(
  request: {
    documentationId: string;
    repositoryId: string;
    owner: string;
    repo: string;
    branch: string;
    filePaths: string[];
    userId: string;
  }
): Promise<void> {
  // Create a webhook URL for the documentation processor
  const webhookUrl = new URL("/api/webhooks/documentation-processor", process.env.NEXT_PUBLIC_APP_URL);
  
  // Add the documentationId as a query parameter
  webhookUrl.searchParams.set("id", request.documentationId);
  
  // Trigger the webhook to start the documentation process
  try {
    // Use `fetch` with minimal payload just to trigger the webhook
    await fetch(webhookUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documentationId: request.documentationId,
        trigger: "start"
      }),
    });
    
    console.log(`Started documentation generation process for ${request.documentationId}`);
  } catch (error) {
    console.error(`Failed to start documentation generation: ${(error as Error).message}`);
    
    // Update the database with error status
    const { db } = await import("@/lib/supabase/db");
    await db
      .update({
        status: "failed",
        result: JSON.stringify({ error: `Failed to start: ${(error as Error).message}` }),
      })
      .where({ id: request.documentationId })
      .into("documentation_requests");
      
    throw error;
  }
}

// New function: Process documentation in chunks
export async function processDocumentationChunk(
  documentationId: string,
  chunkIndex: number,
  totalChunks: number,
  partialRequest: Partial<DocRequest>
): Promise<Partial<DocResult>> {
  try {
    // Define chunk boundaries and process based on the chunk index
    // Each chunk will handle a different part of the documentation process
    
    // Update the processing status
    const { db } = await import("@/lib/supabase/db");
    await db
      .update({
        status: "processing",
        progress: Math.floor((chunkIndex / totalChunks) * 100),
      })
      .where({ id: documentationId })
      .into("documentation_requests");
    
    // Different processing for different chunk types
    let result: Partial<DocResult> = {};
    
    switch(chunkIndex) {
      case 0:
        // First chunk: Initialize and fetch code
        console.log(`Processing documentation chunk ${chunkIndex}/${totalChunks} for ${documentationId}`);
        // Partial initialization logic here
        result = { repositoryId: partialRequest.repositoryId };
        break;
        
      case 1:
        // Second chunk: Parse and analyze code
        console.log(`Processing documentation chunk ${chunkIndex}/${totalChunks} for ${documentationId}`);
        // Code analysis logic would go here
        break;
        
      case 2:
        // Third chunk: Generate documentation
        console.log(`Processing documentation chunk ${chunkIndex}/${totalChunks} for ${documentationId}`);
        // Documentation generation logic would go here
        break;
        
      case 3:
        // Fourth chunk: Quality assessment and diagrams
        console.log(`Processing documentation chunk ${chunkIndex}/${totalChunks} for ${documentationId}`);
        // Quality check and diagram generation would go here
        break;
        
      default:
        throw new Error(`Invalid chunk index: ${chunkIndex}`);
    }
    
    // If this is the last chunk, update as completed
    if (chunkIndex === totalChunks - 1) {
      await db
        .update({
          status: "completed",
          progress: 100,
          completed_at: new Date().toISOString(),
        })
        .where({ id: documentationId })
        .into("documentation_requests");
    }
    
    return result;
  } catch (error) {
    console.error(`Error processing documentation chunk ${chunkIndex}: ${(error as Error).message}`);
    
    // Update the database with error status
    const { db } = await import("@/lib/supabase/db");
    await db
      .update({
        status: "failed",
        result: JSON.stringify({ error: `Failed at chunk ${chunkIndex}: ${(error as Error).message}` }),
      })
      .where({ id: documentationId })
      .into("documentation_requests");
      
    throw error;
  }
} 