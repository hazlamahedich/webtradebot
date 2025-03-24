"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AuthError() {
  const searchParams = useSearchParams();
  const [errorType, setErrorType] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("An authentication error occurred");

  useEffect(() => {
    // Get error from URL
    const error = searchParams.get("error");
    setErrorType(error);

    // Map error code to user-friendly message
    const errorMessages: Record<string, string> = {
      "Configuration": "There is a problem with the server configuration.",
      "AccessDenied": "You do not have access to this resource.",
      "OAuthSignin": "Error starting the sign in process.",
      "OAuthCallback": "Error during the callback process.",
      "OAuthCreateAccount": "Error creating a user account.",
      "EmailCreateAccount": "Error creating a user account.",
      "Callback": "Error during the callback process.",
      "OAuthAccountNotLinked": "This account is already linked to another user.",
      "EmailSignin": "Error sending the email sign in link.",
      "CredentialsSignin": "Sign in failed. Check your credentials.",
      "SessionRequired": "Please sign in to access this page.",
      "Default": "An unknown error occurred during authentication."
    };

    if (error && errorMessages[error]) {
      setErrorMessage(errorMessages[error]);
    } else {
      setErrorMessage(errorMessages.Default);
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
          </div>
          <CardDescription>
            There was a problem authenticating your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
            <p className="font-medium">Error: {errorType || "Unknown"}</p>
            <p className="mt-2">{errorMessage}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              This could be due to:
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>An issue with GitHub OAuth configuration</li>
              <li>Network connectivity problems</li>
              <li>Session expiration</li>
              <li>Permission issues with your GitHub account</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button className="w-full" asChild>
            <Link href="/auth/signin">Try Again</Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 