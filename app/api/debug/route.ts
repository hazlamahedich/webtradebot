import { db } from "@/lib/supabase/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { users, repositories } from "@/lib/supabase/schema";

export async function GET() {
  try {
    // Get current session
    const session = await auth();
    const currentUserId = session?.user?.id || 'not-authenticated';

    // Get all users
    const allUsers = await db.select().from(users);
    
    // Get all repositories
    const allRepositories = await db.select().from(repositories);
    
    // Get repositories for current user if authenticated
    let currentUserRepos = [];
    if (session?.user?.id) {
      currentUserRepos = allRepositories.filter(
        repo => repo.userId === session.user.id
      );
    }
    
    return NextResponse.json({
      sessionUserId: currentUserId,
      users: allUsers,
      repositories: allRepositories,
      currentUserRepositories: currentUserRepos,
      repositoriesCount: {
        total: allRepositories.length,
        currentUser: currentUserRepos.length
      }
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch debug data" },
      { status: 500 }
    );
  }
} 