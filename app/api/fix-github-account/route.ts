import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/supabase/db';
import { accounts } from '@/lib/supabase/schema';
import { eq, sql, and } from 'drizzle-orm';
import { users } from "@/lib/supabase/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get current session
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          error: "Not authenticated", 
          solution: "Sign in at /auth/signin" 
        },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const accessToken = session.accessToken;
    
    if (!accessToken) {
      return NextResponse.json(
        { 
          error: "No access token in session", 
          solution: "Sign out and sign in again to get a new access token" 
        },
        { status: 400 }
      );
    }
    
    // Check if GitHub account exists in database
    const existingAccount = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.userId, userId),
          eq(accounts.provider, "github")
        )
      )
      .limit(1)
      .catch(error => {
        console.error("Error checking account:", error);
        return [];
      });
    
    let result = {};
    
    if (existingAccount.length > 0) {
      // Update existing account
      await db
        .update(accounts)
        .set({
          accessToken,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(accounts.userId, userId),
            eq(accounts.provider, "github")
          )
        );
      
      result = {
        status: "updated",
        message: "GitHub account connection updated successfully"
      };
    } else {
      // Create new account
      await db
        .insert(accounts)
        .values({
          userId,
          type: "oauth",
          provider: "github",
          providerAccountId: userId,
          accessToken,
          tokenType: "bearer",
          scope: "read:user,user:email,repo",
        });
      
      result = {
        status: "created",
        message: "GitHub account connection created successfully"
      };
    }
    
    // Check if user exists in database, create if not
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .catch(error => {
        console.error("Error checking user:", error);
        return [];
      });
    
    if (existingUser.length === 0) {
      // Create user record
      await db
        .insert(users)
        .values({
          id: userId,
          name: session.user.name || "",
          email: session.user.email || "",
          image: session.user.image || "",
        })
        .catch(error => {
          console.error("Error creating user:", error);
        });
      
      result = {
        ...result,
        userStatus: "created",
        userMessage: "User record created successfully"
      };
    } else {
      result = {
        ...result,
        userStatus: "exists",
        userMessage: "User record already exists"
      };
    }
    
    // Fix repositories if needed - update user_id to match session.user.id
    try {
      // Use the user's GitHub login to find repositories
      const userName = session.user.name;
      if (userName) {
        const fixResult = await db.execute(
          sql`
            UPDATE repositories
            SET user_id = ${userId}
            WHERE owner = ${userName}
          `
        );
        
        result = {
          ...result,
          repositoriesFixed: true,
          repositoriesMessage: "Repositories updated with correct user ID"
        };
      }
    } catch (error) {
      console.error("Error fixing repositories:", error);
      result = {
        ...result,
        repositoriesFixed: false,
        repositoriesError: error instanceof Error ? error.message : String(error)
      };
    }
    
    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Error fixing GitHub account:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fix GitHub account",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 