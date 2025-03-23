import { auth } from "@/lib/auth";
import { db } from "@/lib/supabase/db";
import { repositories } from "@/lib/supabase/schema";
import { eq, sql } from "drizzle-orm";
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
import { 
  GitHubLogoIcon, 
  CheckCircledIcon, 
  PlusIcon, 
  TrashIcon 
} from "@radix-ui/react-icons";
import Link from "next/link";
import { format } from "date-fns";
import { addRepository, removeRepository } from "./actions";

// Set Node.js runtime for this page
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function RepositoriesPage() {
  const session = await auth();
  
  if (!session?.user) {
    return <div>You need to be logged in to view this page.</div>;
  }
  
  console.log('Session user details:', {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email
  });
  
  // Get all repositories for the user
  try {
    // Raw query for debugging
    const rawResults = await db.execute(
      sql`SELECT * FROM repositories WHERE user_id = ${session.user.id}`
    );
    console.log('Raw SQL query results:', JSON.stringify(rawResults, null, 2));
    
    // Standard query
    const userRepos = await db.query.repositories.findMany({
      where: eq(repositories.userId, session.user.id),
      orderBy: [repositories.updatedAt],
    });
    
    console.log('Found repositories count:', userRepos.length);
    console.log('Found repositories details:', JSON.stringify(userRepos, null, 2));
    
    return (
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">GitHub Repositories</h1>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/repositories/add">
              <Button className="flex items-center gap-1">
                <PlusIcon className="h-4 w-4" />
                Add Repository
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Debug info in UI for visibility */}
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-xs">
          <p>Debug info:</p>
          <p>User ID: {session.user.id}</p>
          <p>Repositories found: {userRepos.length}</p>
        </div>
        
        {userRepos.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No repositories connected</CardTitle>
              <CardDescription>
                Connect your GitHub repositories to start getting AI-powered code reviews.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/dashboard/repositories/add">
                <Button className="flex items-center gap-1">
                  <GitHubLogoIcon className="h-4 w-4" />
                  Connect Repository
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid gap-4">
            {userRepos.map((repo) => (
              <Card key={repo.id} className="flex flex-col md:flex-row md:items-center md:justify-between p-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <GitHubLogoIcon className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold text-lg">{repo.fullName}</h3>
                    <Badge variant="outline" className="ml-2">
                      Repository
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-4 md:mb-0">
                    Connected on {format(new Date(repo.createdAt), "MMM d, yyyy")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircledIcon className="h-3.5 w-3.5" />
                    Active
                  </Badge>
                  <form action={removeRepository}>
                    <input type="hidden" name="repoId" value={repo.id} />
                    <Button 
                      type="submit" 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 p-2 h-8 w-8"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return (
      <div className="container py-8">
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <h2 className="text-red-700 font-medium">Error fetching repositories</h2>
          <p className="text-red-600 text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
} 