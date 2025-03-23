'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { requestReview } from './actions';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function RequestReviewPage() {
  const [repoFullName, setRepoFullName] = useState('');
  const [prNumber, setPrNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [userRepos, setUserRepos] = useState<{ id: string; fullName: string }[]>([]);
  const [reposLoaded, setReposLoaded] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState('');
  
  const router = useRouter();
  const { toast } = useToast();
  
  // Load user repositories on component mount
  useState(() => {
    async function loadRepositories() {
      try {
        const response = await fetch('/api/user/repositories');
        if (response.ok) {
          const data = await response.json();
          setUserRepos(data.repositories);
        }
      } catch (error) {
        console.error('Error loading repositories:', error);
      } finally {
        setReposLoaded(true);
      }
    }
    
    loadRepositories();
  });
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Use either selected repo or manual input
      const repoToUse = selectedRepo || repoFullName;
      
      if (!repoToUse) {
        toast({
          title: 'Error',
          description: 'Please select or enter a repository.',
          variant: 'destructive',
        });
        return;
      }
      
      if (!prNumber || isNaN(parseInt(prNumber))) {
        toast({
          title: 'Error',
          description: 'Please enter a valid PR number.',
          variant: 'destructive',
        });
        return;
      }
      
      const [owner, repo] = repoToUse.split('/');
      
      const result = await requestReview({
        owner,
        repo,
        pullNumber: parseInt(prNumber),
      });
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Code review requested successfully.',
        });
        
        // Redirect to the review page
        router.push(`/dashboard/reviews/${result.reviewId}`);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to request review.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error requesting review:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="container py-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Request New Code Review</h1>
        <p className="text-muted-foreground mt-1">
          Request an AI code review for a specific pull request.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Pull Request Details</CardTitle>
          <CardDescription>
            Enter the details of the pull request you want to review.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="repository">Repository</Label>
              
              {userRepos.length > 0 ? (
                <Select onValueChange={setSelectedRepo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a repository" />
                  </SelectTrigger>
                  <SelectContent>
                    {userRepos.map((repo) => (
                      <SelectItem key={repo.id} value={repo.fullName}>
                        {repo.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="mb-4">
                  <Label htmlFor="repoFullName">Repository Name</Label>
                  <Input
                    id="repoFullName"
                    placeholder="owner/repository"
                    value={repoFullName}
                    onChange={(e) => setRepoFullName(e.target.value)}
                    disabled={loading}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: username/repository (e.g., octocat/Hello-World)
                  </p>
                </div>
              )}
              
              {reposLoaded && userRepos.length === 0 && (
                <p className="text-sm text-amber-600">
                  No repositories connected. Please connect a repository first or enter a repository name manually.
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prNumber">Pull Request Number</Label>
              <Input
                id="prNumber"
                placeholder="123"
                value={prNumber}
                onChange={(e) => setPrNumber(e.target.value)}
                disabled={loading}
                type="number"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/dashboard/reviews">Cancel</Link>
            </Button>
            
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Requesting...
                </>
              ) : (
                'Request Review'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 