import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/db";
import { repositories } from "@/lib/supabase/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "User ID is required" },
      { status: 400 }
    );
  }

  try {
    // Use raw SQL to handle potential schema issues
    const result = await db.execute(
      sql`SELECT COUNT(*) FROM repositories WHERE user_id = ${userId}`
    );
    
    const count = result && typeof result === 'object' && 'rows' in result 
      ? (result.rows?.[0]?.count || 0) 
      : 0;
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching repository count:", error);
    
    if (error instanceof Error && 
        (error.message.includes("CONNECT_TIMEOUT") || 
         error.message.includes("connection") || 
         error.message.includes("timeout"))) {
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch repository count" },
      { status: 500 }
    );
  }
} 