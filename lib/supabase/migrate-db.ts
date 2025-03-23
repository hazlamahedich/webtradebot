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
    
    console.log(`Found ${migrationFiles.length} migration files.`);
    
    // Run each migration
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const migrationContent = await fs.readFile(
        path.join(migrationsDir, file),
        "utf-8"
      );
      
      // Execute the SQL using raw SQL wrapper
      await db.execute(sql.raw(migrationContent));
      
      console.log(`Completed migration: ${file}`);
    }
    
    console.log("All migrations completed successfully!");
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
}

// Run migrations
runMigrations(); 