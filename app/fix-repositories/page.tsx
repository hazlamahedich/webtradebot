'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function FixRepositoriesPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const fixRepositories = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const response = await fetch('/api/fix-repositories');
      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Repository schema fixed successfully'
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to fix repository schema'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>Fix Repository Issues</CardTitle>
          <CardDescription>
            Fix repository table schema and relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result && (
            <Alert className={result.success ? 'bg-green-50' : 'bg-red-50'}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
          
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-4">
              This utility will fix the following issues:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1 text-gray-600">
              <li>Add missing columns to the repositories table</li>
              <li>Ensure proper column naming conventions</li>
              <li>Fix repository ownership for your GitHub account</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            onClick={fixRepositories} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
            Fix Repository Issues
          </Button>
          
          <Button 
            onClick={() => window.location.href = '/dashboard'} 
            disabled={isRunning}
            variant="outline"
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 