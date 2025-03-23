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

    // Define time condition based on period
    let timeCondition;
    if (period === "day") {
      timeCondition = sql`created_at > NOW() - INTERVAL '24 hours'`;
    } else if (period === "week") {
      timeCondition = sql`created_at > NOW() - INTERVAL '7 days'`;
    } else {
      timeCondition = sql`created_at > NOW() - INTERVAL '30 days'`;
    }

    // Get usage data per model
    const modelUsage = await db.execute(sql`
      SELECT 
        model_id,
        model_name,
        COUNT(*) as requests,
        SUM(input_tokens) as input_tokens,
        SUM(output_tokens) as output_tokens,
        SUM(total_tokens) as total_tokens,
        SUM(cost) as cost
      FROM ${llmUsage}
      WHERE ${timeCondition}
      GROUP BY model_id, model_name
      ORDER BY total_tokens DESC
    `);
    
    return NextResponse.json({
      modelUsage
    });
  } catch (error) {
    console.error("Error fetching model usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch model usage data" },
      { status: 500 }
    );
  }
} 