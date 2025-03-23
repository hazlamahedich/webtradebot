import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/supabase/db';
import { users, accounts } from '@/lib/supabase/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get current session
    const session = await auth();
    
    // Get all accounts
    const allAccounts = await db.select().from(accounts);
    
    // Get all users
    const allUsers = await db.select().from(users);
    
    // Force account creation if user is logged in
    let accountCreationResult = null;
    
    if (session?.user?.id) {
      try {
        const userId = session.user.id;
        const accountExists = await db
          .select()
          .from(accounts)
          .where(eq(accounts.userId, userId))
          .limit(1);
          
        if (accountExists.length === 0 && session.accessToken) {
          // Create account for user
          accountCreationResult = await db.execute(sql`
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
              ${session.accessToken}
            )
          `);
        }
      } catch (error) {
        accountCreationResult = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    // Return debug information
    return NextResponse.json({
      session: {
        user: session?.user,
        hasAccessToken: !!session?.accessToken,
      },
      accounts: {
        count: allAccounts.length,
        data: allAccounts,
      },
      users: {
        count: allUsers.length,
        data: allUsers,
      },
      accountCreationResult,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 