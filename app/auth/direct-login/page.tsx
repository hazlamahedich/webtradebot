"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GithubIcon, AlertCircle, Loader2, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DirectLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  
  // Get client ID from environment
  const clientId = process.env.NEXT_PUBLIC_GITHUB_ID || process.env.GITHUB_ID;
  
  // GitHub OAuth URL - use a useEffect to access window safely
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  
  // Set up the GitHub auth URL after component mounts (when window is available)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const redirectUri = `${window.location.origin}/api/auth/callback`;
      const scope = "read:user user:email repo";
      setAuthUrl(`https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`);
    }
  }, [clientId]);
  
  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Sign in with GitHub</CardTitle>
          <CardDescription className="text-center">
            Direct OAuth implementation for development
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 p-4 rounded-md flex items-start space-x-3 text-red-800 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Authentication Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}
          
          <Button
            className="w-full py-6 text-lg"
            onClick={() => {
              setLoading(true);
              if (authUrl) {
                window.location.href = authUrl;
              } else {
                setError("GitHub authentication URL is not available. Please try again.");
                setLoading(false);
              }
            }}
            disabled={loading || !authUrl}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Redirecting to GitHub...
              </>
            ) : (
              <>
                <GithubIcon className="mr-2 h-5 w-5" />
                Continue with GitHub
              </>
            )}
          </Button>
          
          <div className="pt-4 text-center">
            <Link 
              href="/auth/test-oauth" 
              className="text-sm flex justify-center items-center text-gray-500 hover:text-gray-700"
            >
              <Wrench className="h-4 w-4 mr-1" />
              Troubleshoot OAuth Settings
            </Link>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-xs text-gray-500 text-center">
            This direct OAuth flow is for development and testing purposes.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 