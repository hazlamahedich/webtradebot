import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/supabase/db";
import { pullRequests, reviews } from "@/lib/supabase/schema";
import { v4 as uuidv4 } from "uuid";
import { reviewStatusEnum } from "@/lib/supabase/schema";
import { startCodeReviewFlow } from "@/lib/ai/code-review";

// Verify GitHub webhook signature
function verifyGitHubWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(signature)
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256") || "";
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || "";
  
  // Verify webhook signature
  if (!verifyGitHubWebhook(body, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const event = request.headers.get("x-github-event");

  // Handle pull request events
  if (event === "pull_request") {
    const { action, pull_request, repository } = payload;
    
    // Process PR opened or synchronized (new commits pushed)
    if (["opened", "synchronize"].includes(action)) {
      // Get repository details
      const repoId = await getRepositoryId(repository.full_name);
      
      if (!repoId) {
        console.error("Repository not found:", repository.full_name);
        return NextResponse.json(
          { error: "Repository not registered" },
          { status: 404 }
        );
      }

      // Check if PR exists
      const existingPR = await getPullRequest(repoId, pull_request.number);
      
      if (existingPR) {
        // Update PR status to trigger a new review
        await db
          .update(pullRequests)
          .set({
            status: "updated",
            updatedAt: new Date(),
          })
          .where((pr) => pr.id.equals(existingPR.id));
          
        // Create a new review for the updated PR
        const reviewId = uuidv4();
        await db.insert(reviews).values({
          id: reviewId,
          pullRequestId: existingPR.id,
          status: reviewStatusEnum.pending,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        // Start code review process
        startCodeReviewFlow({
          owner: repository.owner.login,
          repo: repository.name,
          pullNumber: pull_request.number,
          reviewId,
        });
      } else {
        // Create new PR record
        const prId = uuidv4();
        await db.insert(pullRequests).values({
          id: prId,
          number: pull_request.number,
          title: pull_request.title,
          description: pull_request.body || "",
          status: "pending",
          author: pull_request.user.login,
          url: pull_request.html_url,
          repoId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        // Create initial review
        const reviewId = uuidv4();
        await db.insert(reviews).values({
          id: reviewId,
          pullRequestId: prId,
          status: reviewStatusEnum.pending,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        // Start code review process
        startCodeReviewFlow({
          owner: repository.owner.login,
          repo: repository.name,
          pullNumber: pull_request.number,
          reviewId,
        });
      }
    }
  }

  return NextResponse.json({ success: true });
}

// Helper functions
async function getRepositoryId(fullName: string) {
  const result = await db.query.repositories.findFirst({
    where: (repo) => repo.fullName.equals(fullName),
  });
  return result?.id;
}

async function getPullRequest(repoId: string, prNumber: number) {
  const result = await db.query.pullRequests.findFirst({
    where: (pr) => 
      pr.repoId.equals(repoId) && 
      pr.number.equals(prNumber),
  });
  return result;
} 