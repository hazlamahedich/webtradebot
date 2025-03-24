import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/supabase/db";
import { users, accounts } from "@/lib/supabase/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { 
          status: "unauthenticated", 
          authVersion: "NextAuth.js 4",
          nextVersion: "Next.js 15",
          userId: null,
          error: "No active session found" 
        },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    let dbUserData = null;
    let dbAccountData = null;
    
    // Try to get user data from database
    try {
      const dbUser = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (dbUser.length > 0) {
        dbUserData = {
          id: dbUser[0].id,
          name: dbUser[0].name,
          email: dbUser[0].email,
          gitHubId: dbUser[0].gitHubId,
          gitHubLogin: dbUser[0].gitHubLogin,
        };
      }
      
      // Try to get account data from database
      const dbAccount = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, userId))
        .limit(1);
      
      if (dbAccount.length > 0) {
        dbAccountData = {
          provider: dbAccount[0].provider,
          providerAccountId: dbAccount[0].providerAccountId,
          hasAccessToken: Boolean(dbAccount[0].accessToken),
          hasRefreshToken: Boolean(dbAccount[0].refreshToken),
          expiresAt: dbAccount[0].expiresAt,
          tokenType: dbAccount[0].tokenType,
          scope: dbAccount[0].scope,
        };
      }
    } catch (error) {
      console.error("Error getting user/account data:", error);
    }
    
    // Create diagnostics
    const diagnostics = {
      authState: "authenticated",
      session: {
        userId: session.user.id,
        userName: session.user.name,
        userEmail: session.user.email,
        hasAccessToken: Boolean(session.accessToken),
      },
      database: {
        userFound: Boolean(dbUserData),
        userData: dbUserData,
        accountFound: Boolean(dbAccountData),
        accountData: dbAccountData,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextAuth: process.env.NEXTAUTH_URL || "Not set",
        githubIdSet: Boolean(process.env.GITHUB_ID),
        githubSecretSet: Boolean(process.env.GITHUB_SECRET),
      },
    };
    
    return NextResponse.json(diagnostics);
  } catch (error) {
    console.error("Auth debug error:", error);
    return NextResponse.json(
      { 
        status: "error", 
        message: "Error getting authentication information",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 