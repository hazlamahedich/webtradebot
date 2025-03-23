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

    // Get usage data per feature
    const featureUsage = await db.execute(sql`
      SELECT 
        feature,
        COUNT(*) as requests,
        SUM(input_tokens) as input_tokens,
        SUM(output_tokens) as output_tokens,
        SUM(total_tokens) as total_tokens,
        SUM(cost) as cost
      FROM ${llmUsage}
      WHERE ${timeCondition}
      GROUP BY feature
      ORDER BY total_tokens DESC
    `);
    
    return NextResponse.json({
      featureUsage
    });
  } catch (error) {
    console.error("Error fetching feature usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch feature usage data" },
      { status: 500 }
    );
  }
} 