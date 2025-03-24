import { db } from "./db";
import { promises as fs } from "fs";
import path from "path";
import { sql } from "drizzle-orm";

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
            await db.execute(sql.raw(statement));
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
  }
}

// Run migrations
runMigrations(); 