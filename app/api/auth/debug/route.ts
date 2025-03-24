import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Simple check for environment variables
    return NextResponse.json({
      authStatus: "Diagnostic",
      nextAuthVersion: "latest",
      envVars: {
        githubIdExists: !!process.env.GITHUB_ID,
        githubSecretExists: !!process.env.GITHUB_SECRET,
        nodeEnv: process.env.NODE_ENV || "not set"
      }
    });
  } catch (error: any) {
    // Return error information without sensitive details
    return NextResponse.json({
      authStatus: "Error",
      errorMessage: error.message,
      errorName: error.name,
      stack: process.env.NODE_ENV === "development" ? error.stack : null
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; 