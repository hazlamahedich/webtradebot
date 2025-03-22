"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, Code, Activity, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
          {result.qualityAssessment ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Overall Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold bg-primary/10 text-primary">
                        {result.qualityAssessment.score}
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">
                          {result.qualityAssessment.score < 50
                            ? "Needs significant improvement"
                            : result.qualityAssessment.score < 75
                            ? "Good but can be better"
                            : "Excellent documentation"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Coverage</span>
                        <div className="flex items-center">
                          <span className="mr-2">{result.qualityAssessment.coverage}%</span>
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${result.qualityAssessment.coverage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Clarity</span>
                        <div className="flex items-center">
                          <span className="mr-2">{result.qualityAssessment.clarity}%</span>
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${result.qualityAssessment.clarity}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Completeness</span>
                        <div className="flex items-center">
                          <span className="mr-2">{result.qualityAssessment.completeness}%</span>
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${result.qualityAssessment.completeness}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Consistency</span>
                        <div className="flex items-center">
                          <span className="mr-2">{result.qualityAssessment.consistency}%</span>
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${result.qualityAssessment.consistency}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Improvement Suggestions</CardTitle>
                  <CardDescription>
                    Ways to improve the documentation quality.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {result.qualityAssessment.improvements.length > 0 ? (
                    <div className="space-y-4">
                      {result.qualityAssessment.improvements.map((improvement: any, index: number) => (
                        <div key={index} className="border-l-4 pl-4 py-1" style={{
                          borderColor: improvement.priority === "high" 
                            ? "rgb(239, 68, 68)" 
                            : improvement.priority === "medium" 
                            ? "rgb(249, 115, 22)" 
                            : "rgb(59, 130, 246)"
                        }}>
                          <h4 className="font-medium">
                            {improvement.componentId}
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{
                              backgroundColor: improvement.priority === "high" 
                                ? "rgb(254, 226, 226)" 
                                : improvement.priority === "medium" 
                                ? "rgb(255, 237, 213)" 
                                : "rgb(219, 234, 254)",
                              color: improvement.priority === "high" 
                                ? "rgb(185, 28, 28)" 
                                : improvement.priority === "medium" 
                                ? "rgb(194, 65, 12)" 
                                : "rgb(29, 78, 216)"
                            }}>
                              {improvement.priority}
                            </span>
                          </h4>
                          <p className="text-sm mt-1">{improvement.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No improvement suggestions available.</p>
                  )}
                </CardContent>
              </Card>

              {result.missingDocs && result.missingDocs.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Missing Documentation</CardTitle>
                    <CardDescription>
                      Components that need documentation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.missingDocs.map((missing: any, index: number) => (
                        <div key={index} className="p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-mono text-sm">{missing.componentId}</span>
                              <span className="ml-2 text-xs text-gray-500">{missing.type}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {missing.location.filePath}:{missing.location.startLine}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No quality assessment available.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 