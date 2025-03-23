import { auth } from "@/lib/auth";
import { db } from "@/lib/supabase/db";
import { codeReviews, pullRequests, repositories } from "@/lib/supabase/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";

export default async function ReviewDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  
  if (!session?.user) {
    return <div>You need to be logged in to view this page.</div>;
  }
  
  // Get the review with PR and repo data
  const reviewData = await db
    .select({
      review: codeReviews,
      pr: pullRequests,
      repo: repositories,
    })
    .from(codeReviews)
    .innerJoin(pullRequests, eq(codeReviews.prId, pullRequests.id))
    .innerJoin(repositories, eq(pullRequests.repoId, repositories.id))
    .where(eq(codeReviews.id, params.id))
    .limit(1);
  
  if (reviewData.length === 0) {
    return notFound();
  }
  
  const { review, pr, repo } = reviewData[0];
  
  // If the repository doesn't belong to the user, deny access
  if (repo.userId !== session.user.id) {
    return <div>You don't have permission to view this review.</div>;
  }
  
  // Parse the review result JSON if completed
  const reviewResult = review.status === "completed" && review.result 
    ? (typeof review.result === 'string' ? JSON.parse(review.result) : review.result)
    : null;

  return (
    <div className="container py-6">
      <div className="mb-6">
        <Link href="/dashboard/reviews" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to reviews
        </Link>
      </div>
      
      <div className="grid gap-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{pr.title}</h1>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <span>{repo.fullName} #{pr.number}</span>
              <Badge>{review.status}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={pr.url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <ExternalLink className="h-4 w-4" />
                View PR
              </Button>
            </Link>
            <form action={refreshReview}>
              <input type="hidden" name="reviewId" value={review.id} />
              <Button 
                type="submit" 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                disabled={review.status === 'pending' || review.status === 'in_progress'}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </form>
          </div>
        </div>
        
        {(review.status === 'pending' || review.status === 'in_progress') && (
          <Card>
            <CardHeader>
              <CardTitle>Review in progress</CardTitle>
              <CardDescription>
                Our AI is analyzing the code changes. This might take a few minutes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {review.status === 'failed' && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle>Review failed</CardTitle>
              <CardDescription>
                There was an error processing this review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-destructive/10 rounded-md">
                <p className="text-destructive">Error: {review.error || "Unknown error"}</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {review.status === 'completed' && reviewResult && (
          <Tabs defaultValue="summary" className="mt-4">
            <TabsList className="mb-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              <TabsTrigger value="explanation">Explanation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary">
              <SummaryTab summary={reviewResult.summary} />
            </TabsContent>
            
            <TabsContent value="analysis">
              <AnalysisTab analysis={reviewResult.analysis} />
            </TabsContent>
            
            <TabsContent value="suggestions">
              <SuggestionsTab suggestions={reviewResult.suggestions} />
            </TabsContent>
            
            <TabsContent value="explanation">
              <ExplanationTab explanation={reviewResult.explanation} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function SummaryTab({ summary }: { summary: any }) {
  if (!summary) return <div>No summary available</div>;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Summary</CardTitle>
        <CardDescription>
          Overall assessment of the pull request
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Overview</h3>
          <p className="text-muted-foreground">{summary.overview}</p>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Key Points</h3>
          <ul className="list-disc pl-5 space-y-1">
            {summary.keyPoints.map((point: string, i: number) => (
              <li key={i} className="text-muted-foreground">{point}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Quality Assessment</h3>
          <p className="text-muted-foreground">{summary.qualityAssessment}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalysisTab({ analysis }: { analysis: any }) {
  if (!analysis) return <div>No analysis available</div>;

  const sections = [
    { key: 'bugs', title: 'Potential Bugs', severity: true },
    { key: 'codeQuality', title: 'Code Quality Issues', severity: false },
    { key: 'performance', title: 'Performance Concerns', severity: false },
    { key: 'security', title: 'Security Vulnerabilities', severity: true },
    { key: 'architecture', title: 'Architectural Considerations', severity: false },
  ];
  
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <Card key={section.key}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {analysis[section.key]?.length > 0 ? (
              <ul className="space-y-4">
                {analysis[section.key].map((item: any, i: number) => (
                  <li key={i} className="border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{item.description}</p>
                        {item.location && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Location: {item.location}
                          </p>
                        )}
                      </div>
                      {section.severity && item.severity && (
                        <SeverityBadge severity={item.severity} />
                      )}
                    </div>
                    {item.impact && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Impact: {item.impact}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No issues found</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SuggestionsTab({ suggestions }: { suggestions: any[] }) {
  if (!suggestions || suggestions.length === 0) {
    return <div>No suggestions available</div>;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Improvement Suggestions</CardTitle>
        <CardDescription>
          Actionable recommendations to improve the code
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-6">
          {suggestions.map((suggestion, i) => (
            <li key={i} className="border-b pb-5 last:border-0 last:pb-0">
              <h3 className="font-semibold mb-1">{suggestion.target}</h3>
              <p className="mb-2 text-muted-foreground">{suggestion.description}</p>
              
              <div className="mb-2">
                <p className="text-sm font-medium">Rationale:</p>
                <p className="text-sm text-muted-foreground">{suggestion.rationale}</p>
              </div>
              
              {suggestion.location && (
                <div className="mb-2">
                  <p className="text-sm font-medium">Location:</p>
                  <p className="text-sm text-muted-foreground">{suggestion.location}</p>
                </div>
              )}
              
              {suggestion.codeExample && (
                <div>
                  <p className="text-sm font-medium mb-1">Suggested code:</p>
                  <pre className="p-3 bg-muted rounded-md text-sm overflow-x-auto">
                    <code>{suggestion.codeExample}</code>
                  </pre>
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ExplanationTab({ explanation }: { explanation: any }) {
  if (!explanation) return <div>No explanation available</div>;
  
  const sections = [
    { key: 'summary', title: 'Summary' },
    { key: 'functionalChanges', title: 'Functional Changes' },
    { key: 'impact', title: 'Impact' },
    { key: 'technicalDecisions', title: 'Technical Decisions' },
    { key: 'architecturalContext', title: 'Architectural Context' },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plain English Explanation</CardTitle>
        <CardDescription>
          Human-readable explanation of the code changes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map((section) => (
          <div key={section.key}>
            <h3 className="font-semibold mb-2">{section.title}</h3>
            <p className="text-muted-foreground">{explanation[section.key]}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const config = {
    high: { bg: "bg-destructive", text: "text-destructive-foreground" },
    medium: { bg: "bg-amber-500", text: "text-white" },
    low: { bg: "bg-muted", text: "text-muted-foreground" },
  };
  
  const style = config[severity as keyof typeof config] || config.low;
  
  return (
    <span className={`text-xs px-2 py-1 rounded-md font-medium ${style.bg} ${style.text}`}>
      {severity}
    </span>
  );
}

// Server action to refresh a review
async function refreshReview(formData: FormData) {
  'use server'
  
  const reviewId = formData.get('reviewId') as string;
  
  // Get the existing review data
  const reviewData = await db
    .select({
      review: codeReviews,
      pr: pullRequests,
      repo: repositories,
    })
    .from(codeReviews)
    .innerJoin(pullRequests, eq(codeReviews.prId, pullRequests.id))
    .innerJoin(repositories, eq(pullRequests.repoId, repositories.id))
    .where(eq(codeReviews.id, reviewId))
    .limit(1);
  
  if (reviewData.length === 0) {
    return { error: "Review not found" };
  }
  
  const { review, pr, repo } = reviewData[0];
  
  // Start a new review
  const { startCodeReviewFlow } = await import("@/lib/ai/code-review");
  await startCodeReviewFlow({
    owner: repo.owner,
    repo: repo.name,
    pullNumber: pr.number,
    reviewId,
  });
  
  // Update review status to pending
  await db
    .update(codeReviews)
    .set({ 
      status: "pending",
      summary: null,
      feedback: null
    })
    .where(eq(codeReviews.id, reviewId));
} 