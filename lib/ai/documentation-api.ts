import { generateDocumentation } from "./documentation-generator";
import { processDocumentationChunk } from "./documentation-chunked-processor";
import { db } from "@/lib/supabase/db";
import { documentationRequests } from "@/lib/supabase/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';

// Interface for createDocumentation request
interface CreateDocumentationRequest {
  documentationId: string;
  repositoryId: string;
  owner: string;
  repo: string;
  branch: string;
  // Optional parameters
  userId?: string;
  filePaths?: string[];
}

/**
 * Create and start a documentation generation process
 */
export async function createDocumentation(request: CreateDocumentationRequest): Promise<void> {
  try {
    console.log(`Starting documentation creation for ${request.owner}/${request.repo}`);
    
    // Get repository details if needed
    const filePaths = request.filePaths || [];
    
    // If no explicit file paths provided, we'll process the entire repository
    if (filePaths.length === 0) {
      // This is where you would fetch all relevant files from the repository
      // For now we'll just log that we're processing the entire repo
      console.log(`No file paths provided, will process entire repository`);
      
      // In a real implementation, you would:
      // 1. Fetch repository structure via GitHub API
      // 2. Filter for relevant files (based on extensions, etc.)
      // 3. Add them to filePaths
    }
    
    // Update the database request status to processing
    await db.update(documentationRequests)
      .set({
        status: "processing",
        progress: 5, // Starting progress
      })
      .where(eq(documentationRequests.id, request.documentationId));
    
    // Calculate the number of chunks based on repository size
    // This is a simplified implementation - in a production system you'd base this
    // on the repository size, number of files, etc.
    const totalChunks = calculateChunks(filePaths.length);
    
    // Process in chunks to avoid timeouts and memory issues
    for (let i = 0; i < totalChunks; i++) {
      await processDocumentationChunk(
        request.documentationId,
        i,
        totalChunks,
        {
          repositoryId: request.repositoryId,
          owner: request.owner,
          repo: request.repo,
          branch: request.branch,
          filePaths: filePaths,
        }
      );
      
      // Small delay between chunks to prevent resource contention
      if (i < totalChunks - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Documentation creation completed for ${request.owner}/${request.repo}`);
  } catch (error) {
    console.error(`Error creating documentation: ${(error as Error).message}`);
    
    // Update the database with error status
    await db.update(documentationRequests)
      .set({
        status: "failed",
        result: JSON.stringify({ error: `Failed to create documentation: ${(error as Error).message}` }),
      })
      .where(eq(documentationRequests.id, request.documentationId));
    
    throw error;
  }
}

/**
 * Calculate the appropriate number of chunks based on repository size
 */
function calculateChunks(filesCount: number): number {
  if (filesCount <= 10) {
    return 1; // Small repos can be processed in one go
  } else if (filesCount <= 50) {
    return 2; // Medium repos in two chunks
  } else if (filesCount <= 100) {
    return 4; // Larger repos in four chunks
  } else {
    return 8; // Very large repos in eight chunks
  }
} 