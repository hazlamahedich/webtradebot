import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/supabase/db";
import { llmUsage } from "@/lib/supabase/schema";
import { sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // day, week, month

    // Define time condition and grouping based on period
    let timeCondition;
    let dateFormat;
    
    if (period === "day") {
      timeCondition = sql`created_at > NOW() - INTERVAL '24 hours'`;
      dateFormat = sql`TO_CHAR(created_at, 'HH24:00')`;
    } else if (period === "week") {
      timeCondition = sql`created_at > NOW() - INTERVAL '7 days'`;
      dateFormat = sql`TO_CHAR(created_at, 'YYYY-MM-DD')`;
    } else {
      timeCondition = sql`created_at > NOW() - INTERVAL '30 days'`;
      dateFormat = sql`TO_CHAR(created_at, 'YYYY-MM-DD')`;
    }

    // Get daily usage data
    const dailyUsage = await db.execute(sql`
      SELECT 
        ${dateFormat} as date,
        COUNT(*) as requests,
        SUM(input_tokens) as input_tokens,
        SUM(output_tokens) as output_tokens,
        SUM(total_tokens) as total_tokens,
        SUM(cost) as cost
      FROM ${llmUsage}
      WHERE ${timeCondition}
      GROUP BY ${dateFormat}
      ORDER BY date
    `);
    
    return NextResponse.json({
      dailyUsage
    });
  } catch (error) {
    console.error("Error fetching daily usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily usage data" },
      { status: 500 }
    );
  }
} 