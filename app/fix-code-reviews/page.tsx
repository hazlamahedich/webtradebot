"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function FixCodeReviewsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    status: 'success' | 'error';
    message: string;
    error?: string;
  } | null>(null);

  const handleFix = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/fix-code-reviews');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        status: 'error',
        message: 'Error connecting to the API',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Fix Code Reviews Schema</CardTitle>
            <CardDescription>
              This utility fixes missing columns in the code_reviews table, which is necessary
              for the application to function correctly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                This will fix the following issues:
              </p>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>Missing <code>completed_at</code> column in the code_reviews table</li>
                <li>Missing timestamp columns for proper record management</li>
                <li>Schema misalignment issues in the dashboard</li>
              </ul>

              {result && (
                <Alert variant={result.status === 'success' ? 'default' : 'destructive'}>
                  <AlertTitle>
                    {result.status === 'success' ? 'Success!' : 'Error'}
                  </AlertTitle>
                  <AlertDescription>
                    {result.message}
                    {result.error && (
                      <p className="mt-2 text-xs font-mono">{result.error}</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              asChild
            >
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
            <Button 
              onClick={handleFix} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing...
                </>
              ) : (
                'Fix Code Reviews'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 