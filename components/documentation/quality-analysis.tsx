"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, AlertCircle, FileWarning, Zap, Info } from "lucide-react";
import { Button } from '@/components/ui/button';
import { QualityAssessment, MissingDocumentation } from '@/lib/ai/types';

interface QualityAnalysisProps {
  quality: QualityAssessment;
  missingDocs: MissingDocumentation[];
  onGenerateImprovements?: () => void;
  isGeneratingImprovements?: boolean;
}

export function QualityAnalysis({ 
  quality, 
  missingDocs, 
  onGenerateImprovements, 
  isGeneratingImprovements = false 
}: QualityAnalysisProps) {
  const [selectedTab, setSelectedTab] = useState("overview");
  
  // Format percentage values
  const formatPercentage = (value: number): string => {
    return `${Math.round(value * 100)}%`;
  };
  
  // Get quality level based on score
  const getQualityLevel = (score: number): {
    status: 'error' | 'warning' | 'success';
    label: string;
    icon: React.ReactNode;
  } => {
    if (score >= 0.8) {
      return { status: 'success', label: 'Excellent', icon: <Check className="h-5 w-5 text-green-500" /> };
    } else if (score >= 0.6) {
      return { status: 'success', label: 'Good', icon: <Check className="h-5 w-5 text-green-500" /> };
    } else if (score >= 0.4) {
      return { status: 'warning', label: 'Needs Improvement', icon: <AlertCircle className="h-5 w-5 text-amber-500" /> };
    } else {
      return { status: 'error', label: 'Poor', icon: <FileWarning className="h-5 w-5 text-red-500" /> };
    }
  };
  
  // Calculate overall quality level
  const overallQuality = getQualityLevel(quality.score);
  
  // Create insight metrics
  const metrics = [
    { name: 'Coverage', value: quality.coverage, description: 'How much of the codebase is documented' },
    { name: 'Clarity', value: quality.clarity, description: 'How clear and understandable the documentation is' },
    { name: 'Completeness', value: quality.completeness, description: 'How complete is each component\'s documentation' },
    { name: 'Consistency', value: quality.consistency, description: 'How consistent is the documentation style' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Documentation Quality</CardTitle>
            {onGenerateImprovements && (
              <Button 
                onClick={onGenerateImprovements}
                disabled={isGeneratingImprovements}
                variant="outline"
                size="sm"
              >
                {isGeneratingImprovements ? (
                  <>Generating recommendations...</>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Improvements
                  </>
                )}
              </Button>
            )}
          </div>
          <CardDescription>
            Automated quality assessment of your documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="improvements">Improvements ({quality.improvements.length})</TabsTrigger>
              <TabsTrigger value="missing">Missing Documentation ({missingDocs.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 pt-4">
              <div className="flex items-center gap-2 mb-4">
                <div className={`p-2 rounded-full 
                  ${overallQuality.status === 'success' ? 'bg-green-100' : 
                    overallQuality.status === 'warning' ? 'bg-amber-100' : 'bg-red-100'}`}>
                  {overallQuality.icon}
                </div>
                <div>
                  <h3 className="font-semibold">Overall Quality: {overallQuality.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    Score: {formatPercentage(quality.score)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metrics.map((metric) => (
                  <div key={metric.name} className="border rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-medium">{metric.name}</h4>
                      <span className="font-semibold">{formatPercentage(metric.value)}</span>
                    </div>
                    <Progress value={metric.value * 100} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2">{metric.description}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="improvements" className="pt-4">
              {quality.improvements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Check className="w-12 h-12 mx-auto mb-2 text-green-500 opacity-20" />
                  <p>No improvements needed. Your documentation looks great!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {quality.improvements.map((improvement, index) => (
                    <Alert key={index} variant="default" className="bg-blue-50 border-blue-200">
                      <div className="flex gap-2">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-800">{improvement.title}</h4>
                          <AlertDescription className="text-blue-700">
                            {improvement.description}
                          </AlertDescription>
                          {improvement.example && (
                            <div className="mt-2 text-sm bg-white p-2 rounded border border-blue-100">
                              <span className="block text-xs text-blue-500 mb-1">Example:</span>
                              {improvement.example}
                            </div>
                          )}
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="missing" className="pt-4">
              {missingDocs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Check className="w-12 h-12 mx-auto mb-2 text-green-500 opacity-20" />
                  <p>All components are documented. Great job!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {missingDocs.map((missing, index) => (
                    <Alert key={index} variant="default" className="bg-amber-50 border-amber-200">
                      <div className="flex gap-2">
                        <FileWarning className="h-4 w-4 text-amber-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-amber-800">{missing.componentType}: {missing.componentName}</h4>
                          <AlertDescription className="text-amber-700">
                            File: {missing.filePath}
                          </AlertDescription>
                          <div className="mt-2 text-sm">
                            <span className="block text-xs text-amber-500 mb-1">Suggested Documentation:</span>
                            <div className="bg-white p-2 rounded border border-amber-100">
                              {missing.suggestedDocumentation}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 