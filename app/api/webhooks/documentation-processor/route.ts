import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/db";
import { documentationRequests } from "@/lib/supabase/schema";
import { eq } from "drizzle-orm";
import { processDocumentationChunk } from "@/lib/ai/documentation-generator";

// Configure as Edge Function for longer timeout
export const runtime = 'edge';
export const preferredRegion = 'iad1'; // Specify a region with better memory limits if needed

export async function POST(request: NextRequest) {
  try {
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
    const { trigger, chunkIndex = 0, totalChunks = 4 } = body;

    // Process the current chunk
    if (trigger === "start" || trigger === "process") {
      await processDocumentationChunk(
        documentationId,
        chunkIndex,
        totalChunks,
        {
          repositoryId: documentationRequest.repository_id,
          owner: documentationRequest.owner,
          repo: documentationRequest.repo,
          branch: documentationRequest.branch,
          filePaths: [],  // This would be populated from partial results in a real implementation
        }
      );

      // If there are more chunks to process, schedule the next one
      if (chunkIndex < totalChunks - 1) {
        // In a real implementation, we would use a proper background job system
        // For Vercel, we can use a webhook to continue processing
        const nextWebhookUrl = new URL(url.pathname, process.env.NEXT_PUBLIC_APP_URL);
        nextWebhookUrl.searchParams.set("id", documentationId);

        // Use setTimeout to avoid blocking the current request
        setTimeout(async () => {
          try {
            await fetch(nextWebhookUrl.toString(), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                trigger: "process",
                chunkIndex: chunkIndex + 1,
                totalChunks,
              }),
            });
          } catch (error) {
            console.error("Error scheduling next chunk:", error);
          }
        }, 100); // Minimal delay just to ensure the current function completes
      }

      return NextResponse.json({
        success: true,
        message: `Processed documentation chunk ${chunkIndex + 1}/${totalChunks}`,
        progress: Math.floor(((chunkIndex + 1) / totalChunks) * 100),
      });
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