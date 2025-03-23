"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ServerlessTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [functionName, setFunctionName] = useState("testFunction");
  const [executionTime, setExecutionTime] = useState(500);
  const [memoryLimit, setMemoryLimit] = useState(25);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/serverless-test?function=${functionName}&time=${executionTime}&memory=${memoryLimit}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "An error occurred while testing");
      }
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Serverless Optimization Testing</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>
              Configure and run serverless function tests to measure performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="functionName">Function Name</Label>
              <Input
                id="functionName"
                value={functionName}
                onChange={(e) => setFunctionName(e.target.value)}
                placeholder="Enter function name"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="executionTime">Execution Time Limit (ms)</Label>
                <span className="text-sm">{executionTime} ms</span>
              </div>
              <Slider
                id="executionTime"
                min={100}
                max={3000}
                step={100}
                value={[executionTime]}
                onValueChange={(value) => setExecutionTime(value[0])}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="memoryLimit">Memory Limit (MB)</Label>
                <span className="text-sm">{memoryLimit} MB</span>
              </div>
              <Slider
                id="memoryLimit"
                min={5}
                max={100}
                step={5}
                value={[memoryLimit]}
                onValueChange={(value) => setMemoryLimit(value[0])}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={runTest} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Test...
                </>
              ) : (
                'Run Test'
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              View the performance metrics of your serverless function
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {result && (
              <div className="space-y-4">
                <div className="flex items-center">
                  {result.passed ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span className="font-medium">
                    {result.passed ? "Test Passed" : "Test Failed"}
                  </span>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-md">
                  <p className="text-sm font-medium mb-1">Feedback:</p>
                  <p className="text-sm">{result.feedback}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Execution Time</p>
                    <p className="font-medium">{result.metrics.executionTimeMs} ms</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Memory Usage</p>
                    <p className="font-medium">{result.metrics.memoryUsageMb} MB</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Function</p>
                    <p className="font-medium">{result.metrics.functionName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">{result.metrics.status}</p>
                  </div>
                </div>
              </div>
            )}
            
            {!result && !error && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                No test results yet. Run a test to see metrics.
              </div>
            )}
            
            {isLoading && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Running serverless test...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 