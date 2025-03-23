"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MissingDocumentation, QualityAssessment } from "@/lib/ai/types";
import { Check, AlertTriangle, BookOpen, ArrowUpRight, Shield, Lightbulb } from "lucide-react";

// A component that displays quality scores with progress bars
const QualityMeter = ({ 
  title, 
  score, 
  description 
}: { 
  title: string; 
  score: number; 
  description?: string;
}) => {
  let colorClass = "bg-red-500";
  
  if (score >= 80) {
    colorClass = "bg-green-500";
  } else if (score >= 60) {
    colorClass = "bg-yellow-500";
  } else if (score >= 40) {
    colorClass = "bg-orange-500";
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-sm font-medium">{score}%</div>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  );
};

interface QualityAnalysisProps {
  qualityAssessment: QualityAssessment;
  missingDocs: MissingDocumentation[];
}

export function QualityAnalysis({ qualityAssessment, missingDocs }: QualityAnalysisProps) {
  const [showAllImprovements, setShowAllImprovements] = useState(false);
  const [showAllMissing, setShowAllMissing] = useState(false);
  
  const improvementsToShow = showAllImprovements 
    ? qualityAssessment.improvements 
    : qualityAssessment.improvements.slice(0, 3);
  
  const missingDocsToShow = showAllMissing 
    ? missingDocs 
    : missingDocs.slice(0, 3);

  const getIconForComponent = (type: string) => {
    switch(type.toLowerCase()) {
      case 'function':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'class':
        return <BookOpen className="h-4 w-4 text-green-500" />;
      case 'interface':
      case 'type':
        return <ArrowUpRight className="h-4 w-4 text-purple-500" />;
      default:
        return <Lightbulb className="h-4 w-4 text-amber-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'high':
        return <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-800">High</span>;
      case 'medium':
        return <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">Medium</span>;
      case 'low':
        return <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">Low</span>;
      default:
        return null;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch(severity) {
      case 'critical':
        return <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-800">Critical</span>;
      case 'high':
        return <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-800">High</span>;
      case 'medium':
        return <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">Medium</span>;
      case 'low':
        return <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">Low</span>;
      default:
        return null;
    }
  };

  const getOverallRating = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 70) return "Good";
    if (score >= 60) return "Satisfactory";
    if (score >= 50) return "Needs Improvement";
    return "Poor";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Documentation Quality Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-6">
            <div className={`text-5xl font-bold ${
              qualityAssessment.score >= 70 ? 'text-green-600' : 
              qualityAssessment.score >= 50 ? 'text-yellow-600' : 
              'text-red-600'
            }`}>
              {qualityAssessment.score}
            </div>
            <div className="ml-4">
              <div className="text-lg font-medium">{getOverallRating(qualityAssessment.score)}</div>
              <div className="text-sm text-gray-500">Overall documentation quality</div>
            </div>
          </div>

          <div className="space-y-4">
            <QualityMeter 
              title="Coverage" 
              score={qualityAssessment.coverage} 
              description="Percentage of code components that have documentation"
            />
            <QualityMeter 
              title="Clarity" 
              score={qualityAssessment.clarity} 
              description="How clear and understandable the documentation is"
            />
            <QualityMeter 
              title="Completeness" 
              score={qualityAssessment.completeness} 
              description="How complete each component's documentation is"
            />
            <QualityMeter 
              title="Consistency" 
              score={qualityAssessment.consistency} 
              description="How consistent the documentation style is"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Improvement Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          {qualityAssessment.improvements.length > 0 ? (
            <div className="space-y-4">
              {improvementsToShow.map((improvement, index) => (
                <div key={index} className="border p-3 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium flex items-center">
                      <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                      {improvement.componentId}
                    </div>
                    {getPriorityBadge(improvement.priority)}
                  </div>
                  <p className="text-sm">{improvement.suggestion}</p>
                </div>
              ))}
              
              {qualityAssessment.improvements.length > 3 && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowAllImprovements(!showAllImprovements)}
                >
                  {showAllImprovements 
                    ? "Show Fewer Suggestions" 
                    : `Show All ${qualityAssessment.improvements.length} Suggestions`}
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Check className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-70" />
              <p>No improvement suggestions found. Great job!</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Missing Documentation</CardTitle>
        </CardHeader>
        <CardContent>
          {missingDocs.length > 0 ? (
            <div className="space-y-4">
              {missingDocsToShow.map((missing, index) => (
                <div key={index} className="border p-3 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium flex items-center">
                      {getIconForComponent(missing.type)}
                      <span className="ml-2">{missing.componentId}</span>
                    </div>
                    {getSeverityBadge(missing.severity)}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {missing.location.filePath}:{missing.location.startLine}-{missing.location.endLine}
                  </div>
                  <p className="text-sm mb-3">{missing.impact}</p>
                  <div className="text-sm bg-gray-50 p-2 rounded-md">
                    <div className="font-medium text-xs text-gray-700 mb-1">Suggested Template:</div>
                    <p className="whitespace-pre-wrap text-xs font-mono">{missing.template}</p>
                  </div>
                </div>
              ))}
              
              {missingDocs.length > 3 && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowAllMissing(!showAllMissing)}
                >
                  {showAllMissing 
                    ? "Show Fewer Missing Docs" 
                    : `Show All ${missingDocs.length} Missing Components`}
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Check className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-70" />
              <p>All components are documented. Excellent!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 