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
        
        // Use the diagram generation prompt with the LLM
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

        const diagrams = await diagramChain.invoke({
          analysis: JSON.stringify(codeAnalysis),
        });
        
        return {
          ...state,
          diagrams,
        };
      } catch (error) {
        console.error("Error generating diagrams:", error);
        return {
          ...state,
          error: `Failed to generate diagrams: ${(error as Error).message}`,
          // Provide empty array to avoid null pointer issues
          diagrams: [],
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
    const { db } = await import("@/lib/supabase/db");
    const docResult = await db
      .select('*')
      .from('documentation_requests')
      .where({ id: documentationId })
      .single();
    
    if (!docResult) {
      throw new Error(`Documentation not found: ${documentationId}`);
    }
    
    const result = JSON.parse(docResult.result || '{}') as DocResult;
    const { documentation, diagrams, qualityAssessment } = result;
    
    switch (format) {
      case 'json':
        return JSON.stringify(result, null, 2);
        
      case 'markdown':
        return generateMarkdownDocumentation(documentation, diagrams);
        
      case 'html':
        const markdown = generateMarkdownDocumentation(documentation, diagrams);
        return convertMarkdownToHtml(markdown);
        
      case 'pdf':
        const html = convertMarkdownToHtml(
          generateMarkdownDocumentation(documentation, diagrams)
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
  documentation: Documentation,
  diagrams: DocumentationDiagram[]
): string {
  if (!documentation || !documentation.overview) {
    return "# Documentation not available";
  }
  
  let markdown = `# ${documentation.overview.split('\n')[0] || 'API Documentation'}\n\n`;
  
  // Add overview
  markdown += `## Overview\n\n${documentation.overview}\n\n`;
  
  // Add architecture section
  if (documentation.architecture) {
    markdown += `## Architecture\n\n${documentation.architecture}\n\n`;
  }
  
  // Add diagrams if available
  if (diagrams && diagrams.length > 0) {
    markdown += `## Diagrams\n\n`;
    diagrams.forEach((diagram, index) => {
      markdown += `### ${diagram.type.charAt(0).toUpperCase() + diagram.type.slice(1)} Diagram\n\n`;
      markdown += "```mermaid\n" + diagram.content + "\n```\n\n";
    });
  }
  
  // Add components
  if (documentation.components && documentation.components.length > 0) {
    markdown += `## Components\n\n`;
    documentation.components.forEach(component => {
      markdown += `### ${component.componentId}\n\n`;
      markdown += `${component.description}\n\n`;
      
      // Add usage examples
      if (component.usage) {
        markdown += `#### Usage\n\n${component.usage}\n\n`;
      }
      
      // Add parameters if available
      if (component.parameters && component.parameters.length > 0) {
        markdown += `#### Parameters\n\n`;
        markdown += `| Name | Type | Description | Required |\n`;
        markdown += `| ---- | ---- | ----------- | -------- |\n`;
        component.parameters.forEach(param => {
          markdown += `| ${param.name} | ${param.type} | ${param.description} | ${param.required ? 'Yes' : 'No'} |\n`;
        });
        markdown += `\n`;
      }
      
      // Add return type if available
      if (component.returnType) {
        markdown += `#### Returns\n\n`;
        markdown += `**Type:** ${component.returnType}\n\n`;
        if (component.returnDescription) {
          markdown += `${component.returnDescription}\n\n`;
        }
      }
      
      // Add examples if available
      if (component.examples && component.examples.length > 0) {
        markdown += `#### Examples\n\n`;
        component.examples.forEach((example, idx) => {
          markdown += `##### Example ${idx + 1}\n\n`;
          markdown += "```typescript\n" + example + "\n```\n\n";
        });
      }
    });
  }
  
  // Add usage guide
  if (documentation.usageGuide) {
    markdown += `## Usage Guide\n\n${documentation.usageGuide}\n\n`;
  }
  
  // Add setup instructions if available
  if (documentation.setup) {
    markdown += `## Setup\n\n${documentation.setup}\n\n`;
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