import { auth } from "@/auth";
import { db } from "@/lib/supabase/db";
import { reviews, pullRequests, repositories } from "@/lib/supabase/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitHubLogoIcon, ExternalLinkIcon } from "@radix-ui/react-icons";
import { formatDistanceToNow } from "date-fns";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    return redirect("/auth/signin");
  }
  
  // Get user repositories
  const userRepos = await db.query.repositories.findMany({
    where: eq(repositories.userId, session.user.id),
    orderBy: [desc(repositories.updatedAt)],
    limit: 5,
  });
  
  // Get recent reviews
  const recentReviews = await db
    .select({
      review: reviews,
      pr: pullRequests,
      repo: repositories,
    })
    .from(reviews)
    .innerJoin(pullRequests, eq(reviews.pullRequestId, pullRequests.id))
    .innerJoin(repositories, eq(pullRequests.repoId, repositories.id))
    .where(eq(repositories.userId, session.user.id))
    .orderBy(desc(reviews.updatedAt))
    .limit(5);
  
  // Get stats
  const stats = await getStats(session.user.id);
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Reviews" 
          value={stats.totalReviews.toString()} 
          description="All-time code reviews"
          href="/dashboard/reviews"
        />
        <StatCard 
          title="Active Repositories" 
          value={stats.totalRepos.toString()} 
          description="Connected repositories"
          href="/dashboard/repositories"
        />
        <StatCard 
          title="Issues Identified" 
          value={stats.totalIssues.toString()} 
          description="Bugs and quality issues found"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Reviews</h2>
            <Link href="/dashboard/reviews" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          
          {recentReviews.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">No reviews yet</CardTitle>
                <CardDescription>
                  Reviews will appear here when you create pull requests in your connected repositories.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Link href="/dashboard/repositories/add">
                  <Button variant="outline" size="sm">Add Repository</Button>
                </Link>
              </CardFooter>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentReviews.map(({ review, pr, repo }) => (
                <Link key={review.id} href={`/dashboard/reviews/${review.id}`}>
                  <Card className="hover:bg-accent/10 transition-colors">
                    <CardHeader className="p-4">
                      <div className="flex justify-between">
                        <div>
                          <CardTitle className="text-base">{pr.title}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {repo.fullName} #{pr.number}
                          </CardDescription>
                        </div>
                        <Badge>{review.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
                      Updated {formatDistanceToNow(new Date(review.updatedAt))} ago
                    </CardFooter>
                  </Card>
                </Link>
              ))}
              
              <div className="mt-4 text-center">
                <Link href="/dashboard/reviews">
                  <Button variant="outline" size="sm">View All Reviews</Button>
                </Link>
              </div>
            </div>
          )}
        </section>
        
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Your Repositories</h2>
            <Link href="/dashboard/repositories" className="text-sm text-primary hover:underline">
              Manage
            </Link>
          </div>
          
          {userRepos.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">No repositories connected</CardTitle>
                <CardDescription>
                  Connect your GitHub repositories to start getting AI-powered code reviews.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Link href="/dashboard/repositories/add">
                  <Button>Connect Repository</Button>
                </Link>
              </CardFooter>
            </Card>
          ) : (
            <div className="space-y-3">
              {userRepos.map((repo) => (
                <Card key={repo.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <GitHubLogoIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">{repo.fullName}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Connected {formatDistanceToNow(new Date(repo.createdAt))} ago
                        </p>
                      </div>
                    </div>
                    <Link href={repo.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLinkIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
              
              <div className="mt-4 text-center">
                <Link href="/dashboard/repositories/add">
                  <Button variant="outline" size="sm">Add Repository</Button>
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  description, 
  href 
}: { 
  title: string; 
  value: string; 
  description: string;
  href?: string;
}) {
  const content = (
    <Card className={href ? "hover:bg-accent/10 transition-colors" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
  
  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  
  return content;
}

async function getStats(userId: string) {
  // Total reviews
  const totalReviewsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(reviews)
    .innerJoin(pullRequests, eq(reviews.pullRequestId, pullRequests.id))
    .innerJoin(repositories, eq(pullRequests.repoId, repositories.id))
    .where(eq(repositories.userId, userId));
  
  // Total repositories
  const totalReposResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(repositories)
    .where(eq(repositories.userId, userId));
  
  // Total issues (bugs + code quality issues)
  const completedReviews = await db
    .select({
      review: reviews,
    })
    .from(reviews)
    .innerJoin(pullRequests, eq(reviews.pullRequestId, pullRequests.id))
    .innerJoin(repositories, eq(pullRequests.repoId, repositories.id))
    .where(
      and(
        eq(repositories.userId, userId),
        eq(reviews.status, "completed")
      )
    );
  
  let totalIssues = 0;
  for (const { review } of completedReviews) {
    if (review.result) {
      try {
        const result = typeof review.result === 'string'
          ? JSON.parse(review.result)
          : review.result;
          
        totalIssues += 
          (result.analysis?.bugs?.length || 0) + 
          (result.analysis?.codeQuality?.length || 0) +
          (result.analysis?.security?.length || 0);
      } catch (error) {
        console.error('Error parsing review result:', error);
      }
    }
  }
  
  return {
    totalReviews: totalReviewsResult[0]?.count || 0,
    totalRepos: totalReposResult[0]?.count || 0,
    totalIssues: totalIssues,
  };
} 