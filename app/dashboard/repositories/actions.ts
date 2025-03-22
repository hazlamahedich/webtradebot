'use server';

import { auth } from "@/auth";
import { db } from "@/lib/supabase/db";
import { repositories } from "@/lib/supabase/schema";
import { eq } from "drizzle-orm";
import { GitHubClient } from "@/lib/github/api";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

// Add a GitHub repository to the user's account
export async function addRepository(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }
    
    const fullName = formData.get('fullName') as string;
    if (!fullName || !fullName.includes('/')) {
      return { success: false, error: 'Invalid repository format' };
    }
    
    const [owner, name] = fullName.split('/');
    
    // Check if repository already exists for this user
    const existingRepo = await db.query.repositories.findFirst({
      where: (repo) => 
        eq(repo.fullName, fullName) && 
        eq(repo.userId, session.user.id),
    });
    
    if (existingRepo) {
      return { success: false, error: 'Repository already connected' };
    }
    
    // Get GitHub access token from session
    const accessToken = session.user.accounts?.[0]?.access_token;
    if (!accessToken) {
      return { success: false, error: 'GitHub access token not found' };
    }
    
    // Verify repository exists and user has access
    const githubClient = new GitHubClient(accessToken);
    try {
      const repoDetails = await githubClient.getRepository(owner, name);
      
      // Add repository to database
      await db.insert(repositories).values({
        id: uuidv4(),
        name: repoDetails.name,
        fullName: repoDetails.full_name,
        owner: repoDetails.owner.login,
        url: repoDetails.html_url,
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        private: repoDetails.private,
      });
      
      revalidatePath('/dashboard/repositories');
      return { success: true };
    } catch (error) {
      console.error('GitHub API error:', error);
      return { success: false, error: 'Repository not found or you do not have access' };
    }
  } catch (error) {
    console.error('Error adding repository:', error);
    return { success: false, error: 'Failed to add repository' };
  }
}

// Remove a GitHub repository from the user's account
export async function removeRepository(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }
    
    const repoId = formData.get('repoId') as string;
    if (!repoId) {
      return { success: false, error: 'Repository ID is required' };
    }
    
    // Verify that the repository belongs to the user
    const repo = await db.query.repositories.findFirst({
      where: (repo) => 
        eq(repo.id, repoId) && 
        eq(repo.userId, session.user.id),
    });
    
    if (!repo) {
      return { success: false, error: 'Repository not found or you do not have access' };
    }
    
    // Delete repository
    await db.delete(repositories).where(eq(repositories.id, repoId));
    
    revalidatePath('/dashboard/repositories');
    return { success: true };
  } catch (error) {
    console.error('Error removing repository:', error);
    return { success: false, error: 'Failed to remove repository' };
  }
} 