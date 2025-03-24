"use client";

export const runtime = 'nodejs';

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Wrench } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const nextAuthError = searchParams.get("error");

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signIn("github", { 
        callbackUrl,
        redirect: true
      });
      
      if (!result?.ok) {
        setError("Authentication failed. Please try again.");
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setError("An error occurred during authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>
            Sign in to iDocument to start reviewing your code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(error || nextAuthError) && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
              <p className="font-medium">{error || "Authentication error"}</p>
              <p className="text-sm mt-1">
                If you're having trouble signing in with NextAuth, try our alternative methods below.
              </p>
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
                <span>Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                <span>Sign in with GitHub</span>
              </div>
            )}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Other Options
              </span>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button variant="outline" asChild>
              <Link href="/auth/direct-login" className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                <span>Alternative GitHub Login</span>
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link href="/fix-auth" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                <span>Authentication Troubleshooter</span>
              </Link>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          By signing in, you accept our terms of service and privacy policy.
        </CardFooter>
      </Card>
    </div>
  );
} 