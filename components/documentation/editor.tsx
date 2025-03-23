"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Save, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComponentDocumentation, Documentation } from "@/lib/ai/types";

// Simple Markdown preview renderer
const MarkdownPreview = ({ content }: { content: string }) => {
  const formatMarkdown = (text: string) => {
    // Very basic markdown formatting for preview
    // In a real app, use a proper markdown library like marked or remark
    return text
      .replace(/#{3}\s(.*)/g, '<h3 class="text-lg font-semibold my-2">$1</h3>')
      .replace(/#{2}\s(.*)/g, '<h2 class="text-xl font-semibold my-3">$1</h2>')
      .replace(/#{1}\s(.*)/g, '<h1 class="text-2xl font-bold my-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-2 rounded my-2 overflow-x-auto"><code>$1</code></pre>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div 
      className="prose prose-sm max-w-none dark:prose-invert border p-4 rounded-md bg-gray-50 min-h-[200px] h-full overflow-y-auto"
      dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
    />
  );
};

interface DocumentationEditorProps {
  documentation: Documentation | null;
  componentId?: string;
  onSave: (updatedDoc: Documentation) => Promise<void>;
}

export function DocumentationEditor({ documentation, componentId, onSave }: DocumentationEditorProps) {
  const [docContent, setDocContent] = useState<Documentation | null>(null);
  const [activeComponent, setActiveComponent] = useState<ComponentDocumentation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (documentation) {
      setDocContent({ ...documentation });
      
      if (componentId) {
        const component = documentation.components.find(c => c.componentId === componentId);
        if (component) {
          setActiveComponent({ ...component });
          setActiveTab("component");
        }
      }
    }
  }, [documentation, componentId]);

  const handleOverviewChange = (field: keyof Documentation, value: string) => {
    if (!docContent) return;
    setDocContent({ ...docContent, [field]: value });
  };

  const handleComponentChange = (field: keyof ComponentDocumentation, value: string) => {
    if (!activeComponent) return;
    setActiveComponent({ ...activeComponent, [field]: value });
  };

  const handleSaveComponent = () => {
    if (!docContent || !activeComponent) return;
    
    const updatedComponents = docContent.components.map(c => 
      c.componentId === activeComponent.componentId ? activeComponent : c
    );
    
    setDocContent({ ...docContent, components: updatedComponents });
    setSuccess("Component documentation saved successfully");
    
    // Clear success message after a few seconds
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSaveDocumentation = async () => {
    if (!docContent) return;
    setLoading(true);
    setError(null);
    
    try {
      await onSave(docContent);
      setSuccess("Documentation saved successfully");
      setEditMode(false);
    } catch (error) {
      setError(`Failed to save documentation: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleComponentSelect = (componentId: string) => {
    if (!docContent) return;
    
    const component = docContent.components.find(c => c.componentId === componentId);
    if (component) {
      setActiveComponent({ ...component });
      setActiveTab("component");
    }
  };

  if (!docContent) {
    return <div>No documentation available to edit</div>;
  }

  return (
    <div className="space-y-4">
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

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Documentation Editor</h2>
        <div className="space-x-2">
          <Button 
            variant={editMode ? "default" : "outline"} 
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? "Editing Mode" : "View Mode"}
          </Button>
          {editMode && (
            <Button 
              onClick={handleSaveDocumentation} 
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" /> Save All Changes
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="component">Component Details</TabsTrigger>
          <TabsTrigger value="components">All Components</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Documentation Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editMode ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="overview">Overview</Label>
                    <Textarea
                      id="overview"
                      value={docContent.overview}
                      onChange={(e) => handleOverviewChange("overview", e.target.value)}
                      className="min-h-[200px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="architecture">Architecture</Label>
                    <Textarea
                      id="architecture"
                      value={docContent.architecture}
                      onChange={(e) => handleOverviewChange("architecture", e.target.value)}
                      className="min-h-[200px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usageGuide">Usage Guide</Label>
                    <Textarea
                      id="usageGuide"
                      value={docContent.usageGuide}
                      onChange={(e) => handleOverviewChange("usageGuide", e.target.value)}
                      className="min-h-[200px]"
                    />
                  </div>
                  {docContent.setup !== undefined && (
                    <div className="space-y-2">
                      <Label htmlFor="setup">Setup Instructions</Label>
                      <Textarea
                        id="setup"
                        value={docContent.setup}
                        onChange={(e) => handleOverviewChange("setup", e.target.value)}
                        className="min-h-[200px]"
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Overview</h3>
                    <MarkdownPreview content={docContent.overview} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Architecture</h3>
                    <MarkdownPreview content={docContent.architecture} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Usage Guide</h3>
                    <MarkdownPreview content={docContent.usageGuide} />
                  </div>
                  {docContent.setup && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Setup Instructions</h3>
                      <MarkdownPreview content={docContent.setup} />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="component">
          {activeComponent ? (
            <Card>
              <CardHeader>
                <CardTitle>Component: {activeComponent.componentId}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editMode ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={activeComponent.description}
                        onChange={(e) => handleComponentChange("description", e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usage">Usage</Label>
                      <Textarea
                        id="usage"
                        value={activeComponent.usage}
                        onChange={(e) => handleComponentChange("usage", e.target.value)}
                        className="min-h-[200px]"
                      />
                    </div>
                    {/* Parameter editing would need more complex logic */}
                    {activeComponent.returnType && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="returnType">Return Type</Label>
                          <Input
                            id="returnType"
                            value={activeComponent.returnType}
                            onChange={(e) => handleComponentChange("returnType", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="returnDescription">Return Description</Label>
                          <Input
                            id="returnDescription"
                            value={activeComponent.returnDescription || ""}
                            onChange={(e) => handleComponentChange("returnDescription", e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Description</h3>
                      <div className="p-3 bg-gray-50 rounded-md">{activeComponent.description}</div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Usage</h3>
                      <MarkdownPreview content={activeComponent.usage} />
                    </div>
                    {activeComponent.parameters && activeComponent.parameters.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Parameters</h3>
                        <div className="bg-gray-50 p-3 rounded-md">
                          {activeComponent.parameters.map((param, i) => (
                            <div key={i} className="mb-2 last:mb-0">
                              <span className="font-mono">{param.name}</span>
                              <span className="text-gray-500 text-xs ml-2">{param.type}</span>
                              {param.required && (
                                <span className="text-red-500 text-xs ml-2">required</span>
                              )}
                              <p className="text-sm mt-1">{param.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {activeComponent.returnType && (
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Returns</h3>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <span className="font-mono">{activeComponent.returnType}</span>
                          {activeComponent.returnDescription && (
                            <p className="text-sm mt-1">{activeComponent.returnDescription}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
              {editMode && (
                <CardFooter>
                  <Button onClick={handleSaveComponent}>Save Component</Button>
                </CardFooter>
              )}
            </Card>
          ) : (
            <Card>
              <CardContent className="py-10">
                <div className="text-center text-gray-500">
                  <p>Select a component to view or edit its documentation</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="components">
          <Card>
            <CardHeader>
              <CardTitle>All Components</CardTitle>
            </CardHeader>
            <CardContent>
              {docContent.components.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No components documented.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {docContent.components.map((component, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleComponentSelect(component.componentId)}
                    >
                      <div className="font-medium">{component.componentId}</div>
                      <div className="text-sm text-gray-500 truncate">{component.description}</div>
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