import { RunnableSequence } from "@langchain/core/runnables";
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
  CodeChange as ImportedCodeChange,
  CodeIssue
} from "./types";
import { codeReviews } from "@/lib/supabase/schema";
import { eq, sql } from "drizzle-orm";

// Define the types for our workflow states
interface CodeReviewState {
  reviewId?: string;
  owner: string;
  repo: string;
  pullNumber: number;
  pullRequest?: PullRequestDetails;
  codeChanges: CodeChangePatch[];
  analysis?: CodeAnalysisResult;
  suggestions?: ImprovementSuggestion[];
  explanation?: CodeExplanation;
  summary?: ReviewSummary;
  error?: string;
}

// Define the types for code changes
interface CodeChangePatch {
  filename: string;
  patch: string;
  // Add other properties as needed
}

// Define the types for code review analysis
interface CodeReviewAnalysis {
  // Define the structure of the analysis here
  issues: LocalCodeIssue[];
}

// Local interface for CodeIssue used in this file only
interface LocalCodeIssue {
  file: string;
  line?: number;
  severity: "critical" | "major" | "minor" | "suggestion";
  description: string;
  suggestion?: string;
}

// Define the types for the final review result
interface CodeReviewOutput {
  summary: string;
  issues: LocalCodeIssue[];
}

// Simple direct implementation for generating code reviews
export async function generateCodeReview(
  owner: string,
  repo: string,
  pr_number: number,
  pr_title: string,
  pr_description: string,
  code_diff: string
): Promise<CodeReviewOutput> {
  try {
    console.log(`Processing code review for PR #${pr_number} in ${owner}/${repo}`);
    
    // Create a simple code analysis model
    const model = new ChatOpenAI({
      modelName: "gpt-4-turbo-preview",
      temperature: 0,
    });
    
    // Analyze the code
    const analysisResult = await model.invoke(
      `Review this code diff for a pull request:
      
      PR Title: ${pr_title}
      PR Description: ${pr_description}
      
      Code Changes:
      ${code_diff}
      
      Provide a detailed analysis of any potential issues, bugs, or improvements.`
    );
    
    // Parse the result
    const analysis = analysisResult.content.toString();
    
    // Extract issues from the analysis (simplified implementation)
    const issues: CodeIssue[] = [];
    
    const issueRegex = /File: (.*?)(?:\nLine: (\d+))?[\s\S]*?Severity: (critical|major|minor|suggestion)[\s\S]*?Description: (.*?)(?:\nSuggestion: (.*?))?(?=\n\nFile:|$)/gm;
    let match;
    
    while ((match = issueRegex.exec(analysis)) !== null) {
      issues.push({
        file: match[1].trim(),
        line: match[2] ? parseInt(match[2], 10) : undefined,
        severity: match[3] as "critical" | "major" | "minor" | "suggestion",
        description: match[4].trim(),
        suggestion: match[5]?.trim(),
      });
    }
    
    // Generate a summary
    return {
      summary: `Code review completed for PR #${pr_number}: ${pr_title}`,
      issues,
    };
  } catch (error) {
    console.error("Error in code review generation:", error);
    throw error;
  }
}

// Helper function to parse code diff
function parseCodeDiff(codeDiff: string): CodeChangePatch[] {
  // Simple implementation to extract file changes from a Git diff
  const changes: CodeChangePatch[] = [];
  const fileRegex = /^diff --git a\/(.*?) b\/(.*?)$[\s\S]*?^@@.*?@@[\s\S]*?\n([\s\S]*?)(?=^diff --git|\Z)/gm;
  
  let match;
  while ((match = fileRegex.exec(codeDiff)) !== null) {
    changes.push({
      filename: match[2],
      patch: match[3],
    });
  }
  
  return changes;
}

