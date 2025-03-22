"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Code, FileText, GitBranch, Github } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DocumentationPage() {
  const router = useRouter();
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [paths, setPaths] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("generate");
  const [documentations, setDocumentations] = useState([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert paths string to array
      const pathsArray = paths
        .split("\n")
        .map((path) => path.trim())
        .filter((path) => path.length > 0);

      const response = await fetch("/api/documentation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner,
          repo,
          branch,
          paths: pathsArray,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate documentation");
      }

      setSuccess(`Documentation generation started with ID: ${data.id}`);
      // Refresh the documentation list
      fetchDocumentations();
      // Switch to the history tab
      setActiveTab("history");
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentations = async () => {
    try {
      const response = await fetch("/api/documentation");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch documentations");
      }

      setDocumentations(data);
    } catch (error) {
      console.error("Error fetching documentations:", error);
    }
  };

  // Fetch documentations when the component mounts or tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "history") {
      fetchDocumentations();
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Documentation Generator</h1>
      <p className="text-gray-500 mb-8">
        Generate comprehensive documentation from your codebase using AI.
      </p>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Documentation</TabsTrigger>
          <TabsTrigger value="history">Documentation History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Documentation</CardTitle>
              <CardDescription>
                Enter your repository details to generate documentation.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert variant="default" className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Success</AlertTitle>
                    <AlertDescription className="text-green-600">{success}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="owner">Repository Owner</Label>
                    <div className="flex items-center space-x-2">
                      <Github className="w-4 h-4 text-gray-500" />
                      <Input
                        id="owner"
                        placeholder="e.g., facebook"
                        value={owner}
                        onChange={(e) => setOwner(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="repo">Repository Name</Label>
                    <div className="flex items-center space-x-2">
                      <Code className="w-4 h-4 text-gray-500" />
                      <Input
                        id="repo"
                        placeholder="e.g., react"
                        value={repo}
                        onChange={(e) => setRepo(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <div className="flex items-center space-x-2">
                    <GitBranch className="w-4 h-4 text-gray-500" />
                    <Input
                      id="branch"
                      placeholder="e.g., main"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paths">
                    Paths to Document (one per line, leave empty for auto-detection)
                  </Label>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <Textarea
                      id="paths"
                      placeholder="e.g., src/components/Button.tsx"
                      value={paths}
                      onChange={(e) => setPaths(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Generating..." : "Generate Documentation"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Documentation History</CardTitle>
              <CardDescription>
                View and manage your previously generated documentation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documentations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No documentation has been generated yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documentations.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/documentation/${doc.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{doc.owner}/{doc.repo}</h3>
                          <p className="text-sm text-gray-500">
                            Generated on {new Date(doc.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              doc.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : doc.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 