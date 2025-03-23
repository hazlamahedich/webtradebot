import { auth } from "@/lib/auth";
import { db } from "@/lib/supabase/db";
import { codeReviews, pullRequests, repositories } from "@/lib/supabase/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Plus } from "lucide-react";

export default async function ReviewsPage() {
  const session = await auth();
  
  if (!session?.user) {
    return <div>You need to be logged in to view this page.</div>;
  }
  
  // Get all reviews for the user's repositories
  const userRepos = await db.query.repositories.findMany({
    where: eq(repositories.userId, session.user.id),
  });
  
  const repoIds = userRepos.map(repo => repo.id);
  
  // If no repos, show empty state
  if (repoIds.length === 0) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Code Reviews</h1>
        <Card>
          <CardHeader>
            <CardTitle>No repositories found</CardTitle>
            <CardDescription>
              Add a GitHub repository to start getting AI-powered code reviews.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/dashboard/repositories">
              <Button>Add Repository</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Get reviews with PR and repo data
  const reviewsData = await db
    .select({
      review: codeReviews,
      pr: pullRequests,
      repo: repositories,
    })
    .from(codeReviews)
    .innerJoin(pullRequests, eq(codeReviews.prId, pullRequests.id))
    .innerJoin(repositories, eq(pullRequests.repoId, repositories.id))
    .where(eq(repositories.userId, session.user.id))
    .orderBy(desc(codeReviews.updatedAt))
    .limit(20);
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Code Reviews</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/reviews/request">
            <Button variant="default" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              Request Review
            </Button>
          </Link>
          <Link href="/dashboard/repositories">
            <Button variant="outline">Manage Repositories</Button>
          </Link>
        </div>
      </div>
      
      <div className="grid gap-4">
        {reviewsData.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No reviews yet</CardTitle>
              <CardDescription>
                When you open pull requests in your connected repositories, they'll show up here for AI review.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/dashboard/reviews/request">
                <Button>Request Your First Review</Button>
              </Link>
            </CardFooter>
          </Card>
        ) : (
          reviewsData.map(({ review, pr, repo }) => (
            <Link key={review.id} href={`/dashboard/reviews/${review.id}`}>
              <Card className="hover:bg-accent/10 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{pr.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {repo.fullName} #{pr.number}
                      </CardDescription>
                    </div>
                    <StatusBadge status={review.status} />
                  </div>
                </CardHeader>
                <CardFooter className="flex justify-between text-sm text-muted-foreground">
                  <div>Updated {formatDistanceToNow(new Date(review.updatedAt))} ago</div>
                  <div>By {pr.author}</div>
                </CardFooter>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    pending: { label: "Pending", variant: "outline" as const },
    in_progress: { label: "In Progress", variant: "secondary" as const },
    completed: { label: "Completed", variant: "default" as const },
    failed: { label: "Failed", variant: "destructive" as const },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  
  return (
    <Badge variant={config.variant}>{config.label}</Badge>
  );
} 