// Modern workflow for code review processing
export async function processCodeReview(requestData: CodeReviewRequest): Promise<CodeReviewResult> {
  const { reviewId, owner, repo, pullNumber } = requestData;
  
  try {
    console.log(`Starting code review for PR #${pullNumber} in ${owner}/${repo}`);
    
    // Update review status to in_progress
    await db
      .update(codeReviews)
      .set({ 
        status: "in_progress",
        updatedAt: new Date()
      })
      .where(eq(codeReviews.id, reviewId));

    // Step 1: Fetch PR data
    console.log("Fetching PR data...");
    const accessToken = process.env.GITHUB_ACCESS_TOKEN as string;
    const githubClient = new GitHubClient(accessToken);
    
    const pullRequest = await githubClient.getPullRequest(owner, repo, pullNumber);
    const files = await githubClient.getPullRequestFiles(owner, repo, pullNumber);
    
    if (!pullRequest || files.length === 0) {
      throw new Error("Failed to fetch PR data or no files changed");
    }
    
    // Create a code diff text for analysis
    const codeDiff = files
      .map((file) => `File: ${file.filename}\n${file.patch || "Binary file changed"}`)
      .join("\n\n");

    // Step 2: Analyze code
    console.log("Analyzing code...");
    const analysisChain = RunnableSequence.from([
      codeAnalysisPrompt,
      codeAnalysisModel,
      StructuredOutputParser.fromZodSchema(CodeAnalysisResultSchema),
    ]);

    const analysis = await analysisChain.invoke({
      pullRequest: JSON.stringify({
        title: pullRequest.title,
        description: pullRequest.body || "No description provided",
        repo_name: repo,
        pr_number: pullNumber
      }),
      codeChanges: codeDiff
    });

    // Step 3: Generate improvement suggestions
    console.log("Generating improvement suggestions...");
    const suggestionsChain = RunnableSequence.from([
      improvementSuggestionPrompt,
      improvementSuggestionModel,
      StructuredOutputParser.fromZodSchema(ImprovementSuggestionsSchema),
    ]);

    const suggestions = await suggestionsChain.invoke({
      pullRequest: JSON.stringify({
        title: pullRequest.title || "",
        description: pullRequest.body || ""
      }),
      codeChanges: files.map(c => `${c.filename}: ${c.patch}`).join('\n\n'),
      analysis: JSON.stringify(analysis)
    });

    // Step 4: Generate non-technical explanation
    console.log("Generating explanation...");
    const explanationChain = RunnableSequence.from([
      explanationPrompt,
      explanationModel,
      StructuredOutputParser.fromZodSchema(CodeExplanationSchema),
    ]);

    const explanation = await explanationChain.invoke({
      pullRequest: JSON.stringify(pullRequest),
      codeChanges: JSON.stringify(files),
      analysis: JSON.stringify(analysis)
    });

    // Step 5: Generate executive summary
    console.log("Generating summary...");
    const summaryChain = RunnableSequence.from([
      summaryPrompt,
      codeAnalysisModel,
      StructuredOutputParser.fromZodSchema(ReviewSummarySchema),
    ]);

    const summary = await summaryChain.invoke({
      pullRequest: JSON.stringify({
        pr_number: pullRequest.number,
        pr_title: pullRequest.title,
        files_changed: files.length,
        additions: 'additions' in pullRequest ? pullRequest.additions : 0,
        deletions: 'deletions' in pullRequest ? pullRequest.deletions : 0
      }),
      analysis: JSON.stringify(analysis),
      suggestions: JSON.stringify(suggestions),
      explanation: JSON.stringify(explanation)
    });

    // Step 6: Store results
    console.log("Storing results...");
    
    // Create the review result with proper mappings between schema outputs and required types
    const reviewResult: CodeReviewResult = {
      reviewId,
      pullRequest: {
        title: pullRequest.title,
        description: pullRequest.body || "",
        number: pullRequest.number,
        html_url: pullRequest.html_url,
        created_at: pullRequest.created_at,
        updated_at: pullRequest.updated_at,
        state: pullRequest.state,
        user: pullRequest.user,
        author: pullRequest.user?.login || "",
        baseRef: pullRequest.base?.ref || "",
        headRef: pullRequest.head?.ref || "",
        createdAt: pullRequest.created_at,
        updatedAt: pullRequest.updated_at
      } as PullRequestDetails,
      analysis: {
        overallQuality: 70, // Default score
        strengths: [],
        // Convert issues from multiple sources
        issues: [
          ...(Array.isArray(analysis.bugs) 
            ? analysis.bugs.map(bug => ({
                type: "Bugs" as const,
                severity: mapSeverityToType(bug.severity),
                description: bug.description || "",
                location: bug.location ? {
                  filePath: bug.location,
                  lineNumbers: []
                } : undefined,
                impact: "Could introduce unexpected behavior",
                suggestion: bug.description?.includes("fix") ? bug.description : undefined
              })) 
            : []),
          ...(Array.isArray(analysis.codeQuality) 
            ? analysis.codeQuality.map(issue => ({
                type: "Code Quality" as const,
                severity: "Medium" as const,
                description: issue.description || "",
                location: issue.location ? {
                  filePath: issue.location,
                  lineNumbers: []
                } : undefined,
                impact: issue.impact || "Affects maintainability",
                suggestion: undefined
              })) 
            : [])
        ],
        codeComplexity: {
          overall: "Medium" as const,
          hotspots: Array.isArray(analysis.architecture) 
            ? analysis.architecture.map(item => ({
                filePath: item.description.split(' ').slice(-1)[0] || "unknown",
                complexity: "Medium" as const,
                reason: item.description
              })) 
            : []
        },
        securityAnalysis: {
          vulnerabilities: Array.isArray(analysis.security) 
            ? analysis.security.map(sec => ({
                type: "Security" as const,
                severity: mapSeverityToType(sec.severity),
                description: sec.description || "",
                location: sec.location ? {
                  filePath: sec.location,
                  lineNumbers: []
                } : undefined,
                impact: "Security vulnerability",
                suggestion: undefined
              })) 
            : []
        }
      },
      suggestions: Array.isArray(suggestions) 
        ? suggestions.map(s => ({
            title: s.target || s.description?.substring(0, 50) || "Improvement",
            description: s.description || "",
            impact: mapImpact(s.rationale),
            effort: "Medium" as const,
            priority: 5,
            codeExample: s.codeExample,
            affectedFiles: [s.location || ""].filter(Boolean)
          })) 
        : [],
      explanation: {
        summary: explanation.summary || "",
        businessImpact: explanation.impact || "",
        technicalHighlights: explanation.technicalDecisions?.split('\n') || [],
        userFacingChanges: explanation.functionalChanges?.split('\n') || [],
        potentialRisks: []
      },
      summary: {
        qualityScore: parseQualityScore(summary.qualityAssessment) || 70,
        strengths: summary.keyPoints || [],
        criticalIssues: [],
        recommendations: [],
        verdict: "comment" as const,
        confidence: "Medium" as const
      }
    };
    
    // Update the database
    await db
      .update(codeReviews)
      .set({ 
        status: "completed",
        updatedAt: new Date(),
        completedAt: new Date(),
        feedback: sql`${JSON.stringify(reviewResult)}`
      })
      .where(eq(codeReviews.id, reviewId));
    
    console.log("Code review completed successfully");
    return reviewResult;
    
  } catch (error) {
    console.error("Error in code review process:", error);
    
    // Mark as failed if we had an error
    await db
      .update(codeReviews)
      .set({ 
        status: "failed",
        updatedAt: new Date(),
        feedback: sql`jsonb_set(coalesce(feedback, '{}'::jsonb), '{error}', ${JSON.stringify((error as Error).message)})`
      })
      .where(eq(codeReviews.id, reviewId));
    
    throw error;
  }
}

