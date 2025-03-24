import { DocumentationRequest as DocRequest, DocumentationResult as DocResult } from "./types";
import { generateDocumentation } from "./documentation-generator";
import { db } from "@/lib/supabase/db";
import { documentationRequests } from "@/lib/supabase/schema";
import { eq } from "drizzle-orm";

/**
 * Process documentation in chunks with enhanced memory management
 */
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
    
    // For simplicity, we'll generate documentation in a single chunk for now
    // A more sophisticated implementation would split this into multiple steps
    if (chunkIndex === 0) {
      // Prepare a valid request object
      const fullRequest: DocRequest = {
        repositoryId: currentData.repository_id,
        owner: partialRequest.owner || currentData.owner,
        repo: partialRequest.repo || currentData.repo,
        branch: partialRequest.branch || "main",
        filePaths: partialRequest.filePaths || [],
      };
      
      // Generate documentation
      const docResult = await generateDocumentation(fullRequest);
      result = { ...result, ...docResult };
    }
    
    // Update the database with progress
    await db.update(documentationRequests)
      .set({
        status: chunkIndex === totalChunks - 1 ? "completed" : "processing",
        progress: Math.floor(((chunkIndex + 1) / totalChunks) * 100),
        result: JSON.stringify(result),
        completed_at: chunkIndex === totalChunks - 1 ? new Date() : undefined,
      })
      .where(eq(documentationRequests.id, documentationId));
    
    return result;
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
