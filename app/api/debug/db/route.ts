import { db } from "@/lib/supabase/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { users, repositories, accounts } from "@/lib/supabase/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    // Get current session
    const session = await auth();
    const currentUserId = session?.user?.id || 'not-authenticated';

    // Get all users with detailed columns
    const allUsers = await db.select().from(users);
    
    // Get all repositories
    const allRepositories = await db.select().from(repositories);
    
    // Get all accounts
    const allAccounts = await db.select().from(accounts);
    
    // Raw SQL query for repositories count by user
    const repositoriesByUser = await db.execute(
      sql`SELECT user_id, COUNT(*) as repo_count FROM repositories GROUP BY user_id`
    );
    
    // Get user accounts with join
    const userAccounts = await db.execute(
      sql`SELECT u.id as user_id, u.name, u.email, a.provider, a.provider_account_id
          FROM users u
          LEFT JOIN accounts a ON u.id = a.user_id`
    );
    
    // Current user's repositories
    let currentUserRepos: {
      rawSql: any;
      orm: any[];
      count: number;
    } = {
      rawSql: null,
      orm: [],
      count: 0
    };
    
    if (session?.user?.id) {
      // Try both raw SQL and ORM query
      const rawSqlRepos = await db.execute(
        sql`SELECT * FROM repositories WHERE user_id = ${session.user.id}`
      );
      
      const ormRepos = await db
        .select()
        .from(repositories)
        .where(eq(repositories.userId, session.user.id));
      
      currentUserRepos = {
        rawSql: rawSqlRepos,
        orm: ormRepos,
        count: ormRepos.length
      };
    }
    
    // Check for repositories with no matching user
    const orphanedRepos = await db.execute(
      sql`SELECT r.* FROM repositories r 
          LEFT JOIN users u ON r.user_id = u.id
          WHERE u.id IS NULL`
    );
    
    return NextResponse.json({
      session: {
        userId: currentUserId,
        authenticated: !!session?.user,
        email: session?.user?.email || null
      },
      database: {
        users: {
          count: allUsers.length,
          records: allUsers
        },
        repositories: {
          count: allRepositories.length,
          records: allRepositories
        },
        accounts: {
          count: allAccounts.length,
          records: allAccounts
        },
        stats: {
          repositoriesByUser,
          userAccounts
        },
        diagnostics: {
          currentUserRepos,
          orphanedRepositories: orphanedRepos,
        }
      }
    });
  } catch (error) {
    console.error("Debug DB API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch database debug data", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 