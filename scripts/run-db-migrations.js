/**
 * Database Migration Script
 * 
 * This script runs all SQL migrations in the lib/supabase/migrations directory
 * Run with: node scripts/run-db-migrations.js
 */

// Load environment variables
require('dotenv').config();

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const postgres = require('postgres');

// Get database connection details from environment variables
const connectionString = process.env.DATABASE_URL || '';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create database clients
const client = postgres(connectionString);
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  console.log("Starting database migrations...");
  
  try {
    // Get all migration files sorted by name
    const migrationsDir = path.join(process.cwd(), "lib/supabase/migrations");
    const migrationFiles = (await fs.readdir(migrationsDir))
      .filter(file => file.endsWith(".sql"))
      .sort(); // Sort alphabetically to ensure correct order
    
    console.log(`Found ${migrationFiles.length} migration files: ${migrationFiles.join(', ')}`);
    
    // Run each migration
    for (const file of migrationFiles) {
      try {
        console.log(`Running migration: ${file}`);
        const migrationContent = await fs.readFile(
          path.join(migrationsDir, file),
          "utf-8"
        );
        
        // Split the SQL into individual statements to handle errors better
        const statements = migrationContent
          .split(';')
          .filter(statement => statement.trim().length > 0)
          .map(statement => statement.trim() + ';');
        
        for (const statement of statements) {
          try {
            await client.unsafe(statement);
            console.log(`Executed statement: ${statement.substring(0, 50)}...`);
          } catch (error) {
            console.error(`Error executing statement in ${file}:`, error);
            console.log(`Problematic statement: ${statement}`);
            // Continue with next statement rather than aborting entire migration
          }
        }
        
        console.log(`Completed migration: ${file}`);
      } catch (error) {
        console.error(`Error processing migration ${file}:`, error);
        // Continue with next migration rather than aborting the entire process
      }
    }
    
    console.log("All migrations completed!");
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  } finally {
    // Close the database connection
    await client.end();
  }
}

// Run migrations
runMigrations(); 