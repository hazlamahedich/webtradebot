import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { GitHubClient } from "@/lib/github/api";

/**
 * Get the authenticated session for server components
 */
export async function getSession() {
  return await getServerSession();
}

/**
 * Check if the user is authenticated in server components
 */
export async function isAuthenticated() {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Get the GitHub API client for the authenticated user
 */
export async function getGitHubClient() {
  const session = await getSession();
  
  if (!session?.accessToken) {
    throw new Error("No GitHub access token available");
  }
  
  return new GitHubClient(session.accessToken);
}

/**
 * Get user ID from session for database operations
 */
export async function getUserId() {
  const session = await getSession();
  return session?.user?.id;
}

/**
 * Fallback authentication for when NextAuth isn't working
 * Checks cookies for direct GitHub authentication
 */
export async function getGitHubCookies() {
  const cookieStore = await cookies();
  
  const userId = cookieStore.get("github_user_id")?.value;
  const userLogin = cookieStore.get("github_user_login")?.value;
  const accessToken = cookieStore.get("github_access_token")?.value;
  
  if (userId && accessToken) {
    return {
      userId,
      userLogin,
      accessToken
    };
  }
  
  return null;
}

/**
 * Create a GitHub client from cookies (fallback method)
 */
export async function getGitHubClientFromCookies() {
  const githubAuth = await getGitHubCookies();
  
  if (!githubAuth?.accessToken) {
    throw new Error("No GitHub access token in cookies");
  }
  
  return new GitHubClient(githubAuth.accessToken);
}

/**
 * Get combined auth - tries NextAuth first, then falls back to cookies
 */
export async function getAuth() {
  const session = await getSession();
  
  if (session?.user) {
    return {
      userId: session.user.id,
      userName: session.user.name,
      accessToken: session.accessToken,
      method: "nextauth"
    };
  }
  
  const githubAuth = await getGitHubCookies();
  
  if (githubAuth) {
    return {
      userId: githubAuth.userId,
      userName: githubAuth.userLogin,
      accessToken: githubAuth.accessToken,
      method: "github-direct"
    };
  }
  
  return null;
} 