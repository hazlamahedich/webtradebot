import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eq, and, or, desc } from "drizzle-orm";
import { db } from "@/lib/supabase/db";
import { 
  repositories, 
  users, 
  documentationRequests,
} from "@/lib/supabase/schema";
import { createDocumentation } from "@/lib/ai/documentation-api";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    // Get the user's documentation requests
    const requests = await db
      .select({
        id: documentationRequests.id,
        repositoryId: documentationRequests.repository_id,
        repositoryName: repositories.name,
        status: documentationRequests.status,
        createdAt: documentationRequests.created_at,
        updatedAt: documentationRequests.created_at, // using created_at since updated_at doesn't exist
        progress: documentationRequests.progress,
      })
      .from(documentationRequests)
      .leftJoin(repositories, eq(documentationRequests.repository_id, repositories.id))
      .where(eq(documentationRequests.user_id, session.user.id))
      .orderBy(desc(documentationRequests.created_at));
    
    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching documentation requests:", error);
    return NextResponse.json(
      { error: `Failed to fetch documentation requests: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate request
    if (!body.repositoryId) {
      return NextResponse.json({ error: "Repository ID is required" }, { status: 400 });
    }
    
    // Check if the repository belongs to the user
    const repository = await db
      .select()
      .from(repositories)
      .where(eq(repositories.id, body.repositoryId))
      .limit(1);
    
    if (!repository.length || repository[0].userId !== session.user.id) {
      return NextResponse.json({ error: "Repository not found or access denied" }, { status: 404 });
    }
    
    // Check if there's already a pending or in-progress request for this repository
    const existingRequests = await db
      .select()
      .from(documentationRequests)
      .where(
        and(
          eq(documentationRequests.repository_id, body.repositoryId),
          or(
            eq(documentationRequests.status, "pending"),
            eq(documentationRequests.status, "processing")
          )
        )
      )
      .limit(1);
    
    if (existingRequests.length > 0) {
      return NextResponse.json(
        { error: "There is already a pending or in-progress documentation request for this repository" },
        { status: 409 }
      );
    }
    
    // Create a new documentation request with a generated ID
    const newRequestId = crypto.randomUUID();
    
    // Create a new documentation request
    const newRequest = await db
      .insert(documentationRequests)
      .values({
        id: newRequestId,
        repository_id: body.repositoryId,
        owner: repository[0].owner,
        repo: repository[0].name,
        branch: body.branch || "main", // Default to main branch
        status: "pending",
        progress: 0,
        user_id: session.user.id,
      })
      .returning();
    
    // Start the documentation generation process
    if (newRequest.length > 0) {
      const repo = repository[0];
      
      void createDocumentation({
        documentationId: newRequest[0].id,
        repositoryId: repo.id,
        owner: repo.owner,
        repo: repo.name,
        branch: body.branch || "main",
      });
    }
    
    return NextResponse.json(newRequest[0]);
  } catch (error) {
    console.error("Error creating documentation request:", error);
    return NextResponse.json(
      { error: `Failed to create documentation request: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 