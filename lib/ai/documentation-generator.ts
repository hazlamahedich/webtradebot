import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { StateGraph } from "@langchain/langgraph";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { codeAnalysisModel } from "./models";
import { documentationPrompts } from "./documentation-prompts";
import {
  CodeAnalysisForDocs,
  ComponentDocumentation,
  Documentation as ImportedDocumentation,
  DocumentationDiagram,
  DocumentationRequest as DocRequest,
  DocumentationResult as DocResult,
  MissingDocumentation,
  QualityAssessment
} from "./types";
import { db } from "@/lib/supabase/db";
import { documentationRequests } from "@/lib/supabase/schema";
import { eq, desc } from "drizzle-orm";

// Define types for documentation generation
interface DocumentationState {
  repositoryId: string;
  owner: string;
  repo: string;
  branch: string;
  filePaths: string[];
  codeContent: Record<string, string>;
  parsedComponents: ParsedComponent[];
  codeAnalysis: CodeAnalysis | null;
  documentation: DocumentationData | null;
  qualityAssessment?: QualityAssessment;
  missingDocs?: MissingDocumentation[];
  diagrams?: DocumentationDiagram[];
  error?: string;
}

interface ParsedComponent {
  name: string;
  type: string;
  props: Prop[];
  description: string;
  filePath: string;
  code: string;
}

interface Prop {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: string;
}

interface CodeAnalysis {
  components: ComponentAnalysis[];
  utils: UtilityFunction[];
  hooks: CustomHook[];
}

interface ComponentAnalysis {
  name: string;
  purpose: string;
  dependencies: string[];
  usagePattern: string;
  complexity: "simple" | "moderate" | "complex";
}

interface UtilityFunction {
  name: string;
  purpose: string;
  parameters: string[];
  returnType: string;
  usage: string;
}

interface CustomHook {
  name: string;
  purpose: string;
  parameters: string[];
  returnValue: string;
  usage: string;
}

// Rename to avoid conflict with imported type
interface DocumentationData {
  overview: string;
  components: ComponentDoc[];
  utils: UtilDoc[];
  hooks: HookDoc[];
  examples: Example[];
}

interface ComponentDoc {
  name: string;
  description: string;
  props: PropDoc[];
  examples: string[];
  componentId?: string;
  usage?: string;
  parameters?: ParameterDoc[];
  returnType?: string;
  returnDescription?: string;
}

interface PropDoc {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: string;
}

interface UtilDoc {
  name: string;
  description: string;
  parameters: ParameterDoc[];
  returnType: string;
  examples: string[];
}

interface HookDoc {
  name: string;
  description: string;
  parameters: ParameterDoc[];
  returnValue: string;
  examples: string[];
}

interface ParameterDoc {
  name: string;
  type: string;
  description: string;
}

interface Example {
  title: string;
  code: string;
  description: string;
}

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
 * Creates a documentation generation workflow
 * This is a simplified implementation that avoids LangGraph API issues
 */
