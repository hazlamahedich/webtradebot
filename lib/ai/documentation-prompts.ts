import { PromptTemplate } from "@langchain/core/prompts";

/**
 * Prompts for the documentation generator workflow
 */
export const documentationPrompts = {
  // Prompt for analyzing code structure
  codeAnalysisPrompt: PromptTemplate.fromTemplate(`
    You are an expert code analyzer tasked with understanding the structure and patterns in a codebase.
    Analyze the following code with extreme depth and precision:

    Code:
    {code}

    Components:
    {components}

    Perform a comprehensive analysis considering:
    1. Code structure and organization
    2. Component relationships and dependencies
    3. Design patterns and architectural approaches
    4. Module boundaries and responsibilities
    5. API surfaces and interfaces
    6. Data flow and state management

    For each component, identify:
    - Its purpose and responsibility
    - How it relates to other components
    - Any patterns it implements
    - Potential architectural significance

    Return a structured analysis of the code structure.
  `),

  // Prompt for generating documentation
  documentationGenerationPrompt: PromptTemplate.fromTemplate(`
    You are an expert documentation writer creating clear, comprehensive documentation for a codebase.
    Based on the following code analysis, generate high-quality documentation:

    Code:
    {code}

    Analysis:
    {analysis}

    Create documentation that includes:
    1. A clear overview of the codebase
    2. Detailed documentation for each component, including:
       - Purpose and responsibility
       - Usage examples
       - Parameters and return values
       - Edge cases and limitations
    3. Architectural overview explaining how components fit together
    4. Usage guide for implementing and extending the code
    5. Setup instructions if applicable

    Focus on clarity, accuracy, and usefulness. Explain complex concepts in simple terms.
    Include code examples where helpful.

    Return structured documentation following the required schema.
  `),

  // Prompt for assessing documentation quality
  qualityAssessmentPrompt: PromptTemplate.fromTemplate(`
    You are a documentation quality assessor tasked with evaluating and improving documentation.
    Assess the following documentation against the codebase analysis:

    Documentation:
    {documentation}

    Analysis:
    {analysis}

    Provide a comprehensive quality assessment considering:
    1. Overall documentation coverage (0-100)
    2. Clarity of explanations (0-100)
    3. Completeness of component documentation (0-100)
    4. Consistency of documentation style (0-100)
    5. Overall quality score (0-100)

    For each component with suboptimal documentation, provide:
    - Specific improvement suggestions
    - Priority level (high/medium/low)
    - Rationale for the suggestion

    Return a structured quality assessment following the required schema.
  `),

  // Prompt for identifying missing documentation
  missingDocsPrompt: PromptTemplate.fromTemplate(`
    You are a documentation gap analyzer identifying areas where documentation is missing or insufficient.
    Compare the following documentation against the codebase analysis:

    Documentation:
    {documentation}

    Analysis:
    {analysis}

    Identify:
    1. Components completely missing documentation
    2. Components with incomplete documentation
    3. High-priority areas that should be documented first
    4. Relationships that need better explanation

    For each gap, provide:
    - The specific component or area missing documentation
    - The impact of this missing documentation
    - A template or outline for what should be added

    Return a structured list of documentation gaps.
  `),

  // Prompt for generating architectural diagrams
  diagramGenerationPrompt: PromptTemplate.fromTemplate(`
    You are an expert at creating clear, visual representations of code architecture.
    Based on the following code analysis, generate diagram descriptions:

    Analysis:
    {analysis}

    Create diagrams that visualize:
    1. Component relationships and dependencies
    2. Class/object hierarchies
    3. Data flow through the system
    4. Architectural layers and boundaries

    For each diagram:
    - Use appropriate notation (class diagrams, flow charts, etc.)
    - Focus on clarity and usefulness
    - Include only relevant details
    - Explain what the diagram shows

    Return structured diagram descriptions in the format required.
  `)
}; 