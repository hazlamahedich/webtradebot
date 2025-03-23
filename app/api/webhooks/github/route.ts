import { NextRequest, NextResponse } from "next/server";
import { handlePRWebhook } from "@/lib/ai/pr-documentation-integration";
import { headers } from "next/headers";
import crypto from "crypto";

const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

/**
 * Verifies that the webhook request is from GitHub
 */
function verifyGitHubWebhook(req: Request, payload: string): boolean {
  // If no secret is configured, skip verification (not recommended for production)
  if (!GITHUB_WEBHOOK_SECRET) {
    console.warn("No GitHub webhook secret configured. Skipping signature verification.");
    return true;
  }
  
  const headersList = headers();
  const signature = headersList.get("x-hub-signature-256");
  
  if (!signature) {
    console.error("No signature header found");
    return false;
  }
  
  const hmac = crypto.createHmac("sha256", GITHUB_WEBHOOK_SECRET);
  const digest = "sha256=" + hmac.update(payload).digest("hex");
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

export async function POST(req: NextRequest) {
  try {
    // Get the raw request body
    const payload = await req.text();
    
    // Verify webhook signature
    if (!verifyGitHubWebhook(req, payload)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }
    
    // Parse the payload
    const parsedPayload = JSON.parse(payload);
    
    // Get the event type from the headers
    const headersList = headers();
    const event = headersList.get("x-github-event");
    
    if (!event) {
      return NextResponse.json(
        { error: "No event type provided" },
        { status: 400 }
      );
    }
    
    // Handle pull request events
    if (event === "pull_request") {
      // Process in the background
      // We'll immediately return a 200 response and continue processing
      void handlePRWebhook(event, parsedPayload);
      
      return NextResponse.json({
        message: "Webhook received and processing started",
      });
    }
    
    // For other events, just acknowledge receipt
    return NextResponse.json({
      message: `Webhook received for event: ${event}`,
    });
  } catch (error) {
    console.error("Error processing GitHub webhook:", error);
    return NextResponse.json(
      { error: `Failed to process webhook: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 