export const createDocumentationGraph = async (requestData: {
  repositoryId: string;
  owner: string;
  repo: string;
  branch: string;
  filePaths: string[];
}) => {
  // Create a simplified workflow handler
  const workflow = {
    // Process the entire documentation workflow sequentially
    async invoke(state: DocumentationState): Promise<DocumentationState> {
      try {
        // Step 1: Initialize
        const initialState = {
          repositoryId: requestData.repositoryId,
          owner: requestData.owner,
          repo: requestData.repo,
          branch: requestData.branch,
          filePaths: requestData.filePaths,
          codeContent: {} as Record<string, string>,
          parsedComponents: [] as ParsedComponent[],
          codeAnalysis: null as any,
          documentation: null as any,
          qualityAssessment: { 
            score: 0, 
            coverage: 0, 
            clarity: 0, 
            completeness: 0, 
            consistency: 0, 
            improvements: [] 
          },
          missingDocs: [] as any[],
          diagrams: [] as any[],
        };

        // Sequential workflow execution
        const stateWithCode = await this.fetchCode(initialState);
        const stateWithParsed = await this.parseCode(stateWithCode);
        const stateWithAnalysis = await this.analyzeCode(stateWithParsed);
        const stateWithDocs = await this.generateDocumentation(stateWithAnalysis);
        const stateWithQuality = await this.assessQuality(stateWithDocs);
        const stateWithMissing = await this.detectMissingDocs(stateWithQuality);
        const finalState = await this.generateDiagrams(stateWithMissing);
        
        return finalState;
      } catch (error) {
        console.error("Error in documentation workflow:", error);
        return {
          ...state,
          error: `Workflow failed: ${(error as Error).message}`
        };
      }
    },

    // Individual steps of the workflow
    async fetchCode(state: DocumentationState): Promise<DocumentationState> {
      try {
        const codeContent: Record<string, string> = {};
        
        // Simulated code fetching
        for (const path of state.filePaths) {
          codeContent[path] = await fetchFileContent(path, state.owner, state.repo, state.branch);
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

    async parseCode(state: DocumentationState): Promise<DocumentationState> {
      try {
        const { codeContent } = state;
        
        const parsedComponents: ParsedComponent[] = [];
        
        for (const path in codeContent) {
          parsedComponents.push({
            name: path.split("/").pop() || "",
            type: "module",
            props: [],
            description: "",
            filePath: path,
            code: codeContent[path],
          });
        }

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

    async analyzeCode(state: DocumentationState): Promise<DocumentationState> {
      try {
        const { codeContent, parsedComponents } = state;
        
        const codeString = Object.values(codeContent).join("\n\n");
        
        const analysisChain = RunnableSequence.from([
          documentationPrompts.codeAnalysisPrompt,
          codeAnalysisModel,
          StructuredOutputParser.fromZodSchema(CodeAnalysisSchema),
        ]);

        const analysisResponse = await analysisChain.invoke({
          code: codeString,
          components: JSON.stringify(parsedComponents),
        });

        // Create a valid CodeAnalysis object with default values
        const completeAnalysis: CodeAnalysis = {
          components: [],
          utils: [],
          hooks: []
        };
        
        // Add any properties from the response that are available
        if (analysisResponse.components) {
          completeAnalysis.components = analysisResponse.components.map((c: any) => ({
            name: c.name || "",
            purpose: c.purpose || "",
            dependencies: c.dependencies || [],
            usagePattern: c.usagePattern || "",
            complexity: c.complexity || "simple"
          }));
        }

        return {
          ...state,
          codeAnalysis: completeAnalysis,
        };
      } catch (error) {
        console.error("Error analyzing code:", error);
        return {
          ...state,
          error: `Failed to analyze code: ${(error as Error).message}`,
        };
      }
    },

    async generateDocumentation(state: DocumentationState): Promise<DocumentationState> {
      try {
        const { codeContent, codeAnalysis } = state;
        
        const documentationChain = RunnableSequence.from([
          documentationPrompts.documentationGenerationPrompt,
          codeAnalysisModel,
          StructuredOutputParser.fromZodSchema(DocumentationSchema),
        ]);

        const documentationResponse = await documentationChain.invoke({
          code: Object.values(codeContent).join("\n\n"),
          analysis: JSON.stringify(codeAnalysis),
        });

        // Create a valid DocumentationData object with default values
        const completeDocumentation: DocumentationData = {
          overview: documentationResponse.overview || "Documentation overview",
          components: [],
          utils: [],
          hooks: [],
          examples: []
        };
        
        // Convert components from response if available
        if (documentationResponse.components) {
          completeDocumentation.components = documentationResponse.components.map((c: any) => ({
            name: c.componentId || "",
            description: c.description || "",
            props: [],
            examples: c.examples || []
          }));
        }

        return {
          ...state,
          documentation: completeDocumentation,
        };
      } catch (error) {
        console.error("Error generating documentation:", error);
        return {
          ...state,
          error: `Failed to generate documentation: ${(error as Error).message}`,
        };
      }
    },

    async assessQuality(state: DocumentationState): Promise<DocumentationState> {
      try {
        const { documentation, codeAnalysis } = state;
        
        const qualityChain = RunnableSequence.from([
          documentationPrompts.qualityAssessmentPrompt,
          codeAnalysisModel,
          StructuredOutputParser.fromZodSchema(QualityAssessmentSchema),
        ]);

        const qualityResult = await qualityChain.invoke({
          documentation: JSON.stringify(documentation),
          analysis: JSON.stringify(codeAnalysis),
        });

        // Create a valid QualityAssessment object with default values
        const qualityAssessment: QualityAssessment = {
          score: qualityResult.score || 0,
          coverage: qualityResult.coverage || 0,
          clarity: qualityResult.clarity || 0,
          completeness: qualityResult.completeness || 0,
          consistency: qualityResult.consistency || 0,
          improvements: []
        };
        
        // Convert improvements from response if available
        if (qualityResult.improvements) {
          qualityAssessment.improvements = qualityResult.improvements.map((i: any) => ({
            title: i.componentId || "Improvement",
            description: i.suggestion || "Suggested improvement",
            priority: i.priority || "medium"
          }));
        }

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

    async detectMissingDocs(state: DocumentationState): Promise<DocumentationState> {
      try {
        const { codeAnalysis, documentation } = state;
        
        const missingDocsChain = RunnableSequence.from([
          documentationPrompts.missingDocsPrompt,
          codeAnalysisModel,
          StructuredOutputParser.fromZodSchema(z.array(MissingDocumentationSchema)),
        ]);

        const missingDocData = await missingDocsChain.invoke({
          documentation: JSON.stringify(documentation),
          analysis: JSON.stringify(codeAnalysis),
        });

        // Map to correct structure with required properties
        const missingDocs: MissingDocumentation[] = (missingDocData || []).map((item: any) => ({
          componentType: item.type || "unknown",
          componentName: item.componentId || "unknown",
          filePath: item.location?.filePath || "unknown",
          startLine: item.location?.startLine || 0,
          endLine: item.location?.endLine || 0,
          suggestedDocumentation: item.template || "Documentation needed",
          severity: item.severity || "medium"
        }));

        return {
          ...state,
          missingDocs,
        };
      } catch (error) {
        console.error("Error detecting missing documentation:", error);
        return {
          ...state,
          error: `Failed to detect missing documentation: ${(error as Error).message}`,
          missingDocs: [],
        };
      }
    },

    async generateDiagrams(state: DocumentationState): Promise<DocumentationState> {
      try {
        const { codeAnalysis } = state;
        
        const diagramChain = RunnableSequence.from([
          documentationPrompts.diagramGenerationPrompt,
          codeAnalysisModel,
          StructuredOutputParser.fromZodSchema(z.array(z.object({
            type: z.string(),
            title: z.string(),
            description: z.string(),
            content: z.string(),
          }))),
        ]);

        const diagramData = await diagramChain.invoke({
          analysis: JSON.stringify(codeAnalysis),
        });
        
        // Ensure all required properties are present
        const diagrams: DocumentationDiagram[] = (diagramData || []).map((diagram: any) => ({
          type: diagram.type || "diagram",
          title: diagram.title || "Untitled",
          description: diagram.description || "",
          content: diagram.content || "",
        }));

        return {
          ...state,
          diagrams,
        };
      } catch (error) {
        console.error("Error generating diagrams:", error);
        return {
          ...state,
          error: `Failed to generate diagrams: ${(error as Error).message}`,
          diagrams: [],
        };
      }
    }
  };
  
  return workflow;
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
  documentation: DocumentationData;
  qualityAssessment: QualityAssessment;
  missingDocs: MissingDocumentation[];
  diagrams: DocumentationDiagram[];
  error?: string;
}

// Function to generate documentation with direct implementation
export async function generateDocumentation(
  request: DocRequest
): Promise<DocResult> {
  try {
    console.log(`Generating documentation for ${request.owner}/${request.repo}`);
    
    // Create empty result structure
    const result: DocResult = {
      repositoryId: request.repositoryId,
      documentation: {
        overview: `Documentation for ${request.repo}`,
        components: [],
        architecture: "Architecture documentation will be generated here.",
        usageGuide: "A usage guide will be provided here."
      },
      qualityAssessment: {
        score: 0,
        coverage: 0,
        clarity: 0,
        completeness: 0,
        consistency: 0,
        improvements: []
      },
      missingDocs: [],
      diagrams: []
    };
    
    try {
      // Step 1: Fetch code content
      console.log("Fetching code content...");
      const codeContent: Record<string, string> = {};
      
      // Fetch file contents
      for (const path of request.filePaths) {
        try {
          codeContent[path] = await fetchFileContent(
            path, 
            request.owner, 
            request.repo, 
            request.branch
          );
        } catch (error) {
          console.error(`Error fetching file ${path}:`, error);
          codeContent[path] = `// Error fetching content: ${(error as Error).message}`;
        }
      }
      
      // Step 2: Parse code
      console.log("Parsing code...");
      const parsedComponents: ParsedComponent[] = [];
      
      for (const path in codeContent) {
        parsedComponents.push({
          name: path.split("/").pop() || "",
          type: "module",
          props: [],
          description: "",
          filePath: path,
          code: codeContent[path]
        });
      }
      
      // Step 3: Analyze code structure
      console.log("Analyzing code structure...");
      let codeAnalysis: any = null;
      
      try {
        const codeString = Object.values(codeContent).join("\n\n");
        
        const analysisChain = RunnableSequence.from([
          documentationPrompts.codeAnalysisPrompt,
          codeAnalysisModel,
          StructuredOutputParser.fromZodSchema(CodeAnalysisSchema)
        ]);
        
        codeAnalysis = await analysisChain.invoke({
          code: codeString,
          components: JSON.stringify(parsedComponents)
        });
      } catch (error) {
        console.error("Error analyzing code:", error);
        // Continue with partial data
      }
      
      // Step 4: Generate documentation
      console.log("Generating documentation...");
      try {
        if (codeAnalysis) {
          const documentationChain = RunnableSequence.from([
            documentationPrompts.documentationGenerationPrompt,
            codeAnalysisModel,
            StructuredOutputParser.fromZodSchema(DocumentationSchema)
          ]);
          
          const documentationData = await documentationChain.invoke({
            code: Object.values(codeContent).join("\n\n"),
            analysis: JSON.stringify(codeAnalysis)
          });
          
          // Create a valid Documentation object with required properties
          const documentation: ImportedDocumentation = {
            overview: documentationData.overview || "Documentation overview",
            components: (documentationData.components || []).map((c: any) => ({
              componentId: c.componentId || "",
              description: c.description || "",
              usage: c.usage || "",
              parameters: c.parameters || [],
              returnType: c.returnType || "",
              returnDescription: c.returnDescription || "",
              examples: c.examples || []
            })),
            architecture: documentationData.architecture || "Architecture documentation",
            usageGuide: documentationData.usageGuide || "Usage guide"
          };
          
          // Set documentation in result
          result.documentation = documentation;
        }
      } catch (error) {
        console.error("Error generating documentation:", error);
        // Continue with default documentation
      }
      
      // Step 5: Assess quality
      console.log("Assessing documentation quality...");
      try {
        const qualityChain = RunnableSequence.from([
          documentationPrompts.qualityAssessmentPrompt,
          codeAnalysisModel,
          StructuredOutputParser.fromZodSchema(QualityAssessmentSchema)
        ]);
        
        const qualityData = await qualityChain.invoke({
          documentation: JSON.stringify(result.documentation),
          analysis: JSON.stringify(codeAnalysis)
        });
        
        // Create a valid QualityAssessment object with required properties
        const qualityAssessment: QualityAssessment = {
          score: qualityData.score || 0,
          coverage: qualityData.coverage || 0,
          clarity: qualityData.clarity || 0,
          completeness: qualityData.completeness || 0,
          consistency: qualityData.consistency || 0,
          improvements: (qualityData.improvements || []).map((i: any) => ({
            title: i.componentId || "Improvement",
            description: i.suggestion || "Suggested improvement",
            priority: i.priority || "medium"
          }))
        };
        
        // Set quality assessment in result
        result.qualityAssessment = qualityAssessment;
      } catch (error) {
        console.error("Error assessing quality:", error);
        // Continue with default quality assessment
      }
      
      // Step 6: Detect missing documentation
      console.log("Detecting missing documentation...");
      try {
        const missingDocsChain = RunnableSequence.from([
          documentationPrompts.missingDocsPrompt,
          codeAnalysisModel,
          StructuredOutputParser.fromZodSchema(z.array(MissingDocumentationSchema))
        ]);
        
        const missingDocData = await missingDocsChain.invoke({
          documentation: JSON.stringify(result.documentation),
          analysis: JSON.stringify(codeAnalysis)
        });
        
        // Create a valid array of MissingDocumentation objects
        const missingDocs: MissingDocumentation[] = (missingDocData || []).map((item: any) => ({
          componentType: item.type || "unknown",
          componentName: item.componentId || "unknown",
          filePath: item.location?.filePath || "unknown",
          startLine: item.location?.startLine || 0,
          endLine: item.location?.endLine || 0,
          suggestedDocumentation: item.template || "Documentation needed",
          severity: item.severity || "medium"
        }));
        
        // Set missing docs in result
        result.missingDocs = missingDocs;
      } catch (error) {
        console.error("Error detecting missing docs:", error);
        // Continue with empty missing docs array
      }
      
      // Step 7: Generate diagrams
      console.log("Generating diagrams...");
      try {
        const diagramChain = RunnableSequence.from([
          documentationPrompts.diagramGenerationPrompt,
          codeAnalysisModel,
          StructuredOutputParser.fromZodSchema(z.array(z.object({
            type: z.string(),
            title: z.string(),
            description: z.string(),
            content: z.string()
          })))
        ]);
        
        const diagramData = await diagramChain.invoke({
          analysis: JSON.stringify(codeAnalysis)
        });
        
        // Create a valid array of DocumentationDiagram objects
        const diagrams: DocumentationDiagram[] = (diagramData || []).map((diagram: any) => ({
          type: diagram.type || "diagram",
          title: diagram.title || "Untitled",
          description: diagram.description || "",
          content: diagram.content || ""
        }));
        
        // Set diagrams in result
        result.diagrams = diagrams;
      } catch (error) {
        console.error("Error generating diagrams:", error);
        // Continue with empty diagrams array
      }
      
      console.log("Documentation generation complete.");
    } catch (error) {
      console.error("Error in documentation process:", error);
      result.error = `Documentation generation error: ${(error as Error).message}`;
    }
    
    return result;
  } catch (error) {
    console.error("Fatal documentation generation error:", error);
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
    // Initialize the repository file list if not provided
    let filePaths = request.filePaths;
    
    // If no specific file paths are provided, we'll discover them in the webhook
    const fileCount = filePaths.length;
    
    // Use `fetch` with minimal payload just to trigger the webhook
    await fetch(webhookUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documentationId: request.documentationId,
        trigger: "start",
        owner: request.owner,
        repo: request.repo,
        branch: request.branch,
        fileCount: fileCount,
        // Only send file paths if under a reasonable size limit to avoid large payloads
        filePaths: fileCount < 50 ? filePaths : [] 
      }),
    });
    
    console.log(`Started documentation generation process for ${request.documentationId}`);
  } catch (error) {
    console.error(`Failed to start documentation generation: ${(error as Error).message}`);
    
    // Update the database with error status
    const { db } = await import("@/lib/supabase/db");
    const { eq } = await import("drizzle-orm");
    const { documentationRequests } = await import("@/lib/supabase/schema");
    
    await db.update(documentationRequests)
      .set({
        status: "failed",
        result: JSON.stringify({ error: `Failed to start: ${(error as Error).message}` }),
      })
      .where(eq(documentationRequests.id, request.documentationId));
      
    throw error;
  }
}

// Process documentation in chunks with enhanced memory management
export async function processDocumentationChunk(
  documentationId: string,
  chunkIndex: number,
  totalChunks: number,
  partialRequest: Partial<DocRequest>
): Promise<Partial<DocResult>> {
  try {
    // Get existing result from database
    const docData = await db.select()
      .from(documentationRequests)
      .where(eq(documentationRequests.id, documentationId))
      .limit(1);
    
    if (!docData.length) {
      throw new Error(`Documentation request not found: ${documentationId}`);
    }
    
    const currentData = docData[0];
    let result: Partial<DocResult> = { repositoryId: currentData.repository_id };
    
    // Parse existing result if available
    if (currentData.result) {
      try {
        result = JSON.parse(currentData.result as string) as Partial<DocResult>;
      } catch (e) {
        console.warn("Could not parse existing result:", e);
      }
    }
    
    // Process documentation in chunks
    let chunkResult: Partial<DocResult> = {};
    
    if (chunkIndex === 0 && totalChunks === 1) {
      // Small repo, process everything at once
      chunkResult = await processFullDocumentation(partialRequest.filePaths || []);
    } else if (chunkIndex === 0) {
      // First chunk: fetch code and parse
      chunkResult = await processFetchAndParse(partialRequest.filePaths || [], chunkIndex, totalChunks);
    } else if (chunkIndex === totalChunks - 1) {
      // Last chunk: quality and diagrams
      chunkResult = await processQualityAndDiagrams(result);
    } else {
      // Middle chunks: analyze and generate docs
      if (chunkIndex === 1) {
        chunkResult = await processCodeAnalysis(result);
      } else {
        chunkResult = await processDocGeneration(result);
      }
    }
    
    // Merge current result with chunk result
    const updatedResult = { ...result, ...chunkResult };
    
    // Update the database with the progress and results
    await db.update(documentationRequests)
      .set({
        status: chunkIndex === totalChunks - 1 ? "completed" : "processing",
        progress: Math.floor(((chunkIndex + 1) / totalChunks) * 100),
        result: JSON.stringify(updatedResult),
        completed_at: chunkIndex === totalChunks - 1 ? new Date() : undefined,
      })
      .where(eq(documentationRequests.id, documentationId));
    
    return updatedResult;
  } catch (error) {
    console.error(`Error processing chunk ${chunkIndex}:`, error);
    
    // Update the database with error status
    await db.update(documentationRequests)
      .set({
        status: "failed",
        result: JSON.stringify({ error: `Failed on chunk ${chunkIndex}: ${(error as Error).message}` }),
      })
      .where(eq(documentationRequests.id, documentationId));
    
    throw error;
  }
}

// Helper functions for processing chunks

// Process codebase in one go (for small repos)
async function processFullDocumentation(filePaths: string[]): Promise<Partial<DocResult>> {
  // Implementation would go here
  // This is a simplified version just for demonstration
  return {
    documentation: {
      overview: "Generated overview",
      components: [],
      architecture: "Generated architecture",
      usageGuide: "Generated usage guide",
    }
  };
}

// Process quality assessment and diagrams
async function processQualityAndDiagrams(currentResult: Partial<DocResult>): Promise<Partial<DocResult>> {
  // Implementation would go here
  return {
    qualityAssessment: {
      score: 0.75,
      coverage: 0.8,
      clarity: 0.7,
      completeness: 0.75,
      consistency: 0.8,
      improvements: []
    },
    diagrams: []
  };
}

// Process code fetching and parsing
async function processFetchAndParse(
  filePaths: string[],
  chunkIndex: number, 
  totalChunks: number
): Promise<Partial<DocResult>> {
  try {
    // Update result structure to match expected DocumentationResult type
    const result: Partial<DocResult> & {
      files?: Record<string, string>;
      components?: any[];
      metadata?: {
        filesProcessed: number;
        processingTime: number;
        fileTypes: Record<string, number>;
      };
    } = {
      repositoryId: "",
      documentation: {
        overview: "",
        components: [],
        architecture: "",
        usageGuide: "",
      },
      qualityAssessment: {
        score: 0,
        coverage: 0,
        clarity: 0,
        completeness: 0,
        consistency: 0,
        improvements: []
      },
      missingDocs: [],
      diagrams: []
    };
    
    const startTime = Date.now();
    
    // If we have no files to process, return early
    if (!filePaths.length) {
      return result;
    }
    
    // We'll store file contents
    const fileContents: Record<string, string> = {};
    
    // Batch fetch files in groups of 10 to avoid rate limiting and memory issues
    const BATCH_SIZE = 10;
    const batches = Math.ceil(filePaths.length / BATCH_SIZE);
    
    for (let i = 0; i < batches; i++) {
      const batchStart = i * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, filePaths.length);
      const batchPaths = filePaths.slice(batchStart, batchEnd);
      
      // Fetch files in parallel within a batch
      const fetchPromises = batchPaths.map(async (path) => {
        try {
          const fileContent = await fetchFileContent(path);
          return { path, content: fileContent };
        } catch (error) {
          console.error(`Error fetching ${path}:`, error);
          return { path, content: `// Error fetching file: ${(error as Error).message}` };
        }
      });
      
      const batchResults = await Promise.all(fetchPromises);
      
      // Add batch results to our file contents
      batchResults.forEach(({ path, content }) => {
        fileContents[path] = content;
      });
      
      // Small pause between batches to avoid overloading memory or hitting rate limits
      if (i < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Add file contents to result
    result.files = fileContents;
    
    // Identify components for further analysis
    const detectedComponents = identifyComponents(fileContents);
    if (detectedComponents.length) {
      result.components = detectedComponents;
    }
    
    // Update metadata
    result.metadata = {
      filesProcessed: filePaths.length,
      processingTime: Date.now() - startTime,
      fileTypes: countFileTypes(filePaths),
    };
    
    return result;
  } catch (error) {
    console.error("Error in processFetchAndParse:", error);
    return {
      error: `Failed to fetch and parse code: ${(error as Error).message}`
    };
  }
}

// Helper function to fetch file content from GitHub
async function fetchFileContent(filePath: string, owner?: string, repo?: string, branch?: string): Promise<string> {
  try {
    // If no owner/repo/branch provided, we can't fetch from GitHub API
    if (!owner || !repo || !branch) {
      return `// Mock content for ${filePath} (no repo info provided)`;
    }
    
    // Encode the file path for the GitHub API
    const encodedPath = encodeURIComponent(filePath);
    
    // Create the URL for the GitHub API
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${branch}`;
    
    // Fetch the file content
    const response = await fetch(url, {
      headers: {
        Authorization: process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : '',
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "CodeReview",
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // GitHub API returns content as base64 encoded
    if (data.content && data.encoding === "base64") {
      // Decode the base64 content
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    
    // If no content was found
    return `// Empty file or unable to retrieve content for ${filePath}`;
  } catch (error) {
    console.error(`Error fetching file content from GitHub: ${(error as Error).message}`);
    return `// Error: Failed to fetch file content: ${(error as Error).message}`;
  }
}

// Helper function to identify components in code files
function identifyComponents(files: Record<string, string>): any[] {
  // This is a simplified implementation
  const components: any[] = [];
  
  // Look for React components (in .tsx, .jsx files)
  Object.entries(files).forEach(([path, content]) => {
    if (path.endsWith('.tsx') || path.endsWith('.jsx')) {
      // Simple regex to detect component declarations
      // A more sophisticated implementation would use AST parsing
      const componentMatches = content.match(/function\s+([A-Z][a-zA-Z0-9]*)\s*\(/g);
      const classMatches = content.match(/class\s+([A-Z][a-zA-Z0-9]*)\s+extends\s+React\.Component/g);
      const arrowMatches = content.match(/const\s+([A-Z][a-zA-Z0-9]*)\s*=\s*(\([^)]*\)|)\s*=>/g);
      
      if (componentMatches || classMatches || arrowMatches) {
        components.push({
          type: 'component',
          path: path,
          name: extractComponentName(path),
        });
      }
    }
  });
  
  return components;
}

// Helper function to extract component name from file path
function extractComponentName(filePath: string): string {
  const fileName = filePath.split('/').pop() || '';
  return fileName.replace(/\.(tsx|jsx|js|ts)$/, '');
}

// Helper function to count file types
function countFileTypes(filePaths: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  filePaths.forEach(path => {
    const extension = path.split('.').pop() || 'unknown';
    counts[extension] = (counts[extension] || 0) + 1;
  });
  
  return counts;
}

// Process code analysis
async function processCodeAnalysis(currentResult: Partial<DocResult>): Promise<Partial<DocResult>> {
  // Implementation would go here
  return {};
}

// Process documentation generation
async function processDocGeneration(currentResult: Partial<DocResult>): Promise<Partial<DocResult>> {
  // Implementation would go here
  return {
    documentation: {
      overview: "Generated overview",
      components: [],
      architecture: "Generated architecture",
      usageGuide: "Generated usage guide",
    }
  };
}

/**
 * Exports documentation in various formats
 * @param documentationId The ID of the documentation to export
 * @param format The format to export to (markdown, html, pdf, json)
 * @returns The exported documentation as a string or Buffer
 */
export async function exportDocumentation(
  documentationId: string, 
  format: 'markdown' | 'html' | 'pdf' | 'json'
): Promise<string | Buffer> {
  try {
    // Fetch the documentation from the database
    const docResult = await db
      .select()
      .from(documentationRequests)
      .where(eq(documentationRequests.id, documentationId))
      .limit(1);
    
    if (!docResult.length) {
      throw new Error(`Documentation not found: ${documentationId}`);
    }
    
    const doc = docResult[0];
    const result = JSON.parse(doc.result as string || '{}') as DocResult;
    const { documentation, diagrams } = result;
    
    // Convert imported Documentation to our internal format for generation
    const docData: ImportedDocumentation = documentation;
    
    switch (format) {
      case 'json':
        return JSON.stringify(result, null, 2);
        
      case 'markdown':
        return generateMarkdownDocumentation(docData, diagrams || []);
        
      case 'html':
        const markdown = generateMarkdownDocumentation(docData, diagrams || []);
        return convertMarkdownToHtml(markdown);
        
      case 'pdf':
        const html = convertMarkdownToHtml(
          generateMarkdownDocumentation(docData, diagrams || [])
        );
        return await generatePdfFromHtml(html);
        
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  } catch (error) {
    console.error(`Error exporting documentation: ${(error as Error).message}`);
    throw new Error(`Failed to export documentation: ${(error as Error).message}`);
  }
}

/**
 * Generates markdown documentation from the documentation object
 */
function generateMarkdownDocumentation(
  documentation: ImportedDocumentation,
  diagrams: DocumentationDiagram[]
): string {
  let markdown = `# ${documentation.overview}\n\n`;
  
  // Add architecture section if it exists
  if (documentation.architecture) {
    markdown += `## Architecture\n\n${documentation.architecture}\n\n`;
  }
  
  // Add components section
  markdown += `## Components\n\n`;
  
  for (const component of documentation.components) {
    markdown += `### ${component.componentId}\n\n`;
    markdown += `${component.description}\n\n`;
    
    // Add usage if available
    if (component.usage) {
      markdown += `#### Usage\n\n\`\`\`jsx\n${component.usage}\n\`\`\`\n\n`;
    }
    
    // Add parameters if available
    if (component.parameters && component.parameters.length > 0) {
      markdown += `#### Parameters\n\n`;
      markdown += `| Name | Type | Description |\n`;
      markdown += `| ---- | ---- | ----------- |\n`;
      
      for (const param of component.parameters) {
        markdown += `| ${param.name} | ${param.type} | ${param.description} |\n`;
      }
      
      markdown += `\n`;
    }
    
    // Add return type if available
    if (component.returnType) {
      markdown += `#### Returns\n\n`;
      markdown += `\`${component.returnType}\``;
      
      if (component.returnDescription) {
        markdown += `: ${component.returnDescription}`;
      }
      
      markdown += `\n\n`;
    }
  }
  
  // Add usage guide section if it exists
  if (documentation.usageGuide) {
    markdown += `## Usage Guide\n\n${documentation.usageGuide}\n\n`;
  }
  
  // Add setup section if it exists
  if (documentation.setup) {
    markdown += `## Setup\n\n${documentation.setup}\n\n`;
  }
  
  // Add diagrams section
  if (diagrams && diagrams.length > 0) {
    markdown += `## Diagrams\n\n`;
    
    for (const diagram of diagrams) {
      markdown += `### ${diagram.title}\n\n`;
      markdown += `${diagram.description}\n\n`;
      markdown += `\`\`\`\n${diagram.content}\n\`\`\`\n\n`;
    }
  }
  
  return markdown;
}

/**
 * Converts markdown to HTML
 */
function convertMarkdownToHtml(markdown: string): string {
  // Use a library like marked or remark to convert markdown to HTML
  // This is a simplified implementation
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documentation</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background-color: #f4f4f4; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
</head>
<body>
  <div id="content"></div>
  <script>
    document.getElementById('content').innerHTML = marked.parse(\`${markdown.replace(/`/g, '\\`')}\`);
    mermaid.initialize({ startOnLoad: true, theme: 'neutral' });
  </script>
</body>
</html>`;

  return html;
}

/**
 * Generates a PDF from HTML using a headless browser
 * Note: In a real implementation, you'd use a library like puppeteer
 */
async function generatePdfFromHtml(html: string): Promise<Buffer> {
  // This would use a library like puppeteer to generate a PDF
  // For now, we'll return a dummy buffer
  return Buffer.from('PDF generation would happen here');
} 