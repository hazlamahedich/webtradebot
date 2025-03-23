import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/supabase/db";
import { repositories } from "@/lib/supabase/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Get user's repositories
    const userRepos = await db.query.repositories.findMany({
      where: eq(repositories.userId, session.user.id),
      orderBy: (repos) => [repos.fullName],
    });
    
    // Map to a simpler format for the frontend
    const simplifiedRepos = userRepos.map(repo => ({
      id: repo.id,
      fullName: repo.fullName,
      owner: repo.owner,
      name: repo.name,
    }));
    
    return NextResponse.json({
      repositories: simplifiedRepos,
    });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
} 