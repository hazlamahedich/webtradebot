// Run this script with: node scripts/fix-database.js
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function fixDatabase() {
  console.log('Starting database schema fix...');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not defined in .env.local');
    process.exit(1);
  }
  
  // Create a new pool with a timeout
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 10000,
    statement_timeout: 10000,
  });
  
  try {
    console.log('Connecting to database...');
    
    // Test connection
    await pool.query('SELECT 1');
    console.log('Database connection successful');
    
    // Fix repositories table
    console.log('Fixing repositories table...');
    await pool.query(`
      ALTER TABLE repositories 
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS language TEXT,
      ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS url TEXT,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    `);
    console.log('Fixed repositories table schema');
    
    // Fix code_reviews table
    console.log('Fixing code_reviews table...');
    await pool.query(`
      ALTER TABLE code_reviews 
      ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    `);
    console.log('Fixed code_reviews table schema');
    
    // Fix pull_requests table
    console.log('Fixing pull_requests table...');
    await pool.query(`
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
    `);
    console.log('Fixed pull_requests table schema');
    
    console.log('All database schema fixes completed successfully!');
  } catch (error) {
    console.error('Error fixing database schema:', error);
  } finally {
    // Close pool
    await pool.end();
  }
}

// Run the function
fixDatabase().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 