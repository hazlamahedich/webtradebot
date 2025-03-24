"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, AlertCircle } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const errorType = searchParams.get("error");

  // Handle error messages from NextAuth
  useEffect(() => {
    if (errorType) {
      const errorMessages: Record<string, string> = {
        "OAuthSignin": "Error starting the GitHub sign in process.",
        "OAuthCallback": "Error during the GitHub callback process.",
        "OAuthCreateAccount": "Error creating a user account.",
        "EmailCreateAccount": "Error creating a user account.",
        "Callback": "Error during the callback process.",
        "OAuthAccountNotLinked": "This GitHub account is already linked to another user.",
        "EmailSignin": "Error sending the email sign in link.",
        "CredentialsSignin": "Sign in failed. Check your credentials.",
        "SessionRequired": "Please sign in to access this page.",
        "default": "An error occurred during authentication."
      };

      setError(errorMessages[errorType] || errorMessages.default);
    }
  }, [errorType]);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await signIn("github", { 
        callbackUrl,
        redirect: true
      });
    } catch (err) {
      console.error("Authentication error:", err);
      setError("An error occurred during authentication.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>
            Sign in with GitHub to access the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Authentication Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
          
          <Button
            className="w-full"
            size="lg"
            onClick={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Signing in...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                <span>Sign in with GitHub</span>
              </div>
            )}
          </Button>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          By signing in, you agree to allow this application to access your GitHub repositories.
        </CardFooter>
      </Card>
    </div>
  );
} 