'use server';

import { auth } from "@/lib/auth";
import { db } from "@/lib/supabase/db";
import { repositories, users, accounts } from "@/lib/supabase/schema";
import { eq, sql } from "drizzle-orm";
import { GitHubClient } from "@/lib/github/api";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { redirect } from "next/navigation";

// Add a GitHub repository to the user's account
export async function addRepository(formData: FormData) {
  const fullName = formData.get('fullName') as string;
  const forceAdd = formData.get('forceAdd') === 'true';
  
  console.log(`Adding repository with name: ${fullName}, forceAdd: ${forceAdd}`);

  if (!fullName) {
    return { success: false, error: 'Repository name is required' };
  }

  try {
    // Get the user from the session
    const session = await auth();
    
    if (!session?.user?.id) {
      console.log('No session or user ID found');
      return { success: false, error: 'You must be logged in to add a repository' };
    }

    const userId = session.user.id;
    
    console.log(`User ID from session: ${userId}`);
    console.log(`Checking if repository ${fullName} already exists for user ${userId}`);
    
    // Get all repositories for this user to check
    const allUserRepos = await db
      .select()
      .from(repositories)
      .where(eq(repositories.userId, userId));
      
    console.log(`All user repositories: ${JSON.stringify(allUserRepos, null, 2)}`);
    
    // Check if any repository matches (case insensitive)
    const existingRepo = allUserRepos.find(
      repo => repo.fullName.toLowerCase() === fullName.toLowerCase()
    );
    
    if (existingRepo && !forceAdd) {
      console.log(`Repository already exists with ID: ${existingRepo.id}`);
      return { 
        success: false, 
        error: `Repository ${fullName} is already connected`,
        forceAddOption: true 
      };
    }

    // Get the token from the account
    console.log(`Retrieving GitHub account for user ID: ${userId}`);
    
    // First check if user exists
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
      
    console.log(`User exists check: ${userExists.length > 0 ? 'Yes' : 'No'}`);
    if (userExists.length > 0) {
      console.log(`User details: ${JSON.stringify(userExists[0], null, 2)}`);
    }
    
    // Check accounts table status
    const allAccounts = await db
      .select()
      .from(accounts);
      
    console.log(`Total accounts in database: ${allAccounts.length}`);
    
    // Get the specific account
    const account = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .limit(1);

    console.log(`GitHub account query result: ${JSON.stringify(account, null, 2)}`);
    
    if (!account || account.length === 0) {
      console.log('No GitHub account found for user');
      
      // Additional diagnostic info - check if account exists with different casing
      const allAccountsRaw = await db.execute(sql`SELECT * FROM accounts`);
      console.log(`All accounts raw: ${JSON.stringify(allAccountsRaw, null, 2)}`);
      
      return { success: false, error: 'No GitHub account connected' };
    }

    const token = account[0].access_token;
    
    if (!token) {
      console.log('No access token found');
      return { success: false, error: 'No GitHub access token found' };
    }

    // Call the GitHub API to get the repository details
    console.log(`Calling GitHub API for repository: ${fullName}`);
    const response = await fetch(`https://api.github.com/repos/${fullName}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      console.log(`GitHub API error: ${response.status} ${response.statusText}`);
      return { 
        success: false, 
        error: 'Repository not found on GitHub or access denied' 
      };
    }

    const repo = await response.json();
    console.log(`GitHub API response: ${JSON.stringify(repo, null, 2)}`);

    // Insert into database
    const result = await db.insert(repositories).values({
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner.login,
      url: repo.html_url,
      userId: userId,
    }).returning();

    console.log(`Repository created successfully: ${JSON.stringify(result, null, 2)}`);

    return { success: true };
  } catch (error) {
    console.error('Error adding repository:', error);
    return { 
      success: false, 
      error: `Error adding repository: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

// Remove a GitHub repository from the user's account
export async function removeRepository(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return; // Just return void to make TypeScript happy
    }
    
    const repoId = formData.get('repoId') as string;
    if (!repoId) {
      return;
    }
    
    // Verify that the repository belongs to the user
    const repo = await db.query.repositories.findFirst({
      where: (repo) => 
        eq(repo.id, repoId) && 
        eq(repo.userId, session.user.id),
    });
    
    if (!repo) {
      return;
    }
    
    // Delete repository
    await db.delete(repositories).where(eq(repositories.id, repoId));
    
    revalidatePath('/dashboard/repositories');
  } catch (error) {
    console.error('Error removing repository:', error);
  }
} 