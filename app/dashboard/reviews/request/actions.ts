'use server';

import { auth } from "@/lib/auth";
import { GitHubClient } from "@/lib/github/api";
import { createCodeReviewForPR } from "@/lib/ai/pr-review-integration";

interface RequestReviewParams {
  owner: string;
  repo: string;
  pullNumber: number;
}

export async function requestReview(params: RequestReviewParams) {
  try {
    const { owner, repo, pullNumber } = params;
    
    // Authenticate the user
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "You must be logged in to request a review." };
    }
    
    // Get the access token from the session
    const accessToken = session.accessToken;
    if (!accessToken) {
      return { success: false, error: "No GitHub access token found." };
    }
    
    // Initialize GitHub client
    const githubClient = new GitHubClient(accessToken);
    
    // Fetch PR details from GitHub
    try {
      const pullRequest = await githubClient.getPullRequest(owner, repo, pullNumber);
      
      // Create a review for the PR
      const result = await createCodeReviewForPR(
        owner,
        repo,
        pullNumber,
        {
          id: pullRequest.id.toString(),
          number: pullRequest.number,
          title: pullRequest.title,
          body: pullRequest.body,
          state: pullRequest.state,
          html_url: pullRequest.html_url,
          user: {
            login: pullRequest.user.login,
            id: '0', // This is a placeholder, as we don't have the user ID from the API
            avatar_url: pullRequest.user.avatar_url,
          },
          base: {
            repo: {
              id: '0', // This is a placeholder
              full_name: `${owner}/${repo}`,
            },
          },
        }
      );
      
      return result;
    } catch (error) {
      console.error("Error fetching PR details:", error);
      return { 
        success: false, 
        error: "Could not fetch pull request details. Make sure the repository and PR exist and you have access to it."
      };
    }
  } catch (error) {
    console.error("Error requesting review:", error);
    return { 
      success: false, 
      error: `An error occurred: ${(error as Error).message}`
    };
  }
} 