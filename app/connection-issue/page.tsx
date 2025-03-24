"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { AlertTriangle, Database, Home, RefreshCw } from "lucide-react";

export default function ConnectionIssuePage() {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await signOut({ callbackUrl: "/auth/signin" });
  };

  const handleRetry = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-2">
            <Database className="h-10 w-10 text-yellow-500" />
          </div>
          <CardTitle className="text-xl text-center">Database Connection Issue</CardTitle>
          <CardDescription className="text-center">
            We're having trouble connecting to our database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md flex gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  The application is experiencing temporary connection issues with the database. This is likely a temporary issue.
                </p>
              </div>
            </div>
            
            <h3 className="font-medium text-sm">What you can do:</h3>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>Wait a few minutes and try again</li>
              <li>Try refreshing the page</li>
              <li>Check if there are any ongoing maintenance updates</li>
              <li>Try fixing the database schema using the button below</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/api/fix-repositories">
              <RefreshCw className="h-4 w-4 mr-2" />
              Fix Database Schema
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Return Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 