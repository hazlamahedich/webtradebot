import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    console.log("Starting auth schema fix...");
    
    // Fix accounts table
    try {
      await db.execute(sql`
        ALTER TABLE accounts 
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      `);
      console.log("Added timestamp columns to accounts table");
    } catch (error) {
      console.error("Error adding timestamp columns to accounts:", error);
    }
    
    // Fix users table
    try {
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS github_id INTEGER,
        ADD COLUMN IF NOT EXISTS github_login TEXT;
      `);
      console.log("Added columns to users table");
    } catch (error) {
      console.error("Error adding columns to users:", error);
    }
    
    // Fix sessions table
    try {
      await db.execute(sql`
        ALTER TABLE sessions
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      `);
      console.log("Added timestamp columns to sessions table");
    } catch (error) {
      console.error("Error adding timestamp columns to sessions:", error);
    }
    
    // Fix verification tokens table
    try {
      await db.execute(sql`
        ALTER TABLE verification_tokens
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      `);
      console.log("Added timestamp columns to verification_tokens table");
    } catch (error) {
      console.error("Error adding timestamp columns to verification_tokens:", error);
    }
    
    // Create indexes
    try {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
        CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      `);
      console.log("Created indexes");
    } catch (error) {
      console.error("Error creating indexes:", error);
    }
    
    // Fix documentation_requests table
    try {
      // Try converting UUID columns to TEXT
      await db.execute(sql`
        -- First check if the table exists
        DO $$
        BEGIN
          IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documentation_requests') THEN
            -- Check if the id column is UUID type
            IF EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'documentation_requests' 
              AND column_name = 'id' 
              AND data_type = 'uuid'
            ) THEN
              -- Convert ID from UUID to TEXT if it exists and is UUID
              ALTER TABLE documentation_requests ALTER COLUMN id TYPE TEXT USING id::text;
            END IF;
            
            -- Ensure user_id column exists
            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'documentation_requests' 
              AND column_name = 'user_id'
            ) THEN
              ALTER TABLE documentation_requests ADD COLUMN user_id TEXT;
            END IF;
          ELSE
            -- Create the table if it doesn't exist
            CREATE TABLE documentation_requests (
              id TEXT PRIMARY KEY,
              repository_id TEXT NOT NULL,
              owner TEXT NOT NULL,
              repo TEXT NOT NULL,
              branch TEXT NOT NULL,
              status TEXT DEFAULT 'pending',
              progress INTEGER DEFAULT 0,
              result JSONB,
              user_id TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              completed_at TIMESTAMP WITH TIME ZONE
            );
          END IF;
        END
        $$;
      `);
      
      console.log("Fixed documentation_requests schema");
    } catch (error) {
      console.error("Error fixing documentation_requests:", error);
    }
    
    // Fix other documentation tables if they don't exist
    try {
      await db.execute(sql`
        -- Create documentation components table if it doesn't exist
        CREATE TABLE IF NOT EXISTS documentation_components (
          id UUID PRIMARY KEY,
          doc_id TEXT NOT NULL,
          component_id TEXT NOT NULL,
          component_type TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          file_path TEXT NOT NULL,
          content TEXT NOT NULL,
          quality_score INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create documentation versions table if it doesn't exist
        CREATE TABLE IF NOT EXISTS documentation_versions (
          id UUID PRIMARY KEY,
          doc_id TEXT NOT NULL,
          version TEXT NOT NULL,
          content TEXT NOT NULL,
          created_by TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create documentation diagrams table if it doesn't exist
        CREATE TABLE IF NOT EXISTS documentation_diagrams (
          id UUID PRIMARY KEY,
          doc_id TEXT NOT NULL,
          diagram_type TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      console.log("Fixed documentation related tables");
    } catch (error) {
      console.error("Error fixing documentation tables:", error);
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Auth schema fixed successfully'
    });
  } catch (error) {
    console.error("Error fixing auth schema:", error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fix auth schema',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 