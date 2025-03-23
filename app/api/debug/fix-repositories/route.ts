import { NextResponse } from "next/server";
import { db } from "@/lib/supabase/db";
import { repositories, users, accounts } from "@/lib/supabase/schema";
import { sql, eq } from "drizzle-orm";

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Get all repositories
    const allRepositories = await db.select().from(repositories);
    console.log(`Found ${allRepositories.length} repositories to check`);
    
    // Get all GitHub accounts with provider IDs
    const allAccounts = await db.select().from(accounts).where(eq(accounts.provider, 'github'));
    console.log(`Found ${allAccounts.length} GitHub accounts`);
    
    // Associate repositories with GitHub IDs
    const results = [];
    
    for (const repo of allRepositories) {
      console.log(`Processing repository ${repo.id} for user ${repo.userId}`);
      
      // Find the GitHub account for the owner of the repository
      const repoCreatorAccount = await db
        .select({ 
          owner: users.name, 
          githubId: accounts.providerAccountId,
          userName: users.name
        })
        .from(users)
        .innerJoin(accounts, eq(users.id, accounts.userId))
        .where(
          sql`LOWER(${users.name}) = LOWER(${repo.owner}) AND ${accounts.provider} = 'github'`
        )
        .limit(1);
      
      if (repoCreatorAccount.length > 0) {
        const githubId = repoCreatorAccount[0].githubId;
        console.log(`Found GitHub ID ${githubId} for repository owner ${repo.owner}`);
        
        // Update the repository to be associated with the GitHub ID
        await db.update(repositories)
          .set({ userId: githubId })
          .where(eq(repositories.id, repo.id));
        
        results.push({
          repository: repo.fullName,
          oldUserId: repo.userId,
          newUserId: githubId,
          status: 'updated'
        });
      } else {
        console.log(`No GitHub account found for repository owner ${repo.owner}`);
        results.push({
          repository: repo.fullName,
          userId: repo.userId,
          status: 'skipped',
          reason: 'No GitHub account found for owner'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: allRepositories.length,
      results
    });
  } catch (error) {
    console.error("Error fixing repositories:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Error fixing repositories", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 