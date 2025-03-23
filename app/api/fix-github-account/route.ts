import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/supabase/db';
import { accounts } from '@/lib/supabase/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get the current session
    const session = await auth();
    
    if (!session?.user?.id || !session.accessToken) {
      return NextResponse.json({
        success: false,
        error: "No active session or missing access token",
        action: "Please log in again"
      }, { status: 401 });
    }
    
    const userId = session.user.id;
    const accessToken = session.accessToken;
    
    // Check if account already exists
    const existingAccount = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .limit(1);
      
    if (existingAccount.length > 0) {
      // Update existing account
      await db.execute(sql`
        UPDATE accounts 
        SET access_token = ${accessToken}
        WHERE user_id = ${userId}
      `);
      
      return NextResponse.json({
        success: true,
        message: "GitHub account connection updated",
        action: "refreshed"
      });
    } else {
      // Create new account
      await db.execute(sql`
        INSERT INTO accounts (
          user_id,
          type,
          provider,
          provider_account_id,
          access_token
        ) VALUES (
          ${userId},
          'oauth',
          'github',
          ${userId},
          ${accessToken}
        )
      `);
      
      return NextResponse.json({
        success: true,
        message: "GitHub account connection created",
        action: "created"
      });
    }
  } catch (error) {
    console.error("Error fixing GitHub account:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 