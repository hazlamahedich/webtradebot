"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export default function FallbackAuth() {
  const [isLoading, setIsLoading] = useState(false);

  // GitHub OAuth parameters
  const githubClientId = process.env.NEXT_PUBLIC_GITHUB_ID || process.env.GITHUB_ID;
  const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/github-callback`);
  const scope = encodeURIComponent("read:user user:email repo");
  
  // GitHub OAuth URL
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${redirectUri}&scope=${scope}`;

  const handleSignIn = () => {
    setIsLoading(true);
    // Redirect to GitHub OAuth
    window.location.href = githubAuthUrl;
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Emergency Sign In</CardTitle>
          <CardDescription>
            Use this fallback authentication when regular sign-in is unavailable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The regular authentication system is experiencing issues. This is a temporary workaround 
              that will authorize you with GitHub directly.
            </p>
            <Button
              className="w-full"
              size="lg"
              onClick={handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Connecting...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  <span>Sign in with GitHub (Emergency Mode)</span>
                </div>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-xs text-muted-foreground">
            This authentication bypass is intended for emergencies only. Once signed in, you'll have limited access.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 