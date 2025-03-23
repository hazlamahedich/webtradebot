import { db } from "@/lib/supabase/db";
import { repositories, pullRequests, codeReviews } from "@/lib/supabase/schema";
import { eq } from "drizzle-orm";
import { GitHubClient } from "@/lib/github/api";
import { startCodeReviewFlow } from "./code-review";
import { v4 as uuidv4 } from "uuid";

// Extended PullRequestDetails interface that matches our needs
interface ExtendedPullRequestDetails {
  id: string;
  number: number;
  title: string;
  body?: string;
  state?: string;
  html_url?: string;
  user: {
    login: string;
    id: string;
    avatar_url?: string;
  };
  base: {
    repo: {
      id: string;
      full_name: string;
    };
  };
  additions?: number;
  deletions?: number;
}

/**
 * Creates a new code review for a pull request
 */
export async function createCodeReviewForPR(
  owner: string,
  repo: string,
  pullNumber: number,
  pullRequest: ExtendedPullRequestDetails
): Promise<{ success: boolean; reviewId?: string; error?: string }> {
  try {
    console.log(`Creating code review for PR #${pullNumber} in ${owner}/${repo}`);
    
    // Find the repository in our database
    const repositoryData = await db.query.repositories.findFirst({
      where: (r) => 
        eq(r.owner, owner) && 
        eq(r.name, repo),
    });
    
    if (!repositoryData) {
      console.log(`Repository ${owner}/${repo} not found in database`);
      return { success: false, error: "Repository not found in database" };
    }
    
    // Check if PR already exists in our database
    const existingPR = await db.query.pullRequests.findFirst({
      where: (pr) => 
        eq(pr.repoId, repositoryData.id) && 
        eq(pr.number, pullNumber),
    });
    
    let prId: string;
    
    if (!existingPR) {
      // Create PR record if it doesn't exist
      const [newPR] = await db.insert(pullRequests).values({
        repoId: repositoryData.id,
        number: pullNumber,
        title: pullRequest.title,
        description: pullRequest.body || "",
        status: pullRequest.state || "open",
        author: pullRequest.user.login,
        url: pullRequest.html_url || `https://github.com/${owner}/${repo}/pull/${pullNumber}`,
      }).returning();
      
      prId = newPR.id;
    } else {
      // Update PR if it exists
      await db.update(pullRequests)
        .set({
          title: pullRequest.title,
          description: pullRequest.body || "",
          status: pullRequest.state || "open",
          updatedAt: new Date(),
        })
        .where(eq(pullRequests.id, existingPR.id));
      
      prId = existingPR.id;
    }
    
    // Check if review already exists
    const existingReview = await db.query.codeReviews.findFirst({
      where: (cr) => eq(cr.prId, prId),
    });
    
    // If review exists and is not failed, don't create a new one
    if (existingReview && existingReview.status !== "failed") {
      console.log(`Review already exists for PR #${pullNumber} with ID ${existingReview.id}`);
      return { success: true, reviewId: existingReview.id };
    }
    
    // Create a new review
    const reviewId = existingReview?.id || uuidv4();
    
    if (existingReview) {
      // Update existing review if it failed
      await db.update(codeReviews)
        .set({
          status: "pending",
          updatedAt: new Date(),
        })
        .where(eq(codeReviews.id, reviewId));
    } else {
      // Create new review
      await db.insert(codeReviews).values({
        id: reviewId,
        status: "pending",
        prId,
        userId: repositoryData.userId,
      });
    }
    
    // Start the review flow
    await startCodeReviewFlow({
      reviewId,
      owner,
      repo,
      pullNumber,
    });
    
    return { success: true, reviewId };
  } catch (error) {
    console.error("Error creating code review:", error);
    return { 
      success: false, 
      error: `Failed to create code review: ${(error as Error).message}` 
    };
  }
}

/**
 * Post a comment with review results on the PR
 */
export async function postReviewCommentOnPR(
  owner: string,
  repo: string,
  pullNumber: number,
  reviewId: string
): Promise<void> {
  try {
    // Get the review data
    const reviewData = await db
      .select({
        review: codeReviews,
        pr: pullRequests,
      })
      .from(codeReviews)
      .innerJoin(pullRequests, eq(codeReviews.prId, pullRequests.id))
      .where(eq(codeReviews.id, reviewId))
      .limit(1);
    
    if (reviewData.length === 0) {
      console.error(`Review ${reviewId} not found`);
      return;
    }
    
    const { review } = reviewData[0];
    
    // Skip if review is not completed
    if (review.status !== "completed") {
      return;
    }
    
    // Get GitHub token from environment (in production, would get from user's account)
    const accessToken = process.env.GITHUB_ACCESS_TOKEN as string;
    if (!accessToken) {
      console.error("No GitHub access token found");
      return;
    }
    
    const githubClient = new GitHubClient(accessToken);
    
    // Parse the review result (handle potential schema differences)
    // We'll need to use 'any' here since the database schema might not match our types exactly
    const reviewResult = (review as any).result 
      ? (typeof (review as any).result === 'string' ? JSON.parse((review as any).result) : (review as any).result)
      : null;
    
    if (!reviewResult) {
      console.error(`No review result found for review ${reviewId}`);
      return;
    }
    
    // Create comment text
    let commentBody = `## 🤖 AI Code Review\n\n`;
    
    // Add summary section
    if (reviewResult.summary) {
      commentBody += `### Summary\n\n${reviewResult.summary.overview}\n\n`;
      
      if (reviewResult.summary.keyPoints && reviewResult.summary.keyPoints.length > 0) {
        commentBody += `**Key Points:**\n`;
        reviewResult.summary.keyPoints.forEach((point: string) => {
          commentBody += `- ${point}\n`;
        });
        commentBody += `\n`;
      }
    }
    
    // Add important findings (top issues)
    if (reviewResult.analysis) {
      const allIssues = [
        ...(reviewResult.analysis.bugs || []).map((issue: any) => ({ 
          ...issue, 
          type: "Potential Bug",
          priority: issue.severity === "high" ? 1 : (issue.severity === "medium" ? 2 : 3)
        })),
        ...(reviewResult.analysis.security || []).map((issue: any) => ({ 
          ...issue, 
          type: "Security Issue",
          priority: issue.severity === "high" ? 1 : (issue.severity === "medium" ? 2 : 3)
        })),
      ];
      
      // Sort by priority and take top 3
      const topIssues = allIssues
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 3);
      
      if (topIssues.length > 0) {
        commentBody += `### Key Issues\n\n`;
        topIssues.forEach((issue) => {
          commentBody += `**${issue.type}: ${issue.description}**\n`;
          if (issue.location) {
            commentBody += `Location: ${issue.location}\n`;
          }
          commentBody += `\n`;
        });
      }
    }
    
    // Add link to full review
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    commentBody += `[View Full Review](${appUrl}/dashboard/reviews/${reviewId})\n`;
    
    // Post comment
    await githubClient.createPRComment(owner, repo, pullNumber, commentBody);
    
    console.log(`Posted review comment on ${owner}/${repo}#${pullNumber}`);
  } catch (error) {
    console.error("Error posting review comment:", error);
  }
}

/**
 * Process a PR event to create or update a code review
 */
export async function handlePRReviewEvent(
  event: string,
  payload: any
): Promise<void> {
  try {
    // Check if this is a PR open or synchronize event
    if (
      event === 'pull_request' && 
      (payload.action === 'opened' || payload.action === 'synchronize')
    ) {
      const owner = payload.repository.owner.login;
      const repo = payload.repository.name;
      const pullNumber = payload.pull_request.number;
      
      console.log(`Processing PR event: ${payload.action} for ${owner}/${repo}#${pullNumber}`);
      
      // Create a ExtendedPullRequestDetails object
      const pr: ExtendedPullRequestDetails = {
        id: payload.pull_request.id.toString(),
        number: payload.pull_request.number,
        title: payload.pull_request.title,
        body: payload.pull_request.body || '',
        state: payload.pull_request.state,
        html_url: payload.pull_request.html_url,
        user: {
          login: payload.pull_request.user.login,
          id: payload.pull_request.user.id.toString(),
          avatar_url: payload.pull_request.user.avatar_url,
        },
        base: {
          repo: {
            id: payload.repository.id.toString(),
            full_name: payload.repository.full_name,
          },
        },
        additions: payload.pull_request.additions || 0,
        deletions: payload.pull_request.deletions || 0,
      };
      
      // Create or update code review
      const result = await createCodeReviewForPR(owner, repo, pullNumber, pr);
      
      if (result.success && result.reviewId) {
        console.log(`Code review created with ID: ${result.reviewId}`);
        
        // Wait for the review to complete before posting comment
        // In a production app, this would be handled by a background job
        setTimeout(async () => {
          await postReviewCommentOnPR(owner, repo, pullNumber, result.reviewId!);
        }, 60000); // Check after 1 minute
      } else {
        console.error(`Failed to create code review: ${result.error}`);
      }
    }
  } catch (error) {
    console.error("Error handling PR review event:", error);
  }
} 