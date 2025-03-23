"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { addRepository } from "@/app/dashboard/repositories/actions";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

export default function ConnectRepositoryForm() {
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [forceAdd, setForceAdd] = useState(false);
  const [showForceAdd, setShowForceAdd] = useState(false);
  const [accountStatus, setAccountStatus] = useState<{loaded: boolean, hasAccount: boolean, hasToken: boolean}>({
    loaded: false,
    hasAccount: false,
    hasToken: false
  });
  
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("fullName", fullName);
      if (forceAdd) {
        formData.append("forceAdd", "true");
      }
      
      const result = await addRepository(formData);
      
      if (result.success) {
        setSuccess(true);
        toast({
          title: "Repository connected",
          description: "Your repository has been connected successfully.",
        });
        
        // Wait 2 seconds before redirecting
        setTimeout(() => {
          router.push("/dashboard/repositories");
          router.refresh();
        }, 2000);
      } else {
        setError(result.error || "Failed to connect repository");
        if (result.forceAddOption) {
          setShowForceAdd(true);
        }
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const checkAccountStatus = async () => {
    try {
      const response = await fetch('/api/debug/auth');
      const data = await response.json();
      
      setAccountStatus({
        loaded: true,
        hasAccount: data.accounts.count > 0,
        hasToken: data.session.hasAccessToken
      });
      
      if (data.accounts.count === 0) {
        setError("No GitHub account found in the database. Let's fix that now!");
      }
    } catch (error) {
      console.error("Error checking account status:", error);
    }
  };
  
  const createAccountRecord = async () => {
    try {
      setLoading(true);
      // Call our fix API endpoint
      const response = await fetch('/api/fix-github-account');
      const data = await response.json();
      
      if (data.success) {
        setError(null);
        toast({
          title: "GitHub account fixed",
          description: `Your GitHub account has been ${data.action}. Try connecting your repository again.`,
        });
        
        // Check account status again
        await checkAccountStatus();
      } else {
        setError(`Failed to fix GitHub account: ${data.error || 'Unknown error'}`);
        
        if (data.action === "Please log in again") {
          // Force logout and login
          setTimeout(() => {
            window.location.href = "/api/auth/signout?callbackUrl=/dashboard/repositories";
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Error creating account record:", error);
      setError("Failed to fix GitHub account. Please try logging out and logging back in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Connect GitHub Repository</CardTitle>
        <CardDescription>
          Enter the full name of a GitHub repository to connect it to your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            
            {error.includes("No GitHub account connected") && (
              <div className="mt-4">
                <Button onClick={checkAccountStatus} variant="outline" size="sm">
                  Diagnose Account Issue
                </Button>
              </div>
            )}
          </Alert>
        )}
        
        {accountStatus.loaded && !accountStatus.hasAccount && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>GitHub Account Not Connected</AlertTitle>
            <AlertDescription>
              You need to reconnect your GitHub account to fix this issue.
              <div className="mt-2">
                <Button onClick={createAccountRecord} disabled={loading}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reconnecting...</>
                  ) : (
                    "Reconnect GitHub Account"
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">Success!</AlertTitle>
            <AlertDescription className="text-green-600">
              Repository connected successfully. Redirecting to repositories page...
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Repository Name</Label>
              <Input
                id="fullName"
                placeholder="username/repository"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading || success}
                required
              />
              <p className="text-sm text-muted-foreground">
                Format: username/repository (e.g., octocat/Hello-World)
              </p>
            </div>
            
            {showForceAdd && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="forceAdd"
                  checked={forceAdd}
                  onChange={(e) => setForceAdd(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="forceAdd" className="text-sm font-normal">
                  This repository seems to already exist. Force add anyway?
                </Label>
              </div>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="mt-4 w-full" 
            disabled={loading || success || !fullName}>
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...</>
            ) : (
              "Connect Repository"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/repositories">Cancel</Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 