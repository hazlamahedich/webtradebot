import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    console.log("Starting pull_requests schema fix...");
    
    // Fix pull_requests table
    try {
      await db.execute(sql`
        -- Add missing columns to pull_requests table
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
        ADD COLUMN IF NOT EXISTS merged_at TIMESTAMP WITH TIME ZONE;
      `);
      console.log("Fixed pull_requests table schema");
      
      return NextResponse.json({
        status: 'success',
        message: 'Pull requests schema fixed successfully'
      });
    } catch (error) {
      console.error("Error fixing pull_requests schema:", error);
      return NextResponse.json({
        status: 'error',
        message: 'Failed to fix pull_requests schema',
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in fix-pull-requests route:", error);
    return NextResponse.json({
      status: 'error',
      message: 'An error occurred',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 