import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase/db';
import { sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';

interface Column {
  column_name: string;
  data_type: string;
}

interface Repository {
  id: string;
  name: string;
  full_name: string;
  user_id: string;
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  console.log("Starting repositories schema fix...");
  
  try {
    // Step 1: Check what columns exist
    const columnsResult = await db.execute(
      sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'repositories'
      `
    );
    
    const columns = columnsResult && typeof columnsResult === 'object' && 'rows' in columnsResult 
      ? (columnsResult.rows as any[] || []).map(row => row.column_name.toLowerCase())
      : [];
    
    console.log("Current repository columns:", columns);
    
    // Step 2: Add missing columns if needed
    const requiredColumns = [
      { name: 'description', type: 'text', default: 'NULL' },
      { name: 'language', type: 'text', default: 'NULL' },
      { name: 'is_private', type: 'boolean', default: 'false' },
      { name: 'url', type: 'text', default: 'NULL' }
    ];
    
    const addedColumns = [];
    
    for (const column of requiredColumns) {
      if (!columns.includes(column.name.toLowerCase())) {
        console.log(`Adding missing column: ${column.name}`);
        
        try {
          await db.execute(
            sql`
              ALTER TABLE repositories 
              ADD COLUMN IF NOT EXISTS ${sql.raw(column.name)} ${sql.raw(column.type)} 
              DEFAULT ${sql.raw(column.default)}
            `
          );
          addedColumns.push(column.name);
        } catch (error) {
          console.error(`Error adding column ${column.name}:`, error);
        }
      }
    }
    
    // Step 3: Update the url field for existing repositories if it was just added
    if (addedColumns.includes('url')) {
      try {
        await db.execute(
          sql`
            UPDATE repositories
            SET url = CONCAT('https://github.com/', full_name)
            WHERE url IS NULL
          `
        );
        console.log("Updated missing URL fields");
      } catch (error) {
        console.error("Error updating URLs:", error);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Repositories schema fixed successfully",
      columnsAdded: addedColumns,
      currentColumns: columns
    });
    
  } catch (error) {
    console.error("Error fixing repositories schema:", error);
    return NextResponse.json(
      { error: `Failed to fix repositories schema: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 