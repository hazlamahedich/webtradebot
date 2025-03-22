"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  GitPullRequest, 
  MessageSquare, 
  Search, 
  Plus, 
  Filter, 
  UserPlus,
  GitPullRequestClosed,
  Code
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
}

interface SharedReview {
  id: string;
  pullRequest: {
    id: string;
    number: number;
    title: string;
    repository: string;
  };
  status: "pending" | "in_progress" | "completed" | "failed";
  assignedTo: TeamMember[];
  createdAt: string;
  updatedAt: string;
  commentCount: number;
}

const TeamCollaboration = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("members");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [sharedReviews, setSharedReviews] = useState<SharedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    const fetchTeamData = async () => {
      setLoading(true);
      try {
        // This would be real API calls in production
        // const membersResponse = await fetch("/api/team/members");
        // const reviewsResponse = await fetch("/api/team/reviews");
        // const members = await membersResponse.json();
        // const reviews = await reviewsResponse.json();

        // Sample data for demonstration
        const members: TeamMember[] = [
          {
            id: "1",
            name: "Alex Johnson",
            email: "alex@example.com",
            role: "admin",
            avatarUrl: "https://github.com/shadcn.png",
          },
          {
            id: "2",
            name: "Jamie Smith",
            email: "jamie@example.com",
            role: "member",
            avatarUrl: "https://github.com/shadcn.png",
          },
          {
            id: "3",
            name: "Taylor Wilson",
            email: "taylor@example.com",
            role: "member",
            avatarUrl: "https://github.com/shadcn.png",
          },
        ];

        const reviews: SharedReview[] = [
          {
            id: "1",
            pullRequest: {
              id: "pr1",
              number: 123,
              title: "Add authentication flow",
              repository: "frontend",
            },
            status: "in_progress",
            assignedTo: [members[0], members[1]],
            createdAt: "2023-05-15T10:30:00Z",
            updatedAt: "2023-05-15T14:45:00Z",
            commentCount: 7,
          },
          {
            id: "2",
            pullRequest: {
              id: "pr2",
              number: 145,
              title: "Refactor API endpoints",
              repository: "backend",
            },
            status: "completed",
            assignedTo: [members[0]],
            createdAt: "2023-05-14T09:15:00Z",
            updatedAt: "2023-05-14T16:20:00Z",
            commentCount: 12,
          },
          {
            id: "3",
            pullRequest: {
              id: "pr3",
              number: 156,
              title: "Update data schema",
              repository: "database",
            },
            status: "pending",
            assignedTo: [members[2]],
            createdAt: "2023-05-16T11:10:00Z",
            updatedAt: "2023-05-16T11:10:00Z",
            commentCount: 0,
          },
        ];

        setTeamMembers(members);
        setSharedReviews(reviews);
      } catch (error) {
        console.error("Error fetching team data:", error);
      }
      setLoading(false);
    };

    fetchTeamData();
  }, []);

  const filteredReviews = sharedReviews.filter(review => 
    review.pullRequest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.pullRequest.repository.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInvite = async () => {
    if (!inviteEmail) return;
    // In a real app, this would send an API request
    // await fetch("/api/team/invite", { method: "POST", body: JSON.stringify({ email: inviteEmail }) });
    alert(`Invitation sent to ${inviteEmail}`);
    setInviteEmail("");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Team Collaboration</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/reviews/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Review
          </Button>
          <Button onClick={() => setActiveTab("members")}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Team Members
          </TabsTrigger>
          <TabsTrigger value="reviews">
            <GitPullRequest className="h-4 w-4 mr-2" />
            Shared Reviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage your team and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Input 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email address"
                  type="email"
                />
                <Button onClick={handleInvite}>Invite</Button>
              </div>
              
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={member.avatarUrl} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <Badge variant={member.role === "admin" ? "default" : "outline"}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shared Reviews</CardTitle>
              <CardDescription>Reviews shared with team members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {filteredReviews.map((review) => (
                  <div 
                    key={review.id} 
                    className="p-4 border rounded-lg space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Code className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{review.pullRequest.repository}</span>
                          <Badge variant="outline">
                            #{review.pullRequest.number}
                          </Badge>
                        </div>
                        <h3 className="font-semibold mt-1">
                          <Link href={`/dashboard/reviews/${review.id}`} className="hover:underline">
                            {review.pullRequest.title}
                          </Link>
                        </h3>
                      </div>
                      <Badge
                        variant={
                          review.status === "completed" ? "default" :
                          review.status === "in_progress" ? "secondary" :
                          review.status === "failed" ? "destructive" :
                          "outline"
                        }
                      >
                        {review.status.replace("_", " ")}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex -space-x-2">
                        {review.assignedTo.map((member) => (
                          <Avatar key={member.id} className="border-2 border-background">
                            <AvatarImage src={member.avatarUrl} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {review.commentCount} comments
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => router.push("/dashboard/reviews/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Shared Review
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamCollaboration; 