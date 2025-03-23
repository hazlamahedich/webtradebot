import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/db";
import { documentationRequests } from "@/lib/supabase/schema";
import { eq } from "drizzle-orm";
import { processDocumentationChunk } from "@/lib/ai/documentation-generator";

// Remove Edge configuration for Vercel free tier compatibility
// export const runtime = 'edge';
// export const preferredRegion = 'iad1'; // Specify a region with better memory limits if needed

// Constants for chunking and performance
const MAX_CHUNK_SIZE = 200; // Maximum number of files per chunk
const SMALL_CHUNK_THRESHOLD = 30; // Number of files that is considered small
const MAX_EXECUTION_TIME = 8000; // 8 seconds max to stay under Vercel's 10s limit

export async function POST(request: NextRequest) {
  try {
    // Track execution time to avoid timeouts
    const startTime = Date.now();
    
    // Get documentationId from query parameter
    const url = new URL(request.url);
    const documentationId = url.searchParams.get("id");

    if (!documentationId) {
      return NextResponse.json(
        { error: "Missing documentation ID" },
        { status: 400 }
      );
    }

    // Get the documentation request from the database
    const documentationRequest = await db.query.documentationRequests.findFirst({
      where: eq(documentationRequests.id, documentationId),
    });

    if (!documentationRequest) {
      return NextResponse.json(
        { error: "Documentation request not found" },
        { status: 404 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { 
      trigger, 
      chunkIndex = 0, 
      totalChunks = 4, 
      filesProcessed = 0,
      totalFiles = 0,
      filesPaths = []
    } = body;

    // Get total file count on first run
    let currentTotalFiles = totalFiles;
    let currentFilePaths = filesPaths;
    
    if (trigger === "start") {
      try {
        // Fetch repository file list (this would be a real implementation)
        const repoFiles = await fetchRepositoryFiles(
          documentationRequest.owner, 
          documentationRequest.repo, 
          documentationRequest.branch
        );
        
        currentTotalFiles = repoFiles.length;
        currentFilePaths = repoFiles;
        
        // Determine optimal chunk size based on repo size
        const optimizedChunks = calculateOptimalChunks(currentTotalFiles);
        
        // Update the documentation request with initial progress
        await db.update(documentationRequests)
          .set({ 
            progress: 0,
            result: JSON.stringify({
              totalFiles: currentTotalFiles,
              chunksPlanned: optimizedChunks
            })
          })
          .where(eq(documentationRequests.id, documentationId));
      } catch (error) {
        console.error("Error fetching repository files:", error);
        await db.update(documentationRequests)
          .set({ 
            status: "failed",
            result: JSON.stringify({
              error: `Failed to fetch repository files: ${(error as Error).message}`
            })
          })
          .where(eq(documentationRequests.id, documentationId));
          
        return NextResponse.json({
          error: "Failed to fetch repository files",
        }, { status: 500 });
      }
    }

    // Calculate time remaining before potential timeout
    const currentTime = Date.now();
    const timeElapsed = currentTime - startTime;
    const timeRemaining = MAX_EXECUTION_TIME - timeElapsed;
    
    // If we're close to timeout, reschedule immediately
    if (timeRemaining < 1000 && chunkIndex < totalChunks - 1) {
      scheduleNextChunk(url, documentationId, chunkIndex, totalChunks, filesProcessed, currentTotalFiles, currentFilePaths);
      
      return NextResponse.json({
        success: true,
        message: `Rescheduling to avoid timeout at chunk ${chunkIndex + 1}/${totalChunks}`,
        progress: Math.floor((filesProcessed / currentTotalFiles) * 100),
      });
    }

    // Process the current chunk
    if (trigger === "start" || trigger === "process") {
      // Calculate which files to process in this chunk
      const filesPerChunk = Math.ceil(currentTotalFiles / totalChunks);
      const startIndex = chunkIndex * filesPerChunk;
      const endIndex = Math.min(startIndex + filesPerChunk, currentTotalFiles);
      const currentChunkFiles = currentFilePaths.slice(startIndex, endIndex);
      
      try {
        await processDocumentationChunk(
          documentationId,
          chunkIndex,
          totalChunks,
          {
            repositoryId: documentationRequest.repository_id,
            owner: documentationRequest.owner,
            repo: documentationRequest.repo,
            branch: documentationRequest.branch,
            filePaths: currentChunkFiles,
          }
        );
        
        // Update progress in database
        const newFilesProcessed = filesProcessed + currentChunkFiles.length;
        const progressPercent = Math.floor((newFilesProcessed / currentTotalFiles) * 100);
        
        await db.update(documentationRequests)
          .set({ 
            progress: progressPercent,
            status: chunkIndex === totalChunks - 1 ? "completed" : "processing"
          })
          .where(eq(documentationRequests.id, documentationId));

        // If there are more chunks to process, schedule the next one
        if (chunkIndex < totalChunks - 1) {
          scheduleNextChunk(url, documentationId, chunkIndex, totalChunks, newFilesProcessed, currentTotalFiles, currentFilePaths);
        }

        return NextResponse.json({
          success: true,
          message: `Processed documentation chunk ${chunkIndex + 1}/${totalChunks}`,
          progress: progressPercent,
          filesProcessed: newFilesProcessed,
          totalFiles: currentTotalFiles
        });
      } catch (error) {
        console.error(`Error processing chunk ${chunkIndex}:`, error);
        
        // Mark as failed in database
        await db.update(documentationRequests)
          .set({ 
            status: "failed",
            result: JSON.stringify({
              error: `Failed during chunk ${chunkIndex + 1}: ${(error as Error).message}`
            })
          })
          .where(eq(documentationRequests.id, documentationId));
          
        return NextResponse.json({
          error: `Processing failed at chunk ${chunkIndex + 1}: ${(error as Error).message}`,
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      error: "Invalid trigger action",
    }, { status: 400 });
  } catch (error) {
    console.error("Documentation processor error:", error);
    return NextResponse.json(
      { error: `Documentation processing failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

// Schedule the next chunk with a webhook
function scheduleNextChunk(
  url: URL, 
  documentationId: string, 
  currentChunkIndex: number, 
  totalChunks: number,
  filesProcessed: number,
  totalFiles: number,
  filePaths: string[]
) {
  const nextWebhookUrl = new URL(url.pathname, process.env.NEXT_PUBLIC_APP_URL);
  nextWebhookUrl.searchParams.set("id", documentationId);

  // Use setTimeout to avoid blocking
  setTimeout(async () => {
    try {
      await fetch(nextWebhookUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trigger: "process",
          chunkIndex: currentChunkIndex + 1,
          totalChunks,
          filesProcessed,
          totalFiles,
          filePaths
        }),
      });
    } catch (error) {
      console.error("Error scheduling next chunk:", error);
    }
  }, 100);
}

// Calculate optimal number of chunks based on repository size
function calculateOptimalChunks(totalFiles: number): number {
  if (totalFiles <= SMALL_CHUNK_THRESHOLD) {
    return 1; // For small repos, just do it all at once
  }
  
  const chunks = Math.ceil(totalFiles / MAX_CHUNK_SIZE);
  return Math.min(chunks, 10); // Cap at 10 chunks maximum
}

// Fetch repository files from GitHub API
async function fetchRepositoryFiles(owner: string, repo: string, branch: string): Promise<string[]> {
  try {
    // First, get the repository tree from GitHub
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    
    const response = await fetch(treeUrl, {
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
    
    // Filter for files only (not directories) and get their paths
    // Also filter out common non-code files like images, binaries, etc.
    const filePaths = data.tree
      .filter((item: any) => 
        item.type === "blob" && 
        // Basic filter for common code file extensions
        /\.(js|jsx|ts|tsx|py|java|rb|go|rs|php|c|cpp|h|hpp|cs|swift|kt|scala|html|css|scss|md|json|yaml|yml)$/i.test(item.path) &&
        // Exclude common directories and files
        !/^(node_modules|\.git|dist|build|public\/assets|\.next|vendor)\//.test(item.path) &&
        // Exclude common non-code files
        !/\.(png|jpe?g|gif|svg|woff2?|ttf|eot|ico|webp|mp4|webm|mp3|pdf|zip|tar|gz|exe|dll|so|dylib)$/i.test(item.path)
      )
      .map((item: any) => item.path);
    
    // If the repository is very large, limit the files we process
    // to keep processing manageable
    if (filePaths.length > 500) {
      console.log(`Repository has ${filePaths.length} files, limiting to 500 most important files`);
      
      // Prioritize certain file types that are more likely to contain important code
      const priorityFiles = filePaths.filter((path: string) => 
        /\.(tsx?|jsx?)$/.test(path) &&  // TypeScript and JavaScript files
        !/\.test\.|\.spec\./.test(path) // Exclude test files
      );
      
      // Add important configuration files
      const configFiles = filePaths.filter((path: string) => 
        /^(package\.json|tsconfig\.json|next\.config\.js|app\.tsx?|index\.tsx?)$/.test(path) ||
        path === "README.md"
      );
      
      // Combine priority files with config files, deduplicate
      const importantFiles = [...new Set([...configFiles, ...priorityFiles])];
      
      // If we still have too many files, take the first 500
      return importantFiles.slice(0, 500);
    }
    
    return filePaths;
  } catch (error) {
    console.error(`Error fetching repository files: ${(error as Error).message}`);
    // Return empty array on error, the calling code will handle this
    return [];
  }
} 