// Start the code review flow
export async function startCodeReviewFlow(requestData: CodeReviewRequest) {
  try {
    console.log(`Starting code review for PR #${requestData.pullNumber} in ${requestData.owner}/${requestData.repo}`);
    
    // Process the review asynchronously
    processCodeReview(requestData).catch(error => {
      console.error("Error processing code review:", error);
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error starting code review flow:", error);
    
    // Mark review as failed in the database
    await db
      .update(codeReviews)
      .set({ 
        status: "failed",
        updatedAt: new Date(),
        feedback: sql`jsonb_set(coalesce(feedback, '{}'::jsonb), '{error}', ${JSON.stringify((error as Error).message)})`
      })
      .where(eq(codeReviews.id, requestData.reviewId));
    
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

// Helper functions for mapping between types
function mapSeverity(severity?: string): "critical" | "major" | "minor" | "suggestion" {
  if (!severity) return "minor";
  
  switch (severity.toLowerCase()) {
    case "high": return "critical";
    case "medium": return "major";
    case "low": return "minor";
    default: return "suggestion";
  }
}

function mapSeverityToType(severity?: string): "Critical" | "High" | "Medium" | "Low" {
  if (!severity) return "Medium";
  
  switch (severity.toLowerCase()) {
    case "high": return "High";
    case "medium": return "Medium";
    case "low": return "Low";
    default: return "Medium";
  }
}

function mapImpact(impact?: string): "Low" | "Medium" | "High" {
  if (!impact) return "Medium";
  
  if (impact.toLowerCase().includes("high")) return "High";
  if (impact.toLowerCase().includes("low")) return "Low";
  return "Medium";
}

function parseQualityScore(qualityText?: string): number {
  if (!qualityText) return 70;
  
  // Try to extract a number from the quality assessment text
  const numberMatch = qualityText.match(/\b(\d{1,3})\b/);
  if (numberMatch && numberMatch[1]) {
    const score = parseInt(numberMatch[1], 10);
    if (score >= 0 && score <= 100) return score;
  }
  
  // Otherwise make a rough guess based on keywords
  if (qualityText.toLowerCase().includes("excellent") || 
      qualityText.toLowerCase().includes("high")) return 85;
  if (qualityText.toLowerCase().includes("good")) return 75;
  if (qualityText.toLowerCase().includes("poor") || 
      qualityText.toLowerCase().includes("low")) return 40;
      
  return 70; // Default middle score
} 