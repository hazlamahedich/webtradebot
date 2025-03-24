"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ExclamationTriangleIcon, CheckCircledIcon } from "@radix-ui/react-icons";
import Link from "next/link";

export default function FixDatabasePage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFixDatabase = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/fix-database");
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || "An error occurred while fixing the database");
      }
    } catch (err) {
      setError("Network error: Could not connect to the server");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Fix Database Schema</CardTitle>
            <CardDescription>
              This page helps fix missing columns in the database that might be causing errors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800">
                <CheckCircledIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-600 dark:text-green-400">Success</AlertTitle>
                <AlertDescription className="text-green-600 dark:text-green-400">
                  Database schema fixed successfully. You can now try accessing the dashboard again.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Database Schema Issues</h3>
              
              <p className="text-sm text-muted-foreground">
                We detected that your database schema might be missing some required columns, which can cause errors like:
              </p>
              
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li><code>column "description" does not exist</code></li>
                <li><code>column "code_reviews.completed_at" does not exist</code></li>
                <li><code>column "pull_requests.github_id" does not exist</code></li>
              </ul>
              
              <p className="text-sm text-muted-foreground">
                Clicking the button below will automatically add all missing columns to the database tables.
                This is a safe operation and won't affect your existing data.
              </p>
              
              <Button 
                onClick={handleFixDatabase} 
                disabled={loading || success} 
                className="mt-2 w-full"
              >
                {loading ? "Fixing Database Schema..." : 
                 success ? "Database Schema Fixed" : 
                 "Fix Database Schema"}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/">Return Home</Link>
            </Button>
            <Button asChild disabled={!success}>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 