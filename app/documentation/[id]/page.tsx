"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, Code, Activity, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DocumentationEditor } from "@/components/documentation/editor";
import { QualityAnalysis } from "@/components/documentation/quality-analysis";

// This is a placeholder for Markdown rendering - in a real implementation, you'd use a proper Markdown library
const MarkdownRenderer = ({ content }: { content: string }) => (
  <div className="prose prose-sm max-w-none dark:prose-invert">
    <div dangerouslySetInnerHTML={{ __html: content }} />
  </div>
);

// This is a placeholder for diagram rendering - in a real implementation, you'd use a library like Mermaid.js
const DiagramRenderer = ({ content, type }: { content: string; type: string }) => (
  <div className="border p-4 rounded-md bg-gray-50">
    <pre className="text-xs overflow-x-auto">{content}</pre>
  </div>
);

export default function DocumentationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentation, setDocumentation] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchDocumentation = async () => {
      try {
        const response = await fetch(`/api/documentation?id=${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch documentation");
        }

        setDocumentation(data);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchDocumentation();
    }
  }, [params.id]);

  const handleSaveDocumentation = async (updatedDoc: any) => {
    try {
      const response = await fetch(`/api/documentation/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentationId: params.id,
          documentation: updatedDoc,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update documentation");
      }

      // Refresh the documentation
      const refreshResponse = await fetch(`/api/documentation?id=${params.id}`);
      const refreshData = await refreshResponse.json();
      setDocumentation(refreshData);
      
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save documentation:", error);
      // You might want to display an error message to the user
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-gray-500">Loading documentation...</p>
      </div>
    );
  }

  if (error || !documentation) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Could not load documentation"}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push("/documentation")}>
          Back to Documentation
        </Button>
      </div>
    );
  }

  const result = documentation.result || {};
  const docContent = result.documentation || {
    overview: "No overview available",
    components: [],
    architecture: "No architecture information available",
    usageGuide: "No usage guide available",
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{documentation.owner}/{documentation.repo}</h1>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant={documentation.status === "completed" ? "default" : "outline"}>
              {documentation.status}
            </Badge>
            <span className="text-gray-500 text-sm">
              Branch: {documentation.branch}
            </span>
            <span className="text-gray-500 text-sm">
              Generated: {new Date(documentation.created_at).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.push("/documentation")}>
            Back
          </Button>
          <Button variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="p-4 border rounded-md mt-2">
          {isEditing ? (
            <DocumentationEditor 
              documentation={docContent} 
              onSave={handleSaveDocumentation} 
            />
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Button onClick={() => setIsEditing(true)}>
                  Edit Documentation
                </Button>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Documentation Overview</CardTitle>
                  <CardDescription>
                    High-level overview of the codebase.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MarkdownRenderer content={docContent.overview} />
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Usage Guide</CardTitle>
                  <CardDescription>
                    How to use this codebase.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MarkdownRenderer content={docContent.usageGuide} />
                </CardContent>
              </Card>

              {docContent.setup && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Setup Instructions</CardTitle>
                    <CardDescription>
                      How to set up and run this codebase.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MarkdownRenderer content={docContent.setup} />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="components" className="p-4 border rounded-md mt-2">
          <h2 className="text-xl font-semibold mb-4">Components ({docContent.components?.length || 0})</h2>
          
          {docContent.components?.length > 0 ? (
            <div className="space-y-6">
              {docContent.components.map((component: any, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="font-mono">{component.componentId}</CardTitle>
                      <Code className="h-5 w-5 text-gray-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-500 mb-1">Description</h4>
                        <p>{component.description}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-500 mb-1">Usage</h4>
                        <MarkdownRenderer content={component.usage} />
                      </div>
                      {component.parameters && component.parameters.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm text-gray-500 mb-1">Parameters</h4>
                          <div className="bg-gray-50 p-3 rounded-md">
                            {component.parameters.map((param: any, paramIndex: number) => (
                              <div key={paramIndex} className="mb-2 last:mb-0">
                                <span className="font-mono text-sm">{param.name}</span>
                                <span className="text-gray-500 text-xs ml-2">{param.type}</span>
                                {param.required && <span className="text-red-500 text-xs ml-2">required</span>}
                                <p className="text-sm mt-1">{param.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {component.returnType && (
                        <div>
                          <h4 className="font-semibold text-sm text-gray-500 mb-1">Returns</h4>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <span className="font-mono text-sm">{component.returnType}</span>
                            {component.returnDescription && (
                              <p className="text-sm mt-1">{component.returnDescription}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {component.examples && component.examples.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm text-gray-500 mb-1">Examples</h4>
                          {component.examples.map((example: string, exampleIndex: number) => (
                            <div key={exampleIndex} className="bg-gray-50 p-3 rounded-md mb-2">
                              <MarkdownRenderer content={example} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No components documented.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="architecture" className="p-4 border rounded-md mt-2">
          <Card>
            <CardHeader>
              <CardTitle>Architecture Overview</CardTitle>
              <CardDescription>
                The high-level architecture of the codebase.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MarkdownRenderer content={docContent.architecture} />
            </CardContent>
          </Card>

          {result.diagrams && result.diagrams.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-4">Diagrams</h3>
              <div className="space-y-4">
                {result.diagrams.map((diagram: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{diagram.type} Diagram</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DiagramRenderer content={diagram.content} type={diagram.type} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="quality" className="p-4 border rounded-md mt-2">
          <QualityAnalysis 
            qualityAssessment={result.qualityAssessment} 
            missingDocs={result.missingDocs} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 