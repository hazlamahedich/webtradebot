"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function FixAuthPage() {
  const { data: session, status } = useSession();
  const [authDetails, setAuthDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/debug/auth');
      const data = await response.json();
      setAuthDetails(data);
    } catch (err) {
      setError("Failed to fetch auth details");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fixAuth = async () => {
    setIsFixing(true);
    setError(null);
    try {
      const response = await fetch('/api/fix-auth');
      const data = await response.json();
      setFixResult(data);
      
      // Refresh auth details
      if (!data.error) {
        await checkAuth();
      }
    } catch (err) {
      setError("Failed to fix auth issues");
      console.error(err);
    } finally {
      setIsFixing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Authentication Troubleshooter</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
            <CardDescription>Current session information from NextAuth.js</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <strong>Status:</strong> {status}
              </div>
              
              {session && (
                <div className="space-y-2">
                  <div><strong>User ID:</strong> {session.user?.id}</div>
                  <div><strong>Name:</strong> {session.user?.name}</div>
                  <div><strong>Email:</strong> {session.user?.email}</div>
                  <div><strong>Access Token:</strong> {session.accessToken ? "Present" : "Missing"}</div>
                </div>
              )}
              
              {!session && status !== "loading" && (
                <Alert>
                  <AlertDescription>
                    You are not signed in. Please sign in to diagnose authentication issues.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            {session ? (
              <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
            ) : (
              <Button onClick={() => signIn("github")}>Sign In with GitHub</Button>
            )}
            
            <Button onClick={checkAuth} disabled={isLoading || !session}>
              {isLoading ? "Checking..." : "Check Auth Details"}
            </Button>
          </CardFooter>
        </Card>
        
        {authDetails && (
          <Card>
            <CardHeader>
              <CardTitle>Detailed Authentication Information</CardTitle>
              <CardDescription>Technical details about your authentication state</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <strong>Auth State:</strong> {authDetails.authState}
                </div>
                
                <div>
                  <strong>Database Records:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>User in Database: {authDetails.database?.userFound ? "Yes" : "No"}</li>
                    <li>GitHub Account in Database: {authDetails.database?.accountFound ? "Yes" : "No"}</li>
                  </ul>
                </div>

                {authDetails.database?.accountFound === false && (
                  <Alert className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300">
                    <AlertDescription>
                      No GitHub account record found in database. This will cause authentication issues.
                      Click "Fix Authentication" to create the missing records.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="mt-4">
                <details className="text-sm">
                  <summary className="font-medium cursor-pointer">View Raw Details</summary>
                  <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-md overflow-auto text-xs">
                    {JSON.stringify(authDetails, null, 2)}
                  </pre>
                </details>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={fixAuth} 
                disabled={isFixing || authDetails.status === "error"}
                className="w-full"
              >
                {isFixing ? "Fixing..." : "Fix Authentication"}
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {fixResult && (
          <Card>
            <CardHeader>
              <CardTitle>Fix Results</CardTitle>
              <CardDescription>Results of authentication fixes</CardDescription>
            </CardHeader>
            <CardContent>
              {fixResult.error ? (
                <Alert variant="destructive">
                  <AlertDescription>{fixResult.error}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div>
                    <strong>Fixed:</strong> {fixResult.fixed ? "Yes" : "No"}
                  </div>
                  
                  {fixResult.actions && fixResult.actions.length > 0 && (
                    <div>
                      <strong>Actions Performed:</strong>
                      <ul className="list-disc list-inside mt-2">
                        {fixResult.actions.map((action: string, i: number) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
} 