import { NextResponse } from "next/server";
import { db } from "@/lib/supabase/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("Starting database schema fix...");
    
    // Fix repositories table
    await db.execute(
      sql`
        ALTER TABLE repositories 
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS language TEXT,
        ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS url TEXT,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    );
    console.log("Fixed repositories table schema");

    // Fix code_reviews table
    await db.execute(
      sql`
        ALTER TABLE code_reviews 
        ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    );
    console.log("Fixed code_reviews table schema");

    // Fix pull_requests table
    await db.execute(
      sql`
        ALTER TABLE pull_requests 
        ADD COLUMN IF NOT EXISTS github_id INTEGER,
        ADD COLUMN IF NOT EXISTS number INTEGER,
        ADD COLUMN IF NOT EXISTS title TEXT,
        ADD COLUMN IF NOT EXISTS body TEXT,
        ADD COLUMN IF NOT EXISTS state TEXT,
        ADD COLUMN IF NOT EXISTS html_url TEXT,
        ADD COLUMN IF NOT EXISTS diff_url TEXT,
        ADD COLUMN IF NOT EXISTS patch_url TEXT,
        ADD COLUMN IF NOT EXISTS head_branch TEXT,
        ADD COLUMN IF NOT EXISTS base_branch TEXT,
        ADD COLUMN IF NOT EXISTS author TEXT,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS merged_at TIMESTAMP WITH TIME ZONE
      `
    );
    console.log("Fixed pull_requests table schema");

    return NextResponse.json({ 
      success: true, 
      message: "Database schema fixed successfully" 
    });
  } catch (error) {
    console.error("Error fixing database schema:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Error fixing database schema", 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 