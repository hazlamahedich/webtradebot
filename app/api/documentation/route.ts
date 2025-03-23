import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/supabase/db";
import { startDocumentationGeneration } from "@/lib/ai/documentation-generator";
import { GitHubClient } from "@/lib/github/api";

// Remove Edge Runtime configuration to be compatible with Vercel free tier
// export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { owner, repo, branch, paths } = body;

    if (!owner || !repo || !branch) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Create a unique ID for this documentation request
    const repositoryId = `${owner}/${repo}`;
    const documentationId = `doc_${Date.now()}`;

    // Store the documentation request in the database
    await db.insert({
      id: documentationId,
      repository_id: repositoryId,
      owner,
      repo,
      branch,
      status: "processing",
      created_at: new Date().toISOString(),
      user_id: session.user.id,
    }).into("documentation_requests");

    // Start documentation generation process asynchronously
    // We'll use a background process pattern via webhooks
    await startDocumentationGeneration({
      documentationId,
      repositoryId,
      owner,
      repo,
      branch,
      filePaths: paths || [],
      userId: session.user.id
    });

    // Return immediately with the request ID
    return NextResponse.json({
      id: documentationId,
      status: "processing",
      message: "Documentation generation started"
    });
  } catch (error) {
    console.error("Documentation generation error:", error);
    return NextResponse.json(
      { error: `Failed to generate documentation: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const owner = url.searchParams.get("owner");
    const repo = url.searchParams.get("repo");

    // If ID is provided, get a specific documentation request
    if (id) {
      const documentation = await db
        .select()
        .from("documentation_requests")
        .where({ id })
        .first();

      if (!documentation) {
        return NextResponse.json(
          { error: "Documentation not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(documentation);
    }

    // If owner and repo are provided, get documentation for a repository
    if (owner && repo) {
      const repositoryId = `${owner}/${repo}`;
      const documentations = await db
        .select()
        .from("documentation_requests")
        .where({ repository_id: repositoryId })
        .orderBy("created_at", "desc");

      return NextResponse.json(documentations);
    }

    // Get all documentation requests for the user
    const documentations = await db
      .select()
      .from("documentation_requests")
      .where({ user_id: session.user.id })
      .orderBy("created_at", "desc");

    return NextResponse.json(documentations);
  } catch (error) {
    console.error("Documentation request error:", error);
    return NextResponse.json(
      { error: `Failed to retrieve documentation: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 