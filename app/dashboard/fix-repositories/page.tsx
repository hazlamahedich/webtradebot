import { auth } from "@/lib/auth";
import { db } from "@/lib/supabase/db";
import { repositories } from "@/lib/supabase/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Set Node.js runtime for this page
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function FixRepositoriesPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await auth();
  
  if (!session?.user) {
    return <div className="container py-8">You need to be logged in to view this page.</div>;
  }

  // Initialize results
  let results: { message: string; status: string; }[] = [];
  let error = null;

  // Get all repositories that need to be fixed - the ones associated with UUID user IDs
  const reposToFix = await db.query.repositories.findMany();
  
  // Check if there is an action parameter in the URL
  const action = searchParams.action as string | undefined;
  
  if (action === 'fix') {
    try {
      // Update all repositories with the old user ID to the new one
      const oldUserId = 'c5aa4ee1-3a05-472c-91cd-73bb977e345e';
      const newUserId = '65190465';
      
      // Check if there are repos with the old ID
      const oldIdRepos = reposToFix.filter(repo => repo.userId === oldUserId);
      
      if (oldIdRepos.length > 0) {
        // Update repos with the old ID to use the new ID
        await db
          .update(repositories)
          .set({ userId: newUserId })
          .where(eq(repositories.userId, oldUserId));
          
        results.push({
          message: `Updated ${oldIdRepos.length} repositories from user ID ${oldUserId} to ${newUserId}`,
          status: 'success'
        });
      } else {
        results.push({
          message: `No repositories found with user ID ${oldUserId}`,
          status: 'info'
        });
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error occurred';
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Fix Repository Associations</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-red-700 font-medium">Error</h2>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      {results.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-medium mb-2">Results:</h2>
          <ul className="space-y-2">
            {results.map((result, index) => (
              <li 
                key={index}
                className={`p-3 rounded-md ${
                  result.status === 'success' ? 'bg-green-50 border border-green-200' : 
                  result.status === 'info' ? 'bg-blue-50 border border-blue-200' : 
                  'bg-yellow-50 border border-yellow-200'
                }`}
              >
                {result.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">Current State:</h2>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
          <p>Repositories to check: {reposToFix.length}</p>
          <pre className="mt-2 text-xs overflow-auto max-h-60">
            {JSON.stringify(reposToFix, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="flex gap-4">
        <Link href="/dashboard/fix-repositories?action=fix">
          <Button>Fix Repository Associations</Button>
        </Link>
        <Link href="/dashboard/repositories">
          <Button variant="outline">Back to Repositories</Button>
        </Link>
      </div>
    </div>
  );
} 