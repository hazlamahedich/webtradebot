"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import Link from "next/link";

export default function TestOAuth() {
  const [envInfo, setEnvInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Test different variations of the GitHub OAuth URL
  const clientId = "Iv1.2ade8f0a993ffe12"; // GitHub OAuth App client ID

  // Generate test URLs on the client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetchEnvInfo();
    }
  }, []);

  const fetchEnvInfo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/debug/oauth-env');
      const data = await response.json();
      setEnvInfo(data);
    } catch (err) {
      setError("Failed to fetch environment information");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getTestUrls = () => {
    if (typeof window === 'undefined') return {};
    
    const port = window.location.port;
    const hostname = window.location.hostname;
    
    return {
      localhost: {
        url: `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(`http://localhost:${port}/api/auth/callback`)}&scope=${encodeURIComponent("read:user user:email repo")}`,
        description: "Standard localhost URL"
      },
      loopbackIp: {
        url: `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(`http://127.0.0.1:${port}/api/auth/callback`)}&scope=${encodeURIComponent("read:user user:email repo")}`,
        description: "Loopback IP (GitHub recommended)"
      },
      actualHost: {
        url: `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(`http://${hostname}:${port}/api/auth/callback`)}&scope=${encodeURIComponent("read:user user:email repo")}`,
        description: "Using actual hostname"
      },
    };
  };

  const testUrls = getTestUrls();

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">GitHub OAuth Test</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Environment Information</CardTitle>
            <CardDescription>Information about your OAuth environment setup</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading environment information...</div>
            ) : error ? (
              <div className="p-3 bg-red-50 text-red-700 rounded-md">{error}</div>
            ) : envInfo ? (
              <div className="space-y-4">
                <div>
                  <strong>GitHub Client ID:</strong> {envInfo.clientId || "Not found"}
                </div>
                <div>
                  <strong>GitHub Secret:</strong> {envInfo.clientSecret ? "Set" : "Not set"}
                </div>
                <div>
                  <strong>NextAuth URL:</strong> {envInfo.nextAuthUrl || "Not set"}
                </div>
                <div>
                  <strong>Current Hostname:</strong> {envInfo.hostname || "Unknown"}
                </div>
              </div>
            ) : (
              <Button onClick={fetchEnvInfo}>Load Environment Info</Button>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>OAuth URL Test</CardTitle>
            <CardDescription>Test different OAuth URL variations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                GitHub recommends using a loopback IP address (127.0.0.1) instead of 'localhost'.
                Try these different URLs to see which one works with your GitHub OAuth app configuration.
              </p>
              
              {Object.entries(testUrls).map(([name, { url, description }]) => (
                <div key={name} className="border p-4 rounded-md space-y-2">
                  <h3 className="font-medium">{name}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                  <div className="flex justify-between items-center mt-2">
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded">{url.substring(0, 60)}...</code>
                    <Button size="sm" asChild>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4 mr-2" />
                        Test
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/direct-login">Back to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 