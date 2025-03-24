import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase/db';
import { sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    console.log("Starting code_reviews schema fix...");
    
    // Fix code_reviews table
    try {
      await db.execute(sql`
        -- Add missing columns to code_reviews table
        ALTER TABLE code_reviews 
        ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      `);
      console.log("Fixed code_reviews table schema");
      
      return NextResponse.json({
        status: 'success',
        message: 'Code reviews schema fixed successfully'
      });
    } catch (error) {
      console.error("Error fixing code_reviews schema:", error);
      return NextResponse.json({
        status: 'error',
        message: 'Failed to fix code_reviews schema',
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in fix-code-reviews route:", error);
    return NextResponse.json({
      status: 'error',
      message: 'An error occurred',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 