import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(request: Request) {
  try {
    // Get host from request URL instead of headers
    const url = new URL(request.url);
    const host = url.host || "unknown";
    
    // Get environment variables for debugging
    // Be careful not to expose sensitive data in production
    const env = {
      // Only return masked versions of secrets
      clientId: process.env.GITHUB_ID || null,
      clientSecret: process.env.GITHUB_SECRET ? "***" : null, // Only return if it exists, not the actual value
      nextAuthUrl: process.env.NEXTAUTH_URL || null,
      nextAuthSecret: process.env.NEXTAUTH_SECRET ? "***" : null,
      hostname: host,
      nodeEnv: process.env.NODE_ENV || "development"
    };
    
    // In production, only return limited info
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({
        hostname: env.hostname,
        nodeEnv: env.nodeEnv,
        clientId: env.clientId ? "Set" : "Not set",
        clientSecret: env.clientSecret ? "Set" : "Not set",
        nextAuthUrl: env.nextAuthUrl ? "Set" : "Not set"
      });
    }
    
    return NextResponse.json(env);
  } catch (error) {
    console.error("Error getting environment info:", error);
    return NextResponse.json(
      { error: "Failed to get environment information" },
      { status: 500 }
    );
  }
} 