export interface CodeReviewRequest {
  reviewId: string;
  owner: string;
  repo: string;
  pullNumber: number;
}

// Documentation Generator Types
export interface DocumentationRequest {
  repositoryId: string;
  owner: string;
  repo: string;
  branch: string;
  filePaths: string[];
}

export interface CodeComponent {
  type: "function" | "class" | "module" | "interface" | "type" | "constant" | "variable";
  name: string;
  signature?: string;
  location: {
    filePath: string;
    startLine: number;
    endLine: number;
  };
  dependencies?: string[];
  parent?: string;
  children?: string[];
  existingDocs?: string;
}

export interface CodeRelationship {
  source: string;
  target: string;
  type: "imports" | "extends" | "implements" | "uses" | "contains";
}

export interface CodePattern {
  name: string;
  description: string;
  components: string[];
}

export interface CodeArchitecture {
  layers: string[];
  modules: string[];
  description: string;
}

export interface CodeAnalysisForDocs {
  components: CodeComponent[];
  relationships: CodeRelationship[];
  patterns: CodePattern[];
  architecture: CodeArchitecture;
}

export interface ComponentDocumentation {
  componentId: string;
  description: string;
  usage: string;
  parameters?: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;
  returnType?: string;
  returnDescription?: string;
  examples?: string[];
}

export interface Documentation {
  overview: string;
  components: ComponentDocumentation[];
  architecture: string;
  usageGuide: string;
  setup?: string;
}

export interface QualityAssessment {
  score: number; // 0-100
  coverage: number; // 0-100
  clarity: number; // 0-100
  completeness: number; // 0-100
  consistency: number; // 0-100
  improvements: Array<{
    componentId: string;
    suggestion: string;
    priority: "high" | "medium" | "low";
  }>;
}

export interface MissingDocumentation {
  componentId: string;
  type: string;
  location: {
    filePath: string;
    startLine: number;
    endLine: number;
  };
  impact: string;
  severity: "critical" | "high" | "medium" | "low";
  template: string;
}

export interface DocumentationDiagram {
  type: string;
  title: string;
  description: string;
  content: string;
}

export interface DocumentationResult {
  repositoryId: string;
  documentation: Documentation;
  qualityAssessment: QualityAssessment;
  missingDocs: MissingDocumentation[];
  diagrams: DocumentationDiagram[];
  error?: string;
}

export interface PullRequestDetails {
  number: number;
  title: string;
  description: string;
  author: string;
  baseRef: string;
  headRef: string;
  createdAt: string;
  updatedAt: string;
}

export interface CodeChange {
  filePath: string;
  additions: number;
  deletions: number;
  content: string;
  language: string;
  isBinary: boolean;
}

export type IssueSeverity = "Critical" | "High" | "Medium" | "Low";

export type IssueType = 
  | "Security" 
  | "Performance" 
  | "Code Quality" 
  | "Bugs" 
  | "Tests" 
  | "Documentation" 
  | "Architecture" 
  | "Maintainability"
  | "Other";

export interface CodeIssue {
  type: IssueType;
  severity: IssueSeverity;
  description: string;
  location?: {
    filePath: string;
    lineNumbers?: number[];
  };
  impact: string;
  suggestion?: string;
}

export interface CodeAnalysisResult {
  overallQuality: number; // 0-100 score
  strengths: string[];
  issues: CodeIssue[];
  codeComplexity: {
    overall: "Low" | "Medium" | "High";
    hotspots: {
      filePath: string;
      complexity: "Low" | "Medium" | "High";
      reason: string;
    }[];
  };
  testCoverage?: {
    adequacy: "Inadequate" | "Partial" | "Adequate";
    suggestions: string[];
  };
  securityAnalysis: {
    vulnerabilities: CodeIssue[];
  };
}

export interface ImprovementSuggestion {
  title: string;
  description: string;
  impact: "Low" | "Medium" | "High";
  effort: "Low" | "Medium" | "High";
  priority: number; // 1-10 scale
  codeExample?: string;
  affectedFiles: string[];
  tradeoffs?: string;
}

export interface CodeExplanation {
  summary: string;
  businessImpact: string;
  technicalHighlights: string[];
  userFacingChanges: string[];
  potentialRisks: string[];
}

export interface ReviewSummary {
  qualityScore: number; // 0-100
  strengths: string[];
  criticalIssues: CodeIssue[];
  recommendations: string[];
  verdict: "approve" | "request_changes" | "comment";
  confidence: "Low" | "Medium" | "High";
}

export interface CodeReviewResult {
  reviewId: string;
  pullRequest: PullRequestDetails;
  analysis: CodeAnalysisResult;
  suggestions: ImprovementSuggestion[];
  explanation: CodeExplanation;
  summary: ReviewSummary;
  error?: string;
}

export interface WebhookPayload {
  action: string;
  pull_request: {
    number: number;
    title: string;
    body: string;
    user: {
      login: string;
    };
    base: {
      ref: string;
    };
    head: {
      ref: string;
    };
    created_at: string;
    updated_at: string;
  };
  repository: {
    name: string;
    owner: {
      login: string;
    };
    full_name: string;
  };
} 