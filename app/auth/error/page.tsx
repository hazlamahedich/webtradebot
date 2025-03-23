"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  let errorMessage = "An unknown error occurred during authentication.";
  
  if (error === "AccessDenied") {
    errorMessage = "You don't have permission to access this resource.";
  } else if (error === "Configuration") {
    errorMessage = "There is a problem with the server configuration.";
  } else if (error === "OAuthSignin" || error === "OAuthCallback") {
    errorMessage = "There was a problem with GitHub authentication.";
  } else if (error === "OAuthAccountNotLinked") {
    errorMessage = "This email is already associated with another account.";
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
          </div>
          <CardDescription>
            There was a problem signing you in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-md">
            <p className="text-red-700 dark:text-red-400">{errorMessage}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/">
              Return Home
            </Link>
          </Button>
          <Button asChild>
            <Link href="/auth/signin">
              Try Again
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 