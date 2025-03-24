import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/db";
import { repositories } from "@/lib/supabase/schema";
import { eq, desc, sql } from "drizzle-orm";

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
    // First check the table structure to handle potential schema issues
    const columnsResult = await db.execute(
      sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'repositories'
      `
    );
    
    // Get list of available columns
    const columns = columnsResult && typeof columnsResult === 'object' && 'rows' in columnsResult 
      ? (columnsResult.rows as any[] || []).map(row => row.column_name)
      : [];
    
    console.log("Available repository columns:", columns);
    
    // Build a query selecting only columns that exist
    let selectColumns = `id, full_name`;
    if (columns.includes('description')) selectColumns += `, description`;
    if (columns.includes('language')) selectColumns += `, language`;
    if (columns.includes('is_private')) selectColumns += `, is_private`;
    if (columns.includes('url')) selectColumns += `, url`;
    if (columns.includes('created_at')) selectColumns += `, created_at`;
    if (columns.includes('updated_at')) selectColumns += `, updated_at`;
    
    // Execute the query with only existing columns
    const result = await db.execute(
      sql`
        SELECT ${sql.raw(selectColumns)}
        FROM repositories 
        WHERE user_id = ${userId}
        ORDER BY ${columns.includes('updated_at') ? sql.raw('updated_at') : sql.raw('id')} DESC
        LIMIT 10
      `
    );
    
    // Process the result with fallbacks for missing fields
    const repos = result && typeof result === 'object' && 'rows' in result 
      ? (result.rows as any[] || []).map(repo => ({
          id: repo.id,
          full_name: repo.full_name,
          description: repo.description || '',
          language: repo.language || '',
          is_private: typeof repo.is_private === 'boolean' ? repo.is_private : false,
          url: repo.url || `https://github.com/${repo.full_name}`
        })) 
      : [];
    
    return NextResponse.json({ repositories: repos });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    
    // Check if the error is related to missing columns
    if (error instanceof Error && error.message.includes("column") && error.message.includes("does not exist")) {
      return NextResponse.json(
        { 
          error: "Database schema issue. Try fixing the database schema.", 
          missingColumn: true 
        },
        { status: 422 }
      );
    }
    
    // Check if it's a connection error
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
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
} 