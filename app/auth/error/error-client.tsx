"use client";

import { useSearchParams } from "next/navigation";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';

export default function ErrorClient() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Authentication Error</h1>
          <p className="text-muted-foreground">
            There was a problem with the authentication process.
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Failed</AlertTitle>
          <AlertDescription>
            {error ? `Error: ${error}` : "We encountered an error during the authentication process."}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Common Issues:</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>GitHub authorization was denied or timed out</li>
            <li>Database connection issues</li>
            <li>Session configuration problems</li>
            <li>Function.prototype.apply errors (currently fixing)</li>
          </ul>
        </div>

        <div className="flex flex-col space-y-3 pt-4">
          <Link href="/auth/signin" passHref>
            <Button variant="default" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Sign In
            </Button>
          </Link>
          <Link href="/" passHref>
            <Button variant="outline" className="w-full">
              <Home className="mr-2 h-4 w-4" /> Go to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 