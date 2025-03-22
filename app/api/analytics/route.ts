import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/supabase/db";
import { codeReviews, pullRequests, repositories, reviewComments } from "@/lib/supabase/schema";
import { desc, eq, and, sql, count, countDistinct, avg } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get("repository");
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    // Get review trends (monthly)
    const reviewTrend = await db.execute(sql`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as date, 
        COUNT(*) as reviews,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN feedback->>'verdict' = 'approve' THEN 1 END) as approved,
        COUNT(CASE WHEN feedback->>'verdict' = 'request_changes' THEN 1 END) as changesRequested
      FROM code_reviews
      WHERE 
        user_id = ${session.user.id}
        ${repoId && repoId !== 'all' ? sql`AND pr_id IN (SELECT id FROM pull_requests WHERE repo_id = ${repoId})` : sql``}
        ${fromDate ? sql`AND created_at >= ${fromDate}` : sql``}
        ${toDate ? sql`AND created_at <= ${toDate}` : sql``}
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY date
    `);

    // Get issues by type
    const issuesByType = await db.execute(sql`
      WITH issue_types AS (
        SELECT 
          r.id,
          jsonb_array_elements(r.feedback->'issues')->>'type' as issue_type
        FROM code_reviews r
        WHERE 
          r.user_id = ${session.user.id}
          ${repoId && repoId !== 'all' ? sql`AND r.pr_id IN (SELECT id FROM pull_requests WHERE repo_id = ${repoId})` : sql``}
          ${fromDate ? sql`AND r.created_at >= ${fromDate}` : sql``}
          ${toDate ? sql`AND r.created_at <= ${toDate}` : sql``}
      )
      SELECT 
        issue_type as name, 
        COUNT(*) as value
      FROM issue_types
      GROUP BY issue_type
      ORDER BY value DESC
    `);

    // Get issues by severity
    const issuesBySeverity = await db.execute(sql`
      WITH issue_severity AS (
        SELECT 
          r.id,
          jsonb_array_elements(r.feedback->'issues')->>'severity' as severity
        FROM code_reviews r
        WHERE 
          r.user_id = ${session.user.id}
          ${repoId && repoId !== 'all' ? sql`AND r.pr_id IN (SELECT id FROM pull_requests WHERE repo_id = ${repoId})` : sql``}
          ${fromDate ? sql`AND r.created_at >= ${fromDate}` : sql``}
          ${toDate ? sql`AND r.created_at <= ${toDate}` : sql``}
      )
      SELECT 
        severity as name, 
        COUNT(*) as value
      FROM issue_severity
      GROUP BY severity
      ORDER BY 
        CASE 
          WHEN severity = 'Critical' THEN 1
          WHEN severity = 'High' THEN 2
          WHEN severity = 'Medium' THEN 3
          WHEN severity = 'Low' THEN 4
          ELSE 5
        END
    `);

    // Get repository metrics
    const repositoryMetrics = await db.execute(sql`
      SELECT 
        repo.name as name,
        AVG((r.feedback->>'qualityScore')::float) as quality,
        COUNT(DISTINCT jsonb_array_elements(r.feedback->'issues')) as issues,
        COUNT(DISTINCT jsonb_array_elements(r.feedback->'suggestions')) as improvements
      FROM 
        code_reviews r
        JOIN pull_requests pr ON r.pr_id = pr.id
        JOIN repositories repo ON pr.repo_id = repo.id
      WHERE 
        r.user_id = ${session.user.id}
        ${repoId && repoId !== 'all' ? sql`AND repo.id = ${repoId}` : sql``}
        ${fromDate ? sql`AND r.created_at >= ${fromDate}` : sql``}
        ${toDate ? sql`AND r.created_at <= ${toDate}` : sql``}
      GROUP BY repo.name
      ORDER BY quality DESC
    `);

    // Get time to resolve by severity
    const timeToResolve = await db.execute(sql`
      WITH issue_resolution AS (
        SELECT 
          jsonb_array_elements(r.feedback->'issues')->>'severity' as severity,
          EXTRACT(DAY FROM (rc.created_at - r.created_at)) as days_to_resolve
        FROM 
          code_reviews r
          JOIN review_comments rc ON r.id = rc.review_id
        WHERE 
          r.user_id = ${session.user.id}
          AND rc.content LIKE '%Fixed%'
          ${repoId && repoId !== 'all' ? sql`AND r.pr_id IN (SELECT id FROM pull_requests WHERE repo_id = ${repoId})` : sql``}
          ${fromDate ? sql`AND r.created_at >= ${fromDate}` : sql``}
          ${toDate ? sql`AND r.created_at <= ${toDate}` : sql``}
      )
      SELECT 
        severity,
        AVG(days_to_resolve) as time
      FROM issue_resolution
      GROUP BY severity
      ORDER BY 
        CASE 
          WHEN severity = 'Critical' THEN 1
          WHEN severity = 'High' THEN 2
          WHEN severity = 'Medium' THEN 3
          WHEN severity = 'Low' THEN 4
          ELSE 5
        END
    `);

    // Dashboard summary metrics
    const summary = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT r.id) as total_reviews,
        AVG((r.feedback->>'qualityScore')::float) as avg_quality,
        COUNT(DISTINCT jsonb_array_elements(r.feedback->'issues')) as total_issues,
        AVG(EXTRACT(DAY FROM (rc.created_at - r.created_at))) as avg_resolution_days
      FROM 
        code_reviews r
        LEFT JOIN review_comments rc ON r.id = rc.review_id AND rc.content LIKE '%Fixed%'
      WHERE 
        r.user_id = ${session.user.id}
        ${repoId && repoId !== 'all' ? sql`AND r.pr_id IN (SELECT id FROM pull_requests WHERE repo_id = ${repoId})` : sql``}
        ${fromDate ? sql`AND r.created_at >= ${fromDate}` : sql``}
        ${toDate ? sql`AND r.created_at <= ${toDate}` : sql``}
    `);

    return NextResponse.json({
      reviewTrend,
      issuesByType,
      issuesBySeverity,
      repositoryMetrics,
      timeToResolve,
      summary: summary[0],
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
} 