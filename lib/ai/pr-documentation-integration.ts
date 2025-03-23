import { startDocumentationGeneration } from "./documentation-generator";
import { generateUniqueId } from "@/lib/utils";
import { db } from "@/lib/supabase/db";
import { PullRequestDetails } from "./types";

/**
 * Integrates documentation generation with pull request workflow
 */
export async function integrateDocumentationWithPR(
  pullRequest: PullRequestDetails,
  userId: string
): Promise<string> {
  try {
    // 1. Extract relevant files from the PR that need documentation
    const filesToDocument = await extractDocumentableFiles(pullRequest);
    
    if (filesToDocument.length === 0) {
      console.log("No documentable files found in PR");
      return "NO_DOCUMENTABLE_FILES";
    }
    
    // 2. Create a documentation request
    const documentationId = generateUniqueId();
    
    await db.insert({
      id: documentationId,
      user_id: userId,
      repository_id: pullRequest.repository.id,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      result: null,
      pull_request_id: pullRequest.id,
      progress: 0,
    }).into("documentation_requests");
    
    // 3. Start the documentation generation process
    await startDocumentationGeneration({
      documentationId,
      repositoryId: pullRequest.repository.id,
      owner: pullRequest.repository.owner,
      repo: pullRequest.repository.name,
      branch: pullRequest.head.ref,
      filePaths: filesToDocument,
      userId,
    });
    
    return documentationId;
  } catch (error) {
    console.error("Error integrating documentation with PR:", error);
    throw new Error(`Failed to integrate documentation with PR: ${(error as Error).message}`);
  }
}

/**
 * Extracts files that can be documented from a pull request
 */
async function extractDocumentableFiles(pullRequest: PullRequestDetails): Promise<string[]> {
  try {
    // Get the files from the PR
    const { default: fetch } = await import("node-fetch");
    
    const response = await fetch(
      `https://api.github.com/repos/${pullRequest.repository.owner}/${pullRequest.repository.name}/pulls/${pullRequest.number}/files`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    const files = await response.json() as { filename: string, status: string }[];
    
    // Filter for documentable files (e.g., code files, not images, etc.)
    return files
      .filter(file => {
        const extension = file.filename.split('.').pop()?.toLowerCase();
        const documentableExtensions = ['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rb', 'php'];
        
        return (
          extension && 
          documentableExtensions.includes(extension) && 
          !file.filename.includes('test.') && 
          !file.filename.includes('spec.')
        );
      })
      .map(file => file.filename);
  } catch (error) {
    console.error("Error extracting documentable files:", error);
    return [];
  }
}

/**
 * Creates a pull request comment with documentation links
 */
export async function addDocumentationCommentToPR(
  pullRequest: PullRequestDetails,
  documentationId: string
): Promise<void> {
  try {
    const { default: fetch } = await import("node-fetch");
    
    // Get the documentation status
    const docResult = await db
      .select('*')
      .from('documentation_requests')
      .where({ id: documentationId })
      .single();
      
    if (!docResult) {
      throw new Error(`Documentation not found: ${documentationId}`);
    }
    
    // Create a comment body
    let commentBody = `## 📚 Documentation Generated\n\n`;
    commentBody += `iDocument has analyzed your PR and generated documentation for the changes.\n\n`;
    
    if (docResult.status === 'completed') {
      commentBody += `### 🔗 Documentation Links\n\n`;
      commentBody += `- [View Documentation](${process.env.NEXT_PUBLIC_APP_URL}/documentation/${documentationId})\n`;
      commentBody += `- [Download Markdown](${process.env.NEXT_PUBLIC_APP_URL}/api/documentation/export?id=${documentationId}&format=markdown)\n`;
      commentBody += `- [Download HTML](${process.env.NEXT_PUBLIC_APP_URL}/api/documentation/export?id=${documentationId}&format=html)\n`;
      commentBody += `- [Download PDF](${process.env.NEXT_PUBLIC_APP_URL}/api/documentation/export?id=${documentationId}&format=pdf)\n`;
    } else if (docResult.status === 'processing') {
      commentBody += `### ⏳ Documentation is being generated\n\n`;
      commentBody += `Current progress: ${docResult.progress}%\n\n`;
      commentBody += `You'll be notified when the documentation is ready.`;
    } else {
      commentBody += `### ❌ Documentation generation failed\n\n`;
      commentBody += `Please check the [documentation page](${process.env.NEXT_PUBLIC_APP_URL}/documentation/${documentationId}) for more details.`;
    }
    
    // Add the comment to the PR
    const response = await fetch(
      `https://api.github.com/repos/${pullRequest.repository.owner}/${pullRequest.repository.name}/issues/${pullRequest.number}/comments`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: commentBody,
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error adding documentation comment to PR:", error);
    throw new Error(`Failed to add documentation comment to PR: ${(error as Error).message}`);
  }
}

/**
 * Webhook handler for PR events to trigger documentation generation
 */
export async function handlePRWebhook(
  event: string,
  payload: any,
): Promise<void> {
  try {
    // Check if this is a PR open or synchronize event
    if (
      event === 'pull_request' && 
      (payload.action === 'opened' || payload.action === 'synchronize')
    ) {
      const pr: PullRequestDetails = {
        id: payload.pull_request.id.toString(),
        number: payload.pull_request.number,
        title: payload.pull_request.title,
        description: payload.pull_request.body || '',
        status: payload.pull_request.state,
        createdAt: payload.pull_request.created_at,
        updatedAt: payload.pull_request.updated_at,
        user: {
          id: payload.pull_request.user.id.toString(),
          login: payload.pull_request.user.login,
          avatarUrl: payload.pull_request.user.avatar_url,
        },
        head: {
          ref: payload.pull_request.head.ref,
          sha: payload.pull_request.head.sha,
        },
        base: {
          ref: payload.pull_request.base.ref,
          sha: payload.pull_request.base.sha,
        },
        repository: {
          id: payload.repository.id.toString(),
          name: payload.repository.name,
          owner: payload.repository.owner.login,
          url: payload.repository.html_url,
        },
      };
      
      // Find a user to associate with the documentation generation
      // In a real implementation, you'd likely use a bot account or the PR creator
      const { db } = await import("@/lib/supabase/db");
      const orgMembers = await db
        .select('user_id')
        .from('organization_members')
        .where({ 
          organization_id: await getOrganizationIdFromRepo(pr.repository.id)
        })
        .limit(1);
      
      const userId = orgMembers.length > 0 
        ? orgMembers[0].user_id 
        : 'system';
      
      // Start documentation generation
      const documentationId = await integrateDocumentationWithPR(pr, userId);
      
      if (documentationId !== "NO_DOCUMENTABLE_FILES") {
        // Add comment to PR with documentation links
        await addDocumentationCommentToPR(pr, documentationId);
      }
    }
  } catch (error) {
    console.error("Error handling PR webhook:", error);
  }
}

/**
 * Helper function to get organization ID from repository ID
 */
async function getOrganizationIdFromRepo(repoId: string): Promise<string> {
  try {
    const { db } = await import("@/lib/supabase/db");
    const repo = await db
      .select('organization_id')
      .from('repositories')
      .where({ id: repoId })
      .single();
      
    return repo?.organization_id || 'default-org';
  } catch (error) {
    console.error("Error getting organization ID:", error);
    return 'default-org';
  }
} 