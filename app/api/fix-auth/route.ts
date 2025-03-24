import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/supabase/db";
import { users, accounts } from "@/lib/supabase/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    // Get current session
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No authenticated user. Please sign in first." },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const results = { fixed: false, actions: [] };
    
    // Check if user exists in database
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    // Create user if it doesn't exist
    if (existingUser.length === 0) {
      await db.insert(users).values({
        id: userId,
        name: session.user.name || "",
        email: session.user.email || "",
        image: session.user.image || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      results.actions.push("Created missing user record");
    }
    
    // Check if GitHub account exists
    const existingAccount = await db
      .select()
      .from(accounts)
      .where(
        eq(accounts.userId, userId)
      )
      .limit(1);
    
    // Create GitHub account if it doesn't exist and we have a token
    if (existingAccount.length === 0 && session.accessToken) {
      await db.insert(accounts).values({
        userId,
        type: "oauth",
        provider: "github",
        providerAccountId: userId,
        accessToken: session.accessToken,
        tokenType: "bearer",
        scope: "read:user,user:email,repo",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      results.actions.push("Created missing GitHub account record");
    } else if (existingAccount.length > 0 && session.accessToken) {
      // Update token if it exists but might be outdated
      await db
        .update(accounts)
        .set({
          accessToken: session.accessToken,
          updatedAt: new Date(),
        })
        .where(eq(accounts.userId, userId));
      
      results.actions.push("Updated GitHub access token");
    }
    
    // Check if any actions were performed
    if (results.actions.length > 0) {
      results.fixed = true;
    } else {
      results.actions.push("No issues found to fix");
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fixing auth:", error);
    return NextResponse.json(
      { 
        error: "Failed to fix authentication",
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 