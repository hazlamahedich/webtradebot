"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GithubIcon, FileTextIcon, BookOpenIcon } from "lucide-react";

interface Repository {
  id: string;
  full_name: string;
  description: string;
  language: string;
  is_private: boolean;
  url: string;
}

interface Stats {
  totalRepositories: number;
  totalDocuments: number;
  totalReviews: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalRepositories: 0,
    totalDocuments: 0,
    totalReviews: 0
  });
  
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!session?.user?.name) return "U";
    return session.user.name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      redirect("/auth/signin");
    }
    
    const fetchRepositories = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("Dashboard - Session User:", session?.user);
        
        console.log("Dashboard - Fetching repositories for user ID:", session?.user?.id);
        
        // First try to get count with a simpler query
        const countResponse = await fetch(`/api/repositories/count?userId=${session?.user?.id}`);
        if (!countResponse.ok) {
          throw new Error(`HTTP error! status: ${countResponse.status}`);
        }
        const countData = await countResponse.json();
        console.log("Dashboard - Repository count:", countData.count);
        
        // Update stats
        setStats(prev => ({
          ...prev,
          totalRepositories: countData.count,
          // Mock data for now
          totalDocuments: Math.floor(Math.random() * 10),
          totalReviews: Math.floor(Math.random() * 5)
        }));
        
        // If we have repositories, fetch the details
        if (countData.count > 0) {
          const response = await fetch(`/api/repositories?userId=${session?.user?.id}`);
          if (!response.ok) {
            if (response.status === 503) {
              // Database connection issue
              redirect("/connection-issue");
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          console.log("Dashboard - Found repositories:", data.repositories.length);
          console.log("Dashboard - Repository details:", data.repositories);
          setRepositories(data.repositories);
        } else {
          setRepositories([]);
        }
      } catch (error) {
        console.error("Dashboard - Error fetching repositories:", error);
        
        // Check if it's a database connection error
        if (
          error instanceof Error && 
          (error.message.includes("CONNECT_TIMEOUT") || 
           error.message.includes("connection refused") ||
           error.message.includes("database") ||
           error.message.includes("column") ||
           error.message.includes("does not exist"))
        ) {
          redirect("/connection-issue");
        }
        
        setError("Failed to load repositories. Please try again later.");
        setRepositories([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRepositories();
  }, [session, status]);
  
  if (status === "loading") {
    return <div className="container py-8">Loading...</div>;
  }
  
  return (
    <div className="container py-8">
      {/* User welcome section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <Avatar className="h-16 w-16">
            <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "User"} />
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">Welcome, {session?.user?.name?.split(' ')[0] || "User"}</h1>
            <p className="text-muted-foreground">{session?.user?.email}</p>
          </div>
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Repositories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <GithubIcon className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.totalRepositories}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <FileTextIcon className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <BookOpenIcon className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.totalReviews}</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <h2 className="text-2xl font-bold mb-6">Your Repositories</h2>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md mb-6">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <div className="mt-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/fix-database">Fix Database Issues</Link>
            </Button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {repositories.length > 0 ? (
          repositories.map((repo) => (
            <Card key={repo.id}>
              <CardHeader>
                <CardTitle>{repo.full_name}</CardTitle>
                <CardDescription>{repo.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Language:</span>
                    <span>{repo.language || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Visibility:</span>
                    <span>{repo.is_private ? "Private" : "Public"}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="secondary" className="w-full">
                  <Link href={`/repository/${repo.id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardHeader>
                <CardTitle>No repositories connected</CardTitle>
                <CardDescription>Connect a GitHub repository to get started.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  You haven't connected any GitHub repositories yet. Click the button below to connect a repository.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href="/connect-repository">Connect Repository</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
        
        {repositories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Connect another repository</CardTitle>
              <CardDescription>Add more GitHub repositories to your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                You can connect multiple GitHub repositories to your account for code reviews and analysis.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/connect-repository">Connect Repository</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